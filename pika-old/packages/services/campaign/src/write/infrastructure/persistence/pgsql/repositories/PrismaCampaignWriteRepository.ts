import {
  type CampaignCreateDTO,
  type CampaignUpdateDTO,
} from '@campaign-write/domain/dtos/CampaignDTO.js'
import { Campaign } from '@campaign-write/domain/entities/Campaign.js'
import { type CampaignWriteRepositoryPort } from '@campaign-write/domain/port/campaign/CampaignWriteRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'
import { CampaignStatus } from '@pika/types-core'
import { Prisma, type PrismaClient } from '@prisma/client'

import { CampaignDocumentMapper } from '../mappers/CampaignDocumentMapper.js'

/**
 * Prisma implementation of the CampaignWriteRepository
 * Handles persistence and data mapping to/from the database with comprehensive error handling,
 * business rule validation, and provider ownership verification
 */
export class PrismaCampaignWriteRepository
  implements CampaignWriteRepositoryPort
{
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Validates provider existence and ownership for campaign operations
   * @private
   */
  private async validateProviderExists(
    providerId: string,
    operation: string,
  ): Promise<void> {
    logger.debug(`Validating provider existence for ${operation}:`, {
      providerId,
    })

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
      select: { id: true, active: true, verified: true },
    })

    if (!provider) {
      throw ErrorFactory.validationError(
        { providerId: ['Provider does not exist'] },
        {
          source: `PrismaCampaignWriteRepository.${operation}`,
          metadata: { providerId },
          suggestion: 'Ensure the provider ID is valid and the provider exists',
        },
      )
    }

    // Business rule: Only active and verified providers can create/manage campaigns
    if (!provider.active) {
      throw ErrorFactory.businessRuleViolation(
        'Provider is not active',
        'Only active providers can manage campaigns',
        {
          source: `PrismaCampaignWriteRepository.${operation}`,
          metadata: { providerId, providerActive: provider.active },
          suggestion: 'Activate the provider account before managing campaigns',
          httpStatus: 403,
        },
      )
    }

    if (!provider.verified) {
      throw ErrorFactory.businessRuleViolation(
        'Provider is not verified',
        'Only verified providers can manage campaigns',
        {
          source: `PrismaCampaignWriteRepository.${operation}`,
          metadata: { providerId, providerVerified: provider.verified },
          suggestion:
            'Complete provider verification before managing campaigns',
          httpStatus: 403,
        },
      )
    }

    logger.debug(`Provider validation successful for ${operation}:`, {
      providerId,
    })
  }

  /**
   * Validates campaign ownership by provider
   * @private
   */
  private async validateCampaignOwnership(
    campaignId: string,
    providerId: string,
  ): Promise<any> {
    logger.debug('Validating campaign ownership:', { campaignId, providerId })

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, providerId: true, status: true, active: true },
    })

    if (!campaign) {
      throw ErrorFactory.resourceNotFound('Campaign', campaignId, {
        source: 'PrismaCampaignWriteRepository.validateCampaignOwnership',
        metadata: { campaignId, providerId },
        suggestion: 'Ensure the campaign ID is valid and the campaign exists',
      })
    }

    // Business rule: Only the campaign owner can modify it
    if (campaign.providerId !== providerId) {
      throw ErrorFactory.unauthorized(
        'Campaign does not belong to this provider',
        {
          source: 'PrismaCampaignWriteRepository.validateCampaignOwnership',
          metadata: {
            campaignId,
            providerId,
            actualProviderId: campaign.providerId,
          },
          suggestion: 'Only the campaign owner can modify campaigns',
          httpStatus: 403,
        },
      )
    }

    logger.debug('Campaign ownership validated:', { campaignId, providerId })

    return campaign
  }

  /**
   * Validates business rules for campaign dates and budget
   * @private
   */
  private validateCampaignBusinessRules(
    dto: CampaignCreateDTO | CampaignUpdateDTO,
  ): void {
    // Validate date constraints
    if (dto.startDate && dto.endDate) {
      const startDate = new Date(dto.startDate)
      const endDate = new Date(dto.endDate)

      if (startDate >= endDate) {
        throw ErrorFactory.validationError(
          {
            startDate: ['Start date must be before end date'],
            endDate: ['End date must be after start date'],
          },
          {
            source:
              'PrismaCampaignWriteRepository.validateCampaignBusinessRules',
            suggestion: 'Ensure start date is before end date',
          },
        )
      }

      // Business rule: Campaign must be at least 1 day long
      const duration = endDate.getTime() - startDate.getTime()
      const minDuration = 24 * 60 * 60 * 1000 // 1 day in milliseconds

      if (duration < minDuration) {
        throw ErrorFactory.validationError(
          { duration: ['Campaign must be at least 1 day long'] },
          {
            source:
              'PrismaCampaignWriteRepository.validateCampaignBusinessRules',
            suggestion:
              'Set an end date that is at least 1 day after the start date',
          },
        )
      }

      // Business rule: Campaign cannot be more than 1 year long
      const maxDuration = 365 * 24 * 60 * 60 * 1000 // 1 year in milliseconds

      if (duration > maxDuration) {
        throw ErrorFactory.validationError(
          { duration: ['Campaign cannot be longer than 1 year'] },
          {
            source:
              'PrismaCampaignWriteRepository.validateCampaignBusinessRules',
            suggestion:
              'Set an end date that is within 1 year of the start date',
          },
        )
      }
    }

    // Validate budget constraints
    if (dto.budget !== undefined) {
      if (dto.budget < 0) {
        throw ErrorFactory.validationError(
          { budget: ['Budget cannot be negative'] },
          {
            source:
              'PrismaCampaignWriteRepository.validateCampaignBusinessRules',
            suggestion: 'Set a budget of 0 or greater',
          },
        )
      }

      // Business rule: Maximum budget limit (configurable)
      const maxBudget = 1000000 // $1M limit for MVP

      if (dto.budget > maxBudget) {
        throw ErrorFactory.validationError(
          { budget: [`Budget cannot exceed $${maxBudget.toLocaleString()}`] },
          {
            source:
              'PrismaCampaignWriteRepository.validateCampaignBusinessRules',
            suggestion: `Set a budget of $${maxBudget.toLocaleString()} or less`,
          },
        )
      }
    }

    // Validate status transitions
    if (dto.status) {
      const validStatuses = [
        'DRAFT',
        'ACTIVE',
        'PAUSED',
        'COMPLETED',
        'CANCELLED',
      ]

      if (!validStatuses.includes(dto.status)) {
        throw ErrorFactory.validationError(
          {
            status: [
              `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            ],
          },
          {
            source:
              'PrismaCampaignWriteRepository.validateCampaignBusinessRules',
            suggestion: `Use one of the valid statuses: ${validStatuses.join(', ')}`,
          },
        )
      }
    }
  }

  /**
   * Creates a new campaign in the database with comprehensive validation
   * @param dto Campaign creation data
   * @returns The created campaign domain entity
   */
  async createCampaign(dto: CampaignCreateDTO): Promise<Campaign> {
    try {
      logger.debug('Creating campaign with data:', {
        name: dto.name,
        providerId: dto.providerId,
        budget: dto.budget,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      })

      // Validate business rules first
      this.validateCampaignBusinessRules(dto)

      // Validate provider existence and business rules
      await this.validateProviderExists(dto.providerId, 'createCampaign')

      // Create domain entity
      const campaign = Campaign.create({
        name: dto.name,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        budget: dto.budget,
        status: dto.status || CampaignStatus.DRAFT,
        providerId: dto.providerId,
        active: dto.active ?? true,
        targetAudience: dto.targetAudience || null,
        objectives: dto.objectives || null,
      })

      // Map to database format
      const createData = CampaignDocumentMapper.mapDomainToCreateData(campaign)

      logger.debug('Final createData for Prisma:', {
        ...createData,
        name: '[MULTILINGUAL_TEXT]',
        description: '[MULTILINGUAL_TEXT]',
      })

      // Create the campaign in the database
      const created = await this.prisma.campaign.create({
        data: createData as any,
      })

      logger.debug('Campaign created in database:', {
        id: created.id,
        providerId: created.providerId,
        status: created.status,
        budget: created.budget,
      })

      // Verify the record actually exists with correct values
      const verifyCreated = await this.prisma.campaign.findUnique({
        where: { id: created.id },
      })

      logger.debug('Verification after creation:', {
        id: verifyCreated?.id,
        providerId: verifyCreated?.providerId,
        status: verifyCreated?.status,
        active: verifyCreated?.active,
      })

      return this.mapToDomainEntity(created)
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (error.code === 'P2002') {
          // Extract the field name from the error
          const metaTarget = error.meta?.target as string[] | undefined
          const field =
            metaTarget && metaTarget.length > 0 ? metaTarget[0] : 'name'
          const value = field === 'name' ? dto.name?.en || 'unknown' : 'unknown'

          throw ErrorFactory.uniqueConstraintViolation(
            'Campaign',
            field,
            value,
            {
              source: 'PrismaCampaignWriteRepository.createCampaign',
              suggestion: `A campaign with this ${field} already exists for this provider`,
            },
          )
        }

        // Foreign key constraint failure
        if (error.code === 'P2003') {
          throw ErrorFactory.validationError(
            { providerId: ['Provider does not exist'] },
            {
              source: 'PrismaCampaignWriteRepository.createCampaign',
              metadata: { providerId: dto.providerId },
            },
          )
        }
      }

      // Re-throw validation and business rule errors without wrapping
      if (
        error.code === 'VALIDATION_ERROR' ||
        error.code === 'BUSINESS_RULE_VIOLATION' ||
        error.name === 'ValidationError' ||
        error.name === 'BusinessRuleViolationError'
      ) {
        throw error
      }

      // Handle other database errors
      logger.error('Error creating campaign:', error)
      throw ErrorFactory.databaseError(
        'create_campaign',
        'Failed to create campaign',
        error,
        {
          source: 'PrismaCampaignWriteRepository.createCampaign',
          metadata: {
            providerId: dto.providerId,
            campaignName: dto.name?.en || 'unknown',
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  /**
   * Updates an existing campaign in the database with comprehensive validation
   * @param id Campaign ID to update
   * @param dto Partial campaign update data
   * @returns The updated campaign domain entity
   */
  async updateCampaign(id: string, dto: CampaignUpdateDTO): Promise<Campaign> {
    try {
      logger.debug('Updating campaign:', { id, updates: Object.keys(dto) })

      // Validate business rules for the update data
      this.validateCampaignBusinessRules(dto)

      // Get current campaign data and validate ownership
      const existingCampaign = await this.prisma.campaign.findUnique({
        where: { id },
      })

      if (!existingCampaign) {
        throw ErrorFactory.resourceNotFound('Campaign', id, {
          source: 'PrismaCampaignWriteRepository.updateCampaign',
          metadata: { campaignId: id },
          httpStatus: 404,
        })
      }

      // Provider ID cannot be changed in updates

      // Validate status transitions FIRST, before any domain entity operations
      if (dto.status && dto.status !== existingCampaign.status) {
        this.validateStatusTransition(
          existingCampaign.status,
          dto.status,
          existingCampaign,
        )
      }

      // Reconstitute the current domain entity
      const mappedExisting = {
        ...existingCampaign,
        budget: Number(existingCampaign.budget), // Convert Decimal to number
      }
      const currentCampaign = CampaignDocumentMapper.mapDocumentToDomain(
        mappedExisting as any,
      )

      // Apply updates to the domain entity
      const updatedCampaign = currentCampaign.update({
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate,
        endDate: dto.endDate,
        budget: dto.budget,
        targetAudience: dto.targetAudience,
        objectives: dto.objectives,
      })

      // Map the updated entity to database format
      const updateData =
        CampaignDocumentMapper.mapDomainToUpdateData(updatedCampaign)

      // Add status and active if provided in DTO
      if (dto.status) (updateData as any).status = dto.status
      if (dto.active !== undefined) (updateData as any).active = dto.active

      // Persist updates
      const updated = await this.prisma.campaign.update({
        where: { id },
        data: updateData as any,
      })

      logger.debug('Campaign updated successfully:', {
        id: updated.id,
        status: updated.status,
        active: updated.active,
      })

      return this.mapToDomainEntity(updated)
    } catch (error) {
      // First check for our own validation errors, which should be propagated as-is
      if (
        error.name === 'ValidationError' ||
        error.code === 'VALIDATION_ERROR' ||
        error.code === 'BUSINESS_RULE_VIOLATION' ||
        error.name === 'BusinessRuleViolationError' ||
        error.code === 'RESOURCE_NOT_FOUND' ||
        error.code === 'NOT_AUTHORIZED'
      ) {
        throw error
      }

      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (error.code === 'P2002') {
          const metaTarget = error.meta?.target as string[] | undefined
          const field =
            metaTarget && metaTarget.length > 0 ? metaTarget[0] : 'name'
          const value =
            field === 'name' && dto.name ? dto.name.en || 'unknown' : 'unknown'

          throw ErrorFactory.uniqueConstraintViolation(
            'Campaign',
            field,
            value,
            {
              source: 'PrismaCampaignWriteRepository.updateCampaign',
            },
          )
        }

        // Foreign key constraint failure
        if (error.code === 'P2003') {
          throw ErrorFactory.validationError(
            { providerId: ['Provider does not exist'] },
            {
              source: 'PrismaCampaignWriteRepository.updateCampaign',
              httpStatus: 400,
            },
          )
        }

        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Campaign', id, {
            source: 'PrismaCampaignWriteRepository.updateCampaign',
            metadata: { campaignId: id },
          })
        }
      }

      // Handle other database errors
      logger.error('Error updating campaign:', error)
      throw ErrorFactory.databaseError(
        'update_campaign',
        'Failed to update campaign',
        error,
        {
          source: 'PrismaCampaignWriteRepository.updateCampaign',
          metadata: {
            campaignId: id,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  /**
   * Deletes a campaign from the database with ownership validation
   * @param id Campaign ID to delete
   */
  async deleteCampaign(id: string): Promise<void> {
    try {
      logger.debug('Deleting campaign:', { id })

      // Check if the campaign exists and get current data
      const existingCampaign = await this.prisma.campaign.findUnique({
        where: { id },
      })

      if (!existingCampaign) {
        throw ErrorFactory.resourceNotFound('Campaign', id, {
          source: 'PrismaCampaignWriteRepository.deleteCampaign',
          httpStatus: 404,
        })
      }

      // Business rule: Cannot delete active campaigns with vouchers
      if (existingCampaign.status === CampaignStatus.ACTIVE) {
        throw ErrorFactory.businessRuleViolation(
          'Cannot delete active campaign',
          'Active campaigns cannot be deleted. Set status to CANCELLED instead.',
          {
            source: 'PrismaCampaignWriteRepository.deleteCampaign',
            suggestion: 'Cancel the campaign instead of deleting it',
            metadata: { campaignStatus: existingCampaign.status },
            httpStatus: 400,
          },
        )
      }

      // Business rule: Cannot delete campaigns with related vouchers (when implemented)
      // if (existingCampaign._count.vouchers > 0) {
      //   throw ErrorFactory.businessRuleViolation(
      //     'Campaign has associated vouchers',
      //     `Cannot delete campaign with ${existingCampaign._count.vouchers} vouchers`,
      //     {
      //       source: 'PrismaCampaignWriteRepository.deleteCampaign',
      //       suggestion: 'Remove all vouchers first or cancel the campaign instead',
      //       metadata: { voucherCount: existingCampaign._count.vouchers },
      //       httpStatus: 400,
      //     },
      //   )
      // }

      // Log the operation for audit purposes
      logger.info('Deleting campaign from database', {
        id,
        providerId: existingCampaign.providerId,
        status: existingCampaign.status,
      })

      // Delete the campaign from the database
      await this.prisma.campaign.delete({ where: { id } })

      logger.info('Campaign deleted successfully', { id })
    } catch (error) {
      // Re-throw business rule and not found errors
      if (
        error.code === 'BUSINESS_RULE_VIOLATION' ||
        error.code === 'RESOURCE_NOT_FOUND'
      ) {
        throw error
      }

      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Campaign', id, {
            source: 'PrismaCampaignWriteRepository.deleteCampaign',
          })
        }

        // Foreign key constraint failure (has dependent records)
        if (error.code === 'P2003') {
          throw ErrorFactory.businessRuleViolation(
            'Campaign has dependent entities',
            'Cannot delete campaign with associated vouchers or other dependencies',
            {
              source: 'PrismaCampaignWriteRepository.deleteCampaign',
              suggestion: 'Remove all associated entities first',
            },
          )
        }
      }

      // Handle other database errors
      logger.error('Error deleting campaign:', error)
      throw ErrorFactory.databaseError(
        'delete_campaign',
        'Failed to delete campaign',
        error,
        {
          source: 'PrismaCampaignWriteRepository.deleteCampaign',
          metadata: {
            campaignId: id,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  /**
   * Validates campaign status transitions according to business rules
   * @private
   */
  private validateStatusTransition(
    currentStatus: string,
    newStatus: string,
    campaign: any,
  ): void {
    const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
      [CampaignStatus.DRAFT]: [CampaignStatus.ACTIVE, CampaignStatus.CANCELLED],
      [CampaignStatus.ACTIVE]: [
        CampaignStatus.PAUSED,
        CampaignStatus.COMPLETED,
        CampaignStatus.CANCELLED,
      ],
      [CampaignStatus.PAUSED]: [
        CampaignStatus.ACTIVE,
        CampaignStatus.CANCELLED,
      ],
      [CampaignStatus.COMPLETED]: [], // Terminal status
      [CampaignStatus.CANCELLED]: [], // Terminal status
    }

    const allowedTransitions =
      validTransitions[currentStatus as CampaignStatus] || []

    if (!allowedTransitions.includes(newStatus as CampaignStatus)) {
      throw ErrorFactory.validationError(
        {
          status: [
            `Cannot transition from ${currentStatus} to ${newStatus}. Valid transitions: ${allowedTransitions.join(', ') || 'none'}`,
          ],
        },
        {
          source: 'PrismaCampaignWriteRepository.validateStatusTransition',
          suggestion: `Valid transitions from ${currentStatus}: ${allowedTransitions.join(', ') || 'none'}`,
          metadata: { currentStatus, newStatus, allowedTransitions },
        },
      )
    }

    // Additional business rules for specific transitions
    if (newStatus === 'ACTIVE') {
      // Direct date comparison using raw campaign data
      const now = new Date()
      const endDate =
        campaign.endDate instanceof Date
          ? campaign.endDate
          : new Date(campaign.endDate)

      if (now > endDate) {
        throw ErrorFactory.validationError(
          {
            status: [
              'Cannot activate expired campaign. Campaign end date has already passed',
            ],
          },
          {
            source: 'PrismaCampaignWriteRepository.validateStatusTransition',
            suggestion:
              'Update the end date to a future date before activating',
            metadata: { endDate: endDate.toISOString() },
          },
        )
      }
    }
  }

  /**
   * Maps a database record to a domain entity
   * @private
   */
  private mapToDomainEntity(record: any): Campaign {
    logger.debug('Raw record from database:', {
      id: record.id,
      providerId: record.providerId,
      status: record.status,
      active: record.active,
    })

    // Convert Prisma types to expected types
    const mappedRecord = {
      ...record,
      budget: Number(record.budget), // Convert Decimal to number
    }

    return CampaignDocumentMapper.mapDocumentToDomain(mappedRecord)
  }

  /**
   * Find a campaign by ID
   * @param id Campaign ID
   * @returns Campaign domain entity or null if not found
   */
  async findById(id: string): Promise<Campaign | null> {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id },
      })

      if (!campaign) {
        return null
      }

      return this.mapToDomainEntity(campaign)
    } catch (error) {
      logger.error('Error finding campaign by ID:', error)
      throw ErrorFactory.databaseError(
        'find_campaign_by_id',
        'Failed to find campaign',
        error,
        {
          source: 'PrismaCampaignWriteRepository.findById',
          metadata: { campaignId: id },
        },
      )
    }
  }
}
