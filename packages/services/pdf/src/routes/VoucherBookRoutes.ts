import { Router } from 'express'
import { validateQuery, validateParams } from '@pika/http'
import { pdfCommon, pdfPublic } from '@pika/api'

import type { VoucherBookController } from '../controllers/VoucherBookController.js'

/**
 * Creates public voucher book routes (read-only)
 */
export function createVoucherBookRoutes(
  voucherBookController: VoucherBookController,
): Router {
  const router = Router()

  // GET /voucher-books - List published voucher books with pagination and filtering
  router.get(
    '/',
    validateQuery(pdfPublic.VoucherBookQueryParams),
    voucherBookController.getAllVoucherBooks,
  )

  // GET /voucher-books/:id - Get published voucher book by ID
  router.get(
    '/:id',
    validateParams(pdfCommon.VoucherBookIdParam),
    voucherBookController.getVoucherBookById,
  )

  // GET /voucher-books/:id/download - Download PDF for published voucher book
  router.get(
    '/:id/download',
    validateParams(pdfCommon.VoucherBookIdParam),
    voucherBookController.downloadPDF,
  )

  return router
}
