/**
 * Pika API Schemas with Zod
 * Main entry point for all Zod schemas and utilities
 *
 * NOTE: Import z directly from 'zod' package to avoid circular dependencies
 * Example: import { z } from 'zod'
 */

export { fromZodError } from 'zod-validation-error'
// export * from './common/registry/base.js'
export * from './common/registry/simple.js'
export * from './schemas/shared/branded.js'
export * from './schemas/shared/fileUpload.js'
export * from './schemas/shared/geo.js'
export * from './schemas/shared/metadata.js'
export * from './schemas/shared/pagination.js'
export * from './schemas/shared/primitives.js'
export * from './common/utils/openapi.js'
export * from './common/utils/sorting.js'
export * from './common/utils/validators.js'

// Export responses and errors selectively
export {
  ConflictResponse,
  ErrorResponse,
  ForbiddenResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  ServiceUnavailableResponse,
  UnauthorizedResponse,
  ValidationErrorResponse,
} from './schemas/shared/errors.js'
export {
  HealthStatus,
  ServiceHealth,
  SimpleHealthCheckResponse,
} from './schemas/shared/health.js'
export {
  AsyncOperationResponse,
  AsyncOperationStatus,
  BatchOperationError,
  BatchOperationResponse,
  createdResponse,
  HealthCheckResponse,
  MessageResponse,
  paginatedResponse,
  PaginationMetadata,
  RateLimitResponse,
  ServiceHealthCheck,
  successResponse,
} from './schemas/shared/responses.js'

// Note: Using new service-based structure instead of top-level admin/internal/public

// Re-export commonly used public schemas for convenience
export {
  AuthTokensResponse,
  AuthUserResponse,
} from './schemas/auth/public/login.js'
export {
  IntrospectRequest,
  IntrospectResponse,
  RevokeTokenRequest,
  RevokeTokenResponse,
  TokenRequest,
  TokenResponse,
  UserInfoResponse,
} from './schemas/auth/public/oauth.js'

import type { z } from 'zod'

/**
 * Extract TypeScript type from Zod schema
 */
export type InferSchema<T extends z.ZodTypeAny> = z.infer<T>

/**
 * Get the shape of a Zod object schema
 */
export type InferShape<T extends z.ZodObject<any>> = T['shape']

/**
 * Make schema properties optional
 */
export type PartialSchema<T extends z.ZodObject<any>> = z.ZodObject<{
  [K in keyof T['shape']]: z.ZodOptional<T['shape'][K]>
}>
