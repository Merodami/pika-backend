import { z } from 'zod'

import { UserId } from '../../../common/schemas/branded.js'
import { withTimestamps } from '../../../common/schemas/metadata.js'
import { DateTime, UUID } from '../../../common/schemas/primitives.js'
import { paginatedResponse } from '../../../common/schemas/responses.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * File storage schemas for public API
 */

// ============= Enums =============

export const FileType = z.enum(['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'OTHER'])
export type FileType = z.infer<typeof FileType>

export const FileStatus = z.enum(['PENDING', 'UPLOADED', 'FAILED', 'DELETED'])
export type FileStatus = z.infer<typeof FileStatus>

export const StorageProvider = z.enum([
  'AWS_S3',
  'GOOGLE_CLOUD',
  'AZURE',
  'LOCAL',
])
export type StorageProvider = z.infer<typeof StorageProvider>

// ============= File Schema =============

/**
 * File storage log entry
 */
export const FileStorageLog = openapi(
  withTimestamps({
    id: UUID,
    userId: UserId,
    fileKey: z.string().describe('Storage key/path'),
    fileName: z.string(),
    fileSize: z.number().int().positive().describe('Size in bytes'),
    mimeType: z.string(),
    fileType: FileType,
    status: FileStatus,
    provider: StorageProvider,
    bucketName: z.string().optional(),
    region: z.string().optional(),
    uploadedAt: DateTime.optional(),
    deletedAt: DateTime.optional(),
    metadata: z.record(z.string()).optional(),
    error: z.string().optional(),
  }),
  {
    description: 'File storage log entry',
  },
)

export type FileStorageLog = z.infer<typeof FileStorageLog>

// ============= Upload Response =============

/**
 * File upload response
 */
export const FileUploadResponse = openapi(
  z.object({
    fileId: UUID,
    fileKey: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    fileType: FileType,
    url: z.string().url().optional().describe('Presigned URL if applicable'),
    uploadedAt: DateTime,
  }),
  {
    description: 'Response after successful file upload',
  },
)

export type FileUploadResponse = z.infer<typeof FileUploadResponse>

/**
 * Batch upload response
 */
export const BatchUploadResponse = openapi(
  z.object({
    successful: z.array(FileUploadResponse),
    failed: z.array(
      z.object({
        fileName: z.string(),
        error: z.string(),
      }),
    ),
    totalUploaded: z.number().int().nonnegative(),
    totalFailed: z.number().int().nonnegative(),
  }),
  {
    description: 'Response after batch file upload',
  },
)

export type BatchUploadResponse = z.infer<typeof BatchUploadResponse>

// ============= File URL Response =============

/**
 * Get file URL response
 */
export const FileUrlResponse = openapi(
  z.object({
    url: z.string().url(),
    expiresAt: DateTime,
    fileId: UUID,
    fileName: z.string(),
    mimeType: z.string(),
  }),
  {
    description: 'Presigned URL for file access',
  },
)

export type FileUrlResponse = z.infer<typeof FileUrlResponse>

// ============= Query Parameters =============

/**
 * Get file history query parameters
 */
export const GetFileHistoryQuery = openapi(
  z.object({
    status: z.string().optional(),
    folder: z.string().optional(),
    contentType: z.string().optional(),
    provider: z.string().optional(),
    fromDate: DateTime.optional(),
    toDate: DateTime.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z
      .enum(['uploadedAt', 'fileSize', 'fileName'])
      .default('uploadedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  {
    description: 'Query parameters for file history',
  },
)

export type GetFileHistoryQuery = z.infer<typeof GetFileHistoryQuery>

/**
 * File history response
 */
export const FileHistoryResponse = paginatedResponse(FileStorageLog)

export type FileHistoryResponse = z.infer<typeof FileHistoryResponse>

// ============= Path Parameters =============

/**
 * File ID parameter
 */
export const FileIdParam = openapi(
  z.object({
    fileId: UUID,
  }),
  {
    description: 'File ID path parameter',
  },
)

export type FileIdParam = z.infer<typeof FileIdParam>

/**
 * File history ID parameter
 */
export const FileHistoryIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'File history ID path parameter',
  },
)

export type FileHistoryIdParam = z.infer<typeof FileHistoryIdParam>

// ============= Upload Validation =============

/**
 * Allowed MIME types for upload
 */
export const AllowedMimeTypes = z.enum([
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Videos
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
])

export type AllowedMimeTypes = z.infer<typeof AllowedMimeTypes>

/**
 * File upload metadata
 */
export const FileUploadMetadata = openapi(
  z.object({
    category: z.string().optional(),
    description: z.string().max(500).optional(),
    tags: z.array(z.string()).max(10).optional(),
    isPublic: z.boolean().default(false),
  }),
  {
    description: 'Optional metadata for file upload',
  },
)

export type FileUploadMetadata = z.infer<typeof FileUploadMetadata>

// ============= Request Schemas =============

/**
 * File upload request body schema (for multipart form data)
 */
export const FileUploadRequest = openapi(
  z.object({
    folder: z.string().optional().describe('Target folder for upload'),
    isPublic: z
      .string()
      .transform((val) => val === 'true')
      .optional()
      .describe('Whether file should be publicly accessible'),
    metadata: z
      .string()
      .transform((val) => {
        try {
          return val ? JSON.parse(val) : undefined
        } catch {
          return undefined
        }
      })
      .optional()
      .describe('JSON string of additional metadata'),
  }),
  {
    description: 'File upload request body (from multipart form)',
  },
)

export type FileUploadRequest = z.infer<typeof FileUploadRequest>

/**
 * Batch file upload request body schema
 */
export const BatchFileUploadRequest = openapi(
  z.object({
    folder: z.string().optional().describe('Target folder for uploads'),
    isPublic: z
      .string()
      .transform((val) => val === 'true')
      .optional()
      .describe('Whether files should be publicly accessible'),
  }),
  {
    description: 'Batch file upload request body',
  },
)

export type BatchFileUploadRequest = z.infer<typeof BatchFileUploadRequest>

/**
 * Get file URL query parameters
 */
export const GetFileUrlQuery = openapi(
  z.object({
    expiresIn: z.coerce
      .number()
      .int()
      .positive()
      .max(86400)
      .default(3600)
      .describe('URL expiration time in seconds'),
  }),
  {
    description: 'Query parameters for getting file URL',
  },
)

export type GetFileUrlQuery = z.infer<typeof GetFileUrlQuery>
