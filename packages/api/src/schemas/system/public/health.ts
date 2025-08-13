import { z } from 'zod'
import {
  HealthStatus,
  ServiceHealth,
  SimpleHealthCheckResponse,
} from '../../shared/health.js'

/**
 * Health check and system schemas for public API
 */

// Re-export common health schemas
export { HealthStatus, ServiceHealth, SimpleHealthCheckResponse }

// ============= Constants =============

const HEALTH_CHECK_MEMORY_THRESHOLD = parseInt(
  process.env.HEALTH_CHECK_MEMORY_THRESHOLD || '15',
  10,
)
const REDIS_DEFAULT_TTL = parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10)

// ============= Memory Usage =============

/**
 * Memory usage information (raw Zod)
 */
export const MemoryUsage = z.object({
  rss: z.number().describe('Resident Set Size - memory allocated in bytes'),
  heapTotal: z.number().describe('Total size of allocated heap in bytes'),
  heapUsed: z.number().describe('Actual memory used in bytes'),
  external: z
    .number()
    .describe('Memory used by C++ objects bound to JavaScript'),
  memoryThreshold: z
    .number()
    .describe(
      `Memory threshold in percentage (${HEALTH_CHECK_MEMORY_THRESHOLD}%)`,
    ),
})

/**
 * Memory usage information (OpenAPI documented)
 */
export const MemoryUsageSchema = MemoryUsage.openapi('MemoryUsage', {
  description: 'Memory usage information',
})

export type MemoryUsage = z.infer<typeof MemoryUsage>

// ServiceHealth is imported from common schemas

/**
 * All services health (raw Zod)
 */
export const ServicesHealth = z.object({
  auth: ServiceHealth,
  user: ServiceHealth,
  business: ServiceHealth,
  category: ServiceHealth,
  payment: ServiceHealth,
  subscription: ServiceHealth,
  communication: ServiceHealth,
  support: ServiceHealth,
  storage: ServiceHealth,
  pdf: ServiceHealth,
  voucher: ServiceHealth,
})

/**
 * All services health (OpenAPI documented)
 */
export const ServicesHealthSchema = ServicesHealth.openapi('ServicesHealth', {
  description: 'Health status of all services',
})

export type ServicesHealth = z.infer<typeof ServicesHealth>

// ============= Database Health =============

/**
 * PostgreSQL health (raw Zod)
 */
export const PostgreSQLHealth = z.object({
  status: HealthStatus,
  url: z.string().describe('Database connection URL (masked)'),
  responseTime: z.number().describe('Response time in milliseconds'),
  resources: z.array(z.string()).describe('Available resources'),
})

/**
 * PostgreSQL health (OpenAPI documented)
 */
export const PostgreSQLHealthSchema = PostgreSQLHealth.openapi('PostgreSQLHealth', {
  description: 'PostgreSQL database health status',
})

export type PostgreSQLHealth = z.infer<typeof PostgreSQLHealth>

/**
 * Redis health (raw Zod)
 */
export const RedisHealth = z.object({
  status: HealthStatus,
  host: z.string().describe('Redis host'),
  port: z.number().describe('Redis port'),
  ttl: z.number().describe(`Default TTL (${REDIS_DEFAULT_TTL}s)`),
  responseTime: z.number().describe('Response time in milliseconds'),
})

/**
 * Redis health (OpenAPI documented)
 */
export const RedisHealthSchema = RedisHealth.openapi('RedisHealth', {
  description: 'Redis cache health status',
})

export type RedisHealth = z.infer<typeof RedisHealth>

/**
 * All databases health (raw Zod)
 */
export const DatabasesHealth = z.object({
  pgsql: PostgreSQLHealth,
  redis: RedisHealth,
})

/**
 * All databases health (OpenAPI documented)
 */
export const DatabasesHealthSchema = DatabasesHealth.openapi('DatabasesHealth', {
  description: 'Health status of all databases',
})

export type DatabasesHealth = z.infer<typeof DatabasesHealth>

// ============= Message Queue Health =============

/**
 * Queue information (raw Zod)
 */
export const Queue = z.object({
  name: z.string().describe('Queue name'),
  messageCount: z.number().describe('Number of messages in queue'),
})

/**
 * Queue information (OpenAPI documented)
 */
export const QueueSchema = Queue.openapi('Queue', {
  description: 'Message queue information',
})

export type Queue = z.infer<typeof Queue>

/**
 * Event bus health (raw Zod)
 */
export const EventBusHealth = z.object({
  status: HealthStatus,
  host: z.string().describe('Event Bus host'),
  port: z.number().describe('Event Bus port'),
  queues: z.array(Queue).describe('Queues in Event Bus'),
})

/**
 * Event bus health (OpenAPI documented)
 */
export const EventBusHealthSchema = EventBusHealth.openapi('EventBusHealth', {
  description: 'Event bus health status',
})

export type EventBusHealth = z.infer<typeof EventBusHealth>

/**
 * Message queue health (raw Zod)
 */
export const MessageQueueHealth = z.object({
  eventBus: EventBusHealth,
})

/**
 * Message queue health (OpenAPI documented)
 */
export const MessageQueueHealthSchema = MessageQueueHealth.openapi('MessageQueueHealth', {
  description: 'Message queue system health',
})

export type MessageQueueHealth = z.infer<typeof MessageQueueHealth>

// ============= Health Check Response =============

/**
 * Complete health check response (raw Zod)
 */
export const HealthCheckResponse = z.object({
  status: HealthStatus,
  timestamp: z.string().datetime().describe('The current server time'),
  version: z.string().describe('API version'),
  uptime: z.number().describe('Server uptime in seconds'),
  memoryUsage: MemoryUsage,
  services: ServicesHealth,
  databases: DatabasesHealth,
  messageQueue: MessageQueueHealth.optional(),
})

/**
 * Complete health check response (OpenAPI documented)
 */
export const HealthCheckResponseSchema = HealthCheckResponse.openapi(
  'HealthCheckResponse',
  {
    description: 'Complete system health check response',
  },
)

export type HealthCheckResponse = z.infer<typeof HealthCheckResponse>

// ============= API Documentation =============

/**
 * API documentation response (raw Zod)
 */
export const APIDocsResponse = z.object({
  openapi: z.string(),
  info: z.record(z.string(), z.any()),
  paths: z.record(z.string(), z.any()),
  components: z.record(z.string(), z.any()),
})

/**
 * API documentation response (OpenAPI documented)
 */
export const APIDocsResponseSchema = APIDocsResponse.openapi(
  'APIDocsResponse',
  {
    description: 'OpenAPI documentation',
  },
)

export type APIDocsResponse = z.infer<typeof APIDocsResponse>
