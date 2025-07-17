import { HEALTH_CHECK_MEMORY_THRESHOLD } from '@pika/environment'
import {
  buildHealthReport,
  createSystemHealthCheck,
  executeHealthChecks,
  getCriticalDependencies,
  HealthCheckDependency,
  logger,
} from '@pika/shared'
import { ApplicationError } from '@pika/shared'
import { ErrorCode, getDefaultMessageForError } from '@pika/types-core'
import type { FastifyInstance } from 'fastify'

import { ServiceHealthCheckOptions } from '../../domain/types/healthCheck.js'

/**
 * Sets up health check endpoints for a service
 */
export function setupServiceHealthCheck(
  fastify: FastifyInstance,
  dependencies: HealthCheckDependency[],
  options: ServiceHealthCheckOptions,
): void {
  const {
    serviceName,
    version = process.env.npm_package_version || '0.0.0',
    healthPath = '/health',
    memoryThreshold = HEALTH_CHECK_MEMORY_THRESHOLD,
  } = options

  const startTime = Date.now()

  // Add system check if not already present
  const hasSystemCheck = dependencies.some((dep) => dep.name === 'system')

  if (!hasSystemCheck) {
    dependencies.push({
      name: 'system',
      check: createSystemHealthCheck(memoryThreshold),
      details: {
        type: 'System Resources',
        memoryThreshold: `${memoryThreshold}%`,
      },
    })
  }

  // Main health check endpoint
  fastify.get(healthPath, async (_request, reply) => {
    if (!dependencies || dependencies.length === 0) {
      throw new ApplicationError(
        getDefaultMessageForError(ErrorCode.HEALTH_CHECK_DEPENDENCIES_MISSING),
        {
          code: ErrorCode.HEALTH_CHECK_DEPENDENCIES_MISSING,
          httpStatus: 500,
          source: 'health_check',
          metadata: {
            path: healthPath,
          },
        },
      )
    }

    // Execute all health checks
    const serviceResults = await executeHealthChecks(dependencies, startTime)

    // Build the health report
    const healthReport = buildHealthReport(serviceResults, startTime, version)

    // Return appropriate status code based on health
    const statusCode = healthReport.status === 'unhealthy' ? 503 : 200

    return reply.code(statusCode).send(healthReport)
  })

  // Liveness probe
  fastify.get(`${healthPath}/liveness`, (_request, reply) => {
    return reply.code(200).send({
      status: 'healthy',
      service: serviceName,
      timestamp: new Date().toISOString(),
    })
  })

  // Readiness probe
  fastify.get(`${healthPath}/readiness`, async (_request, reply) => {
    if (!dependencies || dependencies.length === 0) {
      throw new ApplicationError(
        getDefaultMessageForError(ErrorCode.HEALTH_CHECK_DEPENDENCIES_MISSING),
        {
          code: ErrorCode.HEALTH_CHECK_DEPENDENCIES_MISSING,
          httpStatus: 500,
          source: 'health_check',
          metadata: {
            path: healthPath,
          },
        },
      )
    }

    // Get critical dependencies
    const criticalDeps = getCriticalDependencies(dependencies)

    // Execute health checks for critical dependencies
    const serviceResults = await executeHealthChecks(criticalDeps, startTime)

    // Determine overall status
    const overallStatus = serviceResults.some(
      (svc) => svc.status === 'unhealthy',
    )
      ? 'unhealthy'
      : 'healthy'

    // Return appropriate status code
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200

    return reply.code(statusCode).send({
      status: overallStatus,
      service: serviceName,
      timestamp: new Date().toISOString(),
    })
  })

  logger.info(`Health check endpoints configured at ${healthPath}`)
}
