import { shared, userPublic } from '@pika/api'
import {
  requireAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import { FavoriteController } from '@user/controllers/FavoriteController.js'
import { UserFavoriteRepository } from '@user/repositories/UserFavoriteRepository.js'
import { FavoriteService } from '@user/services/FavoriteService.js'
import { Router } from 'express'

/**
 * Creates favorite routes for businesses and vouchers
 * All routes are user-scoped (operate on current authenticated user)
 * Designed to be easily extractable into its own microservice
 */
export function createFavoriteRoutes(
  prisma: PrismaClient,
  cache: ICacheService,
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new UserFavoriteRepository(prisma)
  const service = new FavoriteService(repository, cache)
  const controller = new FavoriteController(service)

  // =============== Business Favorites ===============

  // GET /users/me/favorites/businesses - Get favorite businesses
  router.get(
    '/businesses',
    requireAuth(),
    validateQuery(userPublic.GetFavoriteBusinessesQuery),
    controller.getFavoriteBusinesses,
  )

  // POST /users/me/favorites/businesses/batch - Batch add/remove businesses
  router.post(
    '/businesses/batch',
    requireAuth(),
    validateBody(userPublic.BatchFavoriteBusinessesRequest),
    controller.batchFavoriteBusinesses,
  )

  // POST /users/me/favorites/businesses/:id - Add business to favorites
  router.post(
    '/businesses/:id',
    requireAuth(),
    validateParams(shared.BusinessIdParam),
    controller.addFavoriteBusiness,
  )

  // GET /users/me/favorites/businesses/:id/status - Check if business is favorited
  router.get(
    '/businesses/:id/status',
    requireAuth(),
    validateParams(shared.BusinessIdParam),
    controller.checkFavoriteBusiness,
  )

  // DELETE /users/me/favorites/businesses/:id - Remove business from favorites
  router.delete(
    '/businesses/:id',
    requireAuth(),
    validateParams(shared.BusinessIdParam),
    controller.removeFavoriteBusiness,
  )

  // =============== Voucher Favorites ===============

  // GET /users/me/favorites/vouchers - Get favorite vouchers
  router.get(
    '/vouchers',
    requireAuth(),
    validateQuery(userPublic.GetFavoriteVouchersQuery),
    controller.getFavoriteVouchers,
  )

  // POST /users/me/favorites/vouchers/batch - Batch add/remove vouchers
  router.post(
    '/vouchers/batch',
    requireAuth(),
    validateBody(userPublic.BatchFavoriteVouchersRequest),
    controller.batchFavoriteVouchers,
  )

  // POST /users/me/favorites/vouchers/:id - Add voucher to favorites
  router.post(
    '/vouchers/:id',
    requireAuth(),
    validateParams(shared.VoucherIdParam),
    controller.addFavoriteVoucher,
  )

  // GET /users/me/favorites/vouchers/:id/status - Check if voucher is favorited
  router.get(
    '/vouchers/:id/status',
    requireAuth(),
    validateParams(shared.VoucherIdParam),
    controller.checkFavoriteVoucher,
  )

  // DELETE /users/me/favorites/vouchers/:id - Remove voucher from favorites
  router.delete(
    '/vouchers/:id',
    requireAuth(),
    validateParams(shared.VoucherIdParam),
    controller.removeFavoriteVoucher,
  )

  return router
}
