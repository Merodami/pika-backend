import { ErrorFactory, logger } from '@pika/shared'
import type { BusinessDetails, PrismaClient } from '@prisma/client'

export interface CreateBusinessDetailsData {
  businessId: string
  phone?: string
  email?: string
  website?: string
  logoUrl?: string
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  operatingHours?: any
  socialMedia?: any
  additionalInfo?: any
}

export interface IBusinessDetailsRepository {
  create(data: CreateBusinessDetailsData): Promise<BusinessDetails>
  findByBusinessId(businessId: string): Promise<BusinessDetails | null>
  update(
    businessId: string,
    data: Partial<CreateBusinessDetailsData>,
  ): Promise<BusinessDetails>
  delete(businessId: string): Promise<void>
}

/**
 * Repository for managing business details
 * Stores additional information collected during registration
 */
export class BusinessDetailsRepository implements IBusinessDetailsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create business details
   */
  async create(data: CreateBusinessDetailsData): Promise<BusinessDetails> {
    try {
      const details = await this.prisma.businessDetails.create({
        data: {
          businessId: data.businessId,
          phone: data.phone,
          email: data.email,
          website: data.website,
          logoUrl: data.logoUrl,
          street: data.street,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          operatingHours: data.operatingHours,
          socialMedia: data.socialMedia,
          additionalInfo: data.additionalInfo,
        },
      })

      logger.info('Business details created', {
        businessId: data.businessId,
        detailsId: details.id,
      })

      return details
    } catch (error) {
      logger.error('Error creating business details', { data, error })
      throw ErrorFactory.databaseError(
        'create',
        'Failed to create business details',
        error,
      )
    }
  }

  /**
   * Find business details by business ID
   */
  async findByBusinessId(businessId: string): Promise<BusinessDetails | null> {
    try {
      const details = await this.prisma.businessDetails.findUnique({
        where: { businessId },
      })

      return details
    } catch (error) {
      logger.error('Error finding business details', { businessId, error })
      throw ErrorFactory.databaseError(
        'findByBusinessId',
        'Failed to find business details',
        error,
      )
    }
  }

  /**
   * Update business details
   */
  async update(
    businessId: string,
    data: Partial<CreateBusinessDetailsData>,
  ): Promise<BusinessDetails> {
    try {
      const details = await this.prisma.businessDetails.update({
        where: { businessId },
        data: {
          phone: data.phone,
          email: data.email,
          website: data.website,
          logoUrl: data.logoUrl,
          street: data.street,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          operatingHours: data.operatingHours,
          socialMedia: data.socialMedia,
          additionalInfo: data.additionalInfo,
        },
      })

      logger.info('Business details updated', {
        businessId,
        detailsId: details.id,
      })

      return details
    } catch (error) {
      logger.error('Error updating business details', {
        businessId,
        data,
        error,
      })
      throw ErrorFactory.databaseError(
        'update',
        'Failed to update business details',
        error,
      )
    }
  }

  /**
   * Delete business details
   */
  async delete(businessId: string): Promise<void> {
    try {
      await this.prisma.businessDetails.delete({
        where: { businessId },
      })

      logger.info('Business details deleted', { businessId })
    } catch (error) {
      logger.error('Error deleting business details', { businessId, error })
      throw ErrorFactory.databaseError(
        'delete',
        'Failed to delete business details',
        error,
      )
    }
  }
}
