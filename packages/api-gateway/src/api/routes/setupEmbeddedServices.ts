import { logger } from '@pika/shared'
import type { Application, NextFunction, Request, Response } from 'express'

/**
 * Service route mapping for embedded mode (Vercel deployment)
 * Maps API paths to service mount points
 * NOTE: This is NOT used for local development - see setupProxyRoutes.ts instead
 */
const SERVICE_ROUTES = [
  // =================================
  // PUBLIC ROUTES (/api/v1/*)
  // =================================

  // Auth service - public routes
  { prefix: '/api/v1/auth', service: 'auth', mount: '/auth' },

  // User service - public routes
  { prefix: '/api/v1/users', service: 'user', mount: '/users' },
  {
    prefix: '/api/v1/favorites',
    service: 'user',
    mount: '/users/me/favorites',
  },

  // Business service - public routes
  { prefix: '/api/v1/businesses', service: 'business', mount: '/businesses' },

  // Category service - public routes
  { prefix: '/api/v1/categories', service: 'category', mount: '/categories' },

  // Payment service - public routes
  { prefix: '/api/v1/payments', service: 'payment', mount: '/payments' },
  {
    prefix: '/api/v1/payments/webhooks',
    service: 'payment',
    mount: '/webhooks',
  },
  { prefix: '/api/v1/products', service: 'payment', mount: '/' },

  // Subscription service - public routes
  {
    prefix: '/api/v1/subscriptions',
    service: 'subscription',
    mount: '/subscriptions',
  },
  { prefix: '/api/v1/plans', service: 'subscription', mount: '/plans' },

  // Communication service - public routes
  {
    prefix: '/api/v1/communications',
    service: 'communication',
    mount: '/communications',
  },

  // Support service - public routes
  { prefix: '/api/v1/support', service: 'support', mount: '/support' },

  // Storage service - public routes
  { prefix: '/api/v1/storage', service: 'storage', mount: '/storage' },
  { prefix: '/api/v1/files', service: 'storage', mount: '/files' },

  // PDF service - public routes
  { prefix: '/api/v1/pdf', service: 'pdf', mount: '/pdf' },

  // Voucher service - public routes
  { prefix: '/api/v1/vouchers', service: 'voucher', mount: '/vouchers' },

  // =================================
  // ADMIN ROUTES (/api/v1/admin/*)
  // =================================

  // User service - admin routes
  { prefix: '/api/v1/admin/users', service: 'user', mount: '/admin/users' },

  // Business service - admin routes
  {
    prefix: '/api/v1/admin/businesses',
    service: 'business',
    mount: '/admin/businesses',
  },

  // Category service - admin routes
  {
    prefix: '/api/v1/admin/categories',
    service: 'category',
    mount: '/admin/categories',
  },

  // Payment service - admin routes
  {
    prefix: '/api/v1/admin/payments',
    service: 'payment',
    mount: '/admin/payments',
  },

  // Subscription service - admin routes
  {
    prefix: '/api/v1/admin/subscriptions',
    service: 'subscription',
    mount: '/admin/subscriptions',
  },

  // Communication service - admin routes
  {
    prefix: '/api/v1/admin/communications',
    service: 'communication',
    mount: '/admin/communications',
  },

  // Support service - admin routes
  {
    prefix: '/api/v1/admin/support',
    service: 'support',
    mount: '/admin/support',
  },

  // Storage service - admin routes
  { prefix: '/api/v1/admin/files', service: 'storage', mount: '/admin/files' },

  // Voucher service - admin routes
  {
    prefix: '/api/v1/admin/vouchers',
    service: 'voucher',
    mount: '/admin/vouchers',
  },

  // =================================
  // INTERNAL ROUTES (/api/v1/internal/*)
  // =================================

  // User service - internal routes
  {
    prefix: '/api/v1/internal/users',
    service: 'user',
    mount: '/internal/users',
  },

  // Business service - internal routes
  {
    prefix: '/api/v1/internal/businesses',
    service: 'business',
    mount: '/internal/businesses',
  },

  // Category service - internal routes
  {
    prefix: '/api/v1/internal/categories',
    service: 'category',
    mount: '/internal/categories',
  },

  // Subscription service - internal routes
  {
    prefix: '/api/v1/internal/subscriptions',
    service: 'subscription',
    mount: '/internal/subscriptions',
  },

  // Communication service - internal routes
  {
    prefix: '/api/v1/internal/communications',
    service: 'communication',
    mount: '/internal/communications',
  },
]

/**
 * Sets up embedded services by mounting Express apps directly
 * This avoids the network overhead of proxying in monolith deployments
 */
export async function setupEmbeddedServices(
  app: Application,
  services: Map<string, Application>,
): Promise<void> {
  logger.info('Setting up embedded services')

  // Create a middleware that adds service context headers
  const addServiceContext = (serviceName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      // Add internal API key for service auth
      req.headers['x-api-key'] =
        process.env.SERVICE_API_KEY || 'default-service-api-key'

      // Add service identification
      req.headers['x-service-name'] = serviceName
      req.headers['x-gateway-mode'] = 'embedded'

      // Log the request
      logger.debug(
        {
          service: serviceName,
          method: req.method,
          path: req.path,
          originalUrl: req.originalUrl,
        },
        'Routing to embedded service',
      )

      next()
    }
  }

  // Mount each service at its API path
  for (const route of SERVICE_ROUTES) {
    const serviceApp = services.get(route.service)

    if (serviceApp) {
      // Create a sub-router for path rewriting
      app.use(
        route.prefix,
        (req: Request, res: Response, next: NextFunction) => {
          // Add service context
          addServiceContext(route.service)(req, res, () => {
            // Rewrite the URL to match service expectations
            // Services expect their base path (e.g., /auth, /users) in the URL
            const newPath = route.mount + req.path

            req.url = newPath

            // Mount the service app
            serviceApp(req, res, next)
          })
        },
      )

      logger.info(
        `Mounted embedded service: ${route.service} at ${route.prefix}`,
      )
    } else {
      logger.warn(`Service not found for embedded mounting: ${route.service}`)
    }
  }

  // Add a catch-all handler for unmatched API routes
  app.use('/api/v1/*splat', (req: Request, res: Response) => {
    logger.warn(
      {
        path: req.path,
        method: req.method,
      },
      'No service found for API route',
    )

    res.status(404).json({
      error: {
        code: 'SERVICE_NOT_FOUND',
        message: 'The requested service endpoint does not exist',
      },
    })
  })

  logger.info('Embedded services setup complete', {
    totalServices: services.size,
    mountedServices: SERVICE_ROUTES.filter((r) => services.has(r.service))
      .length,
  })
}
