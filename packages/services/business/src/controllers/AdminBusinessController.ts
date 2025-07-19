import {
  mapSortOrder,
  businessAdmin,
  businessPublic,
  businessCommon,
  shared,
} from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import { getValidatedQuery } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { BusinessMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

import type { IBusinessService } from '../services/BusinessService.js'

/**
 * Handles admin business management operations
 */
export class AdminBusinessController {
  constructor(private readonly businessService: IBusinessService) {
    // Bind methods to preserve 'this' context
    this.getAllBusinesses = this.getAllBusinesses.bind(this)
    this.getBusinessById = this.getBusinessById.bind(this)
    this.createBusiness = this.createBusiness.bind(this)
    this.updateBusiness = this.updateBusiness.bind(this)
    this.deleteBusiness = this.deleteBusiness.bind(this)
    this.verifyBusiness = this.verifyBusiness.bind(this)
    this.deactivateBusiness = this.deactivateBusiness.bind(this)
    this.activateBusiness = this.activateBusiness.bind(this)
    this.updateBusinessRating = this.updateBusinessRating.bind(this)
  }

  /**
   * GET /admin/businesses
   * Get all businesses with admin filters and pagination
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:businesses',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllBusinesses(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query =
        getValidatedQuery<businessAdmin.AdminBusinessQueryParams>(req)

      // Map API query to service params - admins can see all businesses
      const params = {
        userId: query.userId,
        categoryId: query.categoryId,
        verified: query.verified,
        active: query.active,
        minRating: query.minRating,
        maxRating: query.maxRating,
        search: query.search,
        page: query.page,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: mapSortOrder(query.sortOrder),
        includeDeleted: query.includeDeleted,
        parsedIncludes: {
          user: query.includeUser,
          category: query.includeCategory,
        },
        // Additional admin filters
        createdFrom: query.createdFrom,
        createdTo: query.createdTo,
        updatedFrom: query.updatedFrom,
        updatedTo: query.updatedTo,
      }

      const result = await this.businessService.getAllBusinesses(params)

      // Convert to DTOs
      res.json({
        data: result.data.map((business) => BusinessMapper.toDTO(business)),
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/businesses/:business_id
   * Get business by ID with full details for admin
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:business',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getBusinessById(
    req: Request<businessPublic.BusinessPathParams>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const query =
        getValidatedQuery<businessAdmin.AdminBusinessQueryParams>(req)

      const business = await this.businessService.getBusinessById(businessId, {
        user: query.includeUser,
        category: query.includeCategory,
      })

      res.json(BusinessMapper.toDTO(business))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/businesses
   * Create new business (admin)
   */
  async createBusiness(
    req: Request<{}, {}, businessAdmin.CreateBusinessRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.body

      const business = await this.businessService.createBusiness({
        userId: data.userId,
        businessName: data.businessNameKey, // Service expects businessName, not businessNameKey
        businessDescription: data.businessDescriptionKey,
        categoryId: data.categoryId,
        verified: data.verified,
        active: data.active,
      })

      const dto = BusinessMapper.toDTO(business)

      res.status(201).json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /admin/businesses/:business_id
   * Update business (admin)
   */
  async updateBusiness(
    req: Request<
      businessPublic.BusinessPathParams,
      {},
      businessAdmin.UpdateBusinessRequest
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const data = req.body

      const business = await this.businessService.updateBusiness(
        businessId,
        data,
      )

      res.json(BusinessMapper.toDTO(business))
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/businesses/:business_id
   * Delete business (admin)
   */
  async deleteBusiness(
    req: Request<businessPublic.BusinessPathParams>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params

      await this.businessService.deleteBusiness(businessId)

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/businesses/:business_id/verify
   * Verify a business (admin)
   */
  async verifyBusiness(
    req: Request<
      businessPublic.BusinessPathParams,
      {},
      businessAdmin.ToggleBusinessVerificationRequest
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params

      const business = await this.businessService.verifyBusiness(businessId)

      res.json(BusinessMapper.toDTO(business))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/businesses/:business_id/deactivate
   * Deactivate a business (admin)
   */
  async deactivateBusiness(
    req: Request<businessPublic.BusinessPathParams>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params

      const business = await this.businessService.deactivateBusiness(businessId)

      res.json(BusinessMapper.toDTO(business))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/businesses/:business_id/activate
   * Activate a business (admin)
   */
  async activateBusiness(
    req: Request<businessPublic.BusinessPathParams>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params

      const business = await this.businessService.updateBusiness(businessId, {
        active: true,
      })

      res.json(BusinessMapper.toDTO(business))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/businesses/:business_id/rating
   * Update business rating (admin)
   */
  async updateBusinessRating(
    req: Request<
      businessPublic.BusinessPathParams,
      {},
      businessAdmin.UpdateBusinessRatingRequest
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const { rating } = req.body

      const business = await this.businessService.updateBusinessRating(
        businessId,
        rating,
      )

      res.json(BusinessMapper.toDTO(business))
    } catch (error) {
      next(error)
    }
  }

}
