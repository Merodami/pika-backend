import { voucherPublic } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { VoucherMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

import type { IVoucherWizardService } from '../services/VoucherWizardService.js'

/**
 * Handles voucher wizard operations for business owners
 * Provides multi-step voucher creation flow
 */
export class VoucherWizardController {
  constructor(private readonly wizardService: IVoucherWizardService) {
    // Bind methods to preserve 'this' context
    this.initializeDraft = this.initializeDraft.bind(this)
    this.getDraft = this.getDraft.bind(this)
    this.getUserDrafts = this.getUserDrafts.bind(this)
    this.deleteDraft = this.deleteDraft.bind(this)
    this.updateStep = this.updateStep.bind(this)
    this.getStep = this.getStep.bind(this)
    this.validateStep = this.validateStep.bind(this)
    this.completeDraft = this.completeDraft.bind(this)
    this.saveDraft = this.saveDraft.bind(this)
    this.resumeDraft = this.resumeDraft.bind(this)
  }

  /**
   * POST /vouchers/wizard/drafts
   * Initialize a new voucher draft
   */
  async initializeDraft(
    req: Request<{}, {}, voucherPublic.InitializeDraftRequestType>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User authentication required')
      }

      const body =
        getValidatedBody<voucherPublic.InitializeDraftRequestType>(req)

      const draft = await this.wizardService.initializeDraft(
        userId,
        body.businessId,
      )

      const response = {
        draftId: draft.draftId,
        sessionToken: draft.sessionToken,
        businessId: draft.businessId,
        currentStep: draft.currentStep,
        expiresAt: draft.expiresAt.toISOString(),
        qrCode: draft.qrCode,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
      }

      const validatedResponse = validateResponse(
        voucherPublic.InitializeDraftResponse,
        response,
        'VoucherWizardController.initializeDraft',
      )

      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /vouchers/wizard/drafts/:draftId
   * Get a specific draft by ID
   */
  async getDraft(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User authentication required')
      }

      const params = getValidatedParams<voucherPublic.DraftIdParam>(req)
      const { draftId } = params

      // Check if user is admin
      const isAdmin = RequestContext.isAdmin(context)

      const draft = await this.wizardService.getDraft(draftId, userId, isAdmin)

      const response = {
        draftId: draft.draftId,
        businessId: draft.businessId,
        userId: draft.userId,
        currentStep: draft.currentStep,
        completedSteps: draft.completedSteps,
        isComplete: draft.isComplete,
        step1Data: draft.step1Data,
        step2Data: draft.step2Data,
        step3Data: draft.step3Data,
        step4Data: draft.step4Data,
        step5Data: draft.step5Data,
        qrCode: draft.qrCode,
        titleKey: draft.titleKey,
        descriptionKey: draft.descriptionKey,
        termsAndConditionsKey: draft.termsAndConditionsKey,
        validationErrors: draft.validationErrors,
        lastValidatedAt: draft.lastValidatedAt?.toISOString() || null,
        sessionToken: draft.sessionToken,
        expiresAt: draft.expiresAt.toISOString(),
        completedAt: draft.completedAt?.toISOString() || null,
        voucherId: draft.voucherId,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
      }

      const validatedResponse = validateResponse(
        voucherPublic.GetDraftResponse,
        response,
        'VoucherWizardController.getDraft',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /vouchers/wizard/drafts
   * Get all drafts for the authenticated user (paginated)
   */
  async getUserDrafts(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User authentication required')
      }

      const query = getValidatedQuery<voucherPublic.GetUserDraftsQuery>(req)
      const { businessId, page, limit } = query

      // Check if user is admin
      const isAdmin = RequestContext.isAdmin(context)

      const result = await this.wizardService.getUserDrafts(
        userId,
        businessId,
        isAdmin,
        page || 1,
        limit || PAGINATION_DEFAULT_LIMIT,
      )

      // Transform drafts to response format
      const transformDraft = (draft: any) => ({
        draftId: draft.draftId,
        businessId: draft.businessId,
        currentStep: draft.currentStep,
        completedSteps: draft.completedSteps,
        isComplete: draft.isComplete,
        createdAt: draft.createdAt.toISOString(),
        expiresAt: draft.expiresAt.toISOString(),
      })

      // Use paginatedResponse utility for consistent pagination
      const response = paginatedResponse(result, transformDraft)

      const validatedResponse = validateResponse(
        voucherPublic.GetUserDraftsResponse,
        response,
        'VoucherWizardController.getUserDrafts',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /vouchers/wizard/drafts/:draftId
   * Delete a draft
   */
  async deleteDraft(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User authentication required')
      }

      const params = getValidatedParams<voucherPublic.DraftIdParam>(req)
      const { draftId } = params

      // Check if user is admin
      const isAdmin = RequestContext.isAdmin(context)

      await this.wizardService.deleteDraft(draftId, userId, isAdmin)

      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /vouchers/wizard/drafts/:draftId/steps/:stepNumber
   * Update a specific step in the wizard
   */
  async updateStep(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User authentication required')
      }

      // Get validated params - Zod will coerce stepNumber to number
      const params = getValidatedParams<voucherPublic.UpdateStepParams>(req)
      const { draftId, stepNumber } = params
      const stepData = getValidatedBody<voucherPublic.UpdateStepRequest>(req)

      // The data is already validated by Zod middleware based on the route
      const updatedDraft = await this.wizardService.updateStep(
        draftId,
        userId,
        stepNumber,
        stepData,
      )

      const response: voucherPublic.UpdateStepResponse = {
        success: true,
        currentStep: updatedDraft.currentStep,
        nextStep:
          updatedDraft.currentStep < 5 ? updatedDraft.currentStep + 1 : null,
        completedSteps: updatedDraft.completedSteps,
        validationErrors: undefined,
      }

      const validatedResponse = validateResponse(
        voucherPublic.UpdateStepResponse,
        response,
        'VoucherWizardController.updateStep',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /vouchers/wizard/drafts/:draftId/steps/:stepNumber
   * Get data for a specific step
   */
  async getStep(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User authentication required')
      }

      // Get validated params - Zod will coerce stepNumber to number
      const params = getValidatedParams<voucherPublic.GetStepParams>(req)
      const { draftId, stepNumber } = params

      const stepData = await this.wizardService.getStep(
        draftId,
        userId,
        stepNumber,
      )

      const response = {
        stepNumber,
        data: stepData,
      }

      const validatedResponse = validateResponse(
        voucherPublic.GetStepResponse,
        response,
        'VoucherWizardController.getStep',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /vouchers/wizard/drafts/:draftId/steps/:stepNumber/validate
   * Validate a specific step
   */
  async validateStep(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User authentication required')
      }

      // Get validated params - Zod will coerce stepNumber to number
      const params = getValidatedParams<voucherPublic.ValidateStepParams>(req)
      const { draftId, stepNumber } = params

      const isValid = await this.wizardService.validateStep(
        draftId,
        userId,
        stepNumber,
      )

      const response: voucherPublic.ValidateStepResponse = {
        valid: isValid,
        stepNumber,
        errors: [], // No errors if valid
        warnings: undefined,
        canProceed: isValid,
      }

      const validatedResponse = validateResponse(
        voucherPublic.ValidateStepResponse,
        response,
        'VoucherWizardController.validateStep',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /vouchers/wizard/drafts/:draftId/complete
   * Complete the draft and create the voucher
   */
  async completeDraft(
    req: Request<
      voucherPublic.DraftIdParam,
      {},
      voucherPublic.CompleteDraftRequest
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User authentication required')
      }

      const params = getValidatedParams<voucherPublic.DraftIdParam>(req)
      const body = getValidatedBody<voucherPublic.CompleteDraftRequest>(req)
      const { draftId } = params
      const { publishImmediately } = body

      // Check if user is admin
      const isAdmin = RequestContext.isAdmin(context)

      const voucher = await this.wizardService.completeDraft(
        draftId,
        userId,
        publishImmediately,
        isAdmin,
      )

      const voucherDto = VoucherMapper.toDTO(voucher)

      const response = {
        success: true,
        voucherId: voucher.id,
        voucher: voucherDto,
        publishStatus: publishImmediately
          ? ('published' as const)
          : ('draft' as const),
      }

      const validatedResponse = validateResponse(
        voucherPublic.CompleteDraftResponse,
        response,
        'VoucherWizardController.completeDraft',
      )

      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /vouchers/wizard/drafts/:draftId/save
   * Save current draft state (for auto-save functionality)
   */
  async saveDraft(
    req: Request<voucherPublic.DraftIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User authentication required')
      }

      const params = getValidatedParams<voucherPublic.DraftIdParam>(req)
      const { draftId } = params

      // Get the draft to verify ownership and return current state
      const draft = await this.wizardService.getDraft(draftId, userId)

      const response = {
        draftId: draft.draftId,
        savedAt: new Date().toISOString(),
        message: 'Draft saved successfully',
      }

      const validatedResponse = validateResponse(
        voucherPublic.SaveDraftResponse,
        response,
        'VoucherWizardController.saveDraft',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /vouchers/wizard/drafts/:draftId/resume
   * Resume a draft from where user left off
   */
  async resumeDraft(
    req: Request<voucherPublic.DraftIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User authentication required')
      }

      const params = getValidatedParams<voucherPublic.DraftIdParam>(req)
      const { draftId } = params

      const draft = await this.wizardService.getDraft(draftId, userId)

      // Determine next incomplete step
      const requiredSteps = [1, 2, 3, 4]

      let nextStep = draft.currentStep

      for (const step of requiredSteps) {
        if (!draft.completedSteps.includes(step)) {
          nextStep = step
          break
        }
      }

      const response = {
        draftId: draft.draftId,
        currentStep: draft.currentStep,
        nextStep,
        completedSteps: draft.completedSteps,
        isComplete: draft.isComplete,
        sessionToken: draft.sessionToken,
      }

      const validatedResponse = validateResponse(
        voucherPublic.ResumeDraftResponse,
        response,
        'VoucherWizardController.resumeDraft',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
