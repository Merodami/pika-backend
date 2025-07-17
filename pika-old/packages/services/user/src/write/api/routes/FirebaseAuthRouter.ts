import { schemas } from '@pika/api'
import { ErrorFactory, FirebaseAdminClient, logger } from '@pika/shared'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

import { GenerateFirebaseTokenCommandHandler } from '../../application/use_cases/commands/GenerateFirebaseTokenCommandHandler.js'
import { FirebaseAuthController } from '../controllers/FirebaseAuthController.js'

/**
 * Firebase Authentication Router
 *
 * Provides endpoints for Firebase custom token generation.
 * This router is provider-agnostic and works with any identity provider.
 */
export function createFirebaseAuthRouter(): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize dependencies
    const firebaseAdmin = FirebaseAdminClient.getInstance()
    // Use the singleton logger instance from @pika/shared

    // Create handler and controller
    const generateTokenHandler = new GenerateFirebaseTokenCommandHandler(
      firebaseAdmin,
      logger,
    )
    const controller = new FirebaseAuthController(generateTokenHandler)

    // Middleware to require authentication for Firebase auth routes (except health check)
    fastify.addHook('preHandler', async (request) => {
      // Skip auth check for health endpoint
      if (request.url.endsWith('/health')) {
        return
      }

      // Check if user context exists (from API Gateway headers)
      const userId = request.headers['x-user-id'] as string

      if (!userId) {
        throw ErrorFactory.unauthorized(
          'Authentication required. Please provide a valid JWT token.',
        )
      }

      // Attach user context to request for backward compatibility
      request.user = {
        id: userId,
        email: request.headers['x-user-email'] as string,
        role: request.headers['x-user-role'] as string,
        type:
          (request.headers['x-user-role'] as string)?.toUpperCase() ||
          'CUSTOMER',
      }
    })

    /**
     * Generate Firebase Custom Token
     *
     * POST /auth/firebase-token
     *
     * Generates a Firebase custom token for real-time features.
     * Requires valid JWT authentication.
     */
    fastify.post(
      '/firebase-token',
      {
        schema: {
          body: schemas.FirebaseTokenRequestSchema,
        },
      },
      controller.generateFirebaseToken.bind(controller),
    )

    /**
     * Firebase Token Service Health Check
     *
     * GET /auth/firebase-token/health
     *
     * Health check endpoint for Firebase token generation service
     */
    fastify.get(
      '/firebase-token/health',
      {
        schema: {
          response: {
            200: schemas.FirebaseTokenHealthOkSchema,
            503: schemas.FirebaseTokenHealthErrorSchema,
          },
        },
      },
      controller.healthCheck.bind(controller),
    )
  }
}
