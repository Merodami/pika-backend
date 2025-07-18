import type { PrismaClient } from '@prisma/client'
import { voucherPublic, voucherCommon, shared } from '@pika/api'
import {
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { FileStoragePort, CommunicationServiceClient } from '@pika/shared'
import type { TranslationClient } from '@pika/translation'
import { Router } from 'express'

import { VoucherController } from '../controllers/VoucherController.js'
import { VoucherRepository } from '../repositories/VoucherRepository.js'
import { VoucherService } from '../services/VoucherService.js'

/**
 * Creates public voucher routes
 */
export async function createVoucherRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
  translationClient: TranslationClient,
  fileStorage: FileStoragePort,
  communicationClient?: CommunicationServiceClient,
): Promise<Router> {
  const router = Router()

  // Initialize dependencies
  const repository = new VoucherRepository(prisma, cache)
  const service = new VoucherService(
    repository,
    cache,
    translationClient,
    fileStorage,
    undefined,
    communicationClient,
  )
  const controller = new VoucherController(service)

  // Public routes (no auth required)
  // GET /vouchers - List all published vouchers
  router.get(
    '/',
    validateQuery(voucherPublic.VoucherQueryParams),
    controller.getAllVouchers,
  )

  // GET /vouchers/:id - Get voucher by ID
  router.get(
    '/:id',
    validateParams(voucherCommon.VoucherIdParam),
    validateQuery(voucherPublic.GetVoucherByIdQuery),
    controller.getVoucherById,
  )

  // GET /vouchers/business/:id - Get business vouchers
  router.get(
    '/business/:id',
    validateParams(shared.BusinessIdParam),
    validateQuery(voucherPublic.VoucherQueryParams),
    controller.getBusinessVouchers,
  )

  // Authentication required routes
  // POST /vouchers/:id/scan - Track voucher scan
  router.post(
    '/:id/scan',
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
