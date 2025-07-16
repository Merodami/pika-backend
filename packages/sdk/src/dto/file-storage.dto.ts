// File Storage DTOs

export interface FileStorageLogDTO {
  id: string
  fileId: string
  fileName: string
  contentType: string
  size: number
  folder?: string
  isPublic: boolean
  url: string
  storageKey?: string
  status: string
  userId?: string
  metadata?: any
  provider?: string
  uploadedAt?: string
  deletedAt?: string
  errorMessage?: string
  processingTimeMs?: number
  createdAt: string
  updatedAt: string
}

// Request DTOs
export interface UploadFileDTO {
  fileName: string
  contentType: string
  folder?: string
  isPublic?: boolean
  metadata?: Record<string, any>
}

export interface BatchUploadDTO {
  files: Array<{
    fileName: string
    contentType: string
    metadata?: Record<string, any>
  }>
  folder?: string
  isPublic?: boolean
}

export interface FileUrlRequestDTO {
  expiresIn?: number
}

export interface FileUrlResponseDTO {
  url: string
  expiresIn: number
  expiresAt: string
}
