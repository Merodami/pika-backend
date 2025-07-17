import { logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

import {
  FirebaseAuthService,
  FirebaseUserClaims,
} from '../../infrastructure/firebase/FirebaseAuthService.js'
import { DeviceInfo } from '../strategies/AuthenticationStrategy.js'
import {
  AuthStrategyFactory,
  AuthStrategyFactoryImpl,
} from '../strategies/AuthStrategyFactory.js'
import { JwtTokenService } from './JwtTokenService.js'

export interface TokenExchangeRequest {
  firebaseIdToken: string
  deviceInfo: DeviceInfo
  provider?: string // Optional, will be extracted from token if not provided
}

export interface TokenExchangeResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    isNewUser: boolean
    requiresAdditionalInfo: boolean
    requiresMfa: boolean
  }
}

export interface TokenExchangeResult {
  success: boolean
  data?: TokenExchangeResponse
  error?: string
  statusCode?: number
}

export class TokenExchangeService {
  private static instance: TokenExchangeService
  private firebaseAuth: FirebaseAuthService
  private authStrategyFactory: AuthStrategyFactory
  private jwtTokenService: JwtTokenService

  constructor(prisma: PrismaClient) {
    this.firebaseAuth = FirebaseAuthService.getInstance()
    this.authStrategyFactory = new AuthStrategyFactoryImpl(prisma)
    this.jwtTokenService = new JwtTokenService()
  }

  static getInstance(prisma: PrismaClient): TokenExchangeService {
    if (!TokenExchangeService.instance) {
      TokenExchangeService.instance = new TokenExchangeService(prisma)
    }

    return TokenExchangeService.instance
  }

  async exchangeFirebaseToken(
    request: TokenExchangeRequest,
  ): Promise<TokenExchangeResult> {
    try {
      logger.info('Starting Firebase token exchange', {
        provider: request.provider,
        deviceType: request.deviceInfo.deviceType,
      })

      // 1. Verify Firebase ID token
      const tokenVerificationResult = await this.firebaseAuth.verifyIdToken(
        request.firebaseIdToken,
      )

      if (!tokenVerificationResult.success) {
        logger.warn('Firebase token verification failed', {
          error: tokenVerificationResult.error,
        })

        return {
          success: false,
          error: tokenVerificationResult.error || 'Invalid Firebase ID token',
          statusCode: 401,
        }
      }

      const claims = tokenVerificationResult.claims!

      // 2. Determine provider from token or request
      const provider =
        request.provider || this.extractProviderFromClaims(claims)

      // 3. Get authentication strategy for provider
      const strategy = this.authStrategyFactory.getStrategy(provider)

      // 4. Authenticate user using strategy
      const authData = await strategy.authenticate(claims, request.deviceInfo)

      // 5. Generate JWT tokens
      const tokenResult = await this.jwtTokenService.generateTokens({
        userId: authData.user.id,
        email: authData.user.email,
        role: authData.user.role,
        firebaseUid: authData.firebaseUid,
      })

      if (!tokenResult.success) {
        logger.error('JWT token generation failed', {
          userId: authData.user.id,
          error: tokenResult.error,
        })

        return {
          success: false,
          error: 'Failed to generate JWT tokens',
          statusCode: 500,
        }
      }

      const tokens = tokenResult.data!

      // 6. Build response
      const response: TokenExchangeResponse = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          firstName: authData.user.firstName,
          lastName: authData.user.lastName,
          role: authData.user.role,
          isNewUser: authData.isNewUser,
          requiresAdditionalInfo: authData.requiresAdditionalInfo,
          requiresMfa: authData.requiresMfa,
        },
      }

      logger.info('Successfully exchanged Firebase token for JWT', {
        userId: authData.user.id,
        provider,
        isNewUser: authData.isNewUser,
      })

      return {
        success: true,
        data: response,
      }
    } catch (error) {
      logger.error('Token exchange failed', { error })

      return {
        success: false,
        error: 'Token exchange failed',
        statusCode: 500,
      }
    }
  }

  private extractProviderFromClaims(claims: FirebaseUserClaims): string {
    // Map Firebase sign-in providers to our internal provider names
    const providerMap: Record<string, string> = {
      'google.com': 'google',
      'facebook.com': 'facebook',
      'twitter.com': 'twitter',
      'github.com': 'github',
      'apple.com': 'apple',
    }

    return (
      providerMap[claims.signInProvider] || claims.signInProvider.toLowerCase()
    )
  }
}
