import { randomBytes } from 'node:crypto';
import { DriveApiError, UploadError, requireText, requireFileId } from './errors.mjs';

export const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files';
const FILE_FIELDS = 'id,name,mimeType,size,parents,trashed,isAppAuthorized';
const quoteQuery = (value) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

export function createDriveClient({ accessToken, fetchImpl = globalThis.fetch }) {
  requireText(accessToken, DriveApiError, 'Drive access token is required.');
  if (typeof fetchImpl !== 'function') throw new DriveApiError('Drive fetch implementation is required.');

  async function request(url, options = {}, ErrorType = DriveApiError) {
    let response;
    try {
      response = await fetchImpl(url.toString(), {
        ...options, redirect: 'error',
        headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      throw new ErrorType('Drive transport or response failed.');
    }
    if (!response.ok) throw new ErrorType(undefined, { status: response.status });
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new ErrorType('Drive transport or response failed.');
    }
    if (!payload || typeof payload !== 'object') throw new ErrorType('Invalid Drive response.');
    return payload;
  }

  function metadataUrl(base) {
    const url = new URL(base);
    url.searchParams.set('fields', FILE_FIELDS);
    return url;
  }

  return {
    async createFolder({ name, parentId }) {
      requireText(name, DriveApiError, 'Folder name is required.');
      if (parentId !== undefined) requireFileId(parentId, DriveApiError);
      return request(metadataUrl(FILES_ENDPOINT), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mimeType: FOLDER_MIME_TYPE,
          ...(parentId === undefined ? {} : { parents: [parentId] }) }),
      });
    },

    async findChildFolder({ name, parentId }) {
      requireText(name, DriveApiError, 'Folder name is required.');
      requireFileId(parentId, DriveApiError);
      const url = new URL(FILES_ENDPOINT);
      url.search = new URLSearchParams({
        q: `'${quoteQuery(parentId)}' in parents and name = '${quoteQuery(name)}' and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`,
        fields: `nextPageToken,files(${FILE_FIELDS})`, pageSize: '2', spaces: 'drive',
      }).toString();
      const result = await request(url);
      if (!Array.isArray(result.files)) throw new DriveApiError('Invalid Drive folder search response.');
      if (result.files.length > 1 || result.nextPageToken) {
        throw new DriveApiError('Ambiguous Drive child folders; administrative reconciliation required.');
      }
      return result.files[0] ?? null;
    },

    async getFileMetadata({ fileId }) {
      requireFileId(fileId, DriveApiError);
      return request(metadataUrl(`${FILES_ENDPOINT}/${encodeURIComponent(fileId)}`));
    },

    async uploadFile({ parentId, filename, mimeType, bytes }) {
      requireFileId(parentId, UploadError);
      requireText(filename, UploadError, 'Upload filename is required.');
      if (/[\\/\x00-\x1f]/.test(filename) || filename === '.' || filename === '..') {
        throw new UploadError('Unsafe upload filename.');
      }
      if (typeof mimeType !== 'string' || !/^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/.test(mimeType)) {
        throw new UploadError('Invalid upload MIME type.');
      }
      if (!(bytes instanceof Uint8Array)) throw new UploadError('Upload bytes must be a Buffer or Uint8Array.');
      const boundary = `sunny_${randomBytes(24).toString('hex')}`;
      const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: filename, parents: [parentId] })}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
        Buffer.from(bytes), Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);
      const url = metadataUrl(UPLOAD_ENDPOINT);
      url.searchParams.set('uploadType', 'multipart');
      return request(url, { method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body }, UploadError);
    },
  };
}
