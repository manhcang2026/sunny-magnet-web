# Direct Google Drive API foundation (SUNNY-BE-02A)

Google Drive is the primary binary storage for Sunny Magnet V2. Customer-facing
operations call Sunny Backend on Oracle VPS. Backend calls Drive REST API v3
directly and uses Supabase for business metadata/state/auth. Legacy GAS is
historical/reference only and has no V2 runtime role.

This is local foundation code, tested with mocks. OAuth and Drive integration
are not live. There are no routes, credentials, scheduled jobs, or Supabase writes.
Only Node built-ins are used; no dependency installation is needed.

## Module contract

- `oauth.mjs`: owner/admin OAuth bootstrap URL, authorization code exchange,
  and access-token refresh using the Google OAuth 2.0 Web Server flow.
- `client.mjs`: folder creation, parent-scoped folder lookup, file metadata,
  and multipart binary upload through injected `fetchImpl` (default: built-in fetch).
- `folders.mjs`: root validation and sequential, idempotent folder provisioning.
- `uploads.mjs`: original, final artwork, print PDF, and preview uploads; returns
  `{ driveFileId, driveFolderId, filename, mimeType, sizeBytes }` for later mapping
  to Supabase `assets`. These helpers do not write database rows or generate PDFs.
- `errors.mjs`: OAuth/config, Drive API, folder validation, and upload error types.
  Errors omit provider bodies, transport causes, tokens, secrets, and file bytes.

This module does not authenticate retail customers, create orders, calculate
pricing, change payments, generate commissions, manage events, generate print
PDFs, or share files publicly. Original/artwork/preview helpers accept image MIME
types; the print PDF helper fixes `application/pdf`.

## Owner/admin OAuth deployment contract

Use the owner's MAIN Google account and the exact scope
`https://www.googleapis.com/auth/drive.file`. This is operational infrastructure,
not a public customer Google login. Configure the placeholders in
`backend/.env.example` exclusively on the server; never use `NEXT_PUBLIC_`.

The future protected admin bootstrap route must generate a cryptographically
random state (for example `randomBytes(32).toString('hex')`), bind it to the admin
session, expire it, and validate/consume it once at the callback before exchanging
the code. `buildAuthorizationUrl({ clientId, redirectUri, state })` requires caller
state and requests offline access and consent. This integration intentionally does
not use incremental authorization because only `drive.file` is required;
`include_granted_scopes` is omitted. No route or session implementation is provided here.

`exchangeAuthorizationCode({ clientId, clientSecret, redirectUri, code, fetchImpl })`
and `refreshAccessToken({ clientId, clientSecret, refreshToken, fetchImpl })` return
normalized token fields. Store the refresh token securely in backend secrets;
never log tokens or the returned objects. Keep access tokens only server-side,
refresh before expiry, and recreate the Drive client with the new access token.
Google may omit a refresh token in subsequent responses: retain the existing
stored token rather than replacing it with `undefined`. Invalid/revoked grants
require a later protected owner/admin reauthorization flow.

### Local owner bootstrap

`bootstrap-local.mjs` is a one-time, owner/admin-only local utility. It starts a
loopback callback on `http://localhost:8787/oauth/google/callback`, requests only
the `drive.file` scope, creates the application root and its `Orders` child, and
writes the folder IDs and refresh token to the requested result file.

Keep both the Google OAuth Web Client credential file and the generated result
file outside this repository. The result contains a refresh token and is
sensitive. Do not upload either file to ChatGPT or GitHub, and do not share them.
The utility refuses repository paths and refuses to overwrite an existing result.

Windows example (the files are not provided by this repository):

```powershell
node backend/drive/bootstrap-local.mjs --credentials "C:\Users\Admin\Documents\SunnyMagnetSecrets\oauth-client.json" --output "C:\Users\Admin\Documents\SunnyMagnetSecrets\drive-bootstrap-result.json"
```

OAuth consent-screen apps in Testing status issue refresh tokens that expire
after 7 days. After publishing the app to Production, repeat owner authorization
if required. This bootstrap utility does not make the broader integration
production-ready.

## Working-tree sandbox

On first bootstrap, call `ensureDriveRoot({ drive })`; it creates
`Sunny Magnet Production` without searching the owner's Drive. Persist the
returned ID before further work and use it on every subsequent call. Repeating
bootstrap without the saved ID creates another root intentionally: global
discovery of personal folders is forbidden.

Known roots must be active folders named `Sunny Magnet Production` and authorized
to the application (`isAppAuthorized`). Only trusted backend configuration may
supply root/destination IDs. App authorization does not prove creation provenance:
the saved bootstrap ID is the trust anchor, and must never come from customer input.

`ensureOrdersRoot({ drive, rootFolderId })` validates the root and ensures `Orders`.
`ensureOrderFolders({ drive, rootFolderId, orderCode, year, month })` returns all
eight folder IDs. Supply string years (`2026`), padded months (`09`), and order
codes matching `SM-YYYYMMDD-NNNN` (4–10 sequence digits). This conservative pattern
matches the architecture example; it checks syntax, not calendar validity.

```text
Sunny Magnet Production/
└── Orders/
    └── YYYY/
        └── MM/
            └── ORDER_CODE/
                ├── 01_ORIGINALS/
                ├── 02_ARTWORKS/
                └── 03_PRINT/
```

Lookups search direct children of the expected parent only. Existing children
are validated and reused; duplicate matches fail rather than selecting a random
folder. Serialize provisioning per root/order in the future backend: Drive has
no unique folder-name constraint and simultaneous search/create can race.

Uploads take `{ drive, folderId, filename, bytes, mimeType }` (`mimeType` is optional
for `uploadPrintPdf`). Use destinations returned by `ensureOrderFolders` and
Buffer/Uint8Array bytes. The low-level REST client does not independently enforce
ancestry for supplied IDs: keep it internal to trusted backend code. No global
listing, delete, arbitrary move, permission changes, or public-link APIs exist.
Parent permissions are inherited; keep the root private and audit it operationally.

Uploads buffer the multipart request in memory. Request size limits, resumable
uploads, timeouts, retries, upload deduplication, folder locks, admin routes, secret
persistence, and Supabase asset synchronization are future integration work.
Repeated uploads create new files; only folder provisioning is idempotent.

## Offline verification

From the repository root: `node --test backend/tests/drive.test.mjs`.
Every network-capable entry point in the tests receives a mock.
