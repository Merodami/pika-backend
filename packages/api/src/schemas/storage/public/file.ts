import { FileSortBy } from '@pika/types'
import { NUMERIC_CONSTRAINTS, SortOrder } from '@pika/types'
import { z } from 'zod'
import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  FileSortBySchema,
  FileStatusSchema,
  FileTypeSchema,
  StorageProviderSchema,
} from '../common/enums.js'

/**
 * File storage schemas for public API
 */

// Enums are now imported from common/

// ============= File Schema =============

/**
 * File storage log entry (raw Zod)
 */
export const FileStorageLog = withTimestamps({
  id: UUID,
  userId: UserId,
  fileKey: z.string().describe('Storage key/path'),
  fileName: z.string(),
  fileSize: z.number().int().positive().describe('Size in bytes'),
  mimeType: z.string(),
  fileType: FileTypeSchema,
  status: FileStatusSchema,
  provider: StorageProviderSchema,
  bucketName: z.string().optional(),
  region: z.string().optional(),
  uploadedAt: DateTime.optional(),
  deletedAt: DateTime.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
})

/**
 * File storage log entry (OpenAPI documented)
 */
export const FileStorageLogSchema = FileStorageLog.openapi('FileStorageLog', {
  description: 'File storage log entry',
})

export type FileStorageLog = z.infer<typeof FileStorageLog>

// ============= Upload Response =============

/**
 * File upload response (raw Zod)
 */
export const FileUploadResponse = z.object({
  id: UUID.describe('Storage log ID'),
  fileId: UUID,
  fileKey: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  fileType: FileTypeSchema,
  status: FileStatusSchema,
  provider: StorageProviderSchema,
  url: z.string().url().optional().describe('Presigned URL if applicable'),
  uploadedAt: DateTime,
  metadata: z
    .record(z.string(), z.any())
    .optional()
    .describe('File metadata'),
})

/**
 * File upload response (OpenAPI documented)
 */
export const FileUploadResponseSchema = FileUploadResponse.openapi(
  'FileUploadResponse',
  {
    description: 'Response after successful file upload',
  },
)

export type FileUploadResponse = z.infer<typeof FileUploadResponse>

/**
 * Batch upload response (raw Zod)
 */
export const BatchUploadResponse = z.object({
  successful: z.array(FileUploadResponse),
  failed: z.array(
    z.object({
      fileName: z.string(),
      error: z.string(),
    }),
  ),
  totalUploaded: z.number().int().nonnegative(),
  totalFailed: z.number().int().nonnegative(),
})

/**
 * Batch upload response (OpenAPI documented)
 */
export const BatchUploadResponseSchema = BatchUploadResponse.openapi(
  'BatchUploadResponse',
  {
    description: 'Response after batch file upload',
  },
)

export type BatchUploadResponse = z.infer<typeof BatchUploadResponse>

// ============= File URL Response =============

/**
 * Get file URL response (raw Zod)
 */
export const FileUrlResponse = z.object({
  url: z.string().url(),
  expiresAt: DateTime,
  fileId: UUID,
  fileName: z.string(),
  mimeType: z.string(),
})

/**
 * Get file URL response (OpenAPI documented)
 */
export const FileUrlResponseSchema = FileUrlResponse.openapi(
  'FileUrlResponse',
  {
    description: 'Presigned URL for file access',
  },
)

export type FileUrlResponse = z.infer<typeof FileUrlResponse>

// ============= Query Parameters =============

/**
 * Get file history query parameters (raw Zod)
 */
export const GetFileHistoryQuery = z.object({
  status: z.string().optional(),
  folder: z.string().optional(),
  contentType: z.string().optional(),
  provider: z.string().optional(),
  fromDate: DateTime.optional(),
  toDate: DateTime.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(NUMERIC_CONSTRAINTS.PAGE_SIZE_MAX)
    .default(NUMERIC_CONSTRAINTS.PAGE_SIZE_DEFAULT),
  sortBy: FileSortBySchema.default(FileSortBy.UPLOADED_AT),
  sortOrder: createZodEnum(SortOrder).default(SortOrder.DESC),
})

/**
 * Get file history query parameters (OpenAPI documented)
 */
export const GetFileHistoryQuerySchema = GetFileHistoryQuery.openapi(
  'GetFileHistoryQuery',
  {
    description: 'Query parameters for file history',
  },
)

export type GetFileHistoryQuery = z.infer<typeof GetFileHistoryQuery>

/**
 * File history response (raw Zod)
 */
export const FileHistoryResponse = paginatedResponse(FileStorageLog)

/**
 * File history response (OpenAPI documented)
 */
export const FileHistoryResponseSchema = FileHistoryResponse.openapi(
  'FileHistoryResponse',
  {
    description: 'Paginated file history',
  },
)

export type FileHistoryResponse = z.infer<typeof FileHistoryResponse>

// Path parameters are now imported from common/

// ============= Upload Validation =============

// AllowedMimeTypes is now imported from common/

/**
 * File upload metadata (raw Zod)
 */
export const FileUploadMetadata = z.object({
  category: z.string().optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
  isPublic: z.boolean().default(false),
})

/**
 * File upload metadata (OpenAPI documented)
 */
export const FileUploadMetadataSchema = FileUploadMetadata.openapi(
  'FileUploadMetadata',
  {
    description: 'Optional metadata for file upload',
  },
)

export type FileUploadMetadata = z.infer<typeof FileUploadMetadata>

// ============= Request Schemas =============

/**
 * File upload request body schema (for multipart form data) (raw Zod)
 */
export const FileUploadRequest = z.object({
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
})

/**
 * File upload request body schema (OpenAPI documented)
 */
export const FileUploadRequestSchema = FileUploadRequest.openapi(
  'FileUploadRequest',
  {
    description: 'File upload request body (from multipart form)',
  },
)

export type FileUploadRequest = z.infer<typeof FileUploadRequest>

/**
 * Batch file upload request body schema (raw Zod)
 */
export const BatchFileUploadRequest = z.object({
  folder: z.string().optional().describe('Target folder for uploads'),
  isPublic: z
    .string()
    .transform((val) => val === 'true')
    .optional()
    .describe('Whether files should be publicly accessible'),
})

/**
 * Batch file upload request body schema (OpenAPI documented)
 */
export const BatchFileUploadRequestSchema = BatchFileUploadRequest.openapi(
  'BatchFileUploadRequest',
  {
    description: 'Batch file upload request body',
  },
)

export type BatchFileUploadRequest = z.infer<typeof BatchFileUploadRequest>

/**
 * Get file URL query parameters (raw Zod)
 */
export const GetFileUrlQuery = z.object({
  expiresIn: z.coerce
    .number()
    .int()
    .positive()
    .max(86400)
    .default(3600)
    .describe('URL expiration time in seconds'),
})

/**
 * Get file URL query parameters (OpenAPI documented)
 */
export const GetFileUrlQuerySchema = GetFileUrlQuery.openapi(
  'GetFileUrlQuery',
  {
    description: 'Query parameters for getting file URL',
  },
)

export type GetFileUrlQuery = z.infer<typeof GetFileUrlQuery>
