import { z } from 'zod'

import { DateTime } from '../../common/schemas/primitives.js'
import { openapi } from '../../common/utils/openapi.js'

/**
 * Internal service health schemas
 */

export const ServiceHealth = openapi(
  z.object({
    service: z.string(),
    status: z.enum(['HEALTHY', 'DEGRADED', 'UNHEALTHY']),
    version: z.string(),
    uptime: z.number().int().nonnegative().describe('Uptime in seconds'),
    timestamp: DateTime,
    checks: z.object({
      database: z.object({
        status: z.enum(['HEALTHY', 'UNHEALTHY']),
        latency: z.number().optional(),
      }),
      redis: z.object({
        status: z.enum(['HEALTHY', 'UNHEALTHY']),
        latency: z.number().optional(),
      }),
    }),
  }),
  {
    description: 'Service health check response',
    example: {
      service: 'user-service',
      status: 'HEALTHY',
      version: '1.0.0',
      uptime: 3600,
      timestamp: new Date(),
      checks: {
        database: {
          status: 'HEALTHY',
          latency: 5,
        },
        redis: {
          status: 'HEALTHY',
          latency: 2,
        },
      },
    },
  },
)

export type ServiceHealth = z.infer<typeof ServiceHealth>
