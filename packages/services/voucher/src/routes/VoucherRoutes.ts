import { businessCommon, shared, voucherCommon, voucherPublic } from '@pika/api'
import {
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import {
  BusinessServiceClient,
  CommunicationServiceClient,
  FileStoragePort,
  UserServiceClient,
} from '@pika/shared'
import type { TranslationClient, TranslationResolver } from '@pika/translation'
import type { PrismaClient } from '@prisma/client'
import { Router } from 'express'

import { VoucherController } from '../controllers/VoucherController.js'
import { InternalVoucherRepository } from '../repositories/InternalVoucherRepository.js'
import { VoucherRepository } from '../repositories/VoucherRepository.js'
import { InternalVoucherService } from '../services/InternalVoucherService.js'
import { VoucherService } from '../services/VoucherService.js'

/**
 * Creates public voucher routes
 */
export async function createVoucherRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
  translationClient: TranslationClient,
  translationResolver: TranslationResolver,
  fileStorage: FileStoragePort,
  communicationClient?: CommunicationServiceClient,
  userServiceClient?: UserServiceClient,
  businessServiceClient?: BusinessServiceClient,
): Promise<Router> {
  const router = Router()

  // Initialize dependencies
  const repository = new VoucherRepository(prisma, cache)
  const internalRepository = new InternalVoucherRepository(prisma, cache)
  const internalService = new InternalVoucherService(
    internalRepository,
    repository, // InternalService needs public repository for some operations
    cache,
  )
  const service = new VoucherService(
    repository,
    cache,
    translationClient,
    translationResolver,
    internalService, // Now passing the internal service
    communicationClient,
    userServiceClient,
    businessServiceClient,
  )
  const controller = new VoucherController(service)

  // Public routes (JWT auth required - available to all authenticated users)
  // GET /vouchers - List all published vouchers
  router.get(
    '/',
    requireAuth(),
    validateQuery(voucherPublic.VoucherQueryParams),
    controller.getAllVouchers,
  )

  // GET /vouchers/:id - Get voucher by ID
  router.get(
    '/:id',
    requireAuth(),
    validateParams(voucherCommon.VoucherIdParam),
    validateQuery(voucherPublic.GetVoucherByIdQuery),
    controller.getVoucherById,
  )

  // GET /vouchers/business/:id - Get business vouchers
  router.get(
    '/business/:id',
    requireAuth(),
    validateParams(businessCommon.BusinessIdParam),
    validateQuery(voucherPublic.VoucherQueryParams),
    controller.getBusinessVouchers,
  )

  // POST /vouchers/:id/scan - Track voucher scan
  router.post(
    '/:id/scan',
    requireAuth(),
    validateParams(voucherCommon.VoucherIdParam),
    validateBody(voucherPublic.VoucherScanRequest),
    controller.scanVoucher,
  )

  // POST /vouchers/:id/claim - Claim voucher to wallet
  router.post(
    '/:id/claim',
    requireAuth(),
    validateParams(voucherCommon.VoucherIdParam),
    validateBody(voucherPublic.VoucherClaimRequest),
    controller.claimVoucher,
  )

  // POST /vouchers/:id/redeem - Redeem voucher
  router.post(
    '/:id/redeem',
    validateParams(voucherCommon.VoucherIdParam),
    validateBody(voucherPublic.VoucherRedeemRequest),
    controller.redeemVoucher,
  )

  // GET /vouchers/user/:id - Get user's vouchers
  router.get(
    '/user/:id',
    requireAuth(),
    validateParams(shared.UserIdParam),
    validateQuery(voucherPublic.UserVouchersQueryParams),
    controller.getUserVouchers,
  )

  // GET /vouchers/by-code/:code - Get voucher by any code type
  router.get(
    '/by-code/:code',
    validateParams(voucherCommon.VoucherCodeParam),
    validateQuery(voucherPublic.GetVoucherByIdQuery),
    controller.getVoucherByCode,
  )

  return router
}
