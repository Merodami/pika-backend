import { businessPublic } from '@pika/api'

type BusinessRegistrationStatusResponse = businessPublic.BusinessRegistrationStatusResponse
type CompleteBusinessRegistrationRequest = businessPublic.CompleteBusinessRegistrationRequest
type CompleteBusinessRegistrationResponse = businessPublic.CompleteBusinessRegistrationResponse
type RegistrationProgressResponse = businessPublic.RegistrationProgressResponse
type SubmitRegistrationStepRequest = businessPublic.SubmitRegistrationStepRequest
type SubmitRegistrationStepResponse = businessPublic.SubmitRegistrationStepResponse
import type { UserServiceClient } from '@pika/shared'
import { ErrorFactory, logger } from '@pika/shared'
import { BusinessRegistrationStatus, UserRole } from '@pika/types'
import { Cache } from '@pika/redis'
import { REDIS_DEFAULT_TTL } from '@pika/environment'

import { BusinessRegistrationMapper } from '../mappers/BusinessRegistrationMapper.js'
import type { IBusinessRegistrationRepository } from '../repositories/BusinessRegistrationRepository.js'
import type { IBusinessRepository } from '../repositories/BusinessRepository.js'
import { CACHE_KEYS } from '../constants/cache-keys.js'

export interface IBusinessRegistrationService {
  checkRegistrationStatus(
    userId: string,
  ): Promise<BusinessRegistrationStatusResponse>
  startRegistration(
    userId: string,
  ): Promise<{ started: boolean; currentStep: number }>
  saveStep(
    userId: string,
    request: SubmitRegistrationStepRequest,
  ): Promise<SubmitRegistrationStepResponse>
  getProgress(userId: string): Promise<RegistrationProgressResponse>
  completeRegistration(
    userId: string,
    request: CompleteBusinessRegistrationRequest,
  ): Promise<CompleteBusinessRegistrationResponse>
}

/**
 * Business registration service
 * Handles the multi-step business registration flow
 */
export class BusinessRegistrationService
  implements IBusinessRegistrationService
{
  constructor(
    private readonly registrationRepository: IBusinessRegistrationRepository,
    private readonly businessRepository: IBusinessRepository,
    private readonly userServiceClient: UserServiceClient,
  ) {}

  /**
   * Check if user needs to complete business registration
   * Cached per user to improve performance
   * Cache key: business:registration:status:{userId}
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: CACHE_KEYS.REGISTRATION.STATUS,
    keyGenerator: (prefix: string, methodName: string, args: any[]) => {
      // Use userId as the cache key
      const userId = args[0]
      return `${prefix}:${userId}`
    },
  })
  async checkRegistrationStatus(
    userId: string,
  ): Promise<BusinessRegistrationStatusResponse> {
    try {
      // Get user details to check role
      const user = await this.userServiceClient.getUser(userId)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', userId)
      }

      // Only business users need registration
      const isBusinessRole = user.role === UserRole.BUSINESS

      // Get existing registration if any
      const registration =
        await this.registrationRepository.findByUserId(userId)

      // Map to response
      const domain = registration
        ? BusinessRegistrationMapper.fromDocument(registration)
        : null

      return BusinessRegistrationMapper.toStatusResponse(
        domain,
        userId,
        isBusinessRole,
      )
    } catch (error) {
      logger.error('Error checking registration status', { userId, error })
      throw ErrorFactory.databaseError(
        'CHECK_STATUS_FAILED',
        'Failed to check registration status',
      )
    }
  }

  /**
   * Start the registration process for a user
   */
  async startRegistration(
    userId: string,
  ): Promise<{ started: boolean; currentStep: number }> {
    try {
      // Check if registration already exists
      const existing = await this.registrationRepository.findByUserId(userId)

      if (existing) {
        logger.info('Registration already exists', {
          userId,
          registrationId: existing.id,
        })

        return {
          started: false,
          currentStep: existing.currentStep,
        }
      }

      // Create new registration
      const registration = await this.registrationRepository.create({
        userId,
        registrationStatus: BusinessRegistrationStatus.IN_PROGRESS,
        currentStep: 1,
      })

      logger.info('Business registration started', {
        userId,
        registrationId: registration.id,
      })

      return {
        started: true,
        currentStep: 1,
      }
    } catch (error) {
      logger.error('Error starting registration', { userId, error })
      throw ErrorFactory.databaseError(
        'START_REGISTRATION_FAILED',
        'Failed to start business registration',
        error,
      )
    }
  }

  /**
   * Save data for a registration step
   */
  async saveStep(
    userId: string,
    request: SubmitRegistrationStepRequest,
  ): Promise<SubmitRegistrationStepResponse> {
    try {
      // Get existing registration
      const registration =
        await this.registrationRepository.findByUserId(userId)

      if (!registration) {
        throw ErrorFactory.validationError(
          { registration: ['Registration not found. Please start registration first.'] },
          { metadata: { userId, step: request.stepNumber } },
        )
      }

      const domain = BusinessRegistrationMapper.fromDocument(registration)

      // Validate step progression
      if (!request.saveAsDraft) {
        // Check if step is already completed (prevent duplicate submissions)
        const isStepCompleted = BusinessRegistrationMapper.isStepCompleted(
          domain,
          request.stepNumber,
        )

        if (isStepCompleted) {
          throw ErrorFactory.resourceConflict(
            'BusinessRegistrationStep',
            `Step ${request.stepNumber} has already been completed. Use step ${domain.currentStep} to continue.`,
            {
              metadata: {
                completedStep: request.stepNumber,
                currentStep: domain.currentStep,
              }
            },
          )
        }

        if (
          !BusinessRegistrationMapper.canProceedToStep(
            domain,
            request.stepNumber,
          )
        ) {
          throw ErrorFactory.validationError(
            { step: ['Cannot skip steps. Please complete previous steps first.'] },
            {
              metadata: {
                currentStep: domain.currentStep,
                requestedStep: request.stepNumber,
              }
            },
          )
        }

        // Validate step data
        if (
          !BusinessRegistrationMapper.validateStepData(
            request.stepNumber,
            request.stepData,
          )
        ) {
          throw ErrorFactory.validationError(
            { stepData: ['Invalid step data. Please check all required fields.'] },
            { metadata: { step: request.stepNumber } },
          )
        }
      }

      // Update the step data
      const updated = await this.registrationRepository.updateStep(
        registration.id,
        request.stepNumber,
        request.stepData,
      )

      // Determine next step
      const totalSteps = 3 // Full registration has 3 steps
      const nextStep =
        request.stepNumber < totalSteps ? request.stepNumber + 1 : null

      logger.info('Registration step saved', {
        userId,
        registrationId: registration.id,
        step: request.stepNumber,
        isDraft: request.saveAsDraft,
      })

      return {
        success: true,
        nextStep,
        savedData: request.stepData,
      }
    } catch (error) {
      logger.error('Error saving registration step', { userId, request, error })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get registration progress
   */
  async getProgress(userId: string): Promise<RegistrationProgressResponse> {
    try {
      const registration =
        await this.registrationRepository.findByUserId(userId)

      if (!registration) {
        throw ErrorFactory.resourceNotFound('Registration', userId)
      }

      const domain = BusinessRegistrationMapper.fromDocument(registration)

      return BusinessRegistrationMapper.toProgressResponse(domain)
    } catch (error) {
      logger.error('Error getting registration progress', { userId, error })
      throw ErrorFactory.databaseError(
        'GET_PROGRESS_FAILED',
        'Failed to get registration progress',
        error,
      )
    }
  }

  /**
   * Complete registration and create business
   */
  async completeRegistration(
    userId: string,
    request: CompleteBusinessRegistrationRequest,
  ): Promise<CompleteBusinessRegistrationResponse> {
    try {
      // Validate request
      if (!request.confirmAllDataAccurate || !request.agreedToTerms) {
        throw ErrorFactory.validationError(
          { confirmation: ['You must confirm data accuracy and agree to terms'] },
          { metadata: { request } },
        )
      }

      // Get registration
      const registration =
        await this.registrationRepository.findByUserId(userId)

      if (!registration) {
        throw ErrorFactory.resourceNotFound('Registration', userId)
      }

      const domain = BusinessRegistrationMapper.fromDocument(registration)

      // Check if ready for submission
      if (!BusinessRegistrationMapper.isReadyForSubmission(domain)) {
        throw ErrorFactory.validationError(
          { registration: ['Registration is not complete. Please complete all required steps.'] },
          { metadata: { currentStep: domain.currentStep } },
        )
      }

      // Check if already submitted
      if (
        domain.registrationStatus === BusinessRegistrationStatus.SUBMITTED ||
        domain.registrationStatus === BusinessRegistrationStatus.APPROVED
      ) {
        throw ErrorFactory.businessRuleViolation(
          'ALREADY_SUBMITTED',
          'Registration has already been submitted',
        )
      }

      // Extract business data from steps
      const step1Data = domain.step1Data as any
      const step2Data = domain.step2Data as any

      // Create the business
      const business = await this.businessRepository.create({
        userId,
        businessNameKey: step1Data.businessName,
        businessDescriptionKey: step2Data.businessDescription,
        categoryId: step1Data.categoryId,
        verified: false,
        active: false, // Inactive until approved
        approved: false, // Needs admin approval
      })

      // Update registration to link business and mark as submitted
      await this.registrationRepository.complete(registration.id, business.id)
      await this.registrationRepository.updateStatus(
        registration.id,
        BusinessRegistrationStatus.SUBMITTED,
      )

      logger.info('Business registration completed', {
        userId,
        registrationId: registration.id,
        businessId: business.id,
      })

      return BusinessRegistrationMapper.toCompletionResponse(
        domain,
        business.id,
      )
    } catch (error) {
      logger.error('Error completing registration', { userId, error })
      throw ErrorFactory.fromError(error)
    }
  }
}
