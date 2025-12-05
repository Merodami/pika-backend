import type { IBusinessSettingsService } from '@business/services/BusinessSettingsService.js'
import { businessBusiness } from '@pika/api'
import { RequestContext, validateResponse } from '@pika/http'
import { BusinessSettingsMapper } from '@pika/sdk'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles business settings operations for business owners
 * Business owners can manage their own settings
 */
export class BusinessSettingsController {
  constructor(
    private readonly businessSettingsService: IBusinessSettingsService,
  ) {
    // Bind methods to preserve 'this' context
    this.getMyBusinessSettings = this.getMyBusinessSettings.bind(this)
    this.updateMyBusinessSettings = this.updateMyBusinessSettings.bind(this)
    this.resetMyBusinessSettings = this.resetMyBusinessSettings.bind(this)
  }

  /**
   * GET /businesses/:business_id/settings
   * Get business settings for the authenticated business owner
   */
  async getMyBusinessSettings(
    req: Request<businessBusiness.BusinessSettingsPathParams>,
    res: Response<businessBusiness.BusinessSettingsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const { id: businessId } = req.params

      // Get settings (service will verify ownership)
      const settings = await this.businessSettingsService.getSettings(
        businessId,
        userId,
      )

      // Transform to DTO
      const response = {
        settings: BusinessSettingsMapper.toDTO(settings),
      }

      // Validate response
      const validatedResponse = validateResponse(
        businessBusiness.BusinessSettingsResponse,
        response,
        'BusinessSettingsController.getMyBusinessSettings',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /businesses/:business_id/settings
   * Update business settings for the authenticated business owner
   */
  async updateMyBusinessSettings(
    req: Request<
      businessBusiness.BusinessSettingsPathParams,
      {},
      businessBusiness.UpdateBusinessSettingsRequest
    >,
    res: Response<businessBusiness.BusinessSettingsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const { id: businessId } = req.params
      const updates = req.body

      // Update settings (service will verify ownership and validate)
      const updatedSettings = await this.businessSettingsService.updateSettings(
        businessId,
        userId,
        updates,
      )

      // Transform to DTO
      const response = {
        settings: BusinessSettingsMapper.toDTO(updatedSettings),
      }

      // Validate response
      const validatedResponse = validateResponse(
        businessBusiness.BusinessSettingsResponse,
        response,
        'BusinessSettingsController.updateMyBusinessSettings',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /businesses/:business_id/settings/reset
   * Reset business settings to defaults for the authenticated business owner
   */
  async resetMyBusinessSettings(
    req: Request<
      businessBusiness.BusinessSettingsPathParams,
      {},
      businessBusiness.ResetBusinessSettingsRequest
    >,
    res: Response<businessBusiness.BusinessSettingsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const { id: businessId } = req.params
      const { sections } = req.body

      // Reset settings (service will verify ownership and validate sections)
      const resetSettings = await this.businessSettingsService.resetSettings(
        businessId,
        userId,
        sections,
      )

      // Transform to DTO
      const response = {
        settings: BusinessSettingsMapper.toDTO(resetSettings),
      }

      // Validate response
      const validatedResponse = validateResponse(
        businessBusiness.BusinessSettingsResponse,
        response,
        'BusinessSettingsController.resetMyBusinessSettings',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
