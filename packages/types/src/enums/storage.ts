/**
 * Storage service-related enums
 */

/**
 * File type categories
 */
export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  OTHER = 'other',
}

/**
 * Type definition for file type - use this for type annotations
 */
export type FileTypeType = `${FileType}`

/**
 * File processing status
 */
export enum FileStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
  DELETED = 'deleted',
}

/**
 * Type definition for file status - use this for type annotations
 */
export type FileStatusType = `${FileStatus}`

/**
 * Supported storage providers
 */
export enum StorageProvider {
  AWS_S3 = 'awsS3',
  LOCAL = 'local',
  MINIO = 'minio',
}

/**
 * Type definition for storage provider - use this for type annotations
 * Alias for compatibility
 */
export type StorageProviderType = `${StorageProvider}`
export type FileProviderType = StorageProviderType
export { StorageProvider as FileProvider }

/**
 * File sorting fields
 */
export enum FileSortBy {
  UPLOADED_AT = 'uploadedAt',
  FILE_SIZE = 'fileSize',
  FILE_NAME = 'fileName',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * System health status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * File migration status
 */
export enum MigrationStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

/**
 * File bulk action types
 */
export enum FileBulkAction {
  DELETE = 'delete',
  MAKE_PUBLIC = 'makePublic',
  MAKE_PRIVATE = 'makePrivate',
  CHANGE_STATUS = 'changeStatus',
}

/**
 * Allowed MIME types for file uploads
 */
export enum AllowedMimeTypes {
  // Images
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif',
  WEBP = 'image/webp',
  SVG = 'image/svg+xml',
  // Documents
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS = 'application/vnd.ms-excel',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Videos
  MP4 = 'video/mp4',
  MPEG = 'video/mpeg',
  QUICKTIME = 'video/quicktime',
  AVI = 'video/x-msvideo',
  // Audio
  MP3 = 'audio/mpeg',
  WAV = 'audio/wav',
  OGG = 'audio/ogg',
}

/**
 * Allowed image MIME types (subset for image uploads)
 */
export enum AllowedImageTypes {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
  GIF = 'image/gif',
}

/**
 * Allowed document MIME types (subset for document uploads)
 */
export enum AllowedDocumentTypes {
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
