import { voucherPublic } from '@pika/api'
import {
  requireAuth,
  requirePermissions,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { BusinessServiceClient } from '@pika/shared'
import type { TranslationClient, TranslationResolver } from '@pika/translation'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { VoucherWizardController } from '../controllers/VoucherWizardController.js'
import { AdminVoucherRepository } from '../repositories/AdminVoucherRepository.js'
import { VoucherDraftRepository } from '../repositories/VoucherDraftRepository.js'
import { AdminVoucherService } from '../services/AdminVoucherService.js'
import { VoucherWizardService } from '../services/VoucherWizardService.js'

/**
 * Creates voucher wizard routes for business owners
 * These routes handle the multi-step voucher creation flow
 */
export function createVoucherWizardRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
  translationClient: TranslationClient,
  translationResolver: TranslationResolver,
  businessServiceClient?: BusinessServiceClient,
): Router {
  const router = Router()

  // Initialize repositories
  const draftRepository = new VoucherDraftRepository(prisma)
  const adminVoucherRepository = new AdminVoucherRepository(prisma, cache)

  // Initialize services
  const adminVoucherService = new AdminVoucherService(
    adminVoucherRepository,
    cache,
    translationClient,
    translationResolver,
    undefined, // fileStorage not needed for wizard
    businessServiceClient,
  )

  const wizardService = new VoucherWizardService(
    draftRepository,
    adminVoucherService,
    translationClient,
    translationResolver,
    cache,
    businessServiceClient,
  )

  const controller = new VoucherWizardController(wizardService)

  // All wizard routes require voucher write:own permissions
  // ADMIN users have admin:* which covers all permissions
  // BUSINESS users have vouchers:write:own for their own vouchers

  // POST /vouchers/wizard/drafts - Initialize new draft
  router.post(
    '/drafts',
    requireAuth(),
    requirePermissions('vouchers:write:own'),
    validateBody(voucherPublic.InitializeDraftRequest),
    controller.initializeDraft,
  )

  // GET /vouchers/wizard/drafts - Get user's drafts
  router.get(
    '/drafts',
    requireAuth(),
    requirePermissions('vouchers:write:own'),
    validateQuery(voucherPublic.GetUserDraftsQuery),
    controller.getUserDrafts,
  )

  // GET /vouchers/wizard/drafts/:draftId - Get specific draft
  router.get(
    '/drafts/:draftId',
    requireAuth(),
    requirePermissions('vouchers:write:own'),
    validateParams(voucherPublic.DraftIdParam),
    controller.getDraft,
  )

  // DELETE /vouchers/wizard/drafts/:draftId - Delete draft
  router.delete(
    '/drafts/:draftId',
    requireAuth(),
    requirePermissions('vouchers:write:own'),
    validateParams(voucherPublic.DraftIdParam),
    controller.deleteDraft,
  )

  // POST /vouchers/wizard/drafts/:draftId/save - Save draft (auto-save)
  router.post(
    '/drafts/:draftId/save',
    requireAuth(),
    requirePermissions('vouchers:write:own'),
    validateParams(voucherPublic.DraftIdParam),
    controller.saveDraft,
  )

  // POST /vouchers/wizard/drafts/:draftId/resume - Resume draft
  router.post(
    '/drafts/:draftId/resume',
    requireAuth(),
    requirePermissions('vouchers:write:own'),
    validateParams(voucherPublic.DraftIdParam),
    controller.resumeDraft,
  )

  // GET /vouchers/wizard/drafts/:draftId/steps/:stepNumber - Get step data
  router.get(
    '/drafts/:draftId/steps/:stepNumber',
    requireAuth(),
    requirePermissions('vouchers:write:own'),
    validateParams(voucherPublic.GetStepParams),
    controller.getStep,
  )

  // PUT /vouchers/wizard/drafts/:draftId/steps/:stepNumber - Update step
  router.put(
    '/drafts/:draftId/steps/:stepNumber',
    requireAuth(),
    requirePermissions('vouchers:write:own'),
    validateParams(voucherPublic.UpdateStepParams),
    validateBody(voucherPublic.UpdateStepRequest),
    controller.updateStep,
  )

  // POST /vouchers/wizard/drafts/:draftId/steps/:stepNumber/validate - Validate step
  router.post(
    '/drafts/:draftId/steps/:stepNumber/validate',
    requireAuth(),
    requirePermissions('vouchers:write:own'),
    validateParams(voucherPublic.ValidateStepParams),
    controller.validateStep,
  )

  // POST /vouchers/wizard/drafts/:draftId/complete - Complete draft and create voucher
  router.post(
    '/drafts/:draftId/complete',
    requireAuth(),
    requirePermissions('vouchers:write:own'),
    validateParams(voucherPublic.DraftIdParam),
    validateBody(voucherPublic.CompleteDraftRequest),
    controller.completeDraft,
  )

  return router
}
