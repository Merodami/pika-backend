import type {
  CreateBusinessData,
  IBusinessRepository,
  UpdateBusinessData,
} from '@business/repositories/BusinessRepository.js'
import type { IBusinessDetailsRepository } from '@business/repositories/BusinessDetailsRepository.js'
import type { BusinessSearchParams } from '@business/types/search.js'
import { DEFAULT_LANGUAGE, REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, type ICacheService } from '@pika/redis'
import type { BusinessDomain } from '@pika/sdk'
import {
  ErrorFactory,
  FileUpload,
  logger,
  StorageServiceClient,
  UserServiceClient,
  ValidationError,
} from '@pika/shared'
import type { TranslationClient, TranslationResolver } from '@pika/translation'
import type { LanguageCode, PaginatedResult, ParsedIncludes } from '@pika/types'
import { v4 as uuid } from 'uuid'

import { CACHE_KEYS } from '../constants/cache-keys.js'

export interface IBusinessService {
  getAllBusinesses(
    params: BusinessSearchParams,
    language?: LanguageCode,
  ): Promise<PaginatedResult<BusinessDomain>>
  getBusinessById(
    id: string,
    includes?: ParsedIncludes,
    language?: LanguageCode,
  ): Promise<BusinessDomain>
  getBusinessByUserId(
    userId: string,
    includes?: ParsedIncludes,
    language?: LanguageCode,
  ): Promise<BusinessDomain>
  createBusiness(
    data: CreateBusinessRequest,
    language?: LanguageCode,
  ): Promise<BusinessDomain>
  updateBusiness(
    id: string,
    data: UpdateBusinessRequest,
  ): Promise<BusinessDomain>
  deleteBusiness(id: string): Promise<void>
  verifyBusiness(id: string): Promise<BusinessDomain>
  deactivateBusiness(id: string): Promise<BusinessDomain>
  updateBusinessRating(id: string, rating: number): Promise<BusinessDomain>
  approveBusiness(
    id: string,
    approved: boolean,
    approvedBy: string,
    reason?: string,
  ): Promise<BusinessDomain>
  uploadBusinessLogo(businessId: string, file: FileUpload): Promise<string>
}

export interface CreateBusinessRequest {
  userId: string
  businessName: string
  businessDescription?: string
  categoryId?: string | null
  verified?: boolean
  active?: boolean
}

export interface UpdateBusinessRequest {
  businessName?: string
  businessDescription?: string
  categoryId?: string
  verified?: boolean
  active?: boolean
}

/**
 * Business service implementation with business logic
 * Handles business operations including translation key management
 */
export class BusinessService implements IBusinessService {
  constructor(
    private readonly businessRepository: IBusinessRepository,
    private readonly translationService: TranslationClient,
    private readonly userServiceClient?: UserServiceClient,
    private readonly cacheService?: ICacheService,
    private readonly translationResolver?: TranslationResolver,
    private readonly businessDetailsRepository?: IBusinessDetailsRepository,
    private readonly storageService?: StorageServiceClient,
  ) {}

  /**
   * Helper method to invalidate all cache entries related to a business
   */
  private async invalidateBusinessCache(
    businessId: string,
    userId?: string,
  ): Promise<void> {
    if (!this.cacheService) return

    const keysToInvalidate = [
      // Invalidate specific business cache
      `${CACHE_KEYS.BUSINESS.SINGLE}:${businessId}`,
    ]

    if (userId) {
      // Invalidate user-specific caches
      keysToInvalidate.push(`${CACHE_KEYS.BUSINESS.USER}:${userId}`)
    }

    // Delete all keys
    // Note: We can't invalidate pattern-based keys with basic ICacheService
    // This means list caches won't be invalidated automatically
    // Consider implementing a more sophisticated cache invalidation strategy
    await Promise.all(
      keysToInvalidate.map((key) => this.cacheService!.del(key)),
    )
  }

  /**
   * Retrieve all businesses with filters and pagination
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: CACHE_KEYS.BUSINESS.LIST,
    keyGenerator: (prefix: string, methodName: string, args: any[]) => {
      const [params, language] = args

      return `${prefix}:${JSON.stringify(params)}:${language || 'default'}`
    },
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllBusinesses(
    params: BusinessSearchParams,
    language?: LanguageCode,
  ): Promise<PaginatedResult<BusinessDomain>> {
    try {
      logger.debug('Fetching businesses with params:', params)

      const result = await this.businessRepository.findAll(params)

      // Resolve translations if language is provided and resolver is available
      if (language && this.translationResolver) {
        const resolvedData = await this.translationResolver.resolveArray(
          result.data,
          language,
        )

        return { data: resolvedData, pagination: result.pagination }
      }

      logger.debug(`Found ${result.data.length} businesses`)

      return result
    } catch (error) {
      logger.error('Error in getAllBusinesses:', error)
      throw ErrorFactory.fromError(error, 'Error fetching businesses', {
        source: 'BusinessService.getAllBusinesses',
      })
    }
  }

  /**
   * Retrieve a business by ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: CACHE_KEYS.BUSINESS.SINGLE,
    keyGenerator: (prefix: string, methodName: string, args: any[]) => {
      const [id, includes, language] = args
      const key = includes ? `${id}:${JSON.stringify(includes)}` : id

      return `${prefix}:${key}:${language || 'default'}`
    },
  })
  async getBusinessById(
    id: string,
    includes?: ParsedIncludes,
    language?: LanguageCode,
  ): Promise<BusinessDomain> {
    try {
      logger.debug(`Fetching business by ID: ${id}`)

      const business = await this.businessRepository.findById(id, includes)

      if (!business) {
        throw ErrorFactory.resourceNotFound('Business', id, {
          source: 'BusinessService.getBusinessById',
        })
      }

      // Resolve translations if language is provided and resolver is available
      if (language && this.translationResolver) {
        const resolved = await this.translationResolver.resolve(
          business,
          language,
        )

        return resolved
      }

      return business
    } catch (error) {
      logger.error(`Error fetching business ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Error fetching business', {
        source: 'BusinessService.getBusinessById',
      })
    }
  }

  /**
   * Retrieve a business by user ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: CACHE_KEYS.BUSINESS.USER,
    keyGenerator: (prefix: string, methodName: string, args: any[]) => {
      const [userId, includes] = args
      const key = includes ? `${userId}:${JSON.stringify(includes)}` : userId

      return `${prefix}:${key}`
    },
  })
  async getBusinessByUserId(
    userId: string,
    includes?: ParsedIncludes,
    language?: LanguageCode,
  ): Promise<BusinessDomain> {
    try {
      logger.debug(`Fetching business by user ID: ${userId}`)

      const business = await this.businessRepository.findByUserId(
        userId,
        includes,
      )

      if (!business) {
        throw ErrorFactory.resourceNotFound('Business', `user:${userId}`, {
          source: 'BusinessService.getBusinessByUserId',
        })
      }

      // Resolve translations if language is provided and resolver is available
      if (language && this.translationResolver) {
        const resolved = await this.translationResolver.resolve(
          business,
          language,
        )

        return resolved
      }

      return business
    } catch (error) {
      logger.error(`Error fetching business for user ${userId}:`, error)
      throw ErrorFactory.fromError(error, 'Error fetching business by user', {
        source: 'BusinessService.getBusinessByUserId',
      })
    }
  }

  /**
   * Create a new business
   */
  async createBusiness(
    data: CreateBusinessRequest,
    language?: LanguageCode,
  ): Promise<BusinessDomain> {
    try {
      logger.debug(`Creating business for user: ${data.userId}`)

      // Check if this is the user's first business
      const existingBusinessesCount =
        await this.businessRepository.countByUserId(data.userId)
      const isFirstBusiness = existingBusinessesCount === 0

      // Generate translation keys for business name and description
      const businessNameKey = `business.name.${uuid()}`
      const businessDescriptionKey = data.businessDescription
        ? `business.description.${uuid()}`
        : undefined

      // Create translations
      await this.translationService.set(
        businessNameKey,
        DEFAULT_LANGUAGE,
        data.businessName,
      )

      if (businessDescriptionKey && data.businessDescription) {
        await this.translationService.set(
          businessDescriptionKey,
          DEFAULT_LANGUAGE,
          data.businessDescription,
        )
      }

      // Create business record
      const createData: CreateBusinessData = {
        userId: data.userId,
        businessNameKey,
        businessDescriptionKey,
        categoryId: data.categoryId,
        verified: data.verified ?? false,
        active: data.active ?? true,
        avgRating: 0,
      }

      const business = await this.businessRepository.create(createData)

      // If this is the user's first business, set it as primaryBusinessId
      if (isFirstBusiness && this.userServiceClient) {
        try {
          await this.userServiceClient.updateUserPrimaryBusiness({
            userId: data.userId,
            primaryBusinessId: business.id,
          })
          logger.info(
            `Set business ${business.id} as primary for user ${data.userId}`,
          )
        } catch (error) {
          logger.error(
            `Failed to set primary business for user ${data.userId}:`,
            error,
          )
          // Don't throw here - business creation succeeded, but primary business setting failed
          // This could be handled by a background job or retry mechanism in production
        }
      } else if (isFirstBusiness && !this.userServiceClient) {
        logger.warn(
          `Cannot set primary business ${business.id} for user ${data.userId} - UserServiceClient not available`,
        )
      }

      // Invalidate cache after creation
      await this.invalidateBusinessCache(business.id, business.userId)

      logger.debug(`Business created successfully: ${business.id}`)

      // Resolve translations if language is provided (following category pattern)
      if (language && this.translationResolver) {
        const resolved = await this.translationResolver.resolve(
          business,
          language,
        )

        return resolved
      }

      return business
    } catch (error) {
      logger.error('Error creating business:', error)
      throw ErrorFactory.fromError(error, 'Error creating business', {
        source: 'BusinessService.createBusiness',
      })
    }
  }

  /**
   * Update an existing business
   */
  async updateBusiness(
    id: string,
    data: UpdateBusinessRequest,
  ): Promise<BusinessDomain> {
    try {
      logger.debug(`Updating business: ${id}`)

      // Get existing business
      const existingBusiness = await this.businessRepository.findById(id)

      if (!existingBusiness) {
        throw ErrorFactory.resourceNotFound('Business', id, {
          source: 'BusinessService.updateBusiness',
        })
      }

      const updateData: UpdateBusinessData = {}

      // Update business name translation if provided
      if (data.businessName) {
        await this.translationService.set(
          existingBusiness.businessNameKey,
          DEFAULT_LANGUAGE,
          data.businessName,
        )
      }

      // Update business description translation if provided
      if (data.businessDescription !== undefined) {
        if (
          data.businessDescription &&
          existingBusiness.businessDescriptionKey
        ) {
          // Update existing description
          await this.translationService.set(
            existingBusiness.businessDescriptionKey,
            DEFAULT_LANGUAGE,
            data.businessDescription,
          )
        } else if (
          data.businessDescription &&
          !existingBusiness.businessDescriptionKey
        ) {
          // Create new description
          const businessDescriptionKey = `business.description.${uuid()}`

          await this.translationService.set(
            businessDescriptionKey,
            DEFAULT_LANGUAGE,
            data.businessDescription,
          )
          updateData.businessDescriptionKey = businessDescriptionKey
        } else if (
          !data.businessDescription &&
          existingBusiness.businessDescriptionKey
        ) {
          // Remove description
          updateData.businessDescriptionKey = null
        }
      }

      // Update other fields
      if (data.categoryId !== undefined) {
        updateData.categoryId = data.categoryId
      }
      if (data.verified !== undefined) {
        updateData.verified = data.verified
      }
      if (data.active !== undefined) {
        updateData.active = data.active
      }

      const business = await this.businessRepository.update(id, updateData)

      // Invalidate related cache entries
      await this.invalidateBusinessCache(id, business.userId)

      logger.debug(`Business updated successfully: ${id}`)

      return business
    } catch (error) {
      logger.error(`Error updating business ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Error updating business', {
        source: 'BusinessService.updateBusiness',
      })
    }
  }

  /**
   * Delete a business (soft delete)
   */
  async deleteBusiness(id: string): Promise<void> {
    try {
      logger.debug(`Deleting business: ${id}`)

      // Check if business exists
      const business = await this.businessRepository.findById(id)

      if (!business) {
        throw ErrorFactory.resourceNotFound('Business', id, {
          source: 'BusinessService.deleteBusiness',
        })
      }

      // Check business rule: Cannot delete primary business if it's the only business
      const userBusinessCount = await this.businessRepository.countByUserId(
        business.userId,
      )

      if (userBusinessCount === 1 && this.userServiceClient) {
        // Get user to check if this is their primary business
        try {
          const user = await this.userServiceClient.getUser(business.userId)

          if (user && user.primaryBusinessId === id) {
            throw ErrorFactory.validationError(
              {
                business: [
                  'Cannot delete the primary business when it is the only business for this user',
                ],
              },
              {
                source: 'BusinessService.deleteBusiness',
                userId: business.userId,
              },
            )
          }
        } catch (error: any) {
          // Re-throw validation errors, but catch service errors
          if (error instanceof ValidationError) {
            throw error
          }
          // If we can't get user info due to service error, log error but don't prevent deletion
          logger.warn(
            `Could not verify primary business status for user ${business.userId}:`,
            error,
          )
        }
      } else if (userBusinessCount === 1 && !this.userServiceClient) {
        logger.warn(
          `Cannot verify primary business status for user ${business.userId} - UserServiceClient not available`,
        )
      }

      await this.businessRepository.delete(id)

      // If this was the primary business and user has other businesses,
      // we should set another business as primary
      if (userBusinessCount > 1 && this.userServiceClient) {
        try {
          const user = await this.userServiceClient.getUser(business.userId)

          if (user && user.primaryBusinessId === id) {
            // Find another business for this user to set as primary
            const remainingBusinesses = await this.businessRepository.findAll({
              userId: business.userId,
              page: 1,
              limit: 1,
            })

            if (remainingBusinesses.data.length > 0) {
              await this.userServiceClient.updateUserPrimaryBusiness({
                userId: business.userId,
                primaryBusinessId: remainingBusinesses.data[0].id,
              })
              logger.info(
                `Updated primary business to ${remainingBusinesses.data[0].id} for user ${business.userId} after deleting ${id}`,
              )
            }
          }
        } catch (error) {
          logger.error(
            `Failed to update primary business after deletion for user ${business.userId}:`,
            error,
          )
          // Don't throw here - business deletion succeeded
        }
      } else if (userBusinessCount > 1 && !this.userServiceClient) {
        logger.warn(
          `Cannot reassign primary business for user ${business.userId} - UserServiceClient not available`,
        )
      }

      // Invalidate cache
      await this.invalidateBusinessCache(id, business.userId)

      logger.debug(`Business deleted successfully: ${id}`)
    } catch (error) {
      logger.error(`Error deleting business ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Error deleting business', {
        source: 'BusinessService.deleteBusiness',
      })
    }
  }

  /**
   * Verify a business
   */
  async verifyBusiness(id: string): Promise<BusinessDomain> {
    try {
      logger.debug(`Verifying business: ${id}`)

      const business = await this.businessRepository.update(id, {
        verified: true,
      })

      logger.debug(`Business verified successfully: ${id}`)

      return business
    } catch (error) {
      logger.error(`Error verifying business ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Error verifying business', {
        source: 'BusinessService.verifyBusiness',
      })
    }
  }

  /**
   * Deactivate a business
   */
  async deactivateBusiness(id: string): Promise<BusinessDomain> {
    try {
      logger.debug(`Deactivating business: ${id}`)

      const business = await this.businessRepository.update(id, {
        active: false,
      })

      logger.debug(`Business deactivated successfully: ${id}`)

      return business
    } catch (error) {
      logger.error(`Error deactivating business ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Error deactivating business', {
        source: 'BusinessService.deactivateBusiness',
      })
    }
  }

  /**
   * Update business rating
   */
  async updateBusinessRating(
    id: string,
    rating: number,
  ): Promise<BusinessDomain> {
    try {
      logger.debug(`Updating business rating: ${id}, rating: ${rating}`)

      // Validate rating range
      if (rating < 0 || rating > 5) {
        throw ErrorFactory.validationError(
          { rating: ['Rating must be between 0 and 5'] },
          { source: 'BusinessService.updateBusinessRating' },
        )
      }

      const business = await this.businessRepository.update(id, {
        avgRating: rating,
      })

      logger.debug(`Business rating updated successfully: ${id}`)

      return business
    } catch (error) {
      logger.error(`Error updating business rating ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Error updating business rating', {
        source: 'BusinessService.updateBusinessRating',
      })
    }
  }

  /**
   * Approve or reject a business
   */
  async approveBusiness(
    id: string,
    approved: boolean,
    approvedBy: string,
    reason?: string,
  ): Promise<BusinessDomain> {
    try {
      logger.debug(`${approved ? 'Approving' : 'Rejecting'} business: ${id}`)

      // Check if business exists
      const existingBusiness = await this.businessRepository.findById(id)

      if (!existingBusiness) {
        throw ErrorFactory.resourceNotFound(
          'Business',
          `Business with id ${id} not found`,
        )
      }

      // Update business approval status
      const business = await this.businessRepository.update(id, {
        approved,
        approvedBy: approved ? approvedBy : null,
        approvedAt: approved ? new Date() : null,
      })

      // Log the approval action with additional context
      logger.info({
        msg: `Business ${approved ? 'approved' : 'rejected'}`,
        businessId: id,
        approved,
        approvedBy,
        reason,
        businessOwnerId: business.userId,
        timestamp: new Date().toISOString(),
      })

      // Clear cache for this business
      await this.invalidateBusinessCache(id, business.userId)

      return business
    } catch (error) {
      logger.error(`Error approving business ${id}:`, error)
      throw ErrorFactory.fromError(error, 'Error approving business', {
        source: 'BusinessService.approveBusiness',
      })
    }
  }

  /**
   * Upload business logo and update business details
   */
  async uploadBusinessLogo(
    businessId: string,
    file: FileUpload,
  ): Promise<string> {
    try {
      if (!this.storageService) {
        throw ErrorFactory.badRequest(
          'Storage service not configured',
          {
            source: 'BusinessService.uploadBusinessLogo',
          },
        )
      }

      if (!this.businessDetailsRepository) {
        throw ErrorFactory.badRequest(
          'Business details repository not configured',
          {
            source: 'BusinessService.uploadBusinessLogo',
          },
        )
      }

      // Validate that business exists
      const business = await this.businessRepository.findById(businessId)
      if (!business) {
        throw ErrorFactory.resourceNotFound('Business', businessId)
      }

      // Validate file type (images only)
      if (!file.mimetype.startsWith('image/')) {
        throw ErrorFactory.badRequest('Only image files are allowed')
      }

      // Upload file with business context for service-to-service call
      const uploadResult = await this.storageService.saveFile(
        file,
        `businesses/${businessId}/logo`,
        {
          context: {
            businessId,
            operation: 'logo-upload',
          },
        },
      )

      // Get or create business details if they don't exist
      let businessDetails = await this.businessDetailsRepository.findByBusinessId(businessId)
      
      if (businessDetails) {
        // Update existing business details with the new logo URL
        await this.businessDetailsRepository.update(businessId, {
          logoUrl: uploadResult.url,
        })
      } else {
        // Create business details with logo URL
        await this.businessDetailsRepository.create({
          businessId,
          logoUrl: uploadResult.url,
        })
      }

      // Invalidate business cache
      await this.invalidateBusinessCache(businessId, business.userId)

      logger.info('Business logo uploaded successfully', {
        businessId,
        logoUrl: uploadResult.url,
      })

      return uploadResult.url
    } catch (error) {
      logger.error('Failed to upload business logo', { error, businessId })
      throw ErrorFactory.fromError(error)
    }
  }
}
