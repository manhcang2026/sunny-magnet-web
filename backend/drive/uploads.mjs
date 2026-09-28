import { UploadError, requireFileId, requireText } from './errors.mjs';

async function upload({ drive, folderId, filename, bytes, mimeType }, kind) {
  requireFileId(folderId, UploadError);
  requireText(filename, UploadError, 'Upload filename is required.');
  if (/[\\/\x00-\x1f]/.test(filename) || filename === '.' || filename === '..') {
    throw new UploadError('Unsafe upload filename.');
  }
  if (!(bytes instanceof Uint8Array)) throw new UploadError('Upload bytes must be a Buffer or Uint8Array.');
  if (typeof mimeType !== 'string' ||
      (kind === 'image' && !/^image\/[A-Za-z0-9.+-]+$/.test(mimeType)) ||
      (kind === 'pdf' && mimeType !== 'application/pdf')) {
    throw new UploadError('Invalid MIME type for this asset kind.');
  }
  let metadata;
  try {
    metadata = await drive.uploadFile({ parentId: folderId, filename, bytes, mimeType });
  } catch {
    throw new UploadError();
  }
  requireFileId(metadata?.id, UploadError);
  const sizeBytes = Number(metadata.size);
  if (metadata.name !== filename || metadata.mimeType !== mimeType ||
      !Array.isArray(metadata.parents) || !metadata.parents.includes(folderId) ||
      metadata.size === undefined || metadata.size === null || metadata.size === '' ||
      !Number.isSafeInteger(sizeBytes) || sizeBytes !== bytes.byteLength) {
    throw new UploadError('Invalid Drive upload metadata.');
  }
  return { driveFileId: metadata.id, driveFolderId: folderId,
    filename: metadata.name, mimeType: metadata.mimeType, sizeBytes };
}

export const uploadOriginal = (options) => upload(options, 'image');
export const uploadArtwork = (options) => upload(options, 'image');
export const uploadPrintPdf = (options) => upload({ ...options, mimeType: 'application/pdf' }, 'pdf');
export const uploadPrintPreview = (options) => upload(options, 'image');
