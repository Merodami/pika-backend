import {
  AUTH_API_URL,
  COMMUNICATION_API_URL,
  FILE_STORAGE_API_URL,
  PAYMENT_API_URL,
  SUBSCRIPTION_API_URL,
  SUPPORT_API_URL,
  USER_API_URL,
} from '@pika/environment'
import { logger } from '@pika/shared'
import type { Express } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

/**
 * Simple service route configuration
 */
interface ServiceConfig {
  name: string
  prefix: string
  upstream: string
}

/**
 * Context headers that should be propagated to downstream services
 * Following industry standards for distributed tracing and user context
 */
const CONTEXT_HEADERS = [
  'x-user-id',
  'x-user-email',
  'x-user-role',
  'x-correlation-id',
  'x-session-id',
  'x-request-id',
  'x-b3-traceid',
  'x-b3-spanid',
  'x-b3-parentspanid',
  'x-b3-sampled',
  'x-b3-flags',
  'x-ot-span-context',
] as const

/**
 * Extract context headers from incoming request
 * This follows the "header propagation" pattern used in microservices
 */
function extractContextHeaders(req: any): Record<string, string> {
  const contextHeaders = new Map<string, string>()

  for (const header of CONTEXT_HEADERS) {
    if (Object.prototype.hasOwnProperty.call(req.headers, header)) {
      // Use Object.getOwnPropertyDescriptor to safely access the property
      const descriptor = Object.getOwnPropertyDescriptor(req.headers, header)
      const value = descriptor?.value

      if (value && typeof value === 'string') {
        contextHeaders.set(header, value)
      }
    }
  }

  return Object.fromEntries(contextHeaders)
}

const services: ServiceConfig[] = [
  {
    name: 'auth',
    prefix: '/api/v1/auth',
    upstream: AUTH_API_URL,
  },
  {
    name: 'users',
    prefix: '/api/v1/users',
    upstream: USER_API_URL,
  },
  {
    name: 'admin/users',
    prefix: '/api/v1/admin/users',
    upstream: USER_API_URL,
  },
  {
    name: 'admin/payments',
    prefix: '/api/v1/admin/payments',
    upstream: PAYMENT_API_URL,
  },
  {
    name: 'admin/subscriptions',
    prefix: '/api/v1/admin/subscriptions',
    upstream: SUBSCRIPTION_API_URL,
  },
  {
    name: 'admin/communications',
    prefix: '/api/v1/admin/communications',
    upstream: COMMUNICATION_API_URL,
  },
  {
    name: 'admin/support',
    prefix: '/api/v1/admin/support',
    upstream: SUPPORT_API_URL,
  },
  {
    name: 'admin/files',
    prefix: '/api/v1/admin/files',
    upstream: FILE_STORAGE_API_URL,
  },
  {
    name: 'payments',
    prefix: '/api/v1/payments',
    upstream: PAYMENT_API_URL,
  },
  {
    name: 'credits',
    prefix: '/api/v1/credits',
    upstream: PAYMENT_API_URL,
  },
  {
    name: 'subscriptions',
    prefix: '/api/v1/subscriptions',
    upstream: SUBSCRIPTION_API_URL,
  },
  {
    name: 'memberships',
    prefix: '/api/v1/memberships',
    upstream: SUBSCRIPTION_API_URL,
  },
  {
    name: 'communications',
    prefix: '/api/v1/communications',
    upstream: COMMUNICATION_API_URL,
  },
  {
    name: 'notifications',
    prefix: '/api/v1/notifications',
    upstream: COMMUNICATION_API_URL,
  },
  {
    name: 'problems',
    prefix: '/api/v1/problems',
    upstream: SUPPORT_API_URL,
  },
  {
    name: 'support',
    prefix: '/api/v1/support',
    upstream: SUPPORT_API_URL,
  },
  {
    name: 'files',
    prefix: '/api/v1/files',
    upstream: FILE_STORAGE_API_URL,
  },
  {
    name: 'uploads',
    prefix: '/api/v1/uploads',
    upstream: FILE_STORAGE_API_URL,
  },
]

/**
 * Set up proxy routes to backend services
 */
export function setupProxyRoutes(app: Express, isLocalDev: boolean): void {
  try {
    // Set up proxy for each service route
    for (const service of services) {
      const proxyMiddleware = createProxyMiddleware({
        target: service.upstream,
        changeOrigin: true,
        pathRewrite: (path) => {
          // When Express mounts on /api/v1/auth, it strips that prefix
          // So we receive /token and need to add /auth back
          return `/${service.name}${path}`
        },
        // Need to handle parsed bodies from Express
        selfHandleResponse: false,
        // Configure proxy events
        on: {
          error: (err, req, res) => {
            logger.error(`Proxy error for ${service.name}:`, err)
            // Type guard to check if res is an Express response
            if (res && 'headersSent' in res && 'status' in res) {
              if (!res.headersSent) {
                ;(res as any).status(502).json({
                  error: 'Bad Gateway',
                  message: `Unable to reach ${service.name} service`,
                })
              }
            }
          },
          proxyReq: (proxyReq, req) => {
            // Add context headers
            const contextHeaders = extractContextHeaders(req)

            Object.entries(contextHeaders).forEach(([key, value]) => {
              proxyReq.setHeader(key, value)
            })
            // Add forwarded prefix
            proxyReq.setHeader('x-forwarded-prefix', service.prefix)

            // If body was parsed by Express, we need to re-stream it
            // Cast req to any to access body property from Express
            const expressReq = req as any

            if (expressReq.body && Object.keys(expressReq.body).length > 0) {
              const bodyData = JSON.stringify(expressReq.body)

              // Update headers
              proxyReq.setHeader('Content-Type', 'application/json')
              proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))

              // Write the body
              proxyReq.write(bodyData)
              proxyReq.end()
            }
          },
        },
        logger: isLocalDev ? logger : undefined,
      })

      // Apply proxy middleware to the service prefix
      app.use(service.prefix, proxyMiddleware)

      if (isLocalDev) {
        logger.info(
          `Proxy ${service.prefix} → ${service.upstream}/${service.name}`,
        )
      }
    }
  } catch (error) {
    logger.error('Failed to setup proxy routes:', error)
    throw error // Re-throw to ensure the server knows setup failed
  }
}
