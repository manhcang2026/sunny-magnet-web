import { FolderValidationError, requireFileId } from './errors.mjs';
import { FOLDER_MIME_TYPE } from './client.mjs';

export const ROOT_FOLDER_NAME = 'Sunny Magnet Production';

function validateFolder(folder, { name, parentId } = {}) {
  if (!folder || folder.mimeType !== FOLDER_MIME_TYPE || folder.trashed !== false ||
      folder.isAppAuthorized !== true || (name && folder.name !== name) ||
      (parentId && (!Array.isArray(folder.parents) || !folder.parents.includes(parentId)))) {
    throw new FolderValidationError('Expected an app-authorized, active folder under the configured parent.');
  }
  requireFileId(folder.id);
  return folder.id;
}

export async function ensureDriveRoot({ drive, rootFolderId }) {
  if (rootFolderId !== undefined) {
    requireFileId(rootFolderId);
    const folder = await drive.getFileMetadata({ fileId: rootFolderId });
    const validatedId = validateFolder(folder, { name: ROOT_FOLDER_NAME });
    if (validatedId !== rootFolderId) throw new FolderValidationError('Configured root ID does not match Drive metadata.');
    return validatedId;
  }
  const folder = await drive.createFolder({ name: ROOT_FOLDER_NAME });
  return validateFolder(folder, { name: ROOT_FOLDER_NAME });
}

async function ensureChild(drive, parentId, name) {
  const expected = { name, parentId };
  const folder = await drive.findChildFolder(expected) ?? await drive.createFolder(expected);
  return validateFolder(folder, expected);
}

export async function ensureOrdersRoot({ drive, rootFolderId }) {
  const validatedRootId = await ensureDriveRoot({ drive, rootFolderId });
  return ensureChild(drive, validatedRootId, 'Orders');
}

export async function ensureOrderFolders({ drive, rootFolderId, orderCode, year, month }) {
  // Validate every path segment before any Drive operation.
  if (typeof year !== 'string' || !/^[0-9]{4}$/.test(year)) {
    throw new FolderValidationError('Year must be four digits.');
  }
  if (typeof month !== 'string' || !/^(0[1-9]|1[0-2])$/.test(month)) {
    throw new FolderValidationError('Month must be 01 through 12.');
  }
  if (typeof orderCode !== 'string' || !/^SM-[0-9]{8}-[0-9]{4,10}$/.test(orderCode)) {
    throw new FolderValidationError('Order code must follow SM-YYYYMMDD-NNNN (4 to 10 sequence digits).');
  }
  requireFileId(rootFolderId);
  const ordersFolderId = await ensureOrdersRoot({ drive, rootFolderId });
  const yearFolderId = await ensureChild(drive, ordersFolderId, year);
  const monthFolderId = await ensureChild(drive, yearFolderId, month);
  const orderFolderId = await ensureChild(drive, monthFolderId, orderCode);
  const originalsFolderId = await ensureChild(drive, orderFolderId, '01_ORIGINALS');
  const artworksFolderId = await ensureChild(drive, orderFolderId, '02_ARTWORKS');
  const printFolderId = await ensureChild(drive, orderFolderId, '03_PRINT');
  return { rootFolderId, ordersFolderId, yearFolderId, monthFolderId, orderFolderId,
    originalsFolderId, artworksFolderId, printFolderId };
}
