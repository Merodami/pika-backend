import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

import type { PrismaClient } from '@prisma/client'
import { logger } from '@pika/shared'

/**
 * Direct MinIO upload utility for seeding without going through the full storage service
 * This avoids circular dependencies and keeps seeding simple
 */

interface MinIOConfig {
  endpoint: string
  port: number
  accessKey: string
  secretKey: string
  bucketName: string
  useSSL: boolean
}

interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export class StorageUploader {
  private config: MinIOConfig
  private minioClient: any = null
  private isDevMode: boolean

  constructor() {
    this.config = {
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
      secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
      bucketName: process.env.AWS_S3_BUCKET || 'pika-uploads',
      useSSL: false,
    }
    
    // Only use real MinIO in development/test environments
    this.isDevMode = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
    
    if (this.isDevMode) {
      this.initializeMinIOClient()
    }
  }

  private async initializeMinIOClient() {
    try {
      // Dynamically import MinIO only in dev/test environments
      const { Client } = await import('minio')
      
      this.minioClient = new Client({
        endPoint: this.config.endpoint,
        port: this.config.port,
        useSSL: this.config.useSSL,
        accessKey: this.config.accessKey,
        secretKey: this.config.secretKey,
      })

      // Ensure bucket exists
      await this.ensureBucketExists()
      
      logger.debug(`MinIO client initialized for ${this.config.endpoint}:${this.config.port}`)
    } catch (error) {
      logger.warn(`Failed to initialize MinIO client, falling back to simulation:`, error)
      this.minioClient = null
    }
  }

  private async ensureBucketExists() {
    if (!this.minioClient) return

    try {
      const bucketExists = await this.minioClient.bucketExists(this.config.bucketName)
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.config.bucketName, 'us-east-1')
        logger.debug(`Created bucket: ${this.config.bucketName}`)
      }
    } catch (error) {
      logger.error(`Failed to ensure bucket exists:`, error)
    }
  }

  /**
   * Upload a file buffer to MinIO
   */
  async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
    folder: string = 'test-seed-images'
  ): Promise<UploadResult> {
    const objectKey = `${folder}/${fileName}`
    const url = `http://${this.config.endpoint}:${this.config.port}/${this.config.bucketName}/${objectKey}`

    try {
      if (this.isDevMode && this.minioClient) {
        // Real MinIO upload in dev/test environments
        await this.minioClient.putObject(
          this.config.bucketName,
          objectKey,
          fileBuffer,
          fileBuffer.length,
          {
            'Content-Type': contentType,
          }
        )
        
        logger.debug(`✅ Uploaded ${fileName} to MinIO: ${url}`)
        
        return {
          success: true,
          url,
        }
      } else {
        // Simulation fallback for production or when MinIO client failed
        await new Promise(resolve => setTimeout(resolve, 10))
        logger.debug(`[SIMULATED] Uploaded ${fileName} to MinIO: ${url}`)
        
        return {
          success: true,
          url,
        }
      }
    } catch (error) {
      logger.error(`Failed to upload ${fileName}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Upload multiple files in batch
   */
  async uploadBatch(files: Array<{
    fileName: string
    fileBuffer: Buffer
    contentType: string
    folder?: string
  }>): Promise<Array<UploadResult & { fileName: string }>> {
    const results: Array<UploadResult & { fileName: string }> = []
    
    for (const file of files) {
      const result = await this.uploadFile(
        file.fileName,
        file.fileBuffer,
        file.contentType,
        file.folder
      )
      
      results.push({
        ...result,
        fileName: file.fileName,
      })
    }
    
    return results
  }

  /**
   * Delete files (for cleanup)
   */
  async deleteFiles(objectKeys: string[]): Promise<void> {
    // Simulate deletion
    logger.debug(`[SIMULATED] Deleted ${objectKeys.length} files from MinIO`)
  }
}

/**
 * Helper function to read and prepare image files for upload
 */
export function prepareImageFiles(
  baseDir: string,
  category: string,
  size: 'small' | 'medium'
): Array<{
  fileName: string
  fileBuffer: Buffer
  contentType: string
  folder: string
}> {
  try {
    const categoryPath = join(baseDir, `size-${size}`, category)
    
    const files = readdirSync(categoryPath).filter((file: string) => 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.jpeg') || 
      file.toLowerCase().endsWith('.png')
    )
    
    return files.map((fileName: string) => {
      const filePath = join(categoryPath, fileName)
      const fileBuffer = readFileSync(filePath)
      
      return {
        fileName: `${size}/${category}/${fileName}`,
        fileBuffer,
        contentType: getContentType(fileName),
        folder: 'test-seed-images',
      }
    })
  } catch (error) {
    logger.error(`Failed to prepare image files for ${category}/${size}:`, error)
    return []
  }
}

function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    default:
      return 'application/octet-stream'
  }
}