import { ICacheService } from '@pika/redis'
import { ProviderDocument } from '@pika/sdk'
import { ErrorFactory, logger, normalizeMultilingualFields } from '@pika/shared'
import { Prisma, type PrismaClient } from '@prisma/client'
import { type ProviderCreateDTO } from '@provider-write/domain/dtos/ProviderDTO.js'
import { Provider } from '@provider-write/domain/entities/Provider.js'
import { type ProviderWriteRepositoryPort } from '@provider-write/domain/port/provider/ProviderWriteRepositoryPort.js'

/**
 * Prisma implementation of the ProviderWriteRepository
 * Handles persistence and data mapping to/from the database
 */
export class PrismaProviderWriteRepository
  implements ProviderWriteRepositoryPort
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Invalidate cache entries for a provider
   */
  private async invalidateProviderCache(
    providerId: string,
    userId?: string,
  ): Promise<void> {
    if (!this.cacheService) return

    try {
      // Invalidate provider by ID cache
      await this.cacheService.del(`provider:${providerId}`)

      // Invalidate provider by user ID cache if userId is provided
      if (userId) {
        await this.cacheService.del(`provider:user:${userId}`)
      }

      logger.debug('Invalidated provider cache', { providerId, userId })
    } catch (error) {
      // Don't fail the operation if cache invalidation fails
      logger.warn('Failed to invalidate provider cache', {
        error,
        providerId,
        userId,
      })
    }
  }

  /**
   * Creates a new provider in the database
   */
  async createProvider(
    dto: ProviderCreateDTO,
    userId: string,
  ): Promise<Provider> {
    try {
      // Check if user already has a provider profile
      const existingProvider = await this.prisma.provider.findFirst({
        where: { userId, deletedAt: null },
      })

      if (existingProvider) {
        throw ErrorFactory.resourceConflict(
          'Provider',
          'User already has a provider profile',
          {
            source: 'PrismaProviderWriteRepository.createProvider',
            metadata: { userId },
          },
        )
      }

      // Check if the category exists
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      })

      if (!category) {
        throw ErrorFactory.validationError(
          { categoryId: ['Category does not exist'] },
          {
            source: 'PrismaProviderWriteRepository.createProvider',
          },
        )
      }

      // Normalize multilingual fields to ensure all languages are present
      const normalizedDto = normalizeMultilingualFields(dto, [
        'businessName',
        'businessDescription',
      ])

      // Create the provider record
      const created = await this.prisma.provider.create({
        data: {
          userId,
          businessName: normalizedDto.businessName as Prisma.JsonObject,
          businessDescription:
            normalizedDto.businessDescription as Prisma.JsonObject,
          categoryId: normalizedDto.categoryId,
          verified: false,
          active: true,
          avgRating: 0,
        },
      })

      logger.info('Created new provider:', {
        id: created.id,
        userId: created.userId,
        businessName: created.businessName,
      })

      // Convert to domain entity
      return Provider.reconstitute(
        created.id,
        {
          userId: created.userId,
          businessName: created.businessName as { [lang: string]: string },
          businessDescription: created.businessDescription as {
            [lang: string]: string
          },
          categoryId: created.categoryId,
          verified: created.verified,
          active: created.active,
          avgRating: created.avgRating || 0,
        } as ProviderDocument,
        created.createdAt,
        created.updatedAt,
        created.deletedAt,
      )
    } catch (error) {
      // Handle unique constraint violations
      if (error.code === 'P2002') {
        throw ErrorFactory.uniqueConstraintViolation(
          'Provider',
          'userId',
          userId,
          {
            source: 'PrismaProviderWriteRepository.createProvider',
          },
        )
      }

      // Re-throw if it's already a known error
      if (error.context?.domain) {
        throw error
      }

      throw ErrorFactory.databaseError(
        'createProvider',
        'Failed to create provider',
        error,
        {
          source: 'PrismaProviderWriteRepository.createProvider',
          metadata: { userId },
        },
      )
    }
  }

  /**
   * Updates an existing provider
   */
  async updateProvider(
    id: string,
    dto: Partial<ProviderDocument>,
  ): Promise<Provider> {
    try {
      // Step 1: Check if the provider exists and fetch current data
      const existing = await this.prisma.provider.findUnique({
        where: { id },
      })

      if (!existing) {
        throw ErrorFactory.resourceNotFound('Provider', id, {
          source: 'PrismaProviderWriteRepository.updateProvider',
        })
      }

      // Step 2: Reconstitute domain entity from existing data
      const domain = Provider.reconstitute(
        existing.id,
        {
          userId: existing.userId,
          businessName: existing.businessName as { [lang: string]: string },
          businessDescription: existing.businessDescription as {
            [lang: string]: string
          },
          categoryId: existing.categoryId,
          verified: existing.verified,
          active: existing.active,
          avgRating: existing.avgRating || 0,
        } as ProviderDocument,
        existing.createdAt,
        existing.updatedAt,
        existing.deletedAt,
      )

      logger.info('Provider domain before update', {
        id,
        dto,
        businessName: domain.businessName.toObject(),
      })

      // Step 3: Apply updates using domain method (this handles merging!)
      domain.update(dto)

      logger.info('Provider domain after update', {
        id,
        businessName: domain.businessName.toObject(),
      })

      // Step 4: Build update data from domain entity
      const updateData: Prisma.ProviderUpdateInput = {}

      // Always update multilingual fields from domain
      updateData.businessName =
        domain.businessName.toObject() as Prisma.JsonObject
      updateData.businessDescription =
        domain.businessDescription.toObject() as Prisma.JsonObject

      // Update other fields
      updateData.active = domain.active
      updateData.verified = domain.verified
      updateData.avgRating = domain.avgRating

      // Handle category change if needed
      if (
        dto.categoryId !== undefined &&
        dto.categoryId !== domain.categoryId
      ) {
        // Verify new category exists
        const category = await this.prisma.category.findUnique({
          where: { id: dto.categoryId },
        })

        if (!category) {
          throw ErrorFactory.validationError(
            { categoryId: ['Category does not exist'] },
            {
              source: 'PrismaProviderWriteRepository.updateProvider',
            },
          )
        }

        updateData.category = { connect: { id: dto.categoryId } }
      } else {
        updateData.category = { connect: { id: domain.categoryId } }
      }

      // Step 5: Update in database
      const updated = await this.prisma.provider.update({
        where: { id },
        data: updateData,
      })

      logger.info('Updated provider:', {
        id: updated.id,
        businessName: updated.businessName,
      })

      // Step 6: Invalidate cache
      await this.invalidateProviderCache(updated.id, updated.userId)

      // Step 7: Return updated domain entity
      return Provider.reconstitute(
        updated.id,
        {
          userId: updated.userId,
          businessName: updated.businessName as { [lang: string]: string },
          businessDescription: updated.businessDescription as {
            [lang: string]: string
          },
          categoryId: updated.categoryId,
          verified: updated.verified,
          active: updated.active,
          avgRating: updated.avgRating || 0,
        } as ProviderDocument,
        updated.createdAt,
        updated.updatedAt,
        updated.deletedAt,
      )
    } catch (error) {
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('Provider', id, {
          source: 'PrismaProviderWriteRepository.updateProvider',
        })
      }

      // Re-throw if it's already a known error
      if (error.context?.domain) {
        throw error
      }

      throw ErrorFactory.databaseError(
        'updateProvider',
        'Failed to update provider',
        error,
        {
          source: 'PrismaProviderWriteRepository.updateProvider',
          metadata: { providerId: id },
        },
      )
    }
  }

  /**
   * Soft deletes a provider
   */
  async deleteProvider(id: string): Promise<void> {
    try {
      // Check if provider has active vouchers
      const activeVouchers = await this.prisma.voucher.count({
        where: {
          providerId: id,
          state: 'PUBLISHED',
          deletedAt: null,
        },
      })

      if (activeVouchers > 0) {
        throw ErrorFactory.businessRuleViolation(
          'Cannot delete provider',
          `Provider has ${activeVouchers} active vouchers`,
          {
            source: 'PrismaProviderWriteRepository.deleteProvider',
            metadata: { providerId: id, activeVouchers },
          },
        )
      }

      // Get provider data before deletion for cache invalidation
      const provider = await this.prisma.provider.findUnique({
        where: { id },
        select: { userId: true },
      })

      // Soft delete the provider
      await this.prisma.provider.update({
        where: { id },
        data: { deletedAt: new Date() },
      })

      // Invalidate cache
      await this.invalidateProviderCache(id, provider?.userId)

      logger.info('Soft deleted provider:', { id })
    } catch (error) {
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('Provider', id, {
          source: 'PrismaProviderWriteRepository.deleteProvider',
        })
      }

      // Re-throw if it's already a known error
      if (error.context?.domain) {
        throw error
      }

      throw ErrorFactory.databaseError(
        'deleteProvider',
        'Failed to delete provider',
        error,
        {
          source: 'PrismaProviderWriteRepository.deleteProvider',
          metadata: { providerId: id },
        },
      )
    }
  }

  /**
   * Gets provider ID by user ID
   */
  async getProviderByUserId(userId: string): Promise<string | null> {
    try {
      const provider = await this.prisma.provider.findFirst({
        where: {
          userId,
          deletedAt: null,
        },
        select: { id: true },
      })

      return provider?.id || null
    } catch (error) {
      throw ErrorFactory.databaseError(
        'getProviderByUserId',
        'Failed to get provider by user ID',
        error,
        {
          source: 'PrismaProviderWriteRepository.getProviderByUserId',
          metadata: { userId },
        },
      )
    }
  }

  /**
   * Gets provider by ID for multilingual field merging in updates
   * EMERGENCY FIX: Required to fetch existing multilingual data before updates
   */
  async getProviderById(id: string): Promise<Provider | null> {
    try {
      const provider = await this.prisma.provider.findUnique({
        where: {
          id,
        },
      })

      if (!provider || provider.deletedAt) {
        return null
      }

      // Convert to domain entity using Provider.reconstitute (same pattern as other methods)
      return Provider.reconstitute(
        provider.id,
        {
          userId: provider.userId,
          businessName: provider.businessName as { [lang: string]: string },
          businessDescription: provider.businessDescription as {
            [lang: string]: string
          },
          categoryId: provider.categoryId,
          verified: provider.verified,
          active: provider.active,
          avgRating: provider.avgRating || 0,
        } as ProviderDocument,
        provider.createdAt,
        provider.updatedAt,
        provider.deletedAt,
      )
    } catch (error) {
      throw ErrorFactory.databaseError(
        'getProviderById',
        'Failed to get provider by ID',
        error,
        {
          source: 'PrismaProviderWriteRepository.getProviderById',
          metadata: { providerId: id },
        },
      )
    }
  }
}
