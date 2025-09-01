/**
 * VoucherValidationController
 *
 * Handles URL-based QR code validation and deep link generation.
 * This controller is separated from the main VoucherController to isolate
 * the new validation/deep-linking architecture.
 */

import { voucherCommon, voucherPublic } from '@pika/api'
import {
  getRequestLanguage,
  getValidatedQuery,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { VoucherMapper } from '@pika/sdk'
import { BaseError, ErrorFactory } from '@pika/shared'
import { VoucherScanSource } from '@pika/types'
import type { NextFunction, Request, Response } from 'express'

import type { VoucherDeepLinkService } from '../services/VoucherDeepLinkService.js'
import type { IVoucherService } from '../services/VoucherService.js'
import type { IVoucherValidationService } from '../services/VoucherValidationService.js'

export class VoucherValidationController {
  constructor(
    private readonly voucherService: IVoucherService,
    private readonly validationService: IVoucherValidationService,
    private readonly deepLinkService: VoucherDeepLinkService,
  ) {
    // Bind methods to preserve context
    this.validateVoucher = this.validateVoucher.bind(this)
    this.generateDeepLink = this.generateDeepLink.bind(this)
    this.getVoucherByCode = this.getVoucherByCode.bind(this)
  }

  /**
   * POST /vouchers/:id/validate
   * Validate a voucher with URL-based code
   * SECURITY NOTE: No authentication required - validation code serves as auth
   */
  async validateVoucher(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherPublic.VoucherValidateRequest
    >,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      console.log('VoucherValidationController.validateVoucher called')

      if (!this.validationService) {
        throw ErrorFactory.serviceUnavailable(
          'Validation service not available',
        )
      }

      const { id: voucherId } = req.params
      const validateData = req.body

      // Validation doesn't require authentication - context is optional
      let userId: string | undefined

      try {
        const context = RequestContext.getContext(req)

        userId = context?.userId
      } catch {
        // No authentication context - that's fine for validation
        userId = undefined
      }

      console.log('Validation context:', { voucherId, userId })

      const result = await this.validationService.validateCode({
        voucherId,
        code: validateData.code,
        userId,
        location: validateData.location,
        deviceInfo: validateData.deviceInfo,
        source: validateData.source,
      })

      const responseData: voucherPublic.VoucherValidateResponse = {
        valid: result.valid,
        canRedeem: result.canRedeem,
        message: result.message,
        expiresAt: result.expiresAt?.toISOString(),
        remainingUses: result.remainingUses,
      }

      // Include voucher details if valid
      if (result.valid && result.voucher) {
        responseData.voucher = VoucherMapper.toDTO(result.voucher)
      }

      const validatedResponse = validateResponse(
        voucherPublic.VoucherValidateResponseSchema,
        responseData,
        'VoucherValidationController.validateVoucher',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /vouchers/:id/deep-link
   * Generate a deep link for voucher QR code
   * Requires authentication to prevent abuse
   */
  async generateDeepLink(
    req: Request<voucherCommon.VoucherIdParam, {}, {}>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!this.validationService || !this.deepLinkService) {
        throw ErrorFactory.serviceUnavailable(
          'Deep link services not available',
        )
      }

      const { id: voucherId } = req.params
      const { type, mode, ttl, campaign, includeOfflineData } =
        getValidatedQuery<voucherPublic.GenerateDeepLinkRequest>(req)

      // Validate voucher exists first - this will throw if not found
      try {
        await this.voucherService.getVoucherById(voucherId)
      } catch (error: any) {
        // If voucher not found, throw 404
        if (error instanceof BaseError && error.getHttpStatus() === 404) {
          throw error
        }
        // For any other error, also throw 404 since we need a valid voucher
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      // Get the default TTL based on validation code type
      const DEFAULT_TTL: Record<string, number> = {
        scan: 300, // 5 minutes for QR scanning
        print: 31536000, // 1 year for printed voucher books
        digital: 86400, // 24 hours for digital sharing
      }

      const effectiveTtl = ttl || DEFAULT_TTL[type as string] || 300

      // Generate validation code first
      const validationCode =
        await this.validationService.generateValidationCode({
          voucherId,
          type: type as any, // Type conversion handled in service
          ttl: effectiveTtl,
          campaign,
        })

      // Generate deep link with validation code
      const deepLinkResult = await this.deepLinkService.generateVoucherDeepLink(
        {
          voucherId,
          validationCode,
          campaign,
          mode: mode as any,
          ttl: effectiveTtl,
          includeOfflineData,
          source: VoucherScanSource.QR,
        },
      )

      const responseData: voucherPublic.GenerateDeepLinkResponse = {
        deepLink: deepLinkResult.deepLink,
        universalLink: deepLinkResult.universalLink,
        qrPayload: deepLinkResult.qrPayload,
        validationCode,
        expiresAt: new Date(Date.now() + effectiveTtl * 1000).toISOString(),
        metadata: {
          source: deepLinkResult.metadata.source as any,
          campaign: deepLinkResult.metadata.campaign,
          businessId: deepLinkResult.metadata.businessId,
          mode: deepLinkResult.metadata.mode as any,
          generatedAt: deepLinkResult.metadata.generatedAt.toISOString(),
        },
      }

      const validatedResponse = validateResponse(
        voucherPublic.GenerateDeepLinkResponseSchema,
        responseData,
        'VoucherValidationController.generateDeepLink',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /vouchers/by-code/:code
   * Get voucher by any code type (validation, QR, short, static)
   * SECURITY NOTE: No authentication required - enables QR code scanning
   */
  async getVoucherByCode(
    req: Request<voucherCommon.VoucherCodeParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { code } = req.params
      const query = getValidatedQuery<voucherPublic.GetVoucherByIdQuery>(req)
      const language = getRequestLanguage(req)

      // First check if it's a validation code
      const validationCode =
        await this.validationService.getValidationCodeInfo(code)

      if (validationCode) {
        // Check if validation code is still valid
        if (new Date() > validationCode.expiresAt || validationCode.usedAt) {
          throw ErrorFactory.resourceNotFound(
            'Voucher',
            `Invalid or expired validation code: ${code}`,
          )
        }

        // Get the voucher associated with this validation code
        let voucher

        try {
          voucher = await this.voucherService.getVoucherById(
            validationCode.voucherId,
            query.include,
            language,
          )
        } catch (error: any) {
          // If voucher not found, throw 404 with expired code message
          if (
            error.statusCode === 404 ||
            error.message?.includes('not found')
          ) {
            throw ErrorFactory.resourceNotFound(
              'Voucher',
              `Invalid or expired validation code: ${code}`,
            )
          }
          throw error
        }

        // Transform and validate single entity response
        const responseData = VoucherMapper.toDTO(voucher)
        const validatedResponse = validateResponse(
          voucherPublic.VoucherResponse,
          responseData,
          'VoucherValidationController.getVoucherByCode',
        )

        res.json(validatedResponse)
      } else {
        // Fall back to other code types (short, static, QR)
        const voucher = await this.voucherService.getVoucherByAnyCode(
          code,
          language,
        )

        if (!voucher) {
          throw ErrorFactory.resourceNotFound(
            'Voucher',
            `No voucher found for code: ${code}`,
          )
        }

        // Apply includes if needed
        let voucherWithIncludes = voucher

        if (query.include) {
          voucherWithIncludes = await this.voucherService.getVoucherById(
            voucher.id,
            query.include,
            language,
          )
        }

        // Transform and validate single entity response
        const responseData = VoucherMapper.toDTO(voucherWithIncludes)
        const validatedResponse = validateResponse(
          voucherPublic.VoucherResponse,
          responseData,
          'VoucherValidationController.getVoucherByCode',
        )

        res.json(validatedResponse)
      }
    } catch (error) {
      next(error)
    }
  }
}
