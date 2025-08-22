import type { ICacheService } from '@pika/redis'
import { ErrorFactory, logger } from '@pika/shared'
import { BusinessRegistrationStatus as DomainStatus } from '@pika/types'
import {
  type BusinessRegistration,
  BusinessRegistrationStatus as PrismaStatus,
  Prisma,
  type PrismaClient,
} from '@prisma/client'

import { generateCacheKey } from '../constants/cache-keys.js'

/**
 * Convert domain enum to Prisma enum
 */
function toPrismaStatus(domainStatus?: DomainStatus): PrismaStatus {
  if (!domainStatus) return PrismaStatus.IN_PROGRESS

  switch (domainStatus) {
    case DomainStatus.IN_PROGRESS:
      return PrismaStatus.IN_PROGRESS
    case DomainStatus.SUBMITTED:
      return PrismaStatus.SUBMITTED
    case DomainStatus.APPROVED:
      return PrismaStatus.APPROVED
    case DomainStatus.REJECTED:
      return PrismaStatus.REJECTED
    default:
      return PrismaStatus.IN_PROGRESS
  }
}

export interface IBusinessRegistrationRepository {
  findByUserId(userId: string): Promise<BusinessRegistration | null>
  findById(id: string): Promise<BusinessRegistration | null>
  create(data: CreateRegistrationData): Promise<BusinessRegistration>
  updateStep(
    id: string,
    step: number,
    stepData: any,
  ): Promise<BusinessRegistration>
  updateStatus(id: string, status: DomainStatus): Promise<BusinessRegistration>
  complete(id: string, businessId: string): Promise<BusinessRegistration>
  reset(id: string): Promise<BusinessRegistration>
}

export interface CreateRegistrationData {
  userId: string
  registrationStatus?: DomainStatus
  currentStep?: number
}

export interface UpdateStepData {
  currentStep: number
  step1Data?: any
  step2Data?: any
  step3Data?: any
}

/**
 * Business registration repository implementation using Prisma
 * Manages the business_registration table for tracking registration progress
 *
 * Cache Key Pattern (using constants from cache-keys.ts):
 * - business:registration:user:{userId} - Repository cache for user's registration data
 * - business:registration:status:{userId} - Service cache for registration status (used by @Cache decorator)
 *
 * Cache invalidation happens on all write operations to ensure consistency
 */
export class BusinessRegistrationRepository
  implements IBusinessRegistrationRepository
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Find registration by user ID
   */
  async findByUserId(userId: string): Promise<BusinessRegistration | null> {
    try {
      // Check cache first
      const cacheKey = generateCacheKey.registrationUser(userId)

      if (this.cacheService) {
        const cached =
          await this.cacheService.get<BusinessRegistration>(cacheKey)

        if (cached) {
          logger.debug('Business registration cache hit', { userId })

          return cached
        }
      }

      const registration = await this.prisma.businessRegistration.findUnique({
        where: { userId },
      })

      // Cache the result
      if (registration && this.cacheService) {
        await this.cacheService.set(cacheKey, registration, 300) // 5 minutes cache
      }

      return registration
    } catch (error) {
      logger.error('Error finding business registration by user ID', {
        userId,
        error,
      })
      throw ErrorFactory.databaseError(
        'findByUserId',
        'Failed to find business registration',
        error,
      )
    }
  }

  /**
   * Find registration by ID
   */
  async findById(id: string): Promise<BusinessRegistration | null> {
    try {
      return await this.prisma.businessRegistration.findUnique({
        where: { id },
      })
    } catch (error) {
      logger.error('Error finding business registration by ID', { id, error })
      throw ErrorFactory.databaseError(
        'findById',
        'Failed to find business registration',
        error,
      )
    }
  }

  /**
   * Create a new business registration
   */
  async create(data: CreateRegistrationData): Promise<BusinessRegistration> {
    try {
      const registration = await this.prisma.businessRegistration.create({
        data: {
          userId: data.userId,
          registrationStatus: toPrismaStatus(data.registrationStatus),
          currentStep: data.currentStep || 1,
          startedAt: new Date(),
        },
      })

      // Invalidate both cache keys - service decorator and repository cache
      if (this.cacheService) {
        await this.cacheService.del(
          generateCacheKey.registrationStatus(data.userId),
        )
        await this.cacheService.del(
          generateCacheKey.registrationUser(data.userId),
        )
      }

      logger.info('Business registration created', {
        registrationId: registration.id,
        userId: data.userId,
      })

      return registration
    } catch (error) {
      // Check for unique constraint violation
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        logger.warn('Business registration already exists for user', {
          userId: data.userId,
        })
        throw ErrorFactory.businessRuleViolation(
          'REGISTRATION_EXISTS',
          'Business registration already exists for this user',
        )
      }

      logger.error('Error creating business registration', { data, error })
      throw ErrorFactory.databaseError(
        'create',
        'Failed to create business registration',
        error,
      )
    }
  }

  /**
   * Update a registration step
   */
  async updateStep(
    id: string,
    step: number,
    stepData: any,
  ): Promise<BusinessRegistration> {
    try {
      // First get the current registration to check existing progress
      const currentRegistration = await this.prisma.businessRegistration.findUnique({
        where: { id },
        select: { currentStep: true },
      })

      if (!currentRegistration) {
        throw ErrorFactory.resourceNotFound('BusinessRegistration', id)
      }

      // Build update data based on step number
      // - If step == currentStep: completing current step, advance
      // - If step < currentStep: editing previous step, maintain current progress
      // - If step > currentStep: should be prevented by validation, but handle gracefully
      let nextStep: number
      if (step >= currentRegistration.currentStep) {
        // Completing current step or advancing to new step
        nextStep = step < 3 ? step + 1 : 3
      } else {
        // Editing a previous step - keep current step
        nextStep = currentRegistration.currentStep
      }

      const updateData: Prisma.BusinessRegistrationUpdateInput = {
        currentStep: nextStep,
        updatedAt: new Date(),
      }

      // Update the appropriate step data field
      switch (step) {
        case 1:
          updateData.step1Data = stepData
          break
        case 2:
          updateData.step2Data = stepData
          break
        case 3:
          updateData.step3Data = stepData
          break
        default:
          throw ErrorFactory.validationError(
            { step: [`Invalid step number: ${step}`] },
            { metadata: { step } },
          )
      }

      const registration = await this.prisma.businessRegistration.update({
        where: { id },
        data: updateData,
      })

      // Invalidate both cache keys - service decorator and repository cache
      if (this.cacheService && registration) {
        await this.cacheService.del(
          generateCacheKey.registrationStatus(registration.userId),
        )
        await this.cacheService.del(
          generateCacheKey.registrationUser(registration.userId),
        )
      }

      logger.info('Business registration step updated', {
        registrationId: id,
        step,
        userId: registration.userId,
      })

      return registration
    } catch (error) {
      logger.error('Error updating business registration step', {
        id,
        step,
        error,
      })
      throw ErrorFactory.databaseError(
        'updateStep',
        'Failed to update registration step',
        error,
      )
    }
  }

  /**
   * Update registration status
   */
  async updateStatus(
    id: string,
    status: DomainStatus,
  ): Promise<BusinessRegistration> {
    try {
      const updateData: Prisma.BusinessRegistrationUpdateInput = {
        registrationStatus: toPrismaStatus(status),
        updatedAt: new Date(),
      }

      // Set timestamps based on status
      if (status === DomainStatus.SUBMITTED) {
        updateData.submittedAt = new Date()
      } else if (status === DomainStatus.APPROVED) {
        updateData.completedAt = new Date()
      }

      const registration = await this.prisma.businessRegistration.update({
        where: { id },
        data: updateData,
      })

      // Invalidate both cache keys - service decorator and repository cache
      if (this.cacheService && registration) {
        await this.cacheService.del(
          generateCacheKey.registrationStatus(registration.userId),
        )
        await this.cacheService.del(
          generateCacheKey.registrationUser(registration.userId),
        )
      }

      logger.info('Business registration status updated', {
        registrationId: id,
        status,
        userId: registration.userId,
      })

      return registration
    } catch (error) {
      logger.error('Error updating business registration status', {
        id,
        status,
        error,
      })
      throw ErrorFactory.databaseError(
        'updateStatus',
        'Failed to update registration status',
        error,
      )
    }
  }

  /**
   * Complete registration and link to business
   */
  async complete(
    id: string,
    businessId: string,
  ): Promise<BusinessRegistration> {
    try {
      const registration = await this.prisma.businessRegistration.update({
        where: { id },
        data: {
          businessId,
          registrationStatus: PrismaStatus.SUBMITTED,
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Invalidate both cache keys - service decorator and repository cache
      if (this.cacheService && registration) {
        await this.cacheService.del(
          generateCacheKey.registrationStatus(registration.userId),
        )
        await this.cacheService.del(
          generateCacheKey.registrationUser(registration.userId),
        )
      }

      logger.info('Business registration completed', {
        registrationId: id,
        businessId,
        userId: registration.userId,
      })

      return registration
    } catch (error) {
      logger.error('Error completing business registration', {
        id,
        businessId,
        error,
      })
      throw ErrorFactory.databaseError(
        'complete',
        'Failed to complete business registration',
        error,
      )
    }
  }

  /**
   * Reset registration to initial state
   * Allows user to restart the registration process
   */
  async reset(id: string): Promise<BusinessRegistration> {
    try {
      const registration = await this.prisma.businessRegistration.update({
        where: { id },
        data: {
          currentStep: 1,
          step1Data: Prisma.JsonNull,
          step2Data: Prisma.JsonNull,
          step3Data: Prisma.JsonNull,
          registrationStatus: PrismaStatus.IN_PROGRESS,
          businessId: null,
          submittedAt: null,
          completedAt: null,
          updatedAt: new Date(),
        },
      })

      // Invalidate both cache keys - service decorator and repository cache
      if (this.cacheService && registration) {
        await this.cacheService.del(
          generateCacheKey.registrationStatus(registration.userId),
        )
        await this.cacheService.del(
          generateCacheKey.registrationUser(registration.userId),
        )
      }

      logger.info('Business registration reset', {
        registrationId: id,
        userId: registration.userId,
      })

      return registration
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw ErrorFactory.resourceNotFound('Business registration', id, {
          source: 'BusinessRegistrationRepository.reset',
        })
      }

      logger.error('Error resetting business registration', {
        id,
        error,
      })
      throw ErrorFactory.databaseError(
        'reset',
        'Failed to reset business registration',
        error,
      )
    }
  }
}
