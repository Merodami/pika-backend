import { AsyncOperationStatus as AsyncOperationStatusEnum } from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../common/utils/zodEnum.js'
import { CorrelationId } from './branded.js'
import { ErrorResponse, ValidationErrorResponse } from './errors.js'
import { HealthStatus } from './health.js'
import { DateTime } from './primitives.js'

/**
 * Common response schemas with Zod
 * Generic factories for consistent API responses
 */

// ============= Error Responses =============

/**
 * Base error structure (raw Zod)
 */
export const ErrorDetails = z.object({
  code: z.string().describe('Machine-readable error code'),
  message: z.string().describe('Human-readable error message'),
  details: z
    .union([
      z.string(),
      z.number(),
      z.boolean(),
      z.record(z.string(), z.unknown()),
      z.null(),
    ])
    .optional()
    .describe('Additional error details'),
  correlationId: CorrelationId.describe('Request correlation ID for tracing'),
  timestamp: DateTime.describe('When the error occurred'),
})

/**
 * Base error structure (OpenAPI documented)
 */
export const ErrorDetailsSchema = ErrorDetails.openapi('ErrorDetails', {
  description: 'Detailed error information',
})

export type ErrorDetails = z.infer<typeof ErrorDetails>

// ErrorResponse imported from ./errors.js to avoid duplicates

/**
 * Validation error field (raw Zod)
 */
export const ValidationErrorField = z.object({
  path: z
    .array(z.union([z.string(), z.number()]))
    .describe('Path to the invalid field'),
  message: z.string().describe('Validation error message'),
  code: z.string().optional().describe('Validation rule that failed'),
})

/**
 * Validation error field (OpenAPI documented)
 */
export const ValidationErrorFieldSchema = ValidationErrorField.openapi(
  'ValidationErrorField',
  {
    description: 'Field-level validation error',
  },
)

export type ValidationErrorField = z.infer<typeof ValidationErrorField>

// ValidationErrorResponse imported from ./errors.js to avoid duplicates

/**
 * Rate limit error response (raw Zod)
 */
export const RateLimitResponse = z.object({
  error: z.object({
    code: z.literal('RATE_LIMIT_EXCEEDED'),
    message: z.string().default('Too many requests'),
    retryAfter: z
      .number()
      .int()
      .positive()
      .describe('Seconds until rate limit resets'),
    limit: z.number().int().positive().describe('Request limit'),
    remaining: z.number().int().nonnegative().describe('Remaining requests'),
    reset: DateTime.describe('When the rate limit resets'),
    correlationId: CorrelationId,
    timestamp: DateTime,
  }),
})

/**
 * Rate limit error response (OpenAPI documented)
 */
export const RateLimitResponseSchema = RateLimitResponse.openapi(
  'RateLimitResponse',
  {
    description: 'Rate limit exceeded response',
  },
)

export type RateLimitResponse = z.infer<typeof RateLimitResponse>

// ============= Success Responses =============

/**
 * Simple message response (raw Zod)
 */
export const MessageResponse = z.object({
  message: z.string().describe('Success message'),
})

/**
 * Simple message response (OpenAPI documented)
 */
export const MessageResponseSchema = MessageResponse.openapi(
  'MessageResponse',
  {
    description: 'Simple message response',
  },
)

export type MessageResponse = z.infer<typeof MessageResponse>

/**
 * Success response factory
 */
export function successResponse<T extends z.ZodTypeAny>(
  dataSchema: T,
  options?: {
    description?: string
  },
) {
  return z
    .object({
      success: z.literal(true),
      data: dataSchema,
    })
    .describe(options?.description || 'Success response with data')
}

/**
 * Created resource response factory
 */
export function createdResponse<T extends z.ZodTypeAny>(
  resourceSchema: T,
  options?: {
    description?: string
  },
) {
  return z
    .object({
      id: z.string().uuid().describe('ID of the created resource'),
      data: resourceSchema,
      links: z
        .object({
          self: z.string().url().describe('URL to access the created resource'),
          related: z
            .record(z.string(), z.string().url())
            .optional()
            .describe('Related resource URLs'),
        })
        .optional(),
    })
    .describe(options?.description || 'Response for newly created resource')
}

// ============= Pagination =============

/**
 * Pagination metadata (raw Zod)
 * For runtime validation
 */
const PaginationMetadataBase = z.object({
  page: z.number().int().positive().describe('Current page number'),
  limit: z.number().int().positive().max(100).describe('Items per page'),
  total: z.number().int().nonnegative().describe('Total number of items'),
  totalPages: z.number().int().nonnegative().describe('Total number of pages'),
  hasNext: z.boolean().describe('Whether there is a next page'),
  hasPrev: z.boolean().describe('Whether there is a previous page'),
})

/**
 * Pagination metadata (OpenAPI documented)
 * This will generate $ref when used in OpenAPI schemas
 */
export const PaginationMetadata = PaginationMetadataBase.openapi(
  'PaginationMetadata',
  {
    description: 'Pagination information',
  },
)

export type PaginationMetadata = z.infer<typeof PaginationMetadata>

/**
 * Paginated response factory
 */
export function paginatedResponse<T extends z.ZodTypeAny>(
  itemSchema: T,
  options?: {
    description?: string
  },
) {
  return z
    .object({
      data: z.array(itemSchema).describe('Page items'),
      pagination: PaginationMetadata,
    })
    .describe(options?.description || 'Paginated response')
}

// ============= Batch Operations =============

/**
 * Batch operation error (raw Zod)
 */
export const BatchOperationError = z.object({
  index: z.number().int().nonnegative().describe('Index of the failed item'),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
})

/**
 * Batch operation error (OpenAPI documented)
 */
export const BatchOperationErrorSchema = BatchOperationError.openapi(
  'BatchOperationError',
  {
    description: 'Error details for failed batch operation item',
  },
)

export type BatchOperationError = z.infer<typeof BatchOperationError>

/**
 * Batch operation response (raw Zod)
 */
export const BatchOperationResponse = z.object({
  successful: z
    .number()
    .int()
    .nonnegative()
    .describe('Number of successful operations'),
  failed: z
    .number()
    .int()
    .nonnegative()
    .describe('Number of failed operations'),
  total: z.number().int().nonnegative().describe('Total number of operations'),
  errors: z
    .array(BatchOperationError)
    .optional()
    .describe('Details of failed operations'),
})

/**
 * Batch operation response (OpenAPI documented)
 */
export const BatchOperationResponseSchema = BatchOperationResponse.openapi(
  'BatchOperationResponse',
  {
    description: 'Response for batch operations',
  },
)

export type BatchOperationResponse = z.infer<typeof BatchOperationResponse>

// ============= Health Check =============

// HealthStatus imported from ./health.js to avoid duplicates

/**
 * Service health check (raw Zod)
 */
export const ServiceHealthCheck = z.object({
  status: HealthStatus,
  message: z.string().optional(),
  latency: z.number().optional().describe('Check latency in milliseconds'),
})

/**
 * Service health check (OpenAPI documented)
 */
export const ServiceHealthCheckSchema = ServiceHealthCheck.openapi(
  'ServiceHealthCheck',
  {
    description: 'Individual service health check result',
  },
)

export type ServiceHealthCheck = z.infer<typeof ServiceHealthCheck>

/**
 * Health check response (raw Zod)
 */
export const HealthCheckResponse = z.object({
  status: HealthStatus,
  timestamp: DateTime,
  service: z.string().describe('Service name'),
  version: z.string().describe('Service version'),
  uptime: z.number().int().nonnegative().describe('Uptime in seconds'),
  checks: z
    .record(z.string(), ServiceHealthCheck)
    .optional()
    .describe('Individual health checks'),
})

/**
 * Health check response (OpenAPI documented)
 */
export const HealthCheckResponseSchema = HealthCheckResponse.openapi(
  'HealthCheckResponse',
  {
    description: 'Service health check response',
  },
)

export type HealthCheckResponse = z.infer<typeof HealthCheckResponse>

// ============= Async Operations =============

/**
 * Async operation status (raw Zod)
 */
export const AsyncOperationStatus = createZodEnum(AsyncOperationStatusEnum)

/**
 * Async operation status (OpenAPI documented)
 */
export const AsyncOperationStatusSchema = AsyncOperationStatus.openapi(
  'AsyncOperationStatus',
  {
    description: 'Status of an asynchronous operation',
    example: AsyncOperationStatusEnum.IN_PROGRESS,
  },
)

export type AsyncOperationStatus = z.infer<typeof AsyncOperationStatus>

/**
 * Async operation response (raw Zod)
 */
export const AsyncOperationResponse = z.object({
  operationId: z.string().uuid().describe('Operation ID for tracking'),
  status: AsyncOperationStatus,
  progress: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('Progress percentage'),
  result: z
    .union([
      z.string(),
      z.number(),
      z.boolean(),
      z.record(z.string(), z.unknown()),
      z.array(z.unknown()),
      z.null(),
    ])
    .optional()
    .describe('Operation result (when completed)'),
  error: ErrorDetails.optional().describe('Error details (when failed)'),
  createdAt: DateTime,
  updatedAt: DateTime,
  completedAt: DateTime.optional(),
})

/**
 * Async operation response (OpenAPI documented)
 */
export const AsyncOperationResponseSchema = AsyncOperationResponse.openapi(
  'AsyncOperationResponse',
  {
    description: 'Asynchronous operation status',
  },
)

export type AsyncOperationResponse = z.infer<typeof AsyncOperationResponse>

// ============= Common Response Configs =============

/**
 * Standard HTTP response configurations for OpenAPI
 */
export const CommonResponses = {
  BadRequest: {
    description: 'Bad request',
    content: {
      'application/json': {
        schema: ValidationErrorResponse,
      },
    },
  },
  Unauthorized: {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: ErrorResponse,
      },
    },
  },
  Forbidden: {
    description: 'Forbidden',
    content: {
      'application/json': {
        schema: ErrorResponse,
      },
    },
  },
  NotFound: {
    description: 'Resource not found',
    content: {
      'application/json': {
        schema: ErrorResponse,
      },
    },
  },
  Conflict: {
    description: 'Resource conflict',
    content: {
      'application/json': {
        schema: ErrorResponse,
      },
    },
  },
  RateLimit: {
    description: 'Rate limit exceeded',
    content: {
      'application/json': {
        schema: RateLimitResponse,
      },
    },
  },
  ServerError: {
    description: 'Internal server error',
    content: {
      'application/json': {
        schema: ErrorResponse,
      },
    },
  },
}

// ============= Response Helpers =============

/**
 * Create a standard success response
 */
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    ...(message && { message }),
  }
}

/**
 * Create a standard error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  correlationId?: string,
) {
  return {
    error: {
      code,
      message,
      details,
      correlationId: correlationId || `req_${Date.now()}`,
      timestamp: new Date(),
    },
  }
}
