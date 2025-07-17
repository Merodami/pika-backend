import { ICacheService } from '@pika/redis/src/domain/repositories/ICacheService.js'

// No custom language option types - we'll use boolean only
import { HealthCheckConfig } from './healthCheck.js'
import { IdempotencyConfig } from './idempotency.js'

export interface ApiTokenOptions {
  /**
   * The secret key used to verify the API token.
   */
  secret: string

  /**
   * The name of the header that contains the API token.
   */
  headerName?: string

  /**
   * The paths that should be excluded from authentication.
   */
  excludePaths?: string[]

  /**
   * Optional Redis cache service for token blacklisting and session management
   */
  cacheService?: ICacheService
}

export interface ServerOptions {
  serviceName: string
  port: number
  jwtSecret?: string
  rateLimit?: {
    max: number
    timeWindow: string
  }
  healthChecks: HealthCheckConfig[]
  cacheService?: ICacheService
  /**
   * Enable @fastify/accepts for content negotiation via HTTP headers
   *
   * If true, the @fastify/accepts plugin will be registered
   * This adds methods like request.accepts() and request.language() to negotiate content types
   */
  languageOptions?: boolean
  /**
   * Skip automatic auth plugin registration
   * Useful when services need to register auth manually with custom configuration
   */
  skipAuthRegistration?: boolean
  /**
   * Authentication configuration options
   */
  authOptions?: {
    /**
     * Additional paths to exclude from authentication
     * Default paths like /health and /auth/* are always excluded
     */
    excludePaths?: string[]
  }
  /**
   * Idempotency configuration options
   */
  idempotencyOptions?: Partial<IdempotencyConfig>
}
