import { randomBytes, timingSafeEqual } from 'node:crypto';
import { lstat, readFile, realpath, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createDriveClient } from './client.mjs';
import { ensureDriveRoot, ensureOrdersRoot, ROOT_FOLDER_NAME } from './folders.mjs';
import {
  buildAuthorizationUrl,
  DRIVE_SCOPE,
  exchangeAuthorizationCode,
} from './oauth.mjs';

const REDIRECT_URI = 'http://localhost:8787/oauth/google/callback';
const CALLBACK_PATH = '/oauth/google/callback';
const CALLBACK_HOST = 'localhost';
const CALLBACK_PORT = 8787;
const BOOTSTRAP_TIMEOUT_MS = 10 * 60 * 1000;
const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const SUCCESS_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Sunny Magnet Drive</title></head>
<body><p>Sunny Magnet Drive authorization completed.<br>You can close this tab.</p></body></html>`;
const FAILURE_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Sunny Magnet Drive</title></head>
<body><p>Sunny Magnet Drive authorization failed.</p></body></html>`;

class BootstrapError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BootstrapError';
  }
}

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const option = argv[index];
    const value = argv[index + 1];
    if (!['--credentials', '--output'].includes(option) || value === undefined ||
        value.startsWith('--') || values.has(option)) {
      throw new BootstrapError(
        'Usage: node backend/drive/bootstrap-local.mjs --credentials <absolute-path> --output <absolute-path>',
      );
    }
    values.set(option, value);
  }
  if (values.size !== 2) {
    throw new BootstrapError(
      'Usage: node backend/drive/bootstrap-local.mjs --credentials <absolute-path> --output <absolute-path>',
    );
  }
  return {
    credentialsPath: values.get('--credentials'),
    outputPath: values.get('--output'),
  };
}

function isWithin(parentPath, candidatePath) {
  const relativePath = path.relative(parentPath, candidatePath);
  return relativePath === '' ||
    (relativePath !== '..' && !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath));
}

async function pathExists(candidatePath) {
  try {
    await lstat(candidatePath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw new BootstrapError('Unable to inspect the output path safely.');
  }
}

async function resolveSafePaths(credentialsArgument, outputArgument) {
  if (!path.isAbsolute(credentialsArgument) || !path.isAbsolute(outputArgument)) {
    throw new BootstrapError('Credential and output paths must be absolute.');
  }

  let repositoryRoot;
  let credentialsPath;
  let outputParent;
  try {
    [repositoryRoot, credentialsPath, outputParent] = await Promise.all([
      realpath(REPOSITORY_ROOT),
      realpath(credentialsArgument),
      realpath(path.dirname(outputArgument)),
    ]);
  } catch {
    throw new BootstrapError('Credential file and output directory must exist and be accessible.');
  }

  const outputPath = path.join(outputParent, path.basename(path.resolve(outputArgument)));
  if (isWithin(repositoryRoot, credentialsPath)) {
    throw new BootstrapError('The OAuth credential file must be stored outside the repository.');
  }
  if (isWithin(repositoryRoot, outputPath)) {
    throw new BootstrapError('The bootstrap result must be stored outside the repository.');
  }
  if (await pathExists(outputPath)) {
    throw new BootstrapError('The output file already exists; refusing to overwrite it.');
  }
  return { credentialsPath, outputPath };
}

async function loadCredentials(credentialsPath) {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(credentialsPath, 'utf8'));
  } catch {
    throw new BootstrapError('Unable to read a valid OAuth client credentials JSON file.');
  }
  const web = parsed?.web;
  if (!web || typeof web !== 'object' ||
      typeof web.client_id !== 'string' || !web.client_id.trim() ||
      typeof web.client_secret !== 'string' || !web.client_secret.trim() ||
      !Array.isArray(web.redirect_uris) || !web.redirect_uris.includes(REDIRECT_URI)) {
    throw new BootstrapError(
      `OAuth credentials must contain a Web client with the redirect URI ${REDIRECT_URI}.`,
    );
  }
  return { clientId: web.client_id, clientSecret: web.client_secret };
}

function stateMatches(expectedState, receivedState) {
  if (typeof receivedState !== 'string') return false;
  const expected = Buffer.from(expectedState, 'utf8');
  const received = Buffer.from(receivedState, 'utf8');
  const comparable = received.length === expected.length ? received : Buffer.alloc(expected.length);
  return timingSafeEqual(expected, comparable) && received.length === expected.length;
}

function sendPage(response, statusCode, page) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; style-src 'none'; img-src 'none'",
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(page);
}

function waitForCallback({ clientId, expectedState, completeBootstrap }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let stateConsumed = false;
    let timer;

    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close();
      if (error) reject(error);
      else resolve();
    };

    const server = createServer(async (request, response) => {
      let callbackUrl;
      try {
        callbackUrl = new URL(request.url ?? '/', REDIRECT_URI);
      } catch {
        sendPage(response, 400, FAILURE_PAGE);
        return;
      }

      if (callbackUrl.pathname !== CALLBACK_PATH) {
        sendPage(response, 404, FAILURE_PAGE);
        return;
      }
      if (request.method !== 'GET') {
        sendPage(response, 400, FAILURE_PAGE);
        finish(new BootstrapError('OAuth callback was rejected.'));
        return;
      }
      if (stateConsumed) {
        sendPage(response, 400, FAILURE_PAGE);
        return;
      }

      const states = callbackUrl.searchParams.getAll('state');
      if (states.length !== 1 || !stateMatches(expectedState, states[0])) {
        sendPage(response, 400, FAILURE_PAGE);
        finish(new BootstrapError('OAuth callback state validation failed.'));
        return;
      }
      stateConsumed = true;
      clearTimeout(timer);

      const codes = callbackUrl.searchParams.getAll('code');
      if (callbackUrl.searchParams.has('error') || codes.length !== 1 || !codes[0]) {
        sendPage(response, 400, FAILURE_PAGE);
        finish(new BootstrapError('Google authorization was not completed.'));
        return;
      }

      try {
        await completeBootstrap(codes[0]);
        sendPage(response, 200, SUCCESS_PAGE);
        finish();
      } catch (error) {
        sendPage(response, 500, FAILURE_PAGE);
        finish(error);
      }
    });

    server.on('error', () => {
      finish(new BootstrapError(`Unable to start the local callback server on port ${CALLBACK_PORT}.`));
    });
    server.listen(CALLBACK_PORT, CALLBACK_HOST, () => {
      timer = setTimeout(() => {
        finish(new BootstrapError('OAuth bootstrap timed out.'));
      }, BOOTSTRAP_TIMEOUT_MS);
      console.log('Open this authorization URL:');
      console.log(buildAuthorizationUrl({
        clientId,
        redirectUri: REDIRECT_URI,
        state: expectedState,
      }));
    });
  });
}

async function main() {
  const arguments_ = parseArguments(process.argv.slice(2));
  const { credentialsPath, outputPath } = await resolveSafePaths(
    arguments_.credentialsPath,
    arguments_.outputPath,
  );
  const { clientId, clientSecret } = await loadCredentials(credentialsPath);
  const state = randomBytes(32).toString('hex');

  const completeBootstrap = async (code) => {
    const tokens = await exchangeAuthorizationCode({
      clientId,
      clientSecret,
      redirectUri: REDIRECT_URI,
      code,
    });
    if (!tokens.refreshToken) {
      throw new BootstrapError(
        'No refresh token was returned. Repeat owner authorization and grant consent again.',
      );
    }
    if (tokens.scope !== undefined && tokens.scope.trim() !== DRIVE_SCOPE) {
      throw new BootstrapError('Google returned an unexpected OAuth scope; bootstrap was aborted.');
    }

    const drive = createDriveClient({ accessToken: tokens.accessToken });
    const driveRootFolderId = await ensureDriveRoot({ drive });
    const ordersFolderId = await ensureOrdersRoot({ drive, rootFolderId: driveRootFolderId });
    const result = {
      version: 1,
      scope: DRIVE_SCOPE,
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      refresh_token: tokens.refreshToken,
      drive_root_folder_id: driveRootFolderId,
      orders_folder_id: ordersFolderId,
      created_at: new Date().toISOString(),
    };
    try {
      await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      });
    } catch {
      throw new BootstrapError('Unable to create the bootstrap result file safely.');
    }
  };
  await waitForCallback({ clientId, expectedState: state, completeBootstrap });
  console.log('Bootstrap completed.');
  console.log(`Result written to: ${outputPath}`);
  console.log(`Drive root created: ${ROOT_FOLDER_NAME}`);
}

main().catch((error) => {
  const message = error instanceof BootstrapError
    ? error.message
    : 'Bootstrap failed. No sensitive details were logged.';
  console.error(message);
  process.exitCode = 1;
});
