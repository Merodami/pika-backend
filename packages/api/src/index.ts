/**
 * Pika API Schemas with Zod
 * Main entry point for all Zod schemas and utilities
 *
 * NOTE: Import z directly from 'zod' package to avoid circular dependencies
 * Example: import { z } from 'zod'
 */

export { fromZodError } from 'zod-validation-error'
export * from './common/registry/base.js'
export * from './common/registry/simple.js'
export * from './common/schemas/branded.js'
export * from './common/schemas/fileUpload.js'
export * from './common/schemas/geo.js'
export * from './common/schemas/metadata.js'
export * from './common/schemas/pagination.js'
export * from './common/schemas/primitives.js'
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
} from './common/schemas/errors.js'
export {
  HealthStatus,
  ServiceHealth,
  SimpleHealthCheckResponse,
} from './common/schemas/health.js'
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
} from './common/schemas/responses.js'

import * as adminSchemas from './admin/index.js'
import * as internalSchemas from './internal/index.js'
import * as publicSchemas from './public/index.js'

export const zod = {
  public: publicSchemas,
  admin: adminSchemas,
  internal: internalSchemas,
}

export {
  adminSchemas as admin,
  internalSchemas as internal,
  publicSchemas as public,
}

// Re-export commonly used public schemas for convenience
export {
  AuthTokensResponse,
  AuthUserResponse,
} from './public/schemas/auth/login.js'
export {
  IntrospectRequest,
  IntrospectResponse,
  RevokeTokenRequest,
  RevokeTokenResponse,
  TokenRequest,
  TokenResponse,
  UserInfoResponse,
} from './public/schemas/auth/oauth.js'

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
