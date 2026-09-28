// Fixed messages only: never attach provider bodies, credentials, or causes.
export class OAuthError extends Error {
  constructor(message = 'Google OAuth request failed.', { status } = {}) {
    super(message);
    this.name = 'OAuthError';
    if (Number.isInteger(status)) this.status = status;
  }
}

export class DriveApiError extends Error {
  constructor(message = 'Google Drive request failed.', { status } = {}) {
    super(message);
    this.name = 'DriveApiError';
    if (Number.isInteger(status)) this.status = status;
  }
}

export class FolderValidationError extends Error {
  constructor(message = 'Invalid Drive folder configuration.') {
    super(message);
    this.name = 'FolderValidationError';
  }
}

export class UploadError extends Error {
  constructor(message = 'Drive upload failed.', { status } = {}) {
    super(message);
    this.name = 'UploadError';
    if (Number.isInteger(status)) this.status = status;
  }
}

export function requireText(value, ErrorType, message) {
  if (typeof value !== 'string' || !value.trim()) throw new ErrorType(message);
}

export function requireFileId(value, ErrorType = FolderValidationError) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new ErrorType('Invalid Drive file or folder ID.');
  }
}
