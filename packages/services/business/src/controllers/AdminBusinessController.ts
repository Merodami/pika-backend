import type { IBusinessRegistrationService } from '@business/services/BusinessRegistrationService.js'
import type { IBusinessService } from '@business/services/BusinessService.js'
import {
  businessAdmin,
  businessCommon,
  businessPublic,
  mapSortOrder,
  userAdmin,
} from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { BusinessRegistrationStatus } from '@pika/types'
import {
  getValidatedQuery,
  paginatedResponse,
  validateResponse,
} from '@pika/http'
import { RequestContext } from '@pika/http'
import { BusinessMapper } from '@pika/sdk'
import { logger, parseIncludeParam } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles admin business management operations
 */
export class AdminBusinessController {
  constructor(
    private readonly businessService: IBusinessService,
    private readonly registrationService?: IBusinessRegistrationService,
  ) {
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
    this.approveBusiness = this.approveBusiness.bind(this)
    this.resetBusinessRegistration = this.resetBusinessRegistration.bind(this)
  }

  /**
   * GET /admin/businesses
   * Get all businesses with admin filters and pagination
   */
  async getAllBusinesses(
    req: Request,
    res: Response<businessAdmin.AdminBusinessListResponse>,
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
        parsedIncludes: parseIncludeParam(query.include, [
          'user',
          'category',
          'businessRegistration',
        ]),
      }

      const result = await this.businessService.getAllBusinesses(params)

      // Use paginatedResponse utility + validation
      const response = paginatedResponse(result, BusinessMapper.toDTO)
      const validatedResponse = validateResponse(
        businessAdmin.AdminBusinessListResponse,
        response,
        'AdminBusinessController.getAllBusinesses',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/businesses/:business_id
   * Get business by ID with full details for admin
   */
  async getBusinessById(
    req: Request<businessPublic.BusinessPathParams>,
    res: Response<businessAdmin.AdminBusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const query =
        getValidatedQuery<businessAdmin.AdminBusinessQueryParams>(req)

      const includes = parseIncludeParam(query.include, ['user', 'category'])

      const business = await this.businessService.getBusinessById(
        businessId,
        includes,
      )

      // Transform to DTO
      const response = BusinessMapper.toDTO(business)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        businessAdmin.AdminBusinessResponse,
        response,
        'AdminBusinessController.getBusinessById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/businesses
   * Create new business (admin)
   */
  async createBusiness(
    req: Request<{}, {}, businessAdmin.AdminCreateBusinessRequest>,
    res: Response<businessAdmin.AdminBusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.body

      const business = await this.businessService.createBusiness({
        userId: data.userId,
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        categoryId: data.categoryId,
        verified: data.verified,
        active: data.active,
      })

      // Transform to DTO
      const response = BusinessMapper.toDTO(business)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        businessAdmin.AdminBusinessResponse,
        response,
        'AdminBusinessController.createBusiness',
      )

      res.status(201).json(validatedResponse)
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
      businessAdmin.AdminUpdateBusinessRequest
    >,
    res: Response<businessAdmin.AdminBusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const data = req.body

      const business = await this.businessService.updateBusiness(
        businessId,
        data,
      )

      // Transform to DTO
      const response = BusinessMapper.toDTO(business)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        businessAdmin.AdminBusinessResponse,
        response,
        'AdminBusinessController.updateBusiness',
      )

      res.json(validatedResponse)
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
    res: Response<void>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params

      await this.businessService.deleteBusiness(businessId)

      // No content response - no validation needed
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /admin/businesses/:business_id/verification
   * Update business verification status (admin)
   */
  async verifyBusiness(
    req: Request<
      businessPublic.BusinessPathParams,
      {},
      businessAdmin.AdminPatchBusinessVerificationRequest
    >,
    res: Response<businessAdmin.AdminBusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const { verified } = req.body

      const updatedBusiness = await this.businessService.updateBusiness(
        businessId,
        {
          verified,
        },
      )

      // Return the updated business data
      res.status(200).json(BusinessMapper.toAdminDTO(updatedBusiness))
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
    res: Response<void>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params

      await this.businessService.deactivateBusiness(businessId)

      // No content response
      res.status(204).send()
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
    res: Response<void>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params

      await this.businessService.updateBusiness(businessId, {
        active: true,
      })

      // No content response
      res.status(204).send()
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
      businessAdmin.AdminUpdateBusinessRatingRequest
    >,
    res: Response<businessAdmin.AdminBusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const { rating } = req.body

      const business = await this.businessService.updateBusinessRating(
        businessId,
        rating,
      )

      // Transform to DTO
      const response = BusinessMapper.toDTO(business)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        businessAdmin.AdminBusinessResponse,
        response,
        'AdminBusinessController.updateBusinessRating',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/businesses/:business_id/approve
   * Approve or reject a business (admin only)
   */
  async approveBusiness(
    req: Request<
      businessPublic.BusinessPathParams,
      {},
      businessAdmin.AdminBusinessApprovalRequest
    >,
    res: Response<businessAdmin.AdminBusinessApprovalResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const { approved, reason } = req.body

      // Get admin user ID from request context
      const context = RequestContext.getContext(req)
      const adminUserId = context.userId

      // Log the approval action
      logger.info({
        msg: 'Business approval action',
        businessId,
        approved,
        adminUserId,
        reason,
        timestamp: new Date().toISOString(),
      })

      // Update business approval status
      const business = await this.businessService.approveBusiness(
        businessId,
        approved,
        adminUserId,
        reason,
      )

      // Also update the registration status if there's a linked registration
      if (this.registrationService) {
        try {
          const registration =
            await this.registrationService.updateRegistrationStatusByBusinessId(
              businessId,
              approved
                ? BusinessRegistrationStatus.APPROVED
                : BusinessRegistrationStatus.REJECTED,
              reason,
            )

          if (registration) {
            logger.info({
              msg: 'Updated registration status after business approval',
              businessId,
              registrationId: registration.registrationId,
              newStatus: approved
                ? BusinessRegistrationStatus.APPROVED
                : BusinessRegistrationStatus.REJECTED,
            })
          }
        } catch (error) {
          // Log but don't fail if registration update fails
          logger.warn({
            msg: 'Could not update registration status after business approval',
            businessId,
            error,
          })
        }
      }

      // Transform to admin DTO using mapper
      const response = BusinessMapper.toAdminDTO(business)

      // Validate response
      const validatedResponse = validateResponse(
        businessAdmin.AdminBusinessApprovalResponse,
        response,
        'AdminBusinessController.approveBusiness',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/businesses/registrations/:registration_id/reset
   * Reset a business registration to allow user to restart
   */
  async resetBusinessRegistration(
    req: Request<
      userAdmin.UserIdParam,
      {},
      businessAdmin.AdminResetBusinessRegistrationRequest
    >,
    res: Response<businessAdmin.AdminResetBusinessRegistrationResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!this.registrationService) {
        throw new Error('Registration service not configured')
      }

      const { id: userId } = req.params
      const { reason, notifyUser } = req.body

      // Get admin user ID from request context
      const context = RequestContext.getContext(req)
      const adminUserId = context.userId

      // Log the reset action
      logger.info({
        msg: 'Business registration reset action',
        userId,
        reason,
        notifyUser,
        adminUserId,
      })

      // Reset the registration
      const result = await this.registrationService.resetRegistration(
        userId,
        reason,
      )

      // TODO: If notifyUser is true, send notification to user
      if (notifyUser) {
        logger.info({
          msg: 'Would notify user about registration reset',
          userId: result.userId,
          reason,
        })
      }

      // Create response matching the schema
      const response: businessAdmin.AdminResetBusinessRegistrationResponse = {
        success: result.success,
        message: result.message,
        registrationId: result.registrationId,
        userId: result.userId as any, // userId comes as string from service
      }

      // Validate response
      const validatedResponse = validateResponse(
        businessAdmin.AdminResetBusinessRegistrationResponse,
        response,
        'AdminBusinessController.resetBusinessRegistration',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
