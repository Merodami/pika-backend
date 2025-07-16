import {
  AUTH_API_URL,
  COMMUNICATION_API_URL,
  FILE_STORAGE_API_URL,
  GYM_API_URL,
  HEALTH_CHECK_MEMORY_THRESHOLD,
  PAYMENT_API_URL,
  PG_DATABASE,
  PG_HOST,
  PG_PORT,
  REDIS_DEFAULT_TTL,
  REDIS_HOST,
  REDIS_PORT,
  SESSION_API_URL,
  SOCIAL_API_URL,
  SUBSCRIPTION_API_URL,
  SUPPORT_API_URL,
  USER_API_URL,
} from '@pika/environment'
import { logger } from '@pika
import type { Request, Response } from 'express'

interface ServiceHealthCheck {
  name: string
  url: string
}

const services: ServiceHealthCheck[] = [
  { name: 'auth', url: AUTH_API_URL },
  { name: 'user', url: USER_API_URL },
  { name: 'gym', url: GYM_API_URL },
  { name: 'session', url: SESSION_API_URL },
  { name: 'payment', url: PAYMENT_API_URL },
  { name: 'subscription', url: SUBSCRIPTION_API_URL },
  { name: 'communication', url: COMMUNICATION_API_URL },
  { name: 'support', url: SUPPORT_API_URL },
  { name: 'social', url: SOCIAL_API_URL },
  { name: 'file-storage', url: FILE_STORAGE_API_URL },
]

async function checkService(service: ServiceHealthCheck) {
  const startTime = Date.now()

  try {
    const response = await fetch(`${service.url}/api/v1/health`)
    const responseTime = Date.now() - startTime

    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      url: service.url,
      responseTime,
    }
  } catch (error) {
    logger.debug(`Health check failed for ${service.name}:`, error)

    return {
      status: 'unhealthy',
      url: service.url,
      responseTime: Date.now() - startTime,
    }
  }
}

async function checkDatabase() {
  // In a real implementation, you would check the actual database connection
  // For now, we'll return a mock healthy status
  return {
    pgsql: {
      status: 'healthy',
      url: `postgresql://${PG_HOST}:${PG_PORT}/${PG_DATABASE}`,
      responseTime: 10,
      resources: ['users', 'gyms', 'sessions', 'bookings'],
    },
    redis: {
      status: 'healthy',
      host: REDIS_HOST,
      port: REDIS_PORT,
      ttl: REDIS_DEFAULT_TTL,
      responseTime: 5,
    },
  }
}

function getMemoryUsage() {
  const memUsage = process.memoryUsage()

  return {
    rss: memUsage.rss,
    heapTotal: memUsage.heapTotal,
    heapUsed: memUsage.heapUsed,
    external: memUsage.external,
    memoryThreshold: HEALTH_CHECK_MEMORY_THRESHOLD,
  }
}

const startTime = Date.now()

export async function handleHealthCheck(req: Request, res: Response) {
  try {
    let servicesHealth: Record<string, any> = {}

    // In embedded mode, all services are healthy if the gateway is running
    if (process.env.EMBEDDED_MODE === 'true') {
      services.forEach((service) => {
        servicesHealth[service.name] = {
          status: 'healthy',
          url: 'embedded',
          responseTime: 0,
        }
      })
    } else {
      // Check all services in parallel (only in non-embedded mode)
      const serviceChecks = await Promise.all(
        services.map(async (service) => ({
          name: service.name,
          result: await checkService(service),
        })),
      )

      // Build services object
      servicesHealth = serviceChecks.reduce(
        (acc, { name, result }) => {
          acc[name] = result

          return acc
        },
        {} as Record<string, any>,
      )
    }

    // Check databases
    const databases = await checkDatabase()

    // Calculate overall status
    const allServices = Object.values(servicesHealth)
    const hasUnhealthy = allServices.some((s: any) => s.status === 'unhealthy')
    const allUnhealthy = allServices.every((s: any) => s.status === 'unhealthy')

    let status: 'healthy' | 'degraded' | 'unhealthy'

    if (allUnhealthy) {
      status = 'unhealthy'
    } else if (hasUnhealthy) {
      status = 'degraded'
    } else {
      status = 'healthy'
    }

    // Build response matching the schema
    const response = {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      memoryUsage: getMemoryUsage(),
      services: servicesHealth,
      databases,
    }

    // Return appropriate status code
    const statusCode = status === 'unhealthy' ? 503 : 200

    res.status(statusCode).json(response)
  } catch (error) {
    logger.error('Health check error:', error)
    res.status(500).json({
      status: 'unhealthy',
      error: 'Failed to perform health check',
      timestamp: new Date().toISOString(),
    })
  }
}
