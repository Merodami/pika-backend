import { z } from 'zod'

import { openapi } from '../../common/utils/openapi.js'

/**
 * File upload schemas for various features
 */

// ============= File Types =============

export const AllowedImageTypes = z.enum([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export const AllowedImageTypesSchema = AllowedImageTypes.openapi(
  'AllowedImageTypes',
  {
    description: 'Allowed image MIME types',
    example: 'image/jpeg',
  },
)

export type AllowedImageTypes = z.infer<typeof AllowedImageTypes>

export const AllowedDocumentTypes = z.enum([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export const AllowedDocumentTypesSchema = AllowedDocumentTypes.openapi(
  'AllowedDocumentTypes',
  {
    description: 'Allowed document MIME types',
    example: 'application/pdf',
  },
)

export type AllowedDocumentTypes = z.infer<typeof AllowedDocumentTypes>

// ============= Binary File Schemas =============

/**
 * Binary file (raw Zod)
 * For runtime validation of file uploads
 */
export const BinaryFile = z.any()

/**
 * Binary file (OpenAPI documented)
 * This generates proper type: string, format: binary in OpenAPI spec
 */
export const BinaryFileSchema = BinaryFile.openapi('BinaryFile', {
  type: 'string',
  format: 'binary',
  description: 'Binary file data',
})

// ============= File Upload =============

/**
 * File upload metadata (raw Zod)
 * For runtime validation
 */
export const FileUpload = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  mimetype: z.string(),
  size: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024), // 10MB max
  buffer: z
    .instanceof(Buffer)
    .optional()
    .describe('File buffer for in-memory storage'),
  path: z.string().optional().describe('File path for disk storage'),
})

/**
 * File upload metadata (OpenAPI documented)
 */
export const FileUploadSchema = FileUpload.openapi('FileUpload', {
  description: 'Uploaded file metadata',
})

export type FileUpload = z.infer<typeof FileUpload>

/**
 * Session review image upload (raw Zod)
 */
export const ReviewImageUpload = z.object({
  fieldname: z.literal('image'),
  originalname: z.string(),
  mimetype: AllowedImageTypes,
  size: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024), // 10MB max
})

/**
 * Session review image upload (OpenAPI documented)
 */
export const ReviewImageUploadSchema = ReviewImageUpload.openapi('ReviewImageUpload', {
  description: 'Review image upload validation',
})

export type ReviewImageUpload = z.infer<typeof ReviewImageUpload>

/**
 * Document upload for certifications, etc. (raw Zod)
 */
export const DocumentUpload = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  mimetype: AllowedDocumentTypes,
  size: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024), // 10MB max
})

/**
 * Document upload for certifications, etc. (OpenAPI documented)
 */
export const DocumentUploadSchema = DocumentUpload.openapi('DocumentUpload', {
  description: 'Document upload validation',
})

export type DocumentUpload = z.infer<typeof DocumentUpload>

/**
 * Multi-file upload response (raw Zod)
 */
export const FileUploadResponse = z.object({
  url: z.string().url().describe('Public URL of uploaded file'),
  key: z.string().describe('Storage key/identifier'),
  mimetype: z.string(),
  size: z.number().int().positive(),
  uploadedAt: z.string().datetime(),
})

/**
 * Multi-file upload response (OpenAPI documented)
 */
export const FileUploadResponseSchema = FileUploadResponse.openapi('FileUploadResponse', {
  description: 'Successful file upload response',
})

export type FileUploadResponse = z.infer<typeof FileUploadResponse>

/**
 * Batch file upload response (raw Zod)
 */
export const BatchFileUploadResponse = z.object({
  files: z.array(FileUploadResponse),
  totalSize: z.number().int().positive(),
  count: z.number().int().positive(),
})

/**
 * Batch file upload response (OpenAPI documented)
 */
export const BatchFileUploadResponseSchema = BatchFileUploadResponse.openapi('BatchFileUploadResponse', {
  description: 'Multiple files uploaded successfully',
})

export type BatchFileUploadResponse = z.infer<typeof BatchFileUploadResponse>

