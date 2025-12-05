/**
 * VoucherValidationRoutes
 *
 * Routes for URL-based voucher validation and deep link generation.
 * Separated from main voucher routes for better organization.
 */

import { voucherCommon, voucherPublic } from '@pika/api'
import {
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type {
  BusinessServiceClient,
  CommunicationServiceClient,
  UserServiceClient,
} from '@pika/shared'
import type { TranslationClient, TranslationResolver } from '@pika/translation'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { VoucherValidationController } from '../controllers/VoucherValidationController.js'
import { InternalVoucherRepository } from '../repositories/InternalVoucherRepository.js'
import { VoucherRepository } from '../repositories/VoucherRepository.js'
import { VoucherValidationRepository } from '../repositories/VoucherValidationRepository.js'
import { InternalVoucherService } from '../services/InternalVoucherService.js'
import { VoucherDeepLinkService } from '../services/VoucherDeepLinkService.js'
import { VoucherDeepLinkValidationService } from '../services/VoucherDeepLinkValidationService.js'
import { VoucherService } from '../services/VoucherService.js'

/**
 * Creates voucher validation routes
 */
export async function createVoucherValidationRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
  translationClient: TranslationClient,
  translationResolver: TranslationResolver,
  communicationClient?: CommunicationServiceClient,
  userServiceClient?: UserServiceClient,
  businessServiceClient?: BusinessServiceClient,
): Promise<Router> {
  const router = Router()

  // Initialize repositories
  const voucherRepository = new VoucherRepository(prisma, cache)
  const validationRepository = new VoucherValidationRepository(prisma, cache)
  const internalRepository = new InternalVoucherRepository(prisma, cache)

  // Initialize validation service first (needed by InternalVoucherService)
  const validationService = new VoucherDeepLinkValidationService(
    validationRepository,
    voucherRepository,
    cache,
  )

  // Initialize services
  const internalService = new InternalVoucherService(
    internalRepository,
    voucherRepository,
    cache,
    validationService,
  )

  const voucherService = new VoucherService(
    voucherRepository,
    cache,
    translationClient,
    translationResolver,
    internalService,
    communicationClient,
    userServiceClient,
    businessServiceClient,
  )

  const deepLinkService = new VoucherDeepLinkService()

  // Initialize controller
  const controller = new VoucherValidationController(
    voucherService,
    validationService,
    deepLinkService,
  )

  // ========== Validation Routes ==========

  // POST /vouchers/:id/validate - Validate voucher with URL-based code
  // SECURITY NOTE: No authentication required - validation code serves as auth
  // Used by mobile apps to validate QR codes from voucher books
  router.post(
    '/:id/validate',
    validateParams(voucherCommon.VoucherIdParam),
    validateBody(voucherPublic.VoucherValidateRequest),
    controller.validateVoucher,
  )

  // GET /vouchers/:id/deep-link - Generate deep link for QR code
  // Requires authentication to prevent abuse
  // Used to generate QR codes for vouchers (digital or print)
  router.get(
    '/:id/deep-link',
    requireAuth(),
    validateParams(voucherCommon.VoucherIdParam),
    validateQuery(voucherPublic.GenerateDeepLinkRequest),
    controller.generateDeepLink,
  )

  // GET /vouchers/by-code/:code - Get voucher by any code type
  // SECURITY NOTE: No authentication required - enables QR code scanning
  // Supports validation codes, short codes, static codes, legacy QR codes
  router.get(
    '/by-code/:code',
    validateParams(voucherCommon.VoucherCodeParam),
    validateQuery(voucherPublic.GetVoucherByIdQuery),
    controller.getVoucherByCode,
  )

  return router
}
