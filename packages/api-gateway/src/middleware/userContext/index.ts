/**
 * User Context Middleware
 *
 * Provides consistent user context across all deployment modes
 */

export {
  userContextMiddleware,
  getUserContext,
  requireUserContext,
} from './middleware.js'

export {
  UserContextStrategy,
  type UserContextConfig,
  CONTEXT_HEADERS,
} from './types.js'

export {
  parseContextFromHeaders,
  setContextHeaders,
  fetchUserContext,
  createContextFromJWT,
} from './strategies.js'

// Re-export Express extension
import type { UserContext } from '@pika/types'

declare global {
  namespace Express {
    interface Request {
      userContext?: UserContext
    }
  }
}
