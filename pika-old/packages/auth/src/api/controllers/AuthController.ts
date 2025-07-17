import { UserRole } from '@pika/types-core'
import { FastifyReply, FastifyRequest } from 'fastify'

import { LoginUseCase } from '../../application/use_cases/LoginUseCase.js'
import { LogoutUseCase } from '../../application/use_cases/LogoutUseCase.js'
import { RefreshTokenUseCase } from '../../application/use_cases/RefreshTokenUseCase.js'
import { RegisterUseCase } from '../../application/use_cases/RegisterUseCase.js'
import { TokenExchangeUseCase } from '../../application/use_cases/TokenExchangeUseCase.js'

export interface LoginRequest {
  Body: {
    email: string
    password: string
    rememberMe?: boolean
  }
}

export interface RegisterRequest {
  Body: {
    email: string
    password: string
    firstName: string
    lastName: string
    phoneNumber?: string
    role: UserRole
    avatarUrl?: string
  }
}

export interface RefreshTokenRequest {
  Body: {
    refreshToken: string
  }
}

export interface LogoutRequest {
  Headers: {
    authorization?: string
  }
}

export interface TokenExchangeRequest {
  Body: {
    firebaseIdToken: string
    provider?: string
    deviceInfo: {
      deviceId: string
      deviceName?: string
      deviceType: 'ios' | 'android' | 'web' | 'desktop'
      fcmToken?: string
    }
  }
}

/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 * Part of auth package's API layer
 */
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly tokenExchangeUseCase: TokenExchangeUseCase,
  ) {}

  /**
   * POST /auth/login
   * Authenticate user with email/password
   */
  async login(
    request: FastifyRequest<LoginRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    const { email, password, rememberMe } = request.body

    const result = await this.loginUseCase.execute({
      email,
      password,
      rememberMe,
      source: 'api',
    })

    if (!result.success) {
      return reply.status(401).send({
        error: 'AUTHENTICATION_FAILED',
        message: result.error,
        status_code: 401,
      })
    }

    // Format response to match Flutter expectations (snake_case)
    if (!result.user || !result.tokens) {
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Authentication succeeded but response data is incomplete',
        status_code: 500,
      })
    }

    // Calculate expires_in from expiresAt timestamp
    const expiresIn = Math.floor(
      (result.tokens.expiresAt.getTime() - Date.now()) / 1000,
    )

    return reply.status(200).send({
      user: {
        id: result.user.id,
        email: result.user.email,
        first_name: result.user.firstName,
        last_name: result.user.lastName,
        role: result.user.role,
        phone_number: (result.user as any).phoneNumber || null,
        phone_verified: false, // Default value
        avatar_url: (result.user as any).avatarUrl || null,
        email_verified: result.user.emailVerified,
        created_at: result.user.createdAt.toISOString(),
        updated_at: result.user.createdAt.toISOString(), // Use createdAt for consistency
        last_login_at: result.user.lastLoginAt?.toISOString() || null,
        status: 'ACTIVE',
      },
      tokens: {
        access_token: result.tokens.accessToken,
        refresh_token: result.tokens.refreshToken,
        expires_in: expiresIn,
      },
    })
  }

  /**
   * POST /auth/register
   * Register new user account
   */
  async register(
    request: FastifyRequest<RegisterRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role,
      avatarUrl,
    } = request.body

    const result = await this.registerUseCase.execute({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role,
      avatarUrl,
      source: 'api',
    })

    if (!result.success) {
      return reply.status(400).send({
        error: 'REGISTRATION_FAILED',
        message: result.error,
        status_code: 400,
      })
    }

    // Format response to match Flutter expectations (snake_case)
    if (!result.user || !result.tokens) {
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Registration succeeded but response data is incomplete',
        status_code: 500,
      })
    }

    const responseData = {
      user: {
        id: result.user.id,
        email: result.user.email,
        first_name: result.user.firstName,
        last_name: result.user.lastName,
        role: result.user.role,
        phone_number: (result.user as any).phoneNumber || null,
        phone_verified: false, // Default for new registrations
        avatar_url: (result.user as any).avatarUrl || null,
        email_verified: result.user.emailVerified,
        created_at: result.user.createdAt.toISOString(),
        updated_at: result.user.createdAt.toISOString(), // Use createdAt as initial updatedAt
        last_login_at: result.user.lastLoginAt?.toISOString() || null,
        status: 'ACTIVE',
      },
      tokens: {
        access_token: result.tokens.accessToken,
        refresh_token: result.tokens.refreshToken,
        expires_in: Math.floor(
          (result.tokens.expiresAt.getTime() - Date.now()) / 1000,
        ),
      },
    }

    return reply.status(201).send(responseData)
  }

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  async refreshToken(
    request: FastifyRequest<RefreshTokenRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    const { refreshToken } = request.body

    const result = await this.refreshTokenUseCase.execute({
      refreshToken,
      source: 'api',
    })

    if (!result.success) {
      return reply.status(401).send({
        error: 'TOKEN_REFRESH_FAILED',
        message: result.error,
        status_code: 401,
      })
    }

    // Format response to match Flutter expectations (snake_case)
    if (!result.tokens) {
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: 'Token refresh succeeded but response data is incomplete',
        status_code: 500,
      })
    }

    return reply.status(200).send({
      success: true,
      data: {
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresAt: result.tokens.expiresAt.toISOString(),
          refreshExpiresAt: result.tokens.refreshExpiresAt.toISOString(),
        },
      },
    })
  }

  /**
   * POST /auth/logout
   * Logout user and invalidate tokens
   */
  async logout(
    request: FastifyRequest<LogoutRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    // Extract user from JWT token (would be set by auth middleware)
    const user = (request as any).user
    const authorization = request.headers.authorization

    if (!user) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        status_code: 401,
      })
    }

    const token = authorization?.replace('Bearer ', '')

    await this.logoutUseCase.execute({
      userId: user.id,
      token,
      source: 'api',
    })

    return reply.status(200).send({
      message: 'Logged out successfully',
    })
  }

  /**
   * POST /auth/exchange-token
   * Exchange Firebase ID token for JWT tokens
   */
  async exchangeToken(
    request: FastifyRequest<TokenExchangeRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    const { firebaseIdToken, provider, deviceInfo } = request.body

    // Extract client IP and user agent
    const ipAddress = this.extractClientIp(request)
    const userAgent = request.headers['user-agent']

    const result = await this.tokenExchangeUseCase.execute({
      firebaseIdToken,
      provider,
      deviceInfo,
      ipAddress,
      userAgent,
      source: 'api',
    })

    // Return direct snake_case response (industry standard)
    return reply.status(200).send({
      user: {
        id: result.user.id,
        email: result.user.email,
        first_name: result.user.firstName,
        last_name: result.user.lastName,
        role: result.user.role,
        is_new_user: result.user.isNewUser,
        requires_additional_info: result.user.requiresAdditionalInfo,
        requires_mfa: result.user.requiresMfa,
      },
      tokens: {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        expires_in: result.expiresIn,
      },
    })
  }

  /**
   * Extract client IP address from request headers
   */
  private extractClientIp(request: FastifyRequest): string {
    // Try various headers to get the real client IP
    const xForwardedFor = request.headers['x-forwarded-for']
    const xRealIp = request.headers['x-real-ip']
    const cfConnectingIp = request.headers['cf-connecting-ip']

    if (typeof xForwardedFor === 'string') {
      return xForwardedFor.split(',')[0].trim()
    }

    if (typeof xRealIp === 'string') {
      return xRealIp
    }

    if (typeof cfConnectingIp === 'string') {
      return cfConnectingIp
    }

    // Safely access request.ip and socket properties
    try {
      if (request.ip) {
        return request.ip
      }

      // Check if socket exists and has remoteAddress
      if (request.socket && typeof request.socket.remoteAddress === 'string') {
        return request.socket.remoteAddress
      }
    } catch {
      // If any error occurs accessing these properties, fall through to default
    }

    return 'unknown'
  }
}
