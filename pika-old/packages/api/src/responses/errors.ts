import { ErrorCode } from '@pika/types-core'
import { Static, Type } from '@sinclair/typebox'

/**
 * Error Response Schema with enhanced properties using imported ErrorCode enum
 */
export const ErrorResponseSchema = Type.Object(
  {
    error: Type.Enum(ErrorCode, {
      description: 'Error code that identifies the type of error',
    }),
    message: Type.Union([Type.String(), Type.Array(Type.String())], {
      description: 'Human-readable error message',
    }),
    details: Type.Optional(
      Type.Object(
        {},
        {
          description: 'Additional error details if available',
        },
      ),
    ),
    path: Type.Optional(
      Type.String({
        description: 'The request path that resulted in the error',
      }),
    ),
    timestamp: Type.Optional(
      Type.String({
        description: 'The time at which the error occurred',
        format: 'date-time',
      }),
    ),
  },
  {
    $id: '#/components/schemas/ErrorResponse',
  },
)
export type ErrorResponse = Static<typeof ErrorResponseSchema>
export const ErrorResponseRef = Type.Ref('#/components/schemas/ErrorResponse')

/**
 * Common error response schemas for OpenAPI documentation
 */

// Unauthorized Error Response
export const UnauthorizedErrorSchema = Type.Object(
  {
    description: Type.Literal(
      'Authentication information is missing or invalid',
    ),
    content: Type.Object({
      'application/json': Type.Object({
        schema: Type.Ref('#/components/schemas/ErrorResponse'),
        examples: Type.Object({
          missingToken: Type.Object({
            summary: Type.Literal('Missing authentication token'),
            value: Type.Object({
              error: Type.Literal(ErrorCode.UNAUTHORIZED),
              message: Type.Literal('Unauthorized access'),
              details: Type.Object({
                reason: Type.Literal('Missing authentication token'),
              }),
              path: Type.Literal('/api/v1/pika'),
              timestamp: Type.Literal('2025-04-15T14:32:15.123Z'),
            }),
          }),
          invalidToken: Type.Object({
            summary: Type.Literal('Invalid authentication token'),
            value: Type.Object({
              error: Type.Literal(ErrorCode.UNAUTHORIZED),
              message: Type.Literal('Unauthorized access'),
              details: Type.Object({
                reason: Type.Literal('Invalid or expired token'),
              }),
              path: Type.Literal('/api/v1/pika'),
              timestamp: Type.Literal('2025-04-15T14:32:15.123Z'),
            }),
          }),
        }),
      }),
    }),
  },
  { $id: '#/components/responses/UnauthorizedError' },
)
export type UnauthorizedError = Static<typeof UnauthorizedErrorSchema>
export const UnauthorizedErrorRef = Type.Ref(
  '#/components/responses/UnauthorizedError',
)

// Forbidden Error Response
export const ForbiddenErrorSchema = Type.Object(
  {
    description: Type.Literal('The user lacks sufficient permissions'),
    content: Type.Object({
      'application/json': Type.Object({
        schema: Type.Ref('#/components/schemas/ErrorResponse'),
        examples: Type.Object({
          insufficientPermissions: Type.Object({
            summary: Type.Literal('Insufficient permissions'),
            value: Type.Object({
              error: Type.Literal(ErrorCode.FORBIDDEN),
              message: Type.Literal('Access forbidden'),
              details: Type.Object({
                reason: Type.Literal(
                  'Insufficient permissions to access this resource',
                ),
                requiredPermissions: Type.Array(Type.String(), {
                  default: ['pika:write'],
                }),
              }),
              path: Type.Literal('/api/v1/pika'),
              timestamp: Type.Literal('2025-04-15T14:32:15.123Z'),
            }),
          }),
        }),
      }),
    }),
  },
  { $id: '#/components/responses/ForbiddenError' },
)
export type ForbiddenError = Static<typeof ForbiddenErrorSchema>
export const ForbiddenErrorRef = Type.Ref(
  '#/components/responses/ForbiddenError',
)

// Not Found Error Response
export const NotFoundErrorSchema = Type.Object(
  {
    description: Type.Literal('The requested resource was not found'),
    content: Type.Object({
      'application/json': Type.Object({
        schema: Type.Ref('#/components/schemas/ErrorResponse'),
        examples: Type.Object({
          bookNotFound: Type.Object({
            summary: Type.Literal('Book not found'),
            value: Type.Object({
              error: Type.Literal(ErrorCode.NOT_FOUND),
              message: Type.Literal(
                'The requested resource could not be found',
              ),
              details: Type.Object({
                isbn: Type.Literal('1234567890123'),
              }),
              path: Type.Literal('/api/v1/pika/1234567890123'),
              timestamp: Type.Literal('2025-04-15T14:32:15.123Z'),
            }),
          }),
        }),
      }),
    }),
  },
  { $id: '#/components/responses/NotFoundError' },
)
export type NotFoundError = Static<typeof NotFoundErrorSchema>
export const NotFoundErrorRef = Type.Ref('#/components/responses/NotFoundError')

// Bad Request Error Response
export const BadRequestErrorSchema = Type.Object(
  {
    description: Type.Literal('The request contains invalid data'),
    content: Type.Object({
      'application/json': Type.Object({
        schema: Type.Ref('#/components/schemas/ErrorResponse'),
        examples: Type.Object({
          validationError: Type.Object({
            summary: Type.Literal('Validation error'),
            value: Type.Object({
              error: Type.Literal(ErrorCode.VALIDATION_ERROR),
              message: Type.Literal('Validation error'),
              details: Type.Object({
                fields: Type.Array(
                  Type.Object({
                    field: Type.String(),
                    message: Type.String(),
                  }),
                  {
                    default: [
                      { field: 'title', message: 'Title is required' },
                      {
                        field: 'publication_year',
                        message: 'Publication year must be a number',
                      },
                    ],
                  },
                ),
              }),
              path: Type.Literal('/api/v1/pika'),
              timestamp: Type.Literal('2025-04-15T14:32:15.123Z'),
            }),
          }),
          bookValidationFailed: Type.Object({
            summary: Type.Literal('Book validation failed'),
            value: Type.Object({
              error: Type.Literal(ErrorCode.VALIDATION_ERROR),
              message: Type.Literal('Book validation failed'),
              details: Type.Object({
                isbn: Type.Literal(
                  'Invalid ISBN format. Must be 10 or 13 digits.',
                ),
              }),
              path: Type.Literal('/api/v1/pika'),
              timestamp: Type.Literal('2025-04-15T14:32:15.123Z'),
            }),
          }),
        }),
      }),
    }),
  },
  { $id: '#/components/responses/BadRequestError' },
)
export type BadRequestError = Static<typeof BadRequestErrorSchema>
export const BadRequestErrorRef = Type.Ref(
  '#/components/responses/BadRequestError',
)

// Conflict Error Response
export const ConflictErrorSchema = Type.Object(
  {
    description: Type.Literal(
      'The request conflicts with the current state of the server',
    ),
    content: Type.Object({
      'application/json': Type.Object({
        schema: Type.Ref('#/components/schemas/ErrorResponse'),
        examples: Type.Object({
          bookAlreadyExists: Type.Object({
            summary: Type.Literal('Book already exists'),
            value: Type.Object({
              error: Type.Literal(ErrorCode.DUPLICATE_ENTITY),
              message: Type.Literal('A book with this ISBN already exists'),
              details: Type.Object({
                isbn: Type.Literal('1234567890123'),
              }),
              path: Type.Literal('/api/v1/pika'),
              timestamp: Type.Literal('2025-04-15T14:32:15.123Z'),
            }),
          }),
        }),
      }),
    }),
  },
  { $id: '#/components/responses/ConflictError' },
)
export type ConflictError = Static<typeof ConflictErrorSchema>
export const ConflictErrorRef = Type.Ref('#/components/responses/ConflictError')

// Rate Limit Error Response
export const RateLimitErrorSchema = Type.Object(
  {
    description: Type.Literal('Too many requests'),
    headers: Type.Object({
      'X-RateLimit-Limit': Type.Object({
        schema: Type.Object({
          type: Type.Literal('integer'),
        }),
        description: Type.Literal(
          'The number of allowed requests in the current period',
        ),
      }),
      'X-RateLimit-Remaining': Type.Object({
        schema: Type.Object({
          type: Type.Literal('integer'),
        }),
        description: Type.Literal(
          'The number of remaining requests in the current period',
        ),
      }),
      'X-RateLimit-Reset': Type.Object({
        schema: Type.Object({
          type: Type.Literal('integer'),
          format: Type.Literal('unix-timestamp'),
        }),
        description: Type.Literal(
          'The time at which the current rate limit window resets',
        ),
      }),
    }),
    content: Type.Object({
      'application/json': Type.Object({
        schema: Type.Ref('#/components/schemas/ErrorResponse'),
        examples: Type.Object({
          rateLimitExceeded: Type.Object({
            summary: Type.Literal('Rate limit exceeded'),
            value: Type.Object({
              error: Type.Literal(ErrorCode.RATE_LIMIT_EXCEEDED),
              message: Type.Literal('Rate limit exceeded. Try again later.'),
              details: Type.Object({
                limit: Type.Number(), // These would be replaced with actual values at runtime
                windowMs: Type.Number(),
                resetTime: Type.Literal('2025-04-15T14:47:15.123Z'),
              }),
              path: Type.Literal('/api/v1/category'),
              timestamp: Type.Literal('2025-04-15T14:32:15.123Z'),
            }),
          }),
        }),
      }),
    }),
  },
  { $id: '#/components/responses/RateLimitError' },
)
export type RateLimitError = Static<typeof RateLimitErrorSchema>
export const RateLimitErrorRef = Type.Ref(
  '#/components/responses/RateLimitError',
)

// Internal Server Error Response
export const InternalServerErrorSchema = Type.Object(
  {
    description: Type.Literal('An internal server error occurred'),
    content: Type.Object({
      'application/json': Type.Object({
        schema: Type.Ref('#/components/schemas/ErrorResponse'),
        examples: Type.Object({
          internalError: Type.Object({
            summary: Type.Literal('Internal server error'),
            value: Type.Object({
              error: Type.Literal(ErrorCode.INTERNAL_ERROR),
              message: Type.Literal('An internal server error occurred'),
              path: Type.Literal('/api/v1/pika'),
              timestamp: Type.Literal('2025-04-15T14:32:15.123Z'),
            }),
          }),
          databaseError: Type.Object({
            summary: Type.Literal('Database error'),
            value: Type.Object({
              error: Type.Literal(ErrorCode.DATABASE_ERROR),
              message: Type.Literal(
                'An error occurred while accessing the database',
              ),
              path: Type.Literal('/api/v1/pika'),
              timestamp: Type.Literal('2025-04-15T14:32:15.123Z'),
            }),
          }),
        }),
      }),
    }),
  },
  { $id: '#/components/responses/InternalServerError' },
)
export type InternalServerError = Static<typeof InternalServerErrorSchema>
export const InternalServerErrorRef = Type.Ref(
  '#/components/responses/InternalServerError',
)

/**
 * Helper function to extract response object from TypeBox schema
 * for OpenAPI compatibility
 */
export function extractResponseObject(schema: any) {
  if (
    !schema ||
    !schema.properties ||
    !schema.properties.description ||
    !schema.properties.content
  ) {
    throw new Error('Invalid response schema format')
  }

  // Convert TypeBox literals to plain values
  const getPlainValue = (obj: any): any => {
    if (!obj) return obj

    if (obj.const !== undefined) return obj.const
    if (obj.default !== undefined) return obj.default

    if (obj.type === 'object' && obj.properties) {
      const result = {}

      // Use Object.assign for a safer copy
      return Object.assign(
        result,
        ...Object.entries(obj.properties).map(([key, value]) => ({
          [key]: getPlainValue(value),
        })),
      )
    }

    return obj
  }

  // Create a response object with only expected properties
  const response = {
    description: getPlainValue(schema.properties.description),
    content: getPlainValue(schema.properties.content),
    ...(schema.properties.headers && {
      headers: getPlainValue(schema.properties.headers),
    }),
  }

  return response
}

/**
 * Plain response objects compatible with OpenAPI validation
 */
// Validation Error Response
export const ValidationErrorSchema = Type.Object(
  {
    description: Type.Literal('Request validation failed'),
    content: Type.Object({
      'application/json': Type.Object({
        schema: Type.Ref('#/components/schemas/ErrorResponse'),
        examples: Type.Object({
          validationFailed: Type.Object({
            summary: Type.Literal('Validation failed'),
            value: Type.Object({
              error: Type.Literal(ErrorCode.VALIDATION_ERROR),
              message: Type.Literal('Request validation failed'),
              details: Type.Object({
                fields: Type.Array(
                  Type.Object({
                    field: Type.String(),
                    message: Type.String(),
                  }),
                  {
                    default: [
                      {
                        field: 'email',
                        message: 'Email must be a valid format',
                      },
                      {
                        field: 'password',
                        message: 'Password must be at least 8 characters',
                      },
                    ],
                  },
                ),
              }),
              path: Type.Literal('/api/v1/auth/register'),
              timestamp: Type.Literal('2025-04-15T14:32:15.123Z'),
            }),
          }),
        }),
      }),
    }),
  },
  { $id: '#/components/responses/ValidationError' },
)
export type ValidationError = Static<typeof ValidationErrorSchema>
export const ValidationErrorRef = Type.Ref(
  '#/components/responses/ValidationError',
)

// Define ServerError as an alias for InternalServerError
export const ServerErrorSchema = InternalServerErrorSchema
export type ServerError = Static<typeof ServerErrorSchema>
export const ServerErrorRef = Type.Ref('#/components/responses/ServerError')

export const ErrorResponses = {
  UnauthorizedError: extractResponseObject(UnauthorizedErrorSchema),
  ForbiddenError: extractResponseObject(ForbiddenErrorSchema),
  NotFoundError: extractResponseObject(NotFoundErrorSchema),
  BadRequestError: extractResponseObject(BadRequestErrorSchema),
  ConflictError: extractResponseObject(ConflictErrorSchema),
  RateLimitError: extractResponseObject(RateLimitErrorSchema),
  InternalServerError: extractResponseObject(InternalServerErrorSchema),
  ValidationError: extractResponseObject(ValidationErrorSchema),
  ServerError: extractResponseObject(InternalServerErrorSchema), // Using InternalServerError as ServerError
}
