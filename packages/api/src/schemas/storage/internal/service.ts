import { z } from 'zod'

import { UserId } from '../../../common/schemas/branded.js'
import { DateTime, UUID } from '../../../common/schemas/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'
import { FileType, FileStatus, StorageProvider } from '../common/index.js'

/**
 * Internal storage service schemas for service-to-service communication
 */

// ============= Service Health =============

export const StorageServiceHealthCheck = openapi(
  z.object({
    service: z.literal('storage'),
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    timestamp: z.string().datetime(),
    providersStatus: z.record(StorageProvider, z.enum(['healthy', 'degraded', 'unhealthy'])),
    totalFiles: z.number().int().nonnegative(),
    totalStorageUsed: z.number().int().nonnegative().describe('Total storage in bytes'),
    diskSpaceRemaining: z.number().int().nonnegative().optional().describe('For local storage'),
  }),
  {
    description: 'Storage service health status',
  },
)
export type StorageServiceHealthCheck = z.infer<typeof StorageServiceHealthCheck>

// ============= Internal File Operations =============

export const InternalCreateFileRequest = openapi(
  z.object({
    userId: UserId,
    fileKey: z.string(),
    fileName: z.string(),
    fileSize: z.number().int().positive(),
    mimeType: z.string(),
    fileType: FileType,
    provider: StorageProvider,
    bucketName: z.string().optional(),
    region: z.string().optional(),
    isPublic: z.boolean().default(false),
    metadata: z.record(z.string()).optional(),
  }),
  {
    description: 'Internal file creation request',
  },
)
export type InternalCreateFileRequest = z.infer<typeof InternalCreateFileRequest>

export const InternalFileResponse = openapi(
  z.object({
    id: UUID,
    userId: UserId,
    fileKey: z.string(),
    fileName: z.string(),
    fileSize: z.number().int().positive(),
    mimeType: z.string(),
    fileType: FileType,
    status: FileStatus,
    provider: StorageProvider,
    bucketName: z.string().optional(),
    region: z.string().optional(),
    isPublic: z.boolean(),
    metadata: z.record(z.string()).optional(),
    uploadedAt: DateTime.optional(),
    createdAt: DateTime,
    updatedAt: DateTime,
  }),
  {
    description: 'Internal file response',
  },
)
export type InternalFileResponse = z.infer<typeof InternalFileResponse>

// ============= Bulk Operations =============

export const InternalBulkDeleteRequest = openapi(
  z.object({
    fileIds: z.array(UUID).min(1).max(1000),
    userId: UserId.optional().describe('If provided, only delete files owned by this user'),
    reason: z.string().optional(),
  }),
  {
    description: 'Internal bulk delete files request',
  },
)
export type InternalBulkDeleteRequest = z.infer<typeof InternalBulkDeleteRequest>

export const InternalBulkDeleteResponse = openapi(
  z.object({
    deleted: z.array(UUID),
    failed: z.array(
      z.object({
        fileId: UUID,
        error: z.string(),
      }),
    ),
    totalDeleted: z.number().int().nonnegative(),
    totalFailed: z.number().int().nonnegative(),
  }),
  {
    description: 'Internal bulk delete response',
  },
)
export type InternalBulkDeleteResponse = z.infer<typeof InternalBulkDeleteResponse>

// ============= User File Management =============

export const GetUserFilesRequest = openapi(
  z.object({
    userId: UserId,
    fileType: FileType.optional(),
    status: FileStatus.optional(),
    limit: z.number().int().positive().max(1000).default(100),
    offset: z.number().int().nonnegative().default(0),
  }),
  {
    description: 'Get files for a specific user',
  },
)
export type GetUserFilesRequest = z.infer<typeof GetUserFilesRequest>

export const UserFileSummaryResponse = openapi(
  z.object({
    userId: UserId,
    totalFiles: z.number().int().nonnegative(),
    totalSize: z.number().int().nonnegative().describe('Total size in bytes'),
    filesByType: z.record(FileType, z.number().int().nonnegative()),
    filesByStatus: z.record(FileStatus, z.number().int().nonnegative()),
    oldestFile: DateTime.optional(),
    newestFile: DateTime.optional(),
  }),
  {
    description: 'User file summary for internal use',
  },
)
export type UserFileSummaryResponse = z.infer<typeof UserFileSummaryResponse>

// ============= Storage Quotas =============

export const CheckUserQuotaRequest = openapi(
  z.object({
    userId: UserId,
    fileSize: z.number().int().positive(),
    fileType: FileType.optional(),
  }),
  {
    description: 'Check if user can upload file within quota',
  },
)
export type CheckUserQuotaRequest = z.infer<typeof CheckUserQuotaRequest>

export const UserQuotaResponse = openapi(
  z.object({
    userId: UserId,
    canUpload: z.boolean(),
    quotaExceeded: z.boolean(),
    currentUsage: z.number().int().nonnegative().describe('Current usage in bytes'),
    quotaLimit: z.number().int().positive().describe('Quota limit in bytes'),
    remainingSpace: z.number().int().nonnegative().describe('Remaining space in bytes'),
    fileCountLimit: z.number().int().positive().optional(),
    currentFileCount: z.number().int().nonnegative(),
  }),
  {
    description: 'User storage quota information',
  },
)
export type UserQuotaResponse = z.infer<typeof UserQuotaResponse>

// ============= File Migration =============

export const MigrateFileRequest = openapi(
  z.object({
    fileId: UUID,
    targetProvider: StorageProvider,
    targetBucket: z.string().optional(),
    targetRegion: z.string().optional(),
    deleteOriginal: z.boolean().default(true),
  }),
  {
    description: 'Migrate file between storage providers',
  },
)
export type MigrateFileRequest = z.infer<typeof MigrateFileRequest>

export const MigrateFileResponse = openapi(
  z.object({
    fileId: UUID,
    oldProvider: StorageProvider,
    newProvider: StorageProvider,
    oldFileKey: z.string(),
    newFileKey: z.string(),
    migrationStatus: z.enum(['success', 'failed', 'partial']),
    error: z.string().optional(),
    migratedAt: DateTime,
  }),
  {
    description: 'File migration result',
  },
)
export type MigrateFileResponse = z.infer<typeof MigrateFileResponse>

// ============= Cleanup Operations =============

export const CleanupOrphanedFilesRequest = openapi(
  z.object({
    olderThan: DateTime.describe('Delete files older than this date'),
    dryRun: z.boolean().default(true),
    provider: StorageProvider.optional(),
    batchSize: z.number().int().positive().max(1000).default(100),
  }),
  {
    description: 'Cleanup orphaned files request',
  },
)
export type CleanupOrphanedFilesRequest = z.infer<typeof CleanupOrphanedFilesRequest>

export const CleanupOrphanedFilesResponse = openapi(
  z.object({
    filesFound: z.number().int().nonnegative(),
    filesDeleted: z.number().int().nonnegative(),
    storageFreed: z.number().int().nonnegative().describe('Storage freed in bytes'),
    errors: z.array(z.string()),
    dryRun: z.boolean(),
  }),
  {
    description: 'Cleanup orphaned files response',
  },
)
export type CleanupOrphanedFilesResponse = z.infer<typeof CleanupOrphanedFilesResponse>