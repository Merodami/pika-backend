import { ErrorFactory, logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

import {
  TokenExchangeRequest,
  TokenExchangeResponse,
  TokenExchangeService,
} from '../../domain/services/TokenExchangeService.js'

export interface TokenExchangeUseCaseRequest {
  firebaseIdToken: string
  provider?: string
  deviceInfo: {
    deviceId: string
    deviceName?: string
    deviceType: 'ios' | 'android' | 'web' | 'desktop'
    fcmToken?: string
  }
  ipAddress?: string
  userAgent?: string
  source: string
}

/**
 * Token Exchange Use Case
 * Business logic for exchanging Firebase tokens for JWT tokens
 */
export class TokenExchangeUseCase {
  private tokenExchangeService: TokenExchangeService

  constructor(private readonly prisma: PrismaClient) {
    this.tokenExchangeService = TokenExchangeService.getInstance(prisma)
  }

  async execute(
    request: TokenExchangeUseCaseRequest,
  ): Promise<TokenExchangeResponse> {
    try {
      logger.info('Executing token exchange use case', {
        provider: request.provider,
        source: request.source,
        deviceType: request.deviceInfo.deviceType,
      })

      // Prepare device info with additional context
      const deviceInfo = {
        deviceId: request.deviceInfo.deviceId,
        deviceName: request.deviceInfo.deviceName,
        deviceType: request.deviceInfo.deviceType,
        fcmToken: request.deviceInfo.fcmToken,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
      }

      // Execute token exchange
      const exchangeRequest: TokenExchangeRequest = {
        firebaseIdToken: request.firebaseIdToken,
        provider: request.provider,
        deviceInfo,
      }

      const result =
        await this.tokenExchangeService.exchangeFirebaseToken(exchangeRequest)

      if (!result.success) {
        logger.warn('Token exchange use case failed', {
          error: result.error,
          statusCode: result.statusCode,
          source: request.source,
        })

        if (result.statusCode === 401) {
          throw ErrorFactory.unauthorized(
            result.error || 'Authentication failed',
            {
              source: 'TokenExchangeUseCase.execute',
              metadata: { requestSource: request.source },
            },
          )
        } else {
          throw ErrorFactory.fromError(
            new Error(result.error),
            'Token exchange failed',
            {
              source: 'TokenExchangeUseCase.execute',
              metadata: {
                requestSource: request.source,
                statusCode: result.statusCode,
              },
            },
          )
        }
      }

      const tokenData = result.data!

      logger.info('Token exchange use case completed successfully', {
        userId: tokenData.user.id,
        isNewUser: tokenData.user.isNewUser,
        source: request.source,
      })

      return tokenData
    } catch (error) {
      logger.error('Token exchange use case failed with unexpected error', {
        error,
        source: request.source,
      })

      throw ErrorFactory.fromError(
        error,
        'Token exchange failed due to an unexpected error',
        {
          source: 'TokenExchangeUseCase.execute',
          metadata: { requestSource: request.source },
        },
      )
    }
  }
}
