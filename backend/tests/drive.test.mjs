import test from 'node:test';
import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { buildAuthorizationUrl, exchangeAuthorizationCode, refreshAccessToken, DRIVE_SCOPE } from '../drive/oauth.mjs';
import { createDriveClient, FOLDER_MIME_TYPE } from '../drive/client.mjs';
import { ensureDriveRoot, ensureOrdersRoot, ensureOrderFolders, ROOT_FOLDER_NAME } from '../drive/folders.mjs';
import { uploadOriginal, uploadArtwork, uploadPrintPdf, uploadPrintPreview } from '../drive/uploads.mjs';
import { OAuthError, DriveApiError, FolderValidationError, UploadError } from '../drive/errors.mjs';

// Fail closed if any test accidentally omits its injected fetch implementation.
globalThis.fetch = async () => { throw new Error('Real network calls are disabled in Drive tests.'); };

// All network-capable entry points below receive mocks. These are synthetic test values.
const secret = 'mock-client-secret';
const accessToken = 'mock-access-token';
const refreshToken = 'mock-refresh-token';
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const token = { access_token: accessToken, refresh_token: refreshToken, expires_in: 3600, token_type: 'Bearer', scope: DRIVE_SCOPE };
const auth = { clientId: 'mock-client-id', clientSecret: secret, redirectUri: 'https://backend.example/oauth/callback' };
const folder = (id, name, parentId) => ({ id, name, mimeType: FOLDER_MIME_TYPE,
  parents: parentId ? [parentId] : [], trashed: false, isAppAuthorized: true });
const order = { rootFolderId: 'root', orderCode: 'SM-20260928-0001', year: '2026', month: '09' };

function fakeDrive() {
  const folders = [folder('root', ROOT_FOLDER_NAME)];
  const calls = [];
  return { folders, calls,
    async getFileMetadata({ fileId }) { calls.push(['get', fileId]); return folders.find((item) => item.id === fileId); },
    async findChildFolder({ name, parentId }) {
      calls.push(['find', name, parentId]);
      return folders.find((item) => item.name === name && item.parents.includes(parentId)) ?? null;
    },
    async createFolder({ name, parentId }) {
      calls.push(['create', name, parentId]);
      const result = folder(`folder-${folders.length}`, name, parentId);
      folders.push(result); return result;
    },
  };
}

test('authorization URL uses exact drive.file scope, offline consent and caller state', () => {
  const url = new URL(buildAuthorizationUrl({ ...auth, state: 'mock-secure-caller-state' }));
  assert.equal(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  for (const [key, value] of Object.entries({ scope: DRIVE_SCOPE, access_type: 'offline',
    prompt: 'consent', response_type: 'code', state: 'mock-secure-caller-state' })) {
    assert.equal(url.searchParams.get(key), value);
  }
  assert.equal(url.searchParams.has('include_granted_scopes'), false);
  assert.throws(() => buildAuthorizationUrl({ ...auth }), OAuthError);
});

test('code exchange sends form body and normalizes success', async () => {
  const result = await exchangeAuthorizationCode({ ...auth, code: 'mock-code', fetchImpl: async (url, options) => {
    assert.equal(url, 'https://oauth2.googleapis.com/token');
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers['Content-Type'], 'application/x-www-form-urlencoded');
    assert.equal(options.body.get('grant_type'), 'authorization_code');
    assert.equal(options.body.get('client_secret'), secret);
    assert.equal(options.body.get('redirect_uri'), auth.redirectUri);
    assert.equal(options.body.get('code'), 'mock-code');
    return response(token);
  } });
  assert.deepEqual(result, { accessToken, refreshToken, expiresIn: 3600, tokenType: 'Bearer', scope: DRIVE_SCOPE });
});

test('refresh flow parses success without replacing the stored refresh token', async () => {
  const result = await refreshAccessToken({ ...auth, refreshToken, fetchImpl: async (_, options) => {
    assert.equal(options.body.get('grant_type'), 'refresh_token');
    assert.equal(options.body.get('refresh_token'), refreshToken);
    return response({ ...token, refresh_token: undefined });
  } });
  assert.equal(result.accessToken, accessToken);
  assert.equal(result.refreshToken, undefined);
  assert.equal(result.expiresIn, 3600);
});

test('OAuth provider and transport errors never expose secrets or tokens', async () => {
  for (const fetchImpl of [async () => response({ error_description: `${secret} ${refreshToken}` }, 400),
    async () => { throw new Error(`${secret} ${accessToken} ${refreshToken}`); },
    async () => { throw new OAuthError(secret); },
    async () => ({ ok: true, json: async () => { throw new Error(secret); } })]) {
    await assert.rejects(refreshAccessToken({ ...auth, refreshToken, fetchImpl }), (error) => {
      assert.ok(error instanceof OAuthError);
      for (const value of [secret, accessToken, refreshToken]) assert.ok(!inspect(error).includes(value));
      return true;
    });
  }
});

test('malformed OAuth success response is rejected', async () => {
  await assert.rejects(exchangeAuthorizationCode({ ...auth, code: 'mock', fetchImpl: async () => response({ ...token, expires_in: -1 }) }), OAuthError);
});

test('createFolder sends exact parent and MIME type, metadata fields only', async () => {
  const drive = createDriveClient({ accessToken, fetchImpl: async (url, options) => {
    assert.equal(new URL(url).pathname, '/drive/v3/files');
    assert.equal(options.headers.Authorization, `Bearer ${accessToken}`);
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { name: 'Orders', mimeType: FOLDER_MIME_TYPE, parents: ['root'] });
    assert.ok(!new URL(url).searchParams.get('fields').includes('*'));
    return response(folder('orders', 'Orders', 'root'));
  } });
  assert.equal((await drive.createFolder({ name: 'Orders', parentId: 'root' })).id, 'orders');
});

test('findChildFolder only searches direct children; query quotes are escaped', async () => {
  const drive = createDriveClient({ accessToken, fetchImpl: async (url) => {
    const query = new URL(url).searchParams.get('q');
    assert.equal(query, `'root' in parents and name = 'Owner\\'s Orders' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`);
    return response({ files: [] });
  } });
  assert.equal(await drive.findChildFolder({ name: "Owner's Orders", parentId: 'root' }), null);
  await assert.rejects(drive.findChildFolder({ name: 'Orders' }), DriveApiError);
});

test('ambiguous duplicate folders are rejected rather than selected arbitrarily', async () => {
  const drive = createDriveClient({ accessToken, fetchImpl: async () => response({ files: [folder('one', 'Orders', 'root'), folder('two', 'Orders', 'root')] }) });
  await assert.rejects(drive.findChildFolder({ name: 'Orders', parentId: 'root' }), DriveApiError);
});

test('root bootstrap creates app root; known root validates metadata without listing', async () => {
  const drive = fakeDrive();
  const newRoot = await ensureDriveRoot({ drive });
  assert.equal(drive.folders.find((item) => item.id === newRoot).name, ROOT_FOLDER_NAME);
  assert.equal(await ensureDriveRoot({ drive, rootFolderId: 'root' }), 'root');
  assert.equal(drive.calls.filter(([method]) => method === 'find').length, 0);
  drive.folders[0].isAppAuthorized = false;
  await assert.rejects(ensureDriveRoot({ drive, rootFolderId: 'root' }), FolderValidationError);
});

test('known root rejects an unexpected metadata ID', async () => {
  const drive = { getFileMetadata: async () => folder('other-root', ROOT_FOLDER_NAME) };
  await assert.rejects(ensureDriveRoot({ drive, rootFolderId: 'root' }), FolderValidationError);
});

test('folder tree is idempotent and rooted in the configured working tree', async () => {
  const drive = fakeDrive();
  const first = await ensureOrderFolders({ drive, ...order });
  const second = await ensureOrderFolders({ drive, ...order });
  assert.deepEqual(first, second);
  assert.equal(drive.calls.filter(([method]) => method === 'create').length, 7);
  assert.deepEqual(drive.folders.slice(1).map((item) => item.name), ['Orders', '2026', '09', order.orderCode, '01_ORIGINALS', '02_ARTWORKS', '03_PRINT']);
  assert.equal(await ensureOrdersRoot({ drive, rootFolderId: 'root' }), first.ordersFolderId);
  for (const [, , parentId] of drive.calls.filter(([method]) => method === 'find')) {
    assert.ok(drive.folders.some((item) => item.id === parentId));
  }
});

test('year/month validation rejects invalid values before any Drive call', async () => {
  for (const invalid of [{ year: '26' }, { year: 2026 }, { year: '../2026' }, { month: '00' }, { month: '13' }, { month: '9' }, { month: '09/..' }]) {
    const drive = fakeDrive();
    await assert.rejects(ensureOrderFolders({ drive, ...order, ...invalid }), FolderValidationError);
    assert.equal(drive.calls.length, 0);
  }
});

test('unsafe order codes are rejected before any Drive call', async () => {
  for (const orderCode of ['../SM-20260928-0001', 'SM-20260928-0001/../', 'SM\\20260928\\0001', 'SM-20260928-0001\n', 'OTHER-123', '']) {
    const drive = fakeDrive();
    await assert.rejects(ensureOrderFolders({ drive, ...order, orderCode }), FolderValidationError);
    assert.equal(drive.calls.length, 0);
  }
});

test('wrong-parent or trashed child metadata is rejected', async () => {
  for (const overrides of [{ parents: ['outside'] }, { trashed: true }, { mimeType: 'image/jpeg' }]) {
    const drive = fakeDrive();
    drive.findChildFolder = async () => ({ ...folder('orders', 'Orders', 'root'), ...overrides });
    await assert.rejects(ensureOrderFolders({ drive, ...order }), FolderValidationError);
  }
});

test('multipart upload preserves binary bytes and exact destination', async () => {
  const bytes = Buffer.from([0, 255, 128, 13, 10]);
  const drive = createDriveClient({ accessToken, fetchImpl: async (url, options) => {
    assert.equal(new URL(url).pathname, '/upload/drive/v3/files');
    assert.equal(new URL(url).searchParams.get('uploadType'), 'multipart');
    assert.ok(options.headers['Content-Type'].startsWith('multipart/related; boundary=sunny_'));
    assert.ok(options.body.includes(bytes));
    assert.ok(options.body.includes(Buffer.from('"parents":["originals"]')));
    assert.ok(!options.body.includes(Buffer.from('permissions')));
    return response({ id: 'file', name: '001.jpg', mimeType: 'image/jpeg', size: String(bytes.length), parents: ['originals'] });
  } });
  assert.deepEqual(await uploadOriginal({ drive, folderId: 'originals', filename: '001.jpg', mimeType: 'image/jpeg', bytes }),
    { driveFileId: 'file', driveFolderId: 'originals', filename: '001.jpg', mimeType: 'image/jpeg', sizeBytes: 5 });
});

test('all semantic upload helpers normalize metadata including PDF MIME type', async () => {
  const bytes = Buffer.from('synthetic contents');
  const drive = { async uploadFile({ parentId, filename, mimeType }) {
    return { id: 'file', name: filename, mimeType, size: String(bytes.length), parents: [parentId] };
  } };
  for (const helper of [uploadOriginal, uploadArtwork, uploadPrintPdf, uploadPrintPreview]) {
    const result = await helper({ drive, folderId: 'destination', filename: 'test', mimeType: 'image/webp', bytes });
    assert.equal(result.sizeBytes, bytes.length);
    assert.equal(result.mimeType, helper === uploadPrintPdf ? 'application/pdf' : 'image/webp');
  }
});

test('invalid upload input and mismatched response metadata fail safely', async () => {
  const bytes = Buffer.from('mock');
  const drive = { uploadFile: async () => ({ id: 'file', name: '001.jpg', mimeType: 'image/jpeg', size: '4', parents: ['outside'] }) };
  await assert.rejects(uploadOriginal({ drive, folderId: 'originals', filename: '../001.jpg', mimeType: 'image/jpeg', bytes }), UploadError);
  await assert.rejects(uploadOriginal({ drive, folderId: 'originals', filename: '001.jpg', mimeType: 'image/jpeg', bytes }), UploadError);
  await assert.rejects(uploadArtwork({ drive, folderId: 'artworks', filename: '001.jpg', mimeType: 'text/plain', bytes }), UploadError);
});

test('Drive and upload errors omit access/refresh tokens and file contents', async () => {
  const sensitive = `${secret} ${accessToken} ${refreshToken} mock-private-file-content`;
  for (const fetchImpl of [async () => response({ error: { message: sensitive } }, 403),
    async () => { throw new DriveApiError(sensitive); },
    async () => { throw new Error(sensitive); }]) {
    const drive = createDriveClient({ accessToken, fetchImpl });
    for (const action of [() => drive.getFileMetadata({ fileId: 'file' }),
      () => uploadOriginal({ drive, folderId: 'originals', filename: 'test.jpg', mimeType: 'image/jpeg', bytes: Buffer.from('mock-private-file-content') })]) {
      await assert.rejects(action(), (error) => {
        assert.ok(error instanceof DriveApiError || error instanceof UploadError);
        for (const value of [secret, accessToken, refreshToken, 'mock-private-file-content']) assert.ok(!inspect(error).includes(value));
        return true;
      });
    }
  }
});
