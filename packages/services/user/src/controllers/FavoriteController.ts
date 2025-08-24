import { mapSortOrder, shared, userPublic } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { getValidatedQuery, RequestContext, validateResponse } from '@pika/http'
import { FavoriteMapper } from '@pika/sdk'
import { parseIncludeParam } from '@pika/shared'
import type { IFavoriteService } from '@user/services/FavoriteService.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles favorite operations for businesses and vouchers
 * All routes are user-scoped (operate on current authenticated user)
 * Designed to be easily extractable into its own microservice
 */
export class FavoriteController {
  constructor(private readonly favoriteService: IFavoriteService) {
    // Bind methods to preserve 'this' context
    // Business favorites
    this.addFavoriteBusiness = this.addFavoriteBusiness.bind(this)
    this.removeFavoriteBusiness = this.removeFavoriteBusiness.bind(this)
    this.getFavoriteBusinesses = this.getFavoriteBusinesses.bind(this)
    this.checkFavoriteBusiness = this.checkFavoriteBusiness.bind(this)
    this.batchFavoriteBusinesses = this.batchFavoriteBusinesses.bind(this)

    // Voucher favorites
    this.addFavoriteVoucher = this.addFavoriteVoucher.bind(this)
    this.removeFavoriteVoucher = this.removeFavoriteVoucher.bind(this)
    this.getFavoriteVouchers = this.getFavoriteVouchers.bind(this)
    this.checkFavoriteVoucher = this.checkFavoriteVoucher.bind(this)
    this.batchFavoriteVouchers = this.batchFavoriteVouchers.bind(this)
  }

  // =============== Business Favorites ===============

  /**
   * POST /users/me/favorites/businesses/:businessId
   * Add a business to current user's favorites
   */
  async addFavoriteBusiness(
    req: Request<shared.BusinessIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const { id: businessId } = req.params

      const favorite = await this.favoriteService.addFavoriteBusiness(
        userId,
        businessId,
      )

      // Transform to DTO
      const response = FavoriteMapper.toAddFavoriteBusinessResponse(favorite)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        userPublic.AddFavoriteBusinessResponseSchema,
        response,
        'FavoriteController.addFavoriteBusiness',
      )

      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /users/me/favorites/businesses/:businessId
   * Remove a business from current user's favorites
   */
  async removeFavoriteBusiness(
    req: Request<shared.BusinessIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const { id: businessId } = req.params

      await this.favoriteService.removeFavoriteBusiness(userId, businessId)

      const response = FavoriteMapper.toRemoveFavoriteResponse()
      const validatedResponse = validateResponse(
        userPublic.RemoveFavoriteResponseSchema,
        response,
        'FavoriteController.removeFavoriteBusiness',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /users/me/favorites/businesses
   * Get current user's favorite businesses with pagination
   */
  async getFavoriteBusinesses(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const query =
        getValidatedQuery<userPublic.GetFavoriteBusinessesQuery>(req)

      // Parse includes properly
      const parsedIncludes = query.include
        ? parseIncludeParam(query.include, [
            'business',
            'category',
            'businessDetails',
          ])
        : {}

      // Map API query to service params
      const params = {
        page: query.page || 1,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: mapSortOrder(query.sortOrder),
        includeDetails: Boolean(parsedIncludes.business),
      }

      const result = await this.favoriteService.getFavoriteBusinesses(
        userId,
        params,
      )

      // Use FavoriteMapper to properly transform favorites with business details
      const mappedResult = {
        data: result.data.map((favorite) =>
          FavoriteMapper.toFavoriteBusinessItem(favorite),
        ),
        pagination: result.pagination,
      }

      const validatedResponse = validateResponse(
        userPublic.GetFavoriteBusinessesResponseSchema,
        mappedResult,
        'FavoriteController.getFavoriteBusinesses',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /users/me/favorites/businesses/:businessId/status
   * Check if a business is favorited by current user
   */
  async checkFavoriteBusiness(
    req: Request<shared.BusinessIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const { id: businessId } = req.params

      const status = await this.favoriteService.checkFavoriteBusiness(
        userId,
        businessId,
      )

      // Transform to DTO
      const response = FavoriteMapper.toFavoriteStatusResponse(status)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        userPublic.FavoriteStatusResponseSchema,
        response,
        'FavoriteController.checkFavoriteBusiness',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /users/me/favorites/businesses/batch
   * Batch add/remove businesses from favorites
   */
  async batchFavoriteBusinesses(
    req: Request<{}, {}, userPublic.BatchFavoriteBusinessesRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      const result = await this.favoriteService.batchFavoriteBusinesses(
        userId,
        req.body,
      )

      // Transform to DTO
      const response = FavoriteMapper.toBatchFavoriteOperationResponse(result)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        userPublic.BatchFavoriteOperationResponseSchema,
        response,
        'FavoriteController.batchFavoriteBusinesses',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  // =============== Voucher Favorites ===============

  /**
   * POST /users/me/favorites/vouchers/:voucherId
   * Add a voucher to current user's favorites
   */
  async addFavoriteVoucher(
    req: Request<shared.VoucherIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const { id: voucherId } = req.params

      const favorite = await this.favoriteService.addFavoriteVoucher(
        userId,
        voucherId,
      )

      // Transform to DTO
      const response = FavoriteMapper.toAddFavoriteVoucherResponse(favorite)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        userPublic.AddFavoriteVoucherResponseSchema,
        response,
        'FavoriteController.addFavoriteVoucher',
      )

      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /users/me/favorites/vouchers/:voucherId
   * Remove a voucher from current user's favorites
   */
  async removeFavoriteVoucher(
    req: Request<shared.VoucherIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const { id: voucherId } = req.params

      await this.favoriteService.removeFavoriteVoucher(userId, voucherId)

      const response = FavoriteMapper.toRemoveFavoriteResponse()
      const validatedResponse = validateResponse(
        userPublic.RemoveFavoriteResponseSchema,
        response,
        'FavoriteController.removeFavoriteVoucher',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /users/me/favorites/vouchers
   * Get current user's favorite vouchers with pagination
   */
  async getFavoriteVouchers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const query = getValidatedQuery<userPublic.GetFavoriteVouchersQuery>(req)

      // Parse includes properly
      const parsedIncludes = query.include
        ? parseIncludeParam(query.include, ['voucher', 'business', 'category'])
        : {}

      // Map API query to service params
      const params = {
        page: query.page || 1,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: mapSortOrder(query.sortOrder),
        includeDetails: Boolean(parsedIncludes.voucher),
      }

      const result = await this.favoriteService.getFavoriteVouchers(
        userId,
        params,
      )

      // Use FavoriteMapper to properly transform favorites with voucher details
      const mappedResult = {
        data: result.data.map((favorite) =>
          FavoriteMapper.toFavoriteVoucherItem(favorite),
        ),
        pagination: result.pagination,
      }

      const validatedResponse = validateResponse(
        userPublic.GetFavoriteVouchersResponseSchema,
        mappedResult,
        'FavoriteController.getFavoriteVouchers',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /users/me/favorites/vouchers/:voucherId/status
   * Check if a voucher is favorited by current user
   */
  async checkFavoriteVoucher(
    req: Request<shared.VoucherIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const { id: voucherId } = req.params

      const status = await this.favoriteService.checkFavoriteVoucher(
        userId,
        voucherId,
      )

      // Transform to DTO
      const response = FavoriteMapper.toFavoriteStatusResponse(status)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        userPublic.FavoriteStatusResponseSchema,
        response,
        'FavoriteController.checkFavoriteVoucher',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /users/me/favorites/vouchers/batch
   * Batch add/remove vouchers from favorites
   */
  async batchFavoriteVouchers(
    req: Request<{}, {}, userPublic.BatchFavoriteVouchersRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      const result = await this.favoriteService.batchFavoriteVouchers(
        userId,
        req.body,
      )

      // Transform to DTO
      const response = FavoriteMapper.toBatchFavoriteOperationResponse(result)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        userPublic.BatchFavoriteOperationResponseSchema,
        response,
        'FavoriteController.batchFavoriteVouchers',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
