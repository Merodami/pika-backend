export { setupServiceHealthCheck } from './application/api/healthCheck.js'
export { createExpressServer, startServer } from './application/api/server.js'
export type { HealthCheckConfig } from './domain/types/healthCheck.js'
export type {
  IdempotencyConfig,
  IdempotencyContext,
  IdempotentResponse,
} from './domain/types/idempotency.js'
export type { ServerOptions } from './domain/types/server.js'

// Express exports
export {
  adaptMulterFile,
  createMulterMiddleware,
} from './infrastructure/express/adapters/file-storage/multer-adapter.js'
export {
  RequestContext,
  type UserContext,
} from './infrastructure/express/context/RequestContext.js'
export {
  authMiddleware,
  requireAdmin,
  requireAuth,
  requireMember,
  requireOwnership,
  requirePermissions,
  requireProfessional,
  requireRoles,
} from './infrastructure/express/middleware/auth.js'
export { errorMiddleware } from './infrastructure/express/middleware/errorHandler.js'
export {
  idempotencyMiddleware,
  idempotencyPlugin,
} from './infrastructure/express/middleware/idempotency.js'
export {
  paginationHook,
  paginationMiddleware,
} from './infrastructure/express/middleware/pagination.js'
export { requestContextMiddleware } from './infrastructure/express/middleware/requestContext.js'
export {
  allowServiceOrUserAuth,
  requireServiceAuth,
  type ServiceAuthContext,
} from './infrastructure/express/middleware/serviceAuth.js'
export {
  getValidatedBody,
  getValidatedData,
  getValidatedParams,
  getValidatedQuery,
} from './infrastructure/express/types/validated-request.js'
export {
  createZodValidatorMiddleware,
  type TypedRequestHandler,
  validateBody,
  type ValidatedRequest,
  validateParams,
  validateQuery,
  validateRequest,
} from './infrastructure/express/validation/zodValidation.js'
export * from './utils/index.js'
