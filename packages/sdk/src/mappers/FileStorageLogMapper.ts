import type { FileStorageLogDomain } from '../domain/file-storage.js'
import type { FileStorageLogDTO } from '../dto/file-storage.dto.js'
import type { UserDocument } from './UserMapper.js'

/**
 * Interface representing a database FileStorageLog document
 * Uses camelCase for fields as they come from Prisma
 */
export interface FileStorageLogDocument {
  id: string
  fileId: string
  fileName: string
  contentType: string
  size: number
  folder: string | null
  isPublic: boolean
  url: string
  storageKey: string | null
  status: string
  userId: string | null
  metadata: any // Prisma returns JsonValue which we convert in mapper
  provider: string | null
  uploadedAt: Date | null
  deletedAt: Date | null
  errorMessage: string | null
  processingTimeMs: number | null
  createdAt: Date
  updatedAt: Date | null
  // Relations
  user?: UserDocument | null
}

export class FileStorageLogMapper {
  /**
   * Convert database document to domain entity
   */
  static fromDocument(doc: FileStorageLogDocument): FileStorageLogDomain {
    return {
      id: doc.id,
      fileId: doc.fileId,
      fileName: doc.fileName,
      contentType: doc.contentType,
      size: doc.size,
      folder: doc.folder || undefined,
      isPublic: doc.isPublic,
      url: doc.url,
      storageKey: doc.storageKey || undefined,
      status: doc.status,
      userId: doc.userId || undefined,
      metadata: doc.metadata,
      provider: doc.provider || undefined,
      uploadedAt: doc.uploadedAt || undefined,
      deletedAt: doc.deletedAt || undefined,
      errorMessage: doc.errorMessage || undefined,
      processingTimeMs: doc.processingTimeMs || undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt || new Date(),
    }
  }

  /**
   * Convert domain entity to API DTO
   */
  static toDTO(domain: FileStorageLogDomain): FileStorageLogDTO {
    return {
      id: domain.id,
      fileId: domain.fileId,
      fileName: domain.fileName,
      contentType: domain.contentType,
      size: domain.size,
      folder: domain.folder,
      isPublic: domain.isPublic,
      url: domain.url,
      storageKey: domain.storageKey,
      status: domain.status,
      userId: domain.userId,
      metadata: domain.metadata,
      provider: domain.provider,
      uploadedAt: domain.uploadedAt?.toISOString(),
      deletedAt: domain.deletedAt?.toISOString(),
      errorMessage: domain.errorMessage,
      processingTimeMs: domain.processingTimeMs,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  /**
   * Convert API DTO to domain entity
   */
  static fromDTO(dto: FileStorageLogDTO): FileStorageLogDomain {
    return {
      id: dto.id,
      fileId: dto.fileId,
      fileName: dto.fileName,
      contentType: dto.contentType,
      size: dto.size,
      folder: dto.folder,
      isPublic: dto.isPublic,
      url: dto.url,
      storageKey: dto.storageKey,
      status: dto.status,
      userId: dto.userId,
      metadata: dto.metadata,
      provider: dto.provider,
      uploadedAt: dto.uploadedAt ? new Date(dto.uploadedAt) : undefined,
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : undefined,
      errorMessage: dto.errorMessage,
      processingTimeMs: dto.processingTimeMs,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    }
  }
}
