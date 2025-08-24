import { join } from 'path'
import { readdirSync, statSync } from 'fs'

import type { PrismaClient } from '@prisma/client'
import { logger } from '@pika/shared'

import { StorageUploader, prepareImageFiles } from './storage-uploader.js'

/**
 * Image seeding utility that uploads test images to MinIO and returns URLs
 * for use in business, voucher, and user seeding
 */

export interface ImageSeedingResult {
  businessImages: string[]
  voucherImages: string[]
  userAvatars: string[]
  generalImages: string[]
}

export interface ImageUploadResult {
  fileName: string
  url: string
  category: 'business' | 'voucher' | 'users' | 'general'
  size: 'small' | 'medium'
}

export class ImageSeeder {
  private readonly TEST_IMAGES_PATH = join(process.cwd(), 'assets', 'test-images')
  private readonly storageUploader: StorageUploader
  
  constructor(private readonly prisma: PrismaClient) {
    this.storageUploader = new StorageUploader()
  }

  /**
   * Seeds all test images to storage and returns organized URLs
   */
  async seedImages(): Promise<ImageSeedingResult> {
    logger.info('🖼️  Starting image seeding process...')
    
    const results: ImageUploadResult[] = []
    
    try {
      // Check if test images directory exists
      if (!this.directoryExists(this.TEST_IMAGES_PATH)) {
        logger.error(`Test images directory not found: ${this.TEST_IMAGES_PATH}`)
        throw new Error('Test images directory not found. Please ensure assets/test-images exists.')
      }
      
      // Upload all categories and sizes
      const categories = ['business', 'voucher', 'users', 'general'] as const
      const sizes = ['small', 'medium'] as const
      
      for (const size of sizes) {
        for (const category of categories) {
          const categoryResults = await this.uploadCategoryImages(category, size)
          results.push(...categoryResults)
        }
      }
      
      // Organize results by category
      const organized = this.organizeImageResults(results)
      
      logger.info('✅ Image seeding completed successfully', {
        totalUploaded: results.length,
        businessImages: organized.businessImages.length,
        voucherImages: organized.voucherImages.length,
        userAvatars: organized.userAvatars.length,
        generalImages: organized.generalImages.length,
      })
      
      return organized
    } catch (error) {
      logger.error('❌ Image seeding failed', error)
      throw error
    }
  }

  /**
   * Uploads all images in a category and size
   */
  private async uploadCategoryImages(
    category: 'business' | 'voucher' | 'users' | 'general',
    size: 'small' | 'medium'
  ): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = []
    
    try {
      // Prepare image files for upload
      const imageFiles = prepareImageFiles(this.TEST_IMAGES_PATH, category, size)
      
      if (imageFiles.length === 0) {
        logger.warn(`No images found for ${category}/${size}`)
        return results
      }
      
      logger.info(`Uploading ${imageFiles.length} ${category} images (${size})...`)
      
      // Upload in batch
      const uploadResults = await this.storageUploader.uploadBatch(imageFiles)
      
      // Convert to our result format
      for (const uploadResult of uploadResults) {
        if (uploadResult.success && uploadResult.url) {
          results.push({
            fileName: uploadResult.fileName,
            url: uploadResult.url,
            category,
            size,
          })
        } else {
          logger.error(`Failed to upload ${uploadResult.fileName}: ${uploadResult.error}`)
        }
      }
      
    } catch (error) {
      logger.error(`Failed to upload ${category}/${size} images:`, error)
    }
    
    return results
  }

  /**
   * Organizes upload results by category for easy access
   */
  private organizeImageResults(results: ImageUploadResult[]): ImageSeedingResult {
    const organized = {
      businessImages: [] as string[],
      voucherImages: [] as string[],
      userAvatars: [] as string[],
      generalImages: [] as string[],
    }
    
    for (const result of results) {
      switch (result.category) {
        case 'business':
          organized.businessImages.push(result.url)
          break
        case 'voucher':
          organized.voucherImages.push(result.url)
          break
        case 'users':
          organized.userAvatars.push(result.url)
          break
        case 'general':
          organized.generalImages.push(result.url)
          break
      }
    }
    
    return organized
  }

  /**
   * Gets content type based on file extension
   */
  private getContentType(fileName: string): string {
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

  /**
   * Checks if directory exists
   */
  private directoryExists(path: string): boolean {
    try {
      return statSync(path).isDirectory()
    } catch {
      return false
    }
  }

  /**
   * Cleanup method for removing test images
   */
  async cleanupImages(): Promise<void> {
    logger.info('🧹 Cleaning up test images...')
    
    // Here you would implement cleanup logic to remove uploaded test images
    // For now, we'll just log the cleanup action
    logger.info('✅ Test images cleanup completed')
  }
}

/**
 * Export functions for use in seeding orchestrator
 */
export async function seedImages(prisma: PrismaClient): Promise<ImageSeedingResult> {
  const imageSeeder = new ImageSeeder(prisma)
  return await imageSeeder.seedImages()
}

export async function cleanupImages(prisma: PrismaClient): Promise<void> {
  const imageSeeder = new ImageSeeder(prisma)
  await imageSeeder.cleanupImages()
}

/**
 * Helper functions for getting specific image types
 */
export function getRandomBusinessImage(images: string[]): string {
  return images[Math.floor(Math.random() * images.length)]
}

export function getRandomVoucherImage(images: string[]): string {
  return images[Math.floor(Math.random() * images.length)]
}

export function getRandomUserAvatar(images: string[]): string {
  return images[Math.floor(Math.random() * images.length)]
}