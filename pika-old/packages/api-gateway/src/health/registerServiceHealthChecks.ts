import type { HealthCheckConfig } from '@pika/http'
import { logger } from '@pika/shared'

/**
 * Register health checks for all services
 * @param isLocalDev - Whether running in development mode
 * @returns Array of health check configurations
 */
export async function registerServiceHealthChecks(
  isLocalDev: boolean,
): Promise<HealthCheckConfig[]> {
  const healthChecks: HealthCheckConfig[] = []

  // ToDo: adapt to new code
  logger.debug('Registering service health checks', {
    component: 'api-gateway',
    operation: 'health-checks',
    isLocalDev,
  })
  // // Add health checks for each service
  // const services = [
  //   // ToDo: adapt to new code
  //   // {
  //   //   name: 'books',
  //   //   url: process.env.BOOKS_API_URL ?? 'http://localhost:3001',
  //   // },
  // ]

  // for (const service of services) {
  //   healthChecks.push({
  //     name: `${service.name}-service`,
  //     check: async () => {
  //       try {
  //         const response = await fetch(`${service.url}/health`)

  //         return response.ok
  //       } catch (error) {
  //         if (isLocalDev) {
  //           logger.warn(`Health check failed for ${service.name}:`, error)
  //         }

  //         return false
  //       }
  //     },
  //     details: {
  //       type: 'Service',
  //       essential: true,
  //     },
  //   })
  // }

  return healthChecks
}
