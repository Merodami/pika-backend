import { ICacheService } from '@pika/redis'
import type { VoucherDomain } from '@pika/sdk'
import { BusinessServiceClient, ErrorFactory, logger } from '@pika/shared'
import type { TranslationClient, TranslationResolver } from '@pika/translation'
import type { LanguageCode, PaginatedResult } from '@pika/types'
import { VoucherState } from '@pika/types'
import { v4 as uuid } from 'uuid'

import type { IVoucherDraftRepository } from '../repositories/VoucherDraftRepository.js'
import type { VoucherDraft } from '../types/domain.js'
import { generateSecureShortCode } from '../utils/codeGenerator.js'
import type { IAdminVoucherService } from './AdminVoucherService.js'

export interface IVoucherWizardService {
  // Draft lifecycle
  initializeDraft(userId: string, businessId?: string): Promise<VoucherDraft>
  getDraft(
    draftId: string,
    userId: string,
    isAdmin?: boolean,
  ): Promise<VoucherDraft>
  getUserDrafts(
    userId: string,
    businessId?: string,
    isAdmin?: boolean,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResult<VoucherDraft>>
  deleteDraft(draftId: string, userId: string, isAdmin?: boolean): Promise<void>

  // Step management
  updateStep(
    draftId: string,
    userId: string,
    stepNumber: number,
    data: any,
  ): Promise<VoucherDraft>
  getStep(draftId: string, userId: string, stepNumber: number): Promise<any>
  validateStep(
    draftId: string,
    userId: string,
    stepNumber: number,
  ): Promise<boolean>

  // Completion
  completeDraft(
    draftId: string,
    userId: string,
    publishImmediately?: boolean,
    isAdmin?: boolean,
  ): Promise<VoucherDomain>
}

/**
 * Service for managing voucher creation wizard for business owners
 * Follows clean architecture: handles business logic only
 */
export class VoucherWizardService implements IVoucherWizardService {
  constructor(
    private readonly draftRepository: IVoucherDraftRepository,
    private readonly adminVoucherService: IAdminVoucherService,
    private readonly translationClient: TranslationClient,
    private readonly translationResolver: TranslationResolver,
    private readonly cache: ICacheService,
    private readonly businessServiceClient?: BusinessServiceClient,
  ) {}

  /**
   * Initialize a new draft for voucher creation
   */
  async initializeDraft(
    userId: string,
    businessId?: string,
  ): Promise<VoucherDraft> {
    try {
      // Business ID is required for draft creation
      if (!businessId) {
        throw ErrorFactory.businessRuleViolation(
          'Business ID is required',
          'A valid business must be selected to create a voucher draft',
        )
      }

      // Validate business exists
      if (this.businessServiceClient) {
        try {
          await this.businessServiceClient.getBusiness(businessId)
        } catch {
          throw ErrorFactory.resourceNotFound('Business', businessId)
        }
      }

      // Generate unique identifiers
      const draftId = `draft-${uuid()}`
      const sessionToken = uuid()

      // Pre-generate QR code to ensure uniqueness
      const qrCode = await this.generateUniqueQRCode()

      // Pre-generate translation keys for consistency
      const titleKey = `voucher.title.${uuid()}`
      const descriptionKey = `voucher.description.${uuid()}`
      const termsAndConditionsKey = `voucher.termsAndConditions.${uuid()}`

      // Create draft with 24 hour expiration
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

      const draft = await this.draftRepository.create({
        draftId,
        businessId,
        userId,
        sessionToken,
        expiresAt,
        qrCode,
        titleKey,
        descriptionKey,
        termsAndConditionsKey,
      })

      logger.info('Voucher draft initialized', {
        draftId: draft.draftId,
        userId,
        businessId,
      })

      return draft
    } catch (error) {
      logger.error('Failed to initialize voucher draft', {
        error,
        userId,
        businessId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get draft by ID with ownership verification
   * Note: Admins can access any draft, business owners only their own
   */
  async getDraft(
    draftId: string,
    userId: string,
    isAdmin = false,
  ): Promise<VoucherDraft> {
    try {
      const draft = await this.draftRepository.findByDraftId(draftId)

      if (!draft) {
        throw ErrorFactory.resourceNotFound('Draft', draftId)
      }

      // Verify ownership - admins can access any draft
      if (!isAdmin && draft.userId !== userId) {
        throw ErrorFactory.forbidden(
          'You do not have permission to access this draft',
        )
      }

      // Check if expired
      if (draft.expiresAt < new Date() && !draft.completedAt) {
        throw ErrorFactory.businessRuleViolation(
          'Draft has expired',
          'Please start a new voucher creation',
        )
      }

      return draft
    } catch (error) {
      logger.error('Failed to get voucher draft', { error, draftId, userId })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get all drafts for a user
   * Admins can see all drafts with pagination, users only their own
   */
  async getUserDrafts(
    userId: string,
    businessId?: string,
    isAdmin = false,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<VoucherDraft>> {
    try {
      // If admin, get all drafts with pagination; otherwise get user's drafts
      if (isAdmin && !businessId) {
        // Admin gets paginated results
        return await this.draftRepository.findAll({
          includeExpired: false,
          includeCompleted: false,
          page,
          limit,
        })
      } else {
        // Regular users get their own drafts with pagination
        const drafts = await this.draftRepository.findByUserId(userId, {
          businessId,
          includeExpired: false,
          includeCompleted: false,
          limit,
        })

        // Convert array to PaginatedResult for consistency
        return {
          data: drafts,
          pagination: {
            page: 1,
            limit: drafts.length,
            total: drafts.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        }
      }
    } catch (error) {
      logger.error('Failed to get user drafts', { error, userId, businessId })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Delete a draft with ownership verification
   */
  async deleteDraft(
    draftId: string,
    userId: string,
    isAdmin = false,
  ): Promise<void> {
    try {
      const draft = await this.getDraft(draftId, userId, isAdmin)

      // Clean up pre-created translations
      const keysToDelete: string[] = []

      if (draft.titleKey) keysToDelete.push(draft.titleKey)
      if (draft.descriptionKey) keysToDelete.push(draft.descriptionKey)
      if (draft.termsAndConditionsKey)
        keysToDelete.push(draft.termsAndConditionsKey)

      if (keysToDelete.length > 0) {
        const deleteResult =
          await this.translationClient.deleteMany(keysToDelete)

        if (deleteResult.errors.length > 0) {
          logger.warn('Some translations could not be deleted', {
            draftId,
            errors: deleteResult.errors,
            deleted: deleteResult.deleted,
          })
        }
      }
      await this.draftRepository.delete(draft.id)

      logger.info('Voucher draft deleted', { draftId, userId })
    } catch (error) {
      logger.error('Failed to delete voucher draft', { error, draftId, userId })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Update a specific step in the wizard
   */
  async updateStep(
    draftId: string,
    userId: string,
    stepNumber: number,
    data: any,
  ): Promise<VoucherDraft> {
    try {
      const draft = await this.getDraft(draftId, userId)

      // Validate step number
      if (stepNumber < 1 || stepNumber > 5) {
        throw ErrorFactory.businessRuleViolation(
          'Invalid step number',
          'Step must be between 1 and 5',
        )
      }

      // Handle step-specific logic
      if (stepNumber === 1 && data.businessId) {
        // Validate business exists
        if (this.businessServiceClient) {
          try {
            await this.businessServiceClient.getBusiness(data.businessId)
          } catch {
            throw ErrorFactory.resourceNotFound('Business', data.businessId)
          }
        }
      }

      if (stepNumber === 2) {
        // Store translations when content step is saved
        await this.storeTranslations(draft, data)
      }

      // Update the draft
      const updateData: any = {
        [`step${stepNumber}Data`]: data,
        lastValidatedAt: new Date(),
      }

      // Update current step if moving forward
      if (stepNumber > draft.currentStep) {
        updateData.currentStep = stepNumber
      }

      // Update completed steps
      const completedSteps = [...(draft.completedSteps || [])]

      if (!completedSteps.includes(stepNumber)) {
        completedSteps.push(stepNumber)
        completedSteps.sort((a, b) => a - b)
      }
      updateData.completedSteps = completedSteps

      // Check if all required steps are complete
      const requiredSteps = [1, 2, 3, 4] // Step 5 is optional

      updateData.isComplete = requiredSteps.every((step) =>
        completedSteps.includes(step),
      )

      const updatedDraft = await this.draftRepository.update(
        draft.id,
        updateData,
      )

      logger.info('Voucher draft step updated', {
        draftId,
        userId,
        stepNumber,
        isComplete: updatedDraft.isComplete,
      })

      return updatedDraft
    } catch (error) {
      logger.error('Failed to update voucher draft step', {
        error,
        draftId,
        userId,
        stepNumber,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Get step data
   */
  async getStep(
    draftId: string,
    userId: string,
    stepNumber: number,
  ): Promise<any> {
    try {
      const draft = await this.getDraft(draftId, userId)

      if (stepNumber < 1 || stepNumber > 5) {
        throw ErrorFactory.businessRuleViolation(
          'Invalid step number',
          'Step must be between 1 and 5',
        )
      }

      const stepData = (draft as any)[`step${stepNumber}Data`]

      return stepData || null
    } catch (error) {
      logger.error('Failed to get step data', { error, draftId, stepNumber })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Validate a step (checks if step data exists and is valid)
   */
  async validateStep(
    draftId: string,
    userId: string,
    stepNumber: number,
  ): Promise<boolean> {
    try {
      const draft = await this.getDraft(draftId, userId)
      const stepData = (draft as any)[`step${stepNumber}Data`]

      // Step 5 is optional
      if (stepNumber === 5) {
        return true
      }

      return !!stepData && Object.keys(stepData).length > 0
    } catch (error) {
      logger.error('Failed to validate step', { error, draftId, stepNumber })

      return false
    }
  }

  /**
   * Complete the draft and create the voucher
   */
  async completeDraft(
    draftId: string,
    userId: string,
    publishImmediately = false,
    isAdmin = false,
  ): Promise<VoucherDomain> {
    try {
      const draft = await this.getDraft(draftId, userId, isAdmin)

      // Ensure draft is complete
      if (!draft.isComplete) {
        throw ErrorFactory.businessRuleViolation(
          'Draft is not complete',
          'Please complete all required steps',
        )
      }

      // Prevent double completion
      if (draft.completedAt) {
        throw ErrorFactory.businessRuleViolation(
          'Draft already completed',
          `Voucher ID: ${draft.voucherId}`,
        )
      }

      // Extract data from steps
      const step1 = draft.step1Data as any
      const step2 = draft.step2Data as any
      const step3 = draft.step3Data as any
      const step4 = draft.step4Data as any
      const step5 = draft.step5Data as any

      // Prepare voucher creation data
      const voucherData = {
        businessId: step1.businessId,
        categoryId: step1.categoryId,
        title: step2.title,
        description: step2.description,
        termsAndConditions: step2.termsAndConditions,
        discountType: step3.discountType,
        discountValue: step3.discountValue,
        currency: step3.currency || 'PYG',
        validFrom: new Date(step4.validFrom),
        expiresAt: new Date(step4.validUntil),
        maxRedemptions: step4.maxRedemptions || null,
        maxRedemptionsPerUser: step4.maxRedemptionsPerUser || 1,
        imageUrl: step5?.imageUrl || null,
        location: step5?.location || null,
        metadata: {
          ...step5?.metadata,
          createdFromWizard: true,
          wizardDraftId: draftId,
        },
      }

      // Create the voucher using admin service
      const voucher = await this.adminVoucherService.createVoucher(voucherData)

      // Mark draft as complete
      await this.draftRepository.markAsComplete(draftId, voucher.id)

      // Publish immediately if requested
      if (publishImmediately) {
        const publishedVoucher =
          await this.adminVoucherService.updateVoucherState(
            voucher.id,
            VoucherState.PUBLISHED,
          )

        return publishedVoucher
      }

      logger.info('Voucher created from draft', {
        draftId,
        voucherId: voucher.id,
        userId,
        published: publishImmediately,
      })

      return voucher
    } catch (error) {
      logger.error('Failed to complete voucher draft', {
        error,
        draftId,
        userId,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Generate a unique QR code
   */
  private async generateUniqueQRCode(): Promise<string> {
    // Generate code with prefix
    const code = await generateSecureShortCode({
      length: 12,
      includeDash: true,
      prefix: 'VCH-',
    })

    // In production, should check uniqueness against both vouchers and drafts
    // For now, assume generated code is unique
    return code
  }

  /**
   * Store translations for step 2 (content)
   */
  private async storeTranslations(
    draft: VoucherDraft,
    data: any,
  ): Promise<void> {
    const promises: Promise<any>[] = []

    // Store title translations
    if (data.title && draft.titleKey) {
      for (const [lang, value] of Object.entries(data.title)) {
        if (value) {
          promises.push(
            this.translationClient.set(
              draft.titleKey,
              lang as LanguageCode,
              value as string,
            ),
          )
        }
      }
    }

    // Store description translations
    if (data.description && draft.descriptionKey) {
      for (const [lang, value] of Object.entries(data.description)) {
        if (value) {
          promises.push(
            this.translationClient.set(
              draft.descriptionKey,
              lang as LanguageCode,
              value as string,
            ),
          )
        }
      }
    }

    // Store terms translations
    if (data.termsAndConditions && draft.termsAndConditionsKey) {
      for (const [lang, value] of Object.entries(data.termsAndConditions)) {
        if (value) {
          promises.push(
            this.translationClient.set(
              draft.termsAndConditionsKey,
              lang as LanguageCode,
              value as string,
            ),
          )
        }
      }
    }

    await Promise.all(promises)
  }
}
