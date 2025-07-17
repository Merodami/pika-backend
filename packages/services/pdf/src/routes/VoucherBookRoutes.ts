import { Router } from 'express'
import { validateQuery, validateParams } from '@pika/http'
import type {
  VoucherBookQueryParams,
} from '@pika/api/public'
import { VoucherBookIdParam } from '@pika/api/pdf'

import type { VoucherBookController } from '../controllers/VoucherBookController.js'

/**
 * Creates public voucher book routes (read-only)
 */
export function createVoucherBookRoutes(voucherBookController: VoucherBookController): Router {
  const router = Router()

  // GET /voucher-books - List published voucher books with pagination and filtering
  router.get(
    '/',
    validateQuery(VoucherBookQueryParams),
    voucherBookController.getAllVoucherBooks
  )

  // GET /voucher-books/:id - Get published voucher book by ID
  router.get(
    '/:id',
    validateParams(VoucherBookIdParam),
    voucherBookController.getVoucherBookById
  )

  // GET /voucher-books/:id/download - Download PDF for published voucher book
  router.get(
    '/:id/download',
    validateParams(VoucherBookIdParam),
    voucherBookController.downloadPDF
  )

  return router
}