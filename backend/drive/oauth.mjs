import { OAuthError, requireText } from './errors.mjs';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export function buildAuthorizationUrl({ clientId, redirectUri, state }) {
  for (const value of [clientId, redirectUri, state]) {
    requireText(value, OAuthError, 'Missing OAuth authorization configuration.');
  }
  const url = new URL(AUTH_ENDPOINT);
  url.search = new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri, state,
    response_type: 'code', scope: DRIVE_SCOPE, access_type: 'offline',
    prompt: 'consent',
  }).toString();
  return url.toString();
}

async function requestToken(parameters, fetchImpl) {
  if (typeof fetchImpl !== 'function') throw new OAuthError('OAuth fetch implementation is required.');
  let response;
  let payload;
  try {
    response = await fetchImpl(TOKEN_ENDPOINT, {
      method: 'POST', redirect: 'error',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(parameters),
    });
  } catch {
    throw new OAuthError('Google OAuth transport or response failed.');
  }
  if (!response.ok) throw new OAuthError(undefined, { status: response.status });
  try {
    payload = await response.json();
  } catch {
    throw new OAuthError('Google OAuth transport or response failed.');
  }
  if (!payload || typeof payload.access_token !== 'string' || !payload.access_token ||
      typeof payload.token_type !== 'string' || !payload.token_type ||
      !Number.isFinite(payload.expires_in) || payload.expires_in <= 0) {
    throw new OAuthError('Invalid Google OAuth token response.');
  }
  return {
    accessToken: payload.access_token,
    refreshToken: typeof payload.refresh_token === 'string' ? payload.refresh_token : undefined,
    expiresIn: payload.expires_in, tokenType: payload.token_type,
    scope: typeof payload.scope === 'string' ? payload.scope : undefined,
  };
}

export function exchangeAuthorizationCode({ clientId, clientSecret, redirectUri, code, fetchImpl = globalThis.fetch }) {
  for (const value of [clientId, clientSecret, redirectUri, code]) {
    requireText(value, OAuthError, 'Missing OAuth code exchange configuration.');
  }
  return requestToken({ client_id: clientId, client_secret: clientSecret,
    redirect_uri: redirectUri, code, grant_type: 'authorization_code' }, fetchImpl);
}

export function refreshAccessToken({ clientId, clientSecret, refreshToken, fetchImpl = globalThis.fetch }) {
  for (const value of [clientId, clientSecret, refreshToken]) {
    requireText(value, OAuthError, 'Missing OAuth refresh configuration.');
  }
  return requestToken({ client_id: clientId, client_secret: clientSecret,
    refresh_token: refreshToken, grant_type: 'refresh_token' }, fetchImpl);
}
