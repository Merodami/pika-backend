import { businessPublic } from '@pika/api'
import { RequestContext, validateResponse } from '@pika/http'
import type { NextFunction, Request, Response } from 'express'

import { BusinessRegistrationMapper } from '../mappers/BusinessRegistrationMapper.js'
import type { IBusinessRegistrationService } from '../services/BusinessRegistrationService.js'

/**
 * Handles business registration flow
 */
export class BusinessRegistrationController {
  constructor(private readonly service: IBusinessRegistrationService) {
    // Bind methods to preserve 'this' context
    this.getRegistrationStatus = this.getRegistrationStatus.bind(this)
    this.startRegistration = this.startRegistration.bind(this)
    this.getProgress = this.getProgress.bind(this)
    this.submitStep1 = this.submitStep1.bind(this)
    this.submitStep2 = this.submitStep2.bind(this)
    this.submitStep3 = this.submitStep3.bind(this)
    this.completeRegistration = this.completeRegistration.bind(this)
  }

  /**
   * POST /businesses/registration/start
   * Start the registration process for a business user
   */
  async startRegistration(
    req: Request,
    res: Response<businessPublic.StartRegistrationResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      const result = await this.service.startRegistration(userId)

      const validatedResponse = validateResponse(
        businessPublic.StartRegistrationResponse,
        result,
        'BusinessRegistrationController.startRegistration',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /businesses/registration/progress
   * Get detailed registration progress with all step data
   */
  async getProgress(
    req: Request,
    res: Response<businessPublic.RegistrationProgressResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      const progress = await this.service.getProgress(userId)
      const response = BusinessRegistrationMapper.toDTO(progress)

      const validatedResponse = validateResponse(
        businessPublic.RegistrationProgressResponse,
        response,
        'BusinessRegistrationController.getProgress',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /businesses/registration/status
   * Get current registration status for authenticated user
   */
  // Note: @Cache cannot be used on controller methods that call res.json()
  // The caching should be done at the service layer instead
  async getRegistrationStatus(
    req: Request,
    res: Response<businessPublic.BusinessRegistrationStatusResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      const status = await this.service.checkRegistrationStatus(userId)
      const response = status

      const validatedResponse = validateResponse(
        businessPublic.BusinessRegistrationStatusResponse,
        response,
        'BusinessRegistrationController.getRegistrationStatus',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /businesses/registration/step1
   * Submit step 1 data
   */
  async submitStep1(
    req: Request<{}, {}, businessPublic.BusinessRegistrationStep1Request>,
    res: Response<businessPublic.RegistrationProgressResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const data = req.body

      // Start registration if needed
      await this.service.startRegistration(userId)

      // Save step 1 data
      const result = await this.service.saveStep(userId, {
        stepNumber: 1,
        stepData: data,
        saveAsDraft: false,
      })

      // Get the full registration for response
      const progress = await this.service.getProgress(userId)
      const response = progress

      const validatedResponse = validateResponse(
        businessPublic.RegistrationProgressResponse,
        response,
        'BusinessRegistrationController.submitStep1',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /businesses/registration/step2
   * Submit step 2 data
   */
  async submitStep2(
    req: Request<{}, {}, businessPublic.BusinessRegistrationStep2Request>,
    res: Response<businessPublic.RegistrationProgressResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const data = req.body

      // Save step 2 data
      const result = await this.service.saveStep(userId, {
        stepNumber: 2,
        stepData: data,
        saveAsDraft: false,
      })

      // Get the full registration for response
      const progress = await this.service.getProgress(userId)
      const response = progress

      const validatedResponse = validateResponse(
        businessPublic.RegistrationProgressResponse,
        response,
        'BusinessRegistrationController.submitStep2',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /businesses/registration/step3
   * Submit step 3 data (does NOT complete registration)
   */
  async submitStep3(
    req: Request<{}, {}, businessPublic.BusinessRegistrationStep3Request>,
    res: Response<businessPublic.RegistrationProgressResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const data = req.body

      // Save step 3 data
      await this.service.saveStep(userId, {
        stepNumber: 3,
        stepData: data,
        saveAsDraft: false,
      })

      // Get the updated registration progress
      const progress = await this.service.getProgress(userId)
      const response = BusinessRegistrationMapper.toDTO(progress)

      const validatedResponse = validateResponse(
        businessPublic.RegistrationProgressResponse,
        response,
        'BusinessRegistrationController.submitStep3',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /businesses/registration/complete
   * Complete the registration process with user consent
   */
  async completeRegistration(
    req: Request<{}, {}, businessPublic.CompleteBusinessRegistrationRequest>,
    res: Response<businessPublic.CompleteBusinessRegistrationResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId
      const data = req.body

      // Complete registration with explicit user consent
      const completion = await this.service.completeRegistration(userId, data)

      const validatedResponse = validateResponse(
        businessPublic.CompleteBusinessRegistrationResponse,
        completion,
        'BusinessRegistrationController.completeRegistration',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
