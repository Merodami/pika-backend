import { ErrorFactory } from '@shared/errors/index.js'
import { logger } from '@shared/infrastructure/logger/index.js'
import * as crypto from 'crypto'
import { get } from 'lodash-es'
import * as path from 'path'

import {
  FileStorageConfig,
  FileStorageOptions,
  FileStoragePort,
  FileStorageResult,
  FileUpload,
} from '../FileStorage.js'

/**
 * Configuration for S3 storage
 */
export interface S3FileStorageConfig extends FileStorageConfig {
  /**
   * S3 bucket name
   */
  bucket: string

  /**
   * AWS region
   */
  region: string

  /**
   * Optional custom endpoint for S3-compatible services
   */
  endpoint?: string

  /**
   * Base path within the bucket
   */
  basePath?: string

  /**
   * Base URL for accessing stored files
   * e.g., 'https://my-bucket.s3.amazonaws.com'
   */
  baseUrl: string

  /**
   * Optional credentials (normally would use environment or instance profile)
   */
  credentials?: {
    accessKeyId: string
    secretAccessKey: string
  }
}

/**
 * AWS S3 implementation of FileStorage
 * This is a stub implementation - in a real application, you would use the AWS SDK
 */
export class S3FileStorage implements FileStoragePort {
  private readonly config: S3FileStorageConfig
  private readonly validCombinations: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg', '.jpe'],
    'image/png': ['.png'],
    'image/svg+xml': ['.svg'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'application/pdf': ['.pdf'],
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
      '.xlsx',
    ],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      '.docx',
    ],
  }

  constructor(config: S3FileStorageConfig) {
    this.config = {
      ...config,
      allowedTypes: config.allowedTypes || [
        'image/jpeg',
        'image/png',
        'image/svg+xml',
        'image/webp',
        'image/gif',
      ],
      maxSize: config.maxSize || 5 * 1024 * 1024, // 5MB default
      basePath: config.basePath || '',
    }

    logger.info(
      `Initialized S3 file storage with bucket: ${this.config.bucket}`,
    )
  }

  /**
   * Save a file to S3 storage
   * @param file - The file to save
   * @param prefix - Optional prefix for the file path (e.g., 'uploads')
   * @param options - Optional configuration for this specific file
   * @returns The result object with URL and metadata about the saved file
   */
  async saveFile(
    file: FileUpload,
    prefix = 'uploads',
    options: FileStorageOptions = {},
  ): Promise<FileStorageResult> {
    // Validate file before processing
    this.validateFile(file)

    // Run custom validator if provided
    if (this.config.customValidator) {
      try {
        await this.config.customValidator(file)
      } catch (error) {
        throw ErrorFactory.fromError(error, 'Custom validation failed', {
          source: 'S3FileStorage.saveFile.customValidator',
        })
      }
    }

    // Generate unique filename with original extension
    const originalExt =
      path.extname(file.filename || '').toLowerCase() || '.bin'

    let filename: string

    // Use custom filename, preserve original, or generate random
    if (options.filename) {
      // Use custom filename but ensure it has an extension
      filename = options.filename
      if (!path.extname(filename)) {
        filename += originalExt
      }
    } else if (options.preserveFilename && file.filename) {
      // Sanitize the original filename
      filename = this.sanitizeKey(file.filename)
    } else {
      // Generate random filename
      const randomName = crypto.randomBytes(16).toString('hex')

      filename = `${randomName}${originalExt}`
    }

    // Construct S3 key (path within bucket)
    const basePath = this.config.basePath ? `${this.config.basePath}/` : ''
    const s3Key = `${basePath}${prefix}/${filename}`

    try {
      // In a real implementation, we would use the AWS SDK to upload the file
      // For this stub, we'll log the operation and return a mock result
      logger.info(`[S3 STUB] Would upload file to S3: ${s3Key}`, {
        bucket: this.config.bucket,
        key: s3Key,
        contentType: file.mimetype,
        size: file.size,
      })

      // Construct the public URL
      const fileUrl = `${this.config.baseUrl}/${s3Key}`

      // In a real implementation, this would be the response from the S3 putObject call
      // Generate thumbnail URL if needed
      let thumbnailUrl: string | undefined

      if (this.config.generateThumbnails && this.isImageFile(file.mimetype)) {
        const thumbFilename = this.getThumbnailFilename(filename)

        thumbnailUrl = `${this.config.baseUrl}/${basePath}${prefix}/${thumbFilename}`
      }

      return {
        url: fileUrl,
        thumbnailUrl,
        size: file.size,
        mimetype: file.mimetype,
        originalFilename: file.filename || 'unknown',
        filename,
        path: s3Key,
      }
    } catch (error) {
      logger.error('Error uploading file to S3:', error)
      throw ErrorFactory.fromError(error, 'Failed to upload file to S3', {
        source: 'S3FileStorage.saveFile',
      })
    }
  }

  /**
   * Delete a file from S3 storage
   * @param fileUrl - The URL of the file to delete
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract the S3 key from the URL
      const s3Key = this.getKeyFromUrl(fileUrl)

      if (!s3Key) {
        throw new Error('Invalid file URL format')
      }

      // In a real implementation, we would use the AWS SDK to delete the object
      logger.info(`[S3 STUB] Would delete file from S3: ${s3Key}`, {
        bucket: this.config.bucket,
        key: s3Key,
      })

      // Also delete thumbnail if it exists
      if (
        this.config.generateThumbnails &&
        this.isImageFile(this.getMimeTypeFromPath(s3Key))
      ) {
        const keyParts = s3Key.split('/')
        const filename = keyParts.pop() || ''
        const prefix = keyParts.join('/')

        const thumbnailFilename = this.getThumbnailFilename(filename)
        const thumbnailKey = `${prefix}/${thumbnailFilename}`

        logger.info(
          `[S3 STUB] Would delete thumbnail from S3: ${thumbnailKey}`,
          {
            bucket: this.config.bucket,
            key: thumbnailKey,
          },
        )
      }
    } catch (err) {
      logger.error('Error deleting file from S3:', err)
      throw ErrorFactory.fromError(err, 'Failed to delete file from S3', {
        source: 'S3FileStorage.deleteFile',
      })
    }
  }

  /**
   * Validate file before saving
   * @private
   */
  private validateFile(file: FileUpload): void {
    if (!file) {
      throw ErrorFactory.validationError(
        { file: ['No file provided'] },
        { source: 'S3FileStorage.validateFile' },
      )
    }

    if (!file.filename) {
      throw ErrorFactory.validationError(
        { file: ['Missing filename'] },
        { source: 'S3FileStorage.validateFile' },
      )
    }

    // Validate extension matches MIME type
    const ext = path.extname(file.filename).toLowerCase()

    this.validateFileExtension(ext, file.mimetype)

    // Check file type
    if (!this.config.allowedTypes?.includes(file.mimetype)) {
      throw ErrorFactory.validationError(
        {
          file: [
            `Unsupported file type: ${file.mimetype}. Allowed types: ${this.config.allowedTypes?.join(', ')}`,
          ],
        },
        { source: 'S3FileStorage.validateFile' },
      )
    }

    // Check file size
    if (this.config.maxSize && file.size > this.config.maxSize) {
      const maxSizeMB = Math.round(this.config.maxSize / (1024 * 1024))

      throw ErrorFactory.validationError(
        {
          file: [`File too large. Maximum size is ${maxSizeMB}MB`],
        },
        { source: 'S3FileStorage.validateFile' },
      )
    }
  }

  /**
   * Validate file extension matches MIME type
   * @private
   */
  private validateFileExtension(ext: string, mimeType: string): void {
    // If we have a mapping for this MIME type, check the extension
    const validExtensions = get(this.validCombinations, mimeType)

    if (validExtensions && !validExtensions.includes(ext)) {
      throw ErrorFactory.validationError(
        {
          file: [
            `File extension "${ext}" doesn't match declared type "${mimeType}"`,
          ],
        },
        {
          source: 'S3FileStorage.validateFileExtension',
          suggestion: `Use a file with a valid extension for type ${mimeType} (${validExtensions.join(', ')})`,
        },
      )
    }
  }

  /**
   * Extract S3 key from URL
   * @private
   */
  private getKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url)

      // Extract pathname from URL
      let urlPathname = urlObj.pathname

      // Remove leading slash if present
      if (urlPathname.startsWith('/')) {
        urlPathname = urlPathname.substring(1)
      }

      // Remove basePath if present
      if (
        this.config.basePath &&
        urlPathname.startsWith(this.config.basePath)
      ) {
        urlPathname = urlPathname.substring(this.config.basePath.length)
        // Remove leading slash again if needed
        if (urlPathname.startsWith('/')) {
          urlPathname = urlPathname.substring(1)
        }
      }

      return urlPathname
    } catch {
      // If it's not a valid URL, try matching against baseUrl
      if (url.startsWith(this.config.baseUrl)) {
        const urlPathname = url.substring(this.config.baseUrl.length)

        // Remove leading slash if present
        return urlPathname.startsWith('/')
          ? urlPathname.substring(1)
          : urlPathname
      }

      return null
    }
  }

  /**
   * Sanitize S3 key to prevent issues
   * @private
   */
  private sanitizeKey(key: string): string {
    // Remove any path components
    const basename = path.basename(key)

    // Remove special characters
    const sanitized = basename.replace(/[^a-zA-Z0-9_.-]/g, '_')

    // Ensure key is not too long (S3 keys can be up to 1024 bytes)
    return sanitized.substring(0, 255)
  }

  /**
   * Check if the file is an image based on MIME type
   * @private
   */
  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/')
  }

  /**
   * Get thumbnail filename
   * @private
   */
  private getThumbnailFilename(filename: string): string {
    const fileNameParts = path.parse(filename)

    return `${fileNameParts.name}_thumb${fileNameParts.ext}`
  }

  /**
   * Guess MIME type from path
   * @private
   */
  private getMimeTypeFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()

    // Map extensions back to MIME types
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.jpe': 'image/jpeg',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.csv': 'text/csv',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }

    return get(mimeMap, ext) || 'application/octet-stream'
  }
}
