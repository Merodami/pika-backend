/**
 * User Context Types and Enums
 */

import type { UserContext } from '@pika/types'
import type { UserServiceClient } from '@pika/shared'
import type { ICacheService } from '@pika/redis'

/**
 * Strategy for obtaining user context
 *
 * This allows the same code to work in different deployment modes
 */
export enum UserContextStrategy {
  /**
   * Gateway mode: Fetch from User Service and enrich headers
   * Used by: API Gateway
   */
  ENRICH = 'enrich',

  /**
   * Service mode: Read from headers only
   * Used by: Microservices behind gateway
   */
  CONSUME = 'consume',

  /**
   * Direct mode: Always fetch from database
   * Used by: Embedded deployments (Vercel)
   */
  DIRECT = 'direct',

  /**
   * Hybrid mode: Read from headers if available, otherwise fetch
   * Used by: Services that can run standalone or behind gateway
   */
  HYBRID = 'hybrid',

  /**
   * Test mode: Use mock data
   * Used by: Unit tests
   */
  TEST = 'test',
}

/**
 * Configuration for user context middleware
 */
export interface UserContextConfig {
  strategy: UserContextStrategy
  userServiceClient?: UserServiceClient
  cacheService?: ICacheService
  cacheTTL?: number
  testData?: Partial<UserContext>
  fallbackToJWT?: boolean
  enableMetrics?: boolean
}

/**
 * Headers used for context propagation
 */
export const CONTEXT_HEADERS = {
  USER_ID: 'x-user-id',
  USER_ROLE: 'x-user-role',
  USER_EMAIL: 'x-user-email',
  USER_PERMISSIONS: 'x-user-permissions',
  BUSINESS_ID: 'x-business-id',
  USER_LANGUAGE: 'x-user-language',
  USER_STATUS: 'x-user-status',
  SESSION_ID: 'x-session-id',
  DEVICE_ID: 'x-device-id',
} as const
