import { z } from 'zod'

/**
 * Storage service enums
 */

export const FileType = z.enum(['image', 'video', 'document', 'audio', 'other'])
export type FileType = z.infer<typeof FileType>

export const FileStatus = z.enum(['pending', 'uploaded', 'failed', 'deleted'])
export type FileStatus = z.infer<typeof FileStatus>

export const StorageProvider = z.enum(['aws_s3', 'local', 'minio'])
export type StorageProvider = z.infer<typeof StorageProvider>

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

export const FileSortBy = z.enum(['uploadedAt', 'fileSize', 'fileName'])
export type FileSortBy = z.infer<typeof FileSortBy>

export const HealthStatus = z.enum(['healthy', 'degraded', 'unhealthy'])
export type HealthStatus = z.infer<typeof HealthStatus>
