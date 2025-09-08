/**
 * User Context Middleware
 *
 * Provides consistent user context across all deployment modes
 */

export {
  getUserContext,
  requireUserContext,
  userContextMiddleware,
} from './middleware.js'
export {
  createContextFromJWT,
  fetchUserContext,
  parseContextFromHeaders,
  setContextHeaders,
} from './strategies.js'
export {
  CONTEXT_HEADERS,
  type UserContextConfig,
  UserContextStrategy,
} from './types.js'

// Re-export Express extension
import type { UserContext } from '@pika/types'

declare global {
  namespace Express {
    interface Request {
      userContext?: UserContext
    }
  }
}
