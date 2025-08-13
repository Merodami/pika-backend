import { z } from 'zod'

import { DateTime } from './primitives.js'

/**
 * Common health check schemas used across APIs
 */

// ============= Health Status =============

/**
 * Health status enum (raw Zod)
 */
export const HealthStatus = z.enum(['healthy', 'degraded', 'unhealthy'])

/**
 * Health status enum (OpenAPI documented)
 */
export const HealthStatusSchema = HealthStatus.openapi('HealthStatus', {
  description: 'Service health status',
  example: 'healthy',
})

export type HealthStatus = z.infer<typeof HealthStatus>

// ============= Service Health =============

/**
 * Individual service health (raw Zod)
 */
export const ServiceHealth = z.object({
  status: HealthStatus,
  url: z.string().describe('Service URL'),
  responseTime: z.number().describe('Response time in milliseconds'),
})

/**
 * Individual service health (OpenAPI documented)
 */
export const ServiceHealthSchema = ServiceHealth.openapi('ServiceHealth', {
  description: 'Health status of an individual service',
  example: {
    status: 'healthy',
    url: 'http://localhost:5021',
    responseTime: 45,
  },
})

export type ServiceHealth = z.infer<typeof ServiceHealth>

// ============= Simple Health Check =============

/**
 * Simple health check response (raw Zod)
 */
export const SimpleHealthCheckResponse = z.object({
  status: HealthStatus,
  timestamp: DateTime,
  service: z.string().describe('Service name'),
  version: z.string().optional(),
})

/**
 * Simple health check response (OpenAPI documented)
 */
export const SimpleHealthCheckResponseSchema =
  SimpleHealthCheckResponse.openapi('SimpleHealthCheckResponse', {
    description: 'Simple health check response',
    example: {
      status: 'healthy',
      timestamp: '2024-01-01T12:00:00.000Z',
      service: 'user-service',
      version: '1.0.0',
    },
  })

export type SimpleHealthCheckResponse = z.infer<
  typeof SimpleHealthCheckResponse
>
