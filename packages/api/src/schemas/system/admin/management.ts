import { ServiceEnvironment as ServiceEnvironmentEnum } from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { DateTime } from '../../shared/primitives.js'

/**
 * System service admin management schemas
 *
 * Basic admin functionality for system monitoring and configuration
 */

// ============= System Information =============

export const SystemInfoResponse = z.object({
  environment: createZodEnum(ServiceEnvironmentEnum),
  version: z.string(),
  buildNumber: z.string().optional(),
  deployedAt: DateTime,
  nodeVersion: z.string(),
  uptime: z.number().describe('Server uptime in seconds'),
})

export const SystemInfoResponseSchema = SystemInfoResponse.openapi(
  'SystemInfoResponse',
  {
    description: 'Basic system information',
  },
)
export type SystemInfoResponse = z.infer<typeof SystemInfoResponse>

// ============= Cache Management =============

export const ClearCacheRequest = z.object({
  pattern: z
    .string()
    .optional()
    .describe('Cache key pattern to clear (e.g., "user:*")'),
})

export const ClearCacheRequestSchema = ClearCacheRequest.openapi(
  'ClearCacheRequest',
  {
    description: 'Clear cache entries',
  },
)
export type ClearCacheRequest = z.infer<typeof ClearCacheRequest>

export const CacheStatsResponse = z.object({
  hitRate: z.number().min(0).max(100).describe('Cache hit rate percentage'),
  totalKeys: z.number().int().nonnegative(),
  memoryUsage: z.number().int().nonnegative().describe('Memory usage in bytes'),
  evictions: z.number().int().nonnegative(),
})

export const CacheStatsResponseSchema = CacheStatsResponse.openapi(
  'CacheStatsResponse',
  {
    description: 'Cache statistics',
  },
)
export type CacheStatsResponse = z.infer<typeof CacheStatsResponse>

// ============= Basic Actions =============

export const SystemActionResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: DateTime,
})

export const SystemActionResponseSchema = SystemActionResponse.openapi(
  'SystemActionResponse',
  {
    description: 'System action result',
  },
)
export type SystemActionResponse = z.infer<typeof SystemActionResponse>
