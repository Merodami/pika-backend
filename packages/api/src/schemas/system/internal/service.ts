import { HealthStatus as HealthStatusEnum } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { DateTime } from '../../shared/primitives.js'

/**
 * Internal system service schemas for service-to-service communication
 *
 * Basic internal health check and system status functionality
 */

// ============= Service Health =============

export const InternalHealthCheckResponse = openapi(
  z.object({
    service: z.string(),
    status: createZodEnum(HealthStatusEnum),
    timestamp: DateTime,
    uptime: z.number().describe('Service uptime in seconds'),
    version: z.string().optional(),
  }),
  {
    description: 'Internal service health check response',
  },
)
export type InternalHealthCheckResponse = z.infer<
  typeof InternalHealthCheckResponse
>

// ============= Resource Status =============

export const ResourceStatusResponse = openapi(
  z.object({
    database: z.object({
      status: createZodEnum(HealthStatusEnum),
      responseTime: z.number().describe('Response time in milliseconds'),
      activeConnections: z.number().int().nonnegative(),
    }),
    cache: z.object({
      status: createZodEnum(HealthStatusEnum),
      responseTime: z.number().describe('Response time in milliseconds'),
      memoryUsage: z.number().describe('Memory usage percentage'),
    }),
  }),
  {
    description: 'Resource status for internal monitoring',
  },
)
export type ResourceStatusResponse = z.infer<typeof ResourceStatusResponse>
