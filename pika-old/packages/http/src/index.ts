export { setupServiceHealthCheck } from './application/api/healthCheck.js'
export { createFastifyServer, startServer } from './application/api/server.js'
export type { HealthCheckConfig } from './domain/types/healthCheck.js'
export type {
  IdempotencyConfig,
  IdempotencyContext,
  IdempotentResponse,
} from './domain/types/idempotency.js'
export type { ServerOptions } from './domain/types/server.js'
export { adaptFastifyMultipart } from './infrastructure/fastify/adapters/file-storage/fastify-multipart-adapter.js'
export {
  RequestContext,
  type UserContext,
} from './infrastructure/fastify/context/RequestContext.js'
export {
  propertyTransformerHook,
  type PropertyTransformerOptions,
  transformSnakeToCamelCase,
} from './infrastructure/fastify/hooks/propertyNameTransformer.js'
export {
  fastifyAuth,
  requireAdmin,
  requireCustomer,
  requirePermissions,
  requireProvider,
} from './infrastructure/fastify/middleware/auth.js'
export { fastifyErrorMiddleware } from './infrastructure/fastify/middleware/errorHandler.js'
export { idempotencyPlugin } from './infrastructure/fastify/middleware/idempotency.js'
export { paginationHook } from './infrastructure/fastify/middleware/pagination.js'
export {
  allowServiceOrUserAuth,
  requireServiceAuth,
  type ServiceAuthContext,
} from './infrastructure/fastify/middleware/serviceAuth.js'
export * from './utils/index.js'
