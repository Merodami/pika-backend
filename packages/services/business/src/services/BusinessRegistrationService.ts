import { businessPublic } from '@pika/api'

type BusinessRegistrationStatusResponse =
  businessPublic.BusinessRegistrationStatusResponse
type CompleteBusinessRegistrationRequest =
  businessPublic.CompleteBusinessRegistrationRequest
type CompleteBusinessRegistrationResponse =
  businessPublic.CompleteBusinessRegistrationResponse
type RegistrationProgressResponse = businessPublic.RegistrationProgressResponse
type SubmitRegistrationStepRequest =
  businessPublic.SubmitRegistrationStepRequest
type SubmitRegistrationStepResponse =
  businessPublic.SubmitRegistrationStepResponse
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache } from '@pika/redis'
import type { UserServiceClient } from '@pika/shared'
import { ErrorFactory, logger } from '@pika/shared'
import { BusinessRegistrationStatus, UserRole } from '@pika/types'

import { CACHE_KEYS } from '../constants/cache-keys.js'
import { BusinessRegistrationMapper } from '../mappers/BusinessRegistrationMapper.js'
import type { IBusinessDetailsRepository } from '../repositories/BusinessDetailsRepository.js'
import type { IBusinessRegistrationRepository } from '../repositories/BusinessRegistrationRepository.js'
import type { IBusinessRepository } from '../repositories/BusinessRepository.js'

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
  resetRegistration(registrationId: string, reason: string): Promise<{
    success: boolean
    message: string
    registrationId: string
    userId: string
  }>
  updateRegistrationStatusByBusinessId(
    businessId: string,
    status: BusinessRegistrationStatus,
    reason?: string,
  ): Promise<{ registrationId: string; userId: string } | null>
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
    private readonly businessDetailsRepository: IBusinessDetailsRepository,
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
      logger.info('Checking registration status', { userId })

      // Get user details to check role
      const user = await this.userServiceClient.getUser(userId)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', userId)
      }

      logger.info('User details for registration check', {
        userId,
        role: user.role,
        email: user.email,
      })

      // Only business users need registration
      const isBusinessRole = user.role === UserRole.BUSINESS

      // Get existing registration if any
      const registration =
        await this.registrationRepository.findByUserId(userId)

      logger.info('Registration lookup result', {
        userId,
        hasRegistration: !!registration,
        registrationId: registration?.id,
        status: registration?.registrationStatus,
      })

      // Map to response
      const domain = registration
        ? BusinessRegistrationMapper.fromDocument(registration)
        : null

      const response = BusinessRegistrationMapper.toStatusResponse(
        domain,
        userId,
        isBusinessRole,
      )

      logger.info('Registration status response', {
        userId,
        isBusinessRole,
        needsRegistration: response.needsRegistration,
        currentStep: response.currentStep,
        canAccessDashboard: response.canAccessDashboard,
      })

      return response
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
      // Users can have multiple businesses, so we don't check for existing businesses
      // We only check if there's an incomplete registration in progress
      
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
      throw ErrorFactory.fromError(error)
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
          {
            registration: [
              'Registration not found. Please start registration first.',
            ],
          },
          { metadata: { userId, step: request.stepNumber } },
        )
      }

      const domain = BusinessRegistrationMapper.fromDocument(registration)

      // Validate step progression
      if (!request.saveAsDraft) {
        // Allow updates to previously completed steps for better UX
        // Users should be able to go back and edit their information

        if (
          !BusinessRegistrationMapper.canProceedToStep(
            domain,
            request.stepNumber,
          )
        ) {
          throw ErrorFactory.validationError(
            {
              step: [
                'Cannot skip steps. Please complete previous steps first.',
              ],
            },
            {
              metadata: {
                currentStep: domain.currentStep,
                requestedStep: request.stepNumber,
              },
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
            {
              stepData: [
                'Invalid step data. Please check all required fields.',
              ],
            },
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
          {
            confirmation: ['You must confirm data accuracy and agree to terms'],
          },
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
          {
            registration: [
              'Registration is not complete. Please complete all required steps.',
            ],
          },
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
      const step3Data = domain.step3Data as any

      // Create the business with basic info
      const business = await this.businessRepository.create({
        userId,
        businessNameKey: step1Data.businessName,
        businessDescriptionKey: step2Data.description, // Fixed: was businessDescription
        categoryId: step1Data.categoryId,
        verified: false,
        active: false, // Inactive until approved
        approved: false, // Needs admin approval
      })

      // Store additional business details
      await this.businessDetailsRepository.create({
        businessId: business.id,
        // Contact Information
        phone: step2Data.phone,
        email: step2Data.email,
        website: step2Data.website,
        // Address Information
        street: step2Data.address?.street,
        city: step2Data.address?.city,
        state: step2Data.address?.state,
        postalCode: step2Data.address?.postalCode,
        country: step2Data.address?.country,
        // Operating Information (from step 3)
        operatingHours: step3Data?.operatingHours,
        socialMedia: step3Data?.socialMedia,
        additionalInfo: step3Data?.additionalInfo,
      })

      logger.info('Business and details created successfully', {
        businessId: business.id,
        hasAddress: !!step2Data.address,
        hasPhone: !!step2Data.phone,
        hasEmail: !!step2Data.email,
        hasWebsite: !!step2Data.website,
        hasOperatingHours: !!step3Data?.operatingHours,
        hasSocialMedia: !!step3Data?.socialMedia,
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

  /**
   * Reset a business registration (admin only)
   * Clears all registration data and allows user to start over
   */
  async resetRegistration(
    userId: string,
    reason: string,
  ): Promise<{
    success: boolean
    message: string
    registrationId: string
    userId: string
  }> {
    try {
      logger.info('Resetting business registration', {
        userId,
        reason,
      })

      // Get registration by user ID
      const registration =
        await this.registrationRepository.findByUserId(userId)

      if (!registration) {
        throw ErrorFactory.resourceNotFound(
          'Business registration',
          `No registration found for user ${userId}`,
        )
      }

      // If there's an associated business, we should delete it
      if (registration.businessId) {
        logger.info('Deleting associated business', {
          businessId: registration.businessId,
          registrationId: registration.id,
        })
        
        // Soft delete the business
        await this.businessRepository.delete(registration.businessId)
        
        // Also delete business details if they exist
        try {
          const details = await this.businessDetailsRepository.findByBusinessId(
            registration.businessId,
          )
          if (details) {
            await this.businessDetailsRepository.delete(details.id)
          }
        } catch (error) {
          // Log but don't fail if details don't exist
          logger.warn('Could not delete business details', {
            businessId: registration.businessId,
            error,
          })
        }
      }

      // Reset the registration
      const resetRegistration =
        await this.registrationRepository.reset(registration.id)

      logger.info('Business registration reset successfully', {
        registrationId: registration.id,
        userId: resetRegistration.userId,
        reason,
      })

      return {
        success: true,
        message: 'Business registration has been reset successfully',
        registrationId: resetRegistration.id,
        userId: resetRegistration.userId,
      }
    } catch (error) {
      logger.error('Error resetting business registration', {
        userId,
        reason,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Update registration status by business ID (used when admin approves/rejects business)
   * This ensures the registration status stays in sync with business approval
   */
  async updateRegistrationStatusByBusinessId(
    businessId: string,
    status: BusinessRegistrationStatus,
    reason?: string,
  ): Promise<{ registrationId: string; userId: string } | null> {
    try {
      logger.info('Updating registration status by business ID', {
        businessId,
        status,
        reason,
      })

      // Find registration by business ID
      const registration =
        await this.registrationRepository.findByBusinessId(businessId)

      if (!registration) {
        logger.warn('No registration found for business', { businessId })
        return null
      }

      // Update the registration status (including rejection reason if applicable)
      const updatedRegistration = await this.registrationRepository.updateStatus(
        registration.id,
        status,
        reason,
      )

      logger.info('Registration status updated successfully', {
        registrationId: registration.id,
        businessId,
        userId: registration.userId,
        newStatus: status,
      })

      return {
        registrationId: registration.id,
        userId: registration.userId,
      }
    } catch (error) {
      logger.error('Error updating registration status by business ID', {
        businessId,
        status,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }
}
