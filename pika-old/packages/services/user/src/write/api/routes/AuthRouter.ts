import {
  AuthController,
  authRoutes,
  JwtTokenService,
  LocalAuthStrategy,
  LoginUseCase,
  LogoutUseCase,
  PasswordSecurityService,
  RefreshTokenUseCase,
  RegisterUseCase,
  TokenExchangeUseCase,
} from '@pika/auth'
import {
  JWT_ACCESS_TOKEN_EXPIRY,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_REFRESH_TOKEN_EXPIRY,
  JWT_SECRET,
} from '@pika/environment'
import { propertyTransformerHook } from '@pika/http'
import { ICacheService } from '@pika/redis'
import { ErrorFactory } from '@pika/shared'
import { UserRole, UserStatus } from '@pika/types-core'
import { PrismaClient } from '@prisma/client'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

/**
 * Authentication Router
 *
 * Integrates the @pika/auth package with the user service.
 * Provides complete authentication functionality including:
 * - Login
 * - Register
 * - Refresh token
 * - Logout
 * - Password reset
 */
export function createAuthRouter(
  prisma: PrismaClient,
  cacheService?: ICacheService,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize auth services
    const passwordService = new PasswordSecurityService()
    const tokenService = new JwtTokenService(
      JWT_SECRET,
      JWT_ACCESS_TOKEN_EXPIRY,
      JWT_REFRESH_TOKEN_EXPIRY,
      JWT_ISSUER,
      JWT_AUDIENCE,
      cacheService,
    )

    // Use the same service for verification
    const verificationService = tokenService

    // Create auth strategy with Prisma repository implementations
    const authStrategy = new LocalAuthStrategy(
      {
        findByEmail: async (email: string) => {
          const user = await prisma.user.findUnique({
            where: { email },
          })

          if (!user) return null

          // Transform to expected format for auth strategy
          return {
            id: user.id,
            email: user.email,
            password: user.password || '',
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role as UserRole,
            status: user.status as UserStatus,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt || new Date(),
            lastLoginAt: user.lastLoginAt || undefined,
            isActive: () => user.status === 'ACTIVE' && !user.deletedAt,
          }
        },
        createUser: async (data) => {
          const newUser = await prisma.user.create({
            data: {
              email: data.email,
              password: data.password,
              firstName: data.firstName,
              lastName: data.lastName,
              phoneNumber: data.phoneNumber,
              role: data.role,
              avatarUrl: data.avatarUrl,
              emailVerified: false,
            },
          })

          return {
            id: newUser.id,
            email: newUser.email,
            password: newUser.password || '',
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role as UserRole,
            status: newUser.status as UserStatus,
            emailVerified: newUser.emailVerified,
            createdAt: newUser.createdAt || new Date(),
            lastLoginAt: newUser.lastLoginAt || undefined,
            isActive: () => newUser.status === 'ACTIVE' && !newUser.deletedAt,
          }
        },
        updateLastLogin: async (userId: string) => {
          await prisma.user.update({
            where: { id: userId },
            data: { lastLoginAt: new Date() },
          })
        },
        emailExists: async (email: string) => {
          const user = await prisma.user.findUnique({
            where: { email },
          })

          return !!user
        },
        phoneExists: async (phoneNumber: string) => {
          const user = await prisma.user.findFirst({
            where: { phoneNumber },
          })

          return !!user
        },
      },
      passwordService,
      tokenService,
    )

    // Initialize use cases
    const loginUseCase = new LoginUseCase(authStrategy)
    const registerUseCase = new RegisterUseCase(authStrategy)
    const refreshTokenUseCase = new RefreshTokenUseCase(authStrategy)
    const logoutUseCase = new LogoutUseCase(authStrategy)
    const tokenExchangeUseCase = new TokenExchangeUseCase(prisma)

    // Create auth controller
    const authController = new AuthController(
      loginUseCase,
      registerUseCase,
      refreshTokenUseCase,
      logoutUseCase,
      tokenExchangeUseCase,
    )

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    await fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Add authentication middleware for logout endpoint
    fastify.addHook('preHandler', async (request) => {
      // Only apply to logout endpoint (account for prefix)
      if (!request.url.endsWith('/logout') || request.method !== 'POST') {
        return
      }

      // Check for Authorization header
      const authorization = request.headers.authorization as string

      if (!authorization || !authorization.startsWith('Bearer ')) {
        throw ErrorFactory.unauthorized(
          'Authentication required. Please provide a valid JWT token.',
          {
            source: 'AuthRouter.logout.preHandler',
          },
        )
      }

      // Extract token and validate with verification service
      const token = authorization.replace('Bearer ', '')

      try {
        if (!verificationService) {
          throw new Error('Token verification service not available')
        }

        const result = await verificationService.verifyToken(token, 'access')

        if (!result.isValid || !result.payload) {
          throw ErrorFactory.unauthorized('Invalid or expired JWT token', {
            source: 'AuthRouter.logout.preHandler',
            metadata: { reason: result.error || 'Token validation failed' },
          })
        }

        // Populate request.user for AuthController
        ;(request as any).user = {
          id: result.payload.userId,
          email: result.payload.email,
          role: result.payload.role,
        }
      } catch (error) {
        // If it's already an ErrorFactory error, re-throw it
        if (
          error.name === 'UnauthorizedError' ||
          error.name === 'InternalServerError'
        ) {
          throw error
        }

        // Otherwise, wrap it in an unauthorized error
        throw ErrorFactory.unauthorized('Token validation failed', {
          source: 'AuthRouter.logout.preHandler',
          metadata: { originalError: error.message },
        })
      }
    })

    // Register auth routes from the auth package
    await fastify.register(authRoutes, { authController })
  }
}
