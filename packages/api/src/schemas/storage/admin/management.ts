import { z } from 'zod'

import { UserId } from '../../../common/schemas/branded.js'
import { SortOrder } from '../../../common/schemas/enums.js'
import { withTimestamps } from '../../../common/schemas/metadata.js'
import { DateTime, UUID } from '../../../common/schemas/primitives.js'
import { createIncludeParam } from '../../../common/schemas/query.js'
import { paginatedResponse } from '../../../common/schemas/responses.js'
import { openapi } from '../../../common/utils/openapi.js'
import { FileType, FileStatus, StorageProvider, FileSortBy } from '../common/index.js'

/**
 * Storage service admin management schemas
 */

// ============= Constants =============

export const ADMIN_FILE_RELATIONS = ['user'] as const

// ============= Admin File Management =============

export const AdminFileDetailResponse = openapi(
  withTimestamps({
    id: UUID,
    userId: UserId,
    userName: z.string().optional(),
    userEmail: z.string().email().optional(),
    fileKey: z.string(),
    fileName: z.string(),
    fileSize: z.number().int().positive(),
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
    isPublic: z.boolean().default(false),
    downloadCount: z.number().int().nonnegative().default(0),
    lastAccessedAt: DateTime.optional(),
  }),
  {
    description: 'Admin file details with user information',
  },
)
export type AdminFileDetailResponse = z.infer<typeof AdminFileDetailResponse>

// ============= Admin File Search =============

export const AdminFileQueryParams = openapi(
  z.object({
    search: z.string().optional().describe('Search in filename or file key'),
    userId: UserId.optional(),
    fileType: FileType.optional(),
    status: FileStatus.optional(),
    provider: StorageProvider.optional(),
    mimeType: z.string().optional(),
    minSize: z.coerce.number().int().positive().optional(),
    maxSize: z.coerce.number().int().positive().optional(),
    isPublic: z.coerce.boolean().optional(),
    fromDate: DateTime.optional(),
    toDate: DateTime.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: FileSortBy.default('uploadedAt'),
    sortOrder: SortOrder.default(SortOrder.enum.desc),
    ...createIncludeParam(ADMIN_FILE_RELATIONS).shape,
  }),
  {
    description: 'Admin file search parameters',
  },
)
export type AdminFileQueryParams = z.infer<typeof AdminFileQueryParams>

export const AdminFileListResponse = paginatedResponse(AdminFileDetailResponse)
export type AdminFileListResponse = z.infer<typeof AdminFileListResponse>

// ============= Admin File Actions =============

export const AdminUpdateFileRequest = openapi(
  z.object({
    fileName: z.string().optional(),
    status: FileStatus.optional(),
    isPublic: z.boolean().optional(),
    metadata: z.record(z.string()).optional(),
  }),
  {
    description: 'Admin update file details',
  },
)
export type AdminUpdateFileRequest = z.infer<typeof AdminUpdateFileRequest>

export const AdminBulkFileActionRequest = openapi(
  z.object({
    fileIds: z.array(UUID).min(1).max(100),
    action: z.enum(['delete', 'make_public', 'make_private', 'change_status']),
    newStatus: FileStatus.optional(),
  }),
  {
    description: 'Bulk action on multiple files',
  },
)
export type AdminBulkFileActionRequest = z.infer<typeof AdminBulkFileActionRequest>

export const AdminBulkFileActionResponse = openapi(
  z.object({
    successful: z.array(UUID),
    failed: z.array(
      z.object({
        fileId: UUID,
        error: z.string(),
      }),
    ),
    totalProcessed: z.number().int().nonnegative(),
    totalSuccessful: z.number().int().nonnegative(),
    totalFailed: z.number().int().nonnegative(),
  }),
  {
    description: 'Bulk file action results',
  },
)
export type AdminBulkFileActionResponse = z.infer<typeof AdminBulkFileActionResponse>

// ============= Storage Analytics =============

export const StorageAnalyticsResponse = openapi(
  z.object({
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),
    totalFiles: z.number().int().nonnegative(),
    totalSize: z.number().int().nonnegative().describe('Total size in bytes'),
    newFiles: z.number().int().nonnegative(),
    deletedFiles: z.number().int().nonnegative(),
    averageFileSize: z.number().optional().describe('Average size in bytes'),
    filesByType: z.record(FileType, z.number().int().nonnegative()),
    filesByStatus: z.record(FileStatus, z.number().int().nonnegative()),
    filesByProvider: z.record(StorageProvider, z.number().int().nonnegative()),
    storageByProvider: z.record(StorageProvider, z.number().int().nonnegative()),
    topUsers: z.array(
      z.object({
        userId: UserId,
        userName: z.string(),
        fileCount: z.number().int().nonnegative(),
        totalSize: z.number().int().nonnegative(),
      }),
    ).max(10),
  }),
  {
    description: 'Storage usage analytics',
  },
)
export type StorageAnalyticsResponse = z.infer<typeof StorageAnalyticsResponse>

// ============= Storage Configuration =============

export const StorageConfigurationResponse = openapi(
  z.object({
    providers: z.array(
      z.object({
        name: StorageProvider,
        isActive: z.boolean(),
        isDefault: z.boolean(),
        config: z.object({
          bucket: z.string().optional(),
          region: z.string().optional(),
          endpoint: z.string().optional(),
          maxFileSize: z.number().int().positive(),
          allowedMimeTypes: z.array(z.string()),
        }),
      }),
    ),
    globalSettings: z.object({
      maxFileSize: z.number().int().positive(),
      maxFilesPerUser: z.number().int().positive().optional(),
      defaultExpiration: z.number().int().positive(),
      compressionEnabled: z.boolean(),
      virusScanEnabled: z.boolean(),
    }),
  }),
  {
    description: 'Storage service configuration',
  },
)
export type StorageConfigurationResponse = z.infer<typeof StorageConfigurationResponse>

export const UpdateStorageConfigurationRequest = openapi(
  z.object({
    provider: StorageProvider,
    config: z.object({
      bucket: z.string().optional(),
      region: z.string().optional(),
      endpoint: z.string().optional(),
      maxFileSize: z.number().int().positive().optional(),
      allowedMimeTypes: z.array(z.string()).optional(),
    }).optional(),
    globalSettings: z.object({
      maxFileSize: z.number().int().positive().optional(),
      maxFilesPerUser: z.number().int().positive().optional(),
      defaultExpiration: z.number().int().positive().optional(),
      compressionEnabled: z.boolean().optional(),
      virusScanEnabled: z.boolean().optional(),
    }).optional(),
  }),
  {
    description: 'Update storage configuration',
  },
)
export type UpdateStorageConfigurationRequest = z.infer<typeof UpdateStorageConfigurationRequest>