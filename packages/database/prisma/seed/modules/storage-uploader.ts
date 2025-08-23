import { readFileSync } from 'fs'
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

  constructor() {
    this.config = {
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
      secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
      bucketName: process.env.AWS_S3_BUCKET || 'pika-uploads',
      useSSL: false,
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
    try {
      // For now, we'll simulate the upload since we don't want to add MinIO client dependencies to the database package
      // In a real implementation, you would:
      // 1. Import MinIO client
      // 2. Create MinIO client with config
      // 3. Upload the buffer
      // 4. Return the public URL

      const objectKey = `${folder}/${fileName}`
      const url = `http://${this.config.endpoint}:${this.config.port}/${this.config.bucketName}/${objectKey}`
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 50))
      
      logger.debug(`[SIMULATED] Uploaded ${fileName} to MinIO: ${url}`)
      
      return {
        success: true,
        url,
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
    const { readdirSync } = require('fs')
    
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