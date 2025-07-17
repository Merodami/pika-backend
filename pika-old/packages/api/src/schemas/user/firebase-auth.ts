import { Type } from '@sinclair/typebox'

import { UUIDSchema } from '../utils/uuid.js'

/**
 * Firebase Custom Token Request Schema
 *
 * Request to generate a Firebase custom token for real-time features
 */
export const FirebaseTokenRequestSchema = Type.Object(
  {
    purpose: Type.Optional(
      Type.Union(
        [
          Type.Literal('messaging'),
          Type.Literal('notifications'),
          Type.Literal('real-time'),
        ],
        {
          description: 'Purpose of the Firebase token',
          default: 'real-time',
        },
      ),
    ),
    expiresIn: Type.Optional(
      Type.Number({
        minimum: 300,
        maximum: 3600,
        description: 'Token expiration in seconds (5min - 1hour)',
        default: 3600,
      }),
    ),
  },
  {
    additionalProperties: false,
    description: 'Request to generate Firebase custom token',
  },
)

/**
 * Firebase Custom Token Response Schema
 *
 * Response containing the Firebase custom token and metadata
 */
export const FirebaseTokenResponseSchema = Type.Object(
  {
    customToken: Type.String({
      description: 'Firebase custom token for authentication',
    }),
    expiresAt: Type.String({
      format: 'date-time',
      description: 'Token expiration timestamp (ISO 8601)',
    }),
    claims: Type.Object(
      {
        userId: UUIDSchema,
        role: Type.String({
          description: 'User role (customer, provider, admin)',
        }),
        purpose: Type.String({
          description: 'Token purpose (messaging, notifications, real-time)',
        }),
      },
      {
        description: 'Custom claims included in the token',
      },
    ),
  },
  {
    additionalProperties: false,
    description: 'Firebase custom token response',
  },
)

/**
 * Firebase Token Error Schemas
 */
export const FirebaseTokenUnauthorizedSchema = Type.Object(
  {
    error: Type.Object({
      code: Type.Literal('UNAUTHORIZED'),
      message: Type.String(),
      details: Type.Optional(
        Type.Object({
          reason: Type.String(),
        }),
      ),
    }),
  },
  {
    description: 'Unauthorized - Invalid or missing JWT token',
  },
)

export const FirebaseTokenForbiddenSchema = Type.Object(
  {
    error: Type.Object({
      code: Type.Literal('FORBIDDEN'),
      message: Type.String(),
      details: Type.Optional(
        Type.Object({
          reason: Type.String(),
        }),
      ),
    }),
  },
  {
    description: 'Forbidden - User not allowed to generate Firebase tokens',
  },
)

export const FirebaseTokenInternalErrorSchema = Type.Object(
  {
    error: Type.Object({
      code: Type.Literal('INTERNAL_ERROR'),
      message: Type.String(),
      details: Type.Optional(
        Type.Object({
          reason: Type.String(),
        }),
      ),
    }),
  },
  {
    description: 'Internal server error during token generation',
  },
)

/**
 * Firebase Token Service Health Check Schemas
 */
export const FirebaseTokenHealthOkSchema = Type.Object(
  {
    status: Type.String({ description: 'Health status', default: 'ok' }),
    service: Type.String({
      description: 'Service name',
      default: 'firebase-token',
    }),
    timestamp: Type.String({
      format: 'date-time',
      description: 'Timestamp (ISO 8601)',
    }),
  },
  {
    description: 'Firebase token service health check (OK)',
  },
)

export const FirebaseTokenHealthErrorSchema = Type.Object(
  {
    status: Type.String({ description: 'Health status', default: 'error' }),
    service: Type.String({
      description: 'Service name',
      default: 'firebase-token',
    }),
    error: Type.String({ description: 'Error message' }),
    timestamp: Type.String({
      format: 'date-time',
      description: 'Timestamp (ISO 8601)',
    }),
  },
  {
    description: 'Firebase token service health check (Error)',
  },
)
