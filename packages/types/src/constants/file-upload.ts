/**
 * File upload constants for MVP
 * Simple, focused configuration for current needs
 */

import { AllowedMimeTypes } from '../enums/storage.js'

/**
 * File size limits in bytes
 */
export const FILE_SIZE_LIMITS = {
  AVATAR: 5 * 1024 * 1024, // 5MB
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  DEFAULT: 10 * 1024 * 1024, // 10MB
} as const

/**
 * Allowed MIME types for different upload contexts
 */
export const ALLOWED_FILE_TYPES = {
  AVATAR: [
    AllowedMimeTypes.JPEG,
    AllowedMimeTypes.PNG,
    AllowedMimeTypes.WEBP,
  ] as const,
  
  IMAGE: [
    AllowedMimeTypes.JPEG,
    AllowedMimeTypes.PNG,
    AllowedMimeTypes.WEBP,
    AllowedMimeTypes.GIF,
  ] as const,
  
  DOCUMENT: [
    AllowedMimeTypes.PDF,
  ] as const,
} as const

/**
 * File extension mappings
 */
export const MIME_TO_EXTENSION: Record<string, string[]> = {
  [AllowedMimeTypes.JPEG]: ['jpg', 'jpeg'],
  [AllowedMimeTypes.PNG]: ['png'],
  [AllowedMimeTypes.WEBP]: ['webp'],
  [AllowedMimeTypes.GIF]: ['gif'],
  [AllowedMimeTypes.PDF]: ['pdf'],
} as const

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string | undefined {
  return filename.toLowerCase().split('.').pop()
}

/**
 * Check if file extension matches MIME type
 */
export function isValidFileExtension(filename: string, mimeType: string): boolean {
  const extension = getFileExtension(filename)
  if (!extension) return false
  
  const validExtensions = MIME_TO_EXTENSION[mimeType]
  return validExtensions ? validExtensions.includes(extension) : false
}