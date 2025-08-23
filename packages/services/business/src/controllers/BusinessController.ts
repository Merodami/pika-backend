import type { IBusinessService } from '@business/services/BusinessService.js'
import { businessPublic, mapSortOrder, shared } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import {
  getRequestLanguage,
  getValidatedQuery,
  paginatedResponse,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { BusinessMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles public business operations
 * Public routes for viewing businesses and business owner routes
 */
export class BusinessController {
  constructor(private readonly businessService: IBusinessService) {
    // Bind methods to preserve 'this' context
    this.getAllBusinesses = this.getAllBusinesses.bind(this)
    this.getBusinessById = this.getBusinessById.bind(this)
    this.getBusinessByUserId = this.getBusinessByUserId.bind(this)
    this.getMyBusinesses = this.getMyBusinesses.bind(this)
    this.createMyBusiness = this.createMyBusiness.bind(this)
    this.updateMyBusiness = this.updateMyBusiness.bind(this)
  }

  /**
   * GET /businesses
   * Get all businesses with filters and pagination (public)
   */
  async getAllBusinesses(
    req: Request,
    res: Response<businessPublic.BusinessListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<businessPublic.BusinessQueryParams>(req)
      const language = getRequestLanguage(req)

      // Map API query to service params - only show active businesses to public
      const params = {
        categoryId: query.categoryId,
        verified: query.verified,
        active: true, // Always filter by active for public routes
        minRating: query.minRating,
        search: query.search,
        page: query.page,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: mapSortOrder(query.sortOrder),
      }

      const result = await this.businessService.getAllBusinesses(
        params,
        language,
      )

      // Use paginatedResponse utility + validation
      const response = paginatedResponse(result, BusinessMapper.toDTO)
      const validatedResponse = validateResponse(
        businessPublic.BusinessListResponse,
        response,
        'BusinessController.getAllBusinesses',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /businesses/:business_id
   * Get business by ID (public)
   */
  async getBusinessById(
    req: Request<businessPublic.BusinessPathParams>,
    res: Response<businessPublic.BusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const query =
        getValidatedQuery<businessPublic.BusinessDetailQueryParams>(req)
      const language = getRequestLanguage(req)

      // Parse include parameter
      const includeRelations = query.include?.split(',') || []
      const business = await this.businessService.getBusinessById(
        businessId,
        {
          user: includeRelations.includes('user'),
          category: includeRelations.includes('category'),
          businessDetails: includeRelations.includes('businessDetails'),
        },
        language,
      )

      // Check if business is active for public access
      if (!business.active) {
        throw ErrorFactory.resourceNotFound('Business', businessId)
      }

      // Transform to DTO
      const response = BusinessMapper.toDTO(business)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        businessPublic.BusinessResponse,
        response,
        'BusinessController.getBusinessById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /businesses/user/:user_id
   * Get business by user ID (public)
   */
  async getBusinessByUserId(
    req: Request<shared.UserIdParam>,
    res: Response<businessPublic.BusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const query =
        getValidatedQuery<businessPublic.BusinessDetailQueryParams>(req)
      const language = getRequestLanguage(req)

      // Parse include parameter
      const includeRelations = query.include?.split(',') || []
      const business = await this.businessService.getBusinessByUserId(
        userId,
        {
          user: includeRelations.includes('user'),
          category: includeRelations.includes('category'),
          businessDetails: includeRelations.includes('businessDetails'),
        },
        language,
      )

      // Check if business is active for public access
      if (!business.active) {
        throw ErrorFactory.resourceNotFound('Business', `user:${userId}`)
      }

      // Transform to DTO
      const response = BusinessMapper.toDTO(business)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        businessPublic.BusinessResponse,
        response,
        'BusinessController.getBusinessByUserId',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /businesses/me
   * Get all businesses for current authenticated user (business owner)
   * Returns paginated list of user's businesses
   */
  async getMyBusinesses(
    req: Request,
    res: Response<businessPublic.BusinessListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const query = getValidatedQuery<businessPublic.BusinessQueryParams>(req)
      const language = getRequestLanguage(req)

      // Build search params with userId filter
      // For business owners, show all their businesses (active and inactive)
      // unless they specifically filter by active status
      const params = {
        userId, // Filter by current user
        categoryId: query.categoryId,
        verified: query.verified,
        active: query.active, // undefined = show all, true/false = filter
        minRating: query.minRating,
        search: query.search,
        page: query.page || 1,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: mapSortOrder(query.sortOrder),
      }

      const result = await this.businessService.getAllBusinesses(
        params,
        language,
      )

      // Use paginatedResponse utility + validation
      const response = paginatedResponse(result, BusinessMapper.toDTO)
      const validatedResponse = validateResponse(
        businessPublic.BusinessListResponse,
        response,
        'BusinessController.getMyBusinesses',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /businesses/me
   * Create business for current authenticated user (business owner)
   */
  async createMyBusiness(
    req: Request<{}, {}, businessPublic.CreateMyBusinessRequest>,
    res: Response<businessPublic.BusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const authenticatedUserId = context.userId
      const language = getRequestLanguage(req)

      const data = {
        ...req.body,
        userId: authenticatedUserId,
      }

      const business = await this.businessService.createBusiness(data, language)

      // Transform to DTO
      const response = BusinessMapper.toDTO(business)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        businessPublic.BusinessResponse,
        response,
        'BusinessController.createMyBusiness',
      )

      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /businesses/me
   * Update current authenticated user's business (business owner)
   */
  async updateMyBusiness(
    req: Request<{}, {}, businessPublic.UpdateMyBusinessRequest>,
    res: Response<businessPublic.BusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const language = getRequestLanguage(req)

      // Get user's business first
      const existingBusiness = await this.businessService.getBusinessByUserId(
        userId,
        undefined,
        language,
      )

      const business = await this.businessService.updateBusiness(
        existingBusiness.id,
        req.body,
      )

      // Transform to DTO
      const response = BusinessMapper.toDTO(business)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        businessPublic.BusinessResponse,
        response,
        'BusinessController.updateMyBusiness',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
