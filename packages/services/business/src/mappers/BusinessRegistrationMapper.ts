import { businessPublic } from '@pika/api'

type BusinessRegistrationStatusResponse =
  businessPublic.BusinessRegistrationStatusResponse
type CompleteBusinessRegistrationResponse =
  businessPublic.CompleteBusinessRegistrationResponse
type RegistrationProgressResponse = businessPublic.RegistrationProgressResponse
import { BusinessRegistrationStatus } from '@pika/types'
import type { BusinessRegistration } from '@prisma/client'

/**
 * Business Registration Domain Model
 * Internal representation of business registration
 */
export interface BusinessRegistrationDomain {
  id: string
  userId: string
  businessId: string | null
  currentStep: number
  step1Data: any | null
  step2Data: any | null
  step3Data: any | null
  registrationStatus: BusinessRegistrationStatus
  startedAt: Date
  completedAt: Date | null
  submittedAt: Date | null
  rejectionReason: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Mapper for transforming business registration data between layers
 * Following Clean Architecture: Database → Domain → DTO
 */
export class BusinessRegistrationMapper {
  /**
   * Transform database entity to domain model
   */
  static fromDocument(doc: BusinessRegistration): BusinessRegistrationDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      businessId: doc.businessId,
      currentStep: doc.currentStep,
      step1Data: doc.step1Data,
      step2Data: doc.step2Data,
      step3Data: doc.step3Data,
      registrationStatus:
        doc.registrationStatus.toLowerCase() as BusinessRegistrationStatus,
      startedAt: doc.startedAt,
      completedAt: doc.completedAt,
      submittedAt: doc.submittedAt,
      rejectionReason: doc.rejectionReason,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
  }

  /**
   * Transform domain model to status response DTO
   */
  static toStatusResponse(
    domain: BusinessRegistrationDomain | null,
    userId: string,
    isBusinessRole: boolean,
  ): BusinessRegistrationStatusResponse {
    // If no registration exists, user needs to register
    if (!domain && isBusinessRole) {
      // Use a consistent base timestamp for cacheable responses when no registration exists
      const baseTimestamp = new Date('2024-01-01T00:00:00.000Z').toISOString()

      return {
        needsRegistration: true,
        currentStep: 0,
        registrationStatus: BusinessRegistrationStatus.IN_PROGRESS,
        canAccessDashboard: false,
        registrationId: undefined,
        businessId: undefined,
        createdAt: baseTimestamp,
        updatedAt: baseTimestamp,
      }
    }

    // If registration exists, check status
    if (domain) {
      const canAccessDashboard =
        domain.registrationStatus === BusinessRegistrationStatus.APPROVED &&
        domain.businessId !== null

      // User doesn't need registration if status is SUBMITTED or APPROVED
      const needsRegistration = !(
        domain.registrationStatus === BusinessRegistrationStatus.SUBMITTED ||
        domain.registrationStatus === BusinessRegistrationStatus.APPROVED
      )

      return {
        needsRegistration,
        currentStep: domain.currentStep,
        registrationStatus: domain.registrationStatus,
        canAccessDashboard,
        registrationId: domain.id,
        businessId: domain.businessId || undefined,
        createdAt: domain.createdAt.toISOString(),
        updatedAt: domain.updatedAt.toISOString(),
      }
    }

    // Non-business users don't need registration
    const baseTimestamp = new Date('2024-01-01T00:00:00.000Z').toISOString()

    return {
      needsRegistration: false,
      currentStep: 0,
      registrationStatus: BusinessRegistrationStatus.APPROVED,
      canAccessDashboard: true,
      registrationId: undefined,
      businessId: undefined,
      createdAt: baseTimestamp,
      updatedAt: baseTimestamp,
    }
  }

  /**
   * Transform domain model to progress response DTO
   */
  static toProgressResponse(
    domain: BusinessRegistrationDomain,
  ): RegistrationProgressResponse {
    const completedSteps: number[] = []

    // Check which steps have data
    if (domain.step1Data) completedSteps.push(1)
    if (domain.step2Data) completedSteps.push(2)
    if (domain.step3Data) completedSteps.push(3)

    return {
      id: domain.id,
      userId: domain.userId,
      currentStep: domain.currentStep,
      stepsCompleted: completedSteps,
      step1Data: domain.step1Data || {},
      step2Data: domain.step2Data || {},
      step3Data: domain.step3Data || {},
      registrationStatus: domain.registrationStatus,
      businessId: domain.businessId || undefined,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }
  }

  /**
   * Transform to completion response DTO
   */
  static toCompletionResponse(
    domain: BusinessRegistrationDomain,
    businessId: string,
  ): CompleteBusinessRegistrationResponse {
    return {
      businessId,
      registrationStatus: 'submitted',
      message:
        'Business registration submitted successfully. Awaiting admin approval.',
      estimatedReviewTime: '24-48 hours',
    }
  }

  /**
   * Standard toDTO method - converts RegistrationProgressResponse to DTO
   * This follows the Clean Architecture pattern used by other services
   */
  static toDTO(
    progressResponse: RegistrationProgressResponse,
  ): RegistrationProgressResponse {
    // The progressResponse is already in the correct DTO format
    // This method exists for consistency with the mapper pattern
    return progressResponse
  }

  /**
   * Validate step data based on step number
   * Returns true if data is valid for the step
   */
  static validateStepData(stepNumber: number, data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false
    }

    switch (stepNumber) {
      case 1:
        // Validate step 1 required fields
        return !!(
          data.businessName &&
          data.businessType &&
          data.categoryId &&
          data.primaryLanguage
        )

      case 2:
        // Validate step 2 required fields (matching API schema)
        return !!(data.description && data.address && data.phone)

      case 3:
        // Step 3 is future implementation
        return true

      default:
        return false
    }
  }

  /**
   * Check if a specific step is already completed
   */
  static isStepCompleted(
    domain: BusinessRegistrationDomain,
    stepNumber: number,
  ): boolean {
    switch (stepNumber) {
      case 1:
        return !!domain.step1Data
      case 2:
        return !!domain.step2Data
      case 3:
        return !!domain.step3Data
      default:
        return false
    }
  }

  /**
   * Check if registration can proceed to or update a specific step
   */
  static canProceedToStep(
    domain: BusinessRegistrationDomain,
    targetStep: number,
  ): boolean {
    // Allow editing any step that's been reached (current or previous)
    if (targetStep <= domain.currentStep) {
      return true
    }

    // For new steps, can't skip ahead more than one step
    if (targetStep > domain.currentStep + 1) {
      return false
    }

    // Check if previous steps are completed before proceeding to new steps
    if (targetStep === 2 && !domain.step1Data) {
      return false
    }

    if (targetStep === 3 && (!domain.step1Data || !domain.step2Data)) {
      return false
    }

    return true
  }

  /**
   * Check if registration is complete and ready for submission
   */
  static isReadyForSubmission(domain: BusinessRegistrationDomain): boolean {
    // All 3 steps are required for complete registration
    return !!(domain.step1Data && domain.step2Data && domain.step3Data)
  }
}
