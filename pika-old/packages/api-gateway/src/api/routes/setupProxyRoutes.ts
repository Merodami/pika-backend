import httpProxy from '@fastify/http-proxy'
import {
  CAMPAIGN_API_URL,
  CATEGORY_API_URL,
  MESSAGING_API_URL,
  NOTIFICATION_API_URL,
  PDF_GENERATOR_API_URL,
  PROVIDER_API_URL,
  REDEMPTION_API_URL,
  REVIEW_API_URL,
  USER_API_URL,
  VOUCHER_API_URL,
} from '@pika/environment'
import { logger } from '@pika/shared'
import type { FastifyInstance } from 'fastify'

/**
 * Simple service route configuration
 */
interface ServiceConfig {
  name: string
  prefix: string
  readUpstream: string
  writeUpstream: string
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
    readUpstream: USER_API_URL,
    writeUpstream: USER_API_URL,
  },
  {
    name: 'categories',
    prefix: '/api/v1/categories',
    readUpstream: CATEGORY_API_URL,
    writeUpstream: CATEGORY_API_URL,
  },
  {
    name: 'users',
    prefix: '/api/v1/users',
    readUpstream: USER_API_URL,
    writeUpstream: USER_API_URL,
  },
  {
    name: 'conversations',
    prefix: '/api/v1/conversations',
    readUpstream: MESSAGING_API_URL,
    writeUpstream: MESSAGING_API_URL,
  },
  {
    name: 'notifications',
    prefix: '/api/v1/notifications',
    readUpstream: NOTIFICATION_API_URL,
    writeUpstream: NOTIFICATION_API_URL,
  },
  {
    name: 'vouchers',
    prefix: '/api/v1/vouchers',
    readUpstream: VOUCHER_API_URL,
    writeUpstream: VOUCHER_API_URL,
  },
  {
    name: 'redemptions',
    prefix: '/api/v1/redemptions',
    readUpstream: REDEMPTION_API_URL,
    writeUpstream: REDEMPTION_API_URL,
  },
  {
    name: 'providers',
    prefix: '/api/v1/providers',
    readUpstream: PROVIDER_API_URL,
    writeUpstream: PROVIDER_API_URL,
  },
  {
    name: 'pdf-generator',
    prefix: '/api/v1/pdf-generator',
    readUpstream: PDF_GENERATOR_API_URL,
    writeUpstream: PDF_GENERATOR_API_URL,
  },
  {
    name: 'reviews',
    prefix: '/api/v1/reviews',
    readUpstream: REVIEW_API_URL,
    writeUpstream: REVIEW_API_URL,
  },
  {
    name: 'campaigns',
    prefix: '/api/v1/campaigns',
    readUpstream: CAMPAIGN_API_URL,
    writeUpstream: CAMPAIGN_API_URL,
  },
]

/**
 * Set up proxy routes to backend services
 */
export async function setupProxyRoutes(
  app: FastifyInstance,
  isLocalDev: boolean,
): Promise<void> {
  try {
    // Set up proxy for each service route
    for (const service of services) {
      // 1. Queries (GET, HEAD, OPTIONS) → read model
      await app.register(httpProxy, {
        upstream: service.readUpstream,
        prefix: service.prefix,
        rewritePrefix: `/${service.name}`,
        httpMethods: ['GET', 'HEAD', 'OPTIONS'],
        proxyPayloads: false,
        replyOptions: {
          rewriteRequestHeaders: (req, headers) => ({
            ...headers,
            ...extractContextHeaders(req),
            'x-forwarded-prefix': service.prefix,
          }),
        },
      })

      // 2. Commands (mutations) → write model
      await app.register(httpProxy, {
        upstream: service.writeUpstream,
        prefix: service.prefix,
        rewritePrefix: `/${service.name}`,
        httpMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
        proxyPayloads: true,
        replyOptions: {
          rewriteRequestHeaders: (req, headers) => ({
            ...headers,
            ...extractContextHeaders(req),
            'x-forwarded-prefix': service.prefix,
          }),
        },
      })

      if (isLocalDev) {
        logger.info(
          `Proxy [READ ] ${service.prefix} → ${service.readUpstream}/${service.name}`,
        )
        logger.info(
          `Proxy [WRITE] ${service.prefix} → ${service.writeUpstream}/${service.name}`,
        )
      }
    }
  } catch (error) {
    logger.error('Failed to setup proxy routes:', error)
    throw error // Re-throw to ensure the server knows setup failed
  }
}
