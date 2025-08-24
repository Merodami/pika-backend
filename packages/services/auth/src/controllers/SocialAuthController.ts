import { authPublic } from '@pika/api'
import type { z } from 'zod'

type GetLinkedAccountsResponse = z.infer<
  typeof authPublic.GetLinkedAccountsResponse
>
type LinkAccountRequest = z.infer<typeof authPublic.LinkAccountRequest>
type LinkAccountResponse = z.infer<typeof authPublic.LinkAccountResponse>
type SocialLoginRequest = z.infer<typeof authPublic.SocialLoginRequest>
type SocialLoginResponse = z.infer<typeof authPublic.SocialLoginResponse>
type UnlinkAccountRequest = z.infer<typeof authPublic.UnlinkAccountRequest>
type UnlinkAccountResponse = z.infer<typeof authPublic.UnlinkAccountResponse>
type ExchangeTokenRequest = z.infer<typeof authPublic.ExchangeTokenRequest>
type ExchangeTokenResponse = z.infer<typeof authPublic.ExchangeTokenResponse>
import { ErrorFactory } from '@pika/shared'
import { SocialProvider } from '@pika/types'
import type { NextFunction, Request, Response } from 'express'

import { UserMapper } from '../mappers/UserMapper.js'
import type { ISocialAuthService } from '../services/SocialAuthService.js'

/**
 * Social Authentication Controller
 * Handles Firebase-based social login endpoints
 */
export class SocialAuthController {
  constructor(private readonly socialAuthService: ISocialAuthService) {
    // Bind methods to preserve 'this' context
    this.socialLogin = this.socialLogin.bind(this)
    this.linkAccount = this.linkAccount.bind(this)
    this.unlinkAccount = this.unlinkAccount.bind(this)
    this.getLinkedAccounts = this.getLinkedAccounts.bind(this)
    this.exchangeToken = this.exchangeToken.bind(this)
  }

  /**
   * Social login endpoint
   * POST /auth/social/login
   */
  async socialLogin(
    request: Request<{}, {}, SocialLoginRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { provider, idToken, accessToken, deviceInfo, marketingConsent } =
        request.body

      // Call service layer
      const result = await this.socialAuthService.socialLogin({
        provider,
        idToken,
        accessToken,
        deviceInfo,
        marketingConsent,
      })

      // Transform to DTO using mapper
      const responseData: SocialLoginResponse = {
        user: UserMapper.toAuthDTO(result.user) as any,
        accessToken: result.accessToken as any,
        refreshToken: result.refreshToken as any,
        tokenType: 'Bearer',
        expiresIn: 7200, // 2 hours
        isNewUser: result.isNewUser,
        linkedAccounts: result.linkedAccounts,
      }

      response.json(responseData)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Link social account endpoint
   * POST /auth/social/link
   * Requires authentication
   */
  async linkAccount(
    request: Request<{}, {}, LinkAccountRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!request.user) {
        throw ErrorFactory.unauthorized('Authentication required')
      }

      const { provider, idToken, replace } = request.body
      const userId = request.user.id

      // Call service layer
      const result = await this.socialAuthService.linkAccount({
        userId,
        provider,
        idToken,
        replace,
      })

      // Transform to DTO
      const responseData: LinkAccountResponse = {
        success: result.success,
        message: result.message,
        linkedAccounts: result.linkedAccounts,
      }

      response.json(responseData)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Unlink social account endpoint
   * POST /auth/social/unlink
   * Requires authentication
   */
  async unlinkAccount(
    request: Request<{}, {}, UnlinkAccountRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!request.user) {
        throw ErrorFactory.unauthorized('Authentication required')
      }

      const { provider } = request.body
      const userId = request.user.id

      // Call service layer
      const result = await this.socialAuthService.unlinkAccount({
        userId,
        provider,
      })

      // Transform to DTO
      const responseData: UnlinkAccountResponse = {
        success: result.success,
        message: result.message,
        linkedAccounts: result.linkedAccounts,
      }

      response.json(responseData)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get linked accounts endpoint
   * GET /auth/social/accounts
   * Requires authentication
   */
  async getLinkedAccounts(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!request.user) {
        throw ErrorFactory.unauthorized('Authentication required')
      }

      const userId = request.user.id

      // Call service layer
      const result = await this.socialAuthService.getLinkedAccounts(userId)

      // Transform to DTO
      const responseData: GetLinkedAccountsResponse = {
        linkedAccounts: result.linkedAccounts.map((account) => ({
          provider: account.provider as SocialProvider,
          email: account.email as any,
          displayName: account.displayName,
          photoUrl: account.photoUrl,
          linkedAt: account.linkedAt.toISOString(),
        })),
      }

      response.json(responseData)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Exchange authorization code for tokens
   * POST /auth/exchange-token
   * Public endpoint for OAuth authorization code flow
   */
  async exchangeToken(
    request: Request<{}, {}, ExchangeTokenRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { code, provider, redirectUri, state } = request.body

      // Call service to exchange code for tokens
      const result = await this.socialAuthService.exchangeToken({
        code,
        provider,
        redirectUri,
        state,
      })

      // Transform to DTO using mapper
      const responseData: ExchangeTokenResponse = {
        user: UserMapper.toAuthDTO(result.user) as any,
        accessToken: result.accessToken as any,
        refreshToken: result.refreshToken as any,
        tokenType: 'Bearer',
        expiresIn: 7200, // 2 hours
        isNewUser: result.isNewUser,
        linkedAccounts: result.linkedAccounts,
      }

      response.json(responseData)
    } catch (error) {
      next(error)
    }
  }
}
