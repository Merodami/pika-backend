import { schemas } from '@pika/api'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'

import { AuthController } from '../controllers/AuthController.js'

/**
 * Authentication routes plugin
 * Defines HTTP routes for authentication operations
 */
export async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions & { authController: AuthController },
): Promise<void> {
  const { authController } = options

  // Login endpoint
  fastify.post(
    '/login',
    {
      schema: {
        body: schemas.LoginSchema,
      },
    },
    authController.login.bind(authController),
  )

  // Register endpoint
  fastify.post(
    '/register',
    {
      schema: {
        body: schemas.UserRegistrationSchema,
      },
    },
    authController.register.bind(authController),
  )

  // Refresh token endpoint
  fastify.post(
    '/refresh',
    {
      schema: {
        body: schemas.RefreshTokenRequestSchema,
      },
    },
    authController.refreshToken.bind(authController),
  )

  // Logout endpoint
  fastify.post('/logout', authController.logout.bind(authController))

  // Token exchange endpoint
  fastify.post(
    '/exchange-token',
    {
      schema: {
        body: schemas.TokenExchangeRequestSchema,
      },
    },
    authController.exchangeToken.bind(authController),
  )
}
