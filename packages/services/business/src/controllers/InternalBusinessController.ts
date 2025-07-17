import type {
  BusinessIdParam,
  GetBusinessRequest,
  GetBusinessesByIdsRequest,
  GetBusinessesByCategoryRequest,
  UserIdParam,
} from '@pika/api/internal'
import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { BusinessMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

import type { IBusinessService } from '../services/BusinessService.js'

/**
 * Handles internal business operations for service-to-service communication
 */
export class InternalBusinessController {
  constructor(private readonly businessService: IBusinessService) {
    // Bind methods to preserve 'this' context
    this.getBusinessById = this.getBusinessById.bind(this)
    this.getBusinessByUserId = this.getBusinessByUserId.bind(this)
    this.getBusinessesByIds = this.getBusinessesByIds.bind(this)
    this.getBusinessesByCategory = this.getBusinessesByCategory.bind(this)
  }

  /**
   * GET /internal/businesses/:business_id
   * Get business by ID for internal services
   */
  async getBusinessById(
    req: Request<BusinessIdParam, {}, {}, GetBusinessRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const { includeUser, includeCategory } = req.query

      const business = await this.businessService.getBusinessById(businessId, {
        user: includeUser,
        category: includeCategory,
      })

      res.json(BusinessMapper.toDTO(business))
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/businesses/user/:user_id
   * Get business by user ID for internal services
   */
  async getBusinessByUserId(
    req: Request<UserIdParam, {}, {}, GetBusinessRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const { includeUser, includeCategory } = req.query

      const business = await this.businessService.getBusinessByUserId(userId, {
        user: includeUser,
        category: includeCategory,
      })

      res.json(BusinessMapper.toDTO(business))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/businesses/batch
   * Get multiple businesses by IDs
   */
  async getBusinessesByIds(
    req: Request<{}, {}, GetBusinessesByIdsRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { businessIds, includeUser, includeCategory } = req.body

      const businesses = await Promise.all(
        businessIds.map((id) =>
          this.businessService.getBusinessById(id, {
            user: includeUser,
            category: includeCategory,
          }).catch(() => null)
        )
      )

      // Filter out null values (businesses that don't exist)
      const validBusinesses = businesses.filter((b) => b !== null)

      res.json({
        businesses: validBusinesses.map((business) => BusinessMapper.toDTO(business!))
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/businesses/category/:category_id
   * Get businesses by category for internal services
   */
  async getBusinessesByCategory(
    req: Request<{ categoryId: string }, {}, {}, GetBusinessesByCategoryRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { categoryId } = req.params
      const { limit = PAGINATION_DEFAULT_LIMIT, includeUser, includeCategory } = req.query

      const result = await this.businessService.getAllBusinesses({
        categoryId,
        active: true,
        verified: true,
        limit,
        parsedIncludes: {
          user: includeUser,
          category: includeCategory,
        },
      })

      res.json({
        businesses: result.data.map((business) => BusinessMapper.toDTO(business))
      })
    } catch (error) {
      next(error)
    }
  }
}