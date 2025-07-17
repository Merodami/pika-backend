import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import { FastifyReply, FastifyRequest } from 'fastify'

import { GenerateFirebaseTokenCommandHandler } from '../../application/use_cases/commands/GenerateFirebaseTokenCommandHandler.js'

/**
 * Request interface for Firebase token generation
 */
interface GenerateFirebaseTokenRequest {
  Body: {
    purpose?: 'messaging' | 'notifications' | 'real-time'
    expiresIn?: number
  }
}

/**
 * Firebase Authentication Controller
 *
 * Handles Firebase custom token generation for real-time features.
 * Works with any identity provider through the standardized JWT validation.
 */
export class FirebaseAuthController {
  constructor(
    private readonly generateTokenHandler: GenerateFirebaseTokenCommandHandler,
  ) {}

  /**
   * Generate Firebase Custom Token
   *
   * POST /api/v1/auth/firebase-token
   *
   * Generates a Firebase custom token for the authenticated user.
   * Requires valid JWT token in Authorization header.
   */
  async generateFirebaseToken(
    request: FastifyRequest<GenerateFirebaseTokenRequest>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      // Get user ID from validated JWT token context
      const userId = request.user?.id

      if (!userId) {
        throw ErrorFactory.unauthorized(
          'Authentication required. Please provide a valid JWT token.',
          {
            correlationId: request.id,
            source: 'FirebaseAuthController.generateFirebaseToken',
            suggestion: 'Include a valid JWT token in the Authorization header',
          },
        )
      }

      // Validate request body
      const { purpose = 'real-time', expiresIn = 3600 } = request.body

      // Generate Firebase custom token
      const result = await this.generateTokenHandler.execute({
        userId,
        purpose,
        expiresIn,
        metadata: {
          requestId: request.id,
          userAgent: request.headers['user-agent'],
          ipAddress: request.ip,
        },
      })

      // Return successful response
      reply.code(200).send(result)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error generating Firebase token:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: request.user?.id,
        correlationId: request.id,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'UnauthorizedError') {
        throw error // Pass through unauthorized errors
      }

      // Handle command handler validation errors
      if (
        error.message?.includes('User ID') ||
        error.message?.includes('expiration') ||
        error.message?.includes('purpose')
      ) {
        throw ErrorFactory.validationError(
          {
            token: [error.message],
          },
          {
            correlationId: request.id,
            source: 'FirebaseAuthController.generateFirebaseToken',
            suggestion: 'Check the request parameters and try again',
          },
        )
      }

      // Handle user not found or inactive
      if (
        error.message?.includes('not found') ||
        error.message?.includes('inactive')
      ) {
        throw ErrorFactory.resourceNotFound(
          'User',
          request.user?.id || 'unknown',
          {
            correlationId: request.id,
            source: 'FirebaseAuthController.generateFirebaseToken',
            httpStatus: 403,
            suggestion: 'Ensure the user exists and is active',
          },
        )
      }

      // Handle Firebase-specific errors
      if (
        error.message?.includes('Firebase') ||
        error.message?.includes('token generation')
      ) {
        throw ErrorFactory.externalServiceError(
          'Firebase Admin SDK',
          'Failed to generate custom token',
          error,
          {
            correlationId: request.id,
            source: 'FirebaseAuthController.generateFirebaseToken',
            severity: ErrorSeverity.ERROR,
            metadata: {
              userId: request.user?.id,
              purpose: request.body.purpose,
              expiresIn: request.body.expiresIn,
            },
          },
        )
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(error, 'Failed to generate Firebase token', {
        source: 'FirebaseAuthController.generateFirebaseToken',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          userId: request.user?.id,
          requestBody: request.body,
        },
        suggestion: 'Please try again later',
      })
    }
  }

  /**
   * Health Check for Firebase Token Service
   *
   * GET /api/v1/auth/firebase-token/health
   *
   * Simple health check to verify Firebase token generation is available
   */
  async healthCheck(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      // Simple health check - verify Firebase Admin SDK is available
      const firebaseApp = this.generateTokenHandler['firebaseAdmin']

      if (firebaseApp && firebaseApp.auth) {
        reply.code(200).send({
          status: 'healthy',
          service: 'firebase-token-generation',
          timestamp: new Date().toISOString(),
        })
      } else {
        throw ErrorFactory.serviceUnavailable(
          'Firebase Admin SDK not available',
          {
            correlationId: request.id,
            source: 'FirebaseAuthController.healthCheck',
            severity: ErrorSeverity.WARNING,
            metadata: {
              service: 'firebase-token-generation',
            },
          },
        )
      }
    } catch (error: any) {
      // If it's already a formatted error, throw it
      if (error.context && error.context.domain) {
        throw error
      }

      // Log the error for monitoring
      logger.error('Health check failed:', {
        error: error.message,
        stack: error.stack,
        correlationId: request.id,
      })

      // For any unexpected errors during health check
      throw ErrorFactory.serviceUnavailable(
        'Firebase token generation service health check failed',
        {
          correlationId: request.id,
          source: 'FirebaseAuthController.healthCheck',
          severity: ErrorSeverity.WARNING,
          metadata: {
            service: 'firebase-token-generation',
            error: error.message,
          },
        },
      )
    }
  }
}
