import { Static, Type } from '@sinclair/typebox'

// Environment variables
const HEALTH_CHECK_MEMORY_THRESHOLD = parseInt(
  process.env.HEALTH_CHECK_MEMORY_THRESHOLD || '15',
  10,
)
const REDIS_DEFAULT_TTL = parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10)

// --------------------------------
// Schema Definitions
// --------------------------------

/**
 * Health Status Enum Schema
 */
export const HealthStatusSchema = Type.Enum(
  {
    healthy: 'healthy',
    degraded: 'degraded',
    unhealthy: 'unhealthy',
  },
  {
    description: 'Health status of a service or component',
    $id: '#/components/schemas/HealthStatus',
  },
)
export type HealthStatus = Static<typeof HealthStatusSchema>
export const HealthStatusRef = Type.Ref('#/components/schemas/HealthStatus')

/**
 * Memory Usage Schema
 */
export const MemoryUsageSchema = Type.Object(
  {
    rss: Type.Number({
      description: 'Resident Set Size - memory allocated in bytes',
    }),
    heap_total: Type.Number({
      description: 'Total size of allocated heap in bytes',
    }),
    heap_used: Type.Number({
      description: 'Actual memory used in bytes',
    }),
    external: Type.Number({
      description: 'Memory used by C++ objects bound to JavaScript',
    }),
    memory_threshold: Type.Number({
      description: `Memory threshold in percentage (${HEALTH_CHECK_MEMORY_THRESHOLD}%)`,
    }),
  },
  {
    description: 'Memory usage information',
    $id: '#/components/schemas/MemoryUsage',
  },
)
export type MemoryUsage = Static<typeof MemoryUsageSchema>
export const MemoryUsageRef = Type.Ref('#/components/schemas/MemoryUsage')

/**
 * Service Health Schema
 */
export const ServiceHealthSchema = Type.Object(
  {
    status: HealthStatusRef,
    url: Type.String({
      description: 'Service URL',
    }),
    response_time: Type.Number({
      description: 'Response time in milliseconds',
    }),
  },
  {
    description: 'Health information for a service',
    $id: '#/components/schemas/ServiceHealth',
  },
)
export type ServiceHealth = Static<typeof ServiceHealthSchema>
export const ServiceHealthRef = Type.Ref('#/components/schemas/ServiceHealth')

/**
 * Services Health Schema
 */
export const ServicesHealthSchema = Type.Object(
  {
    voucher: ServiceHealthRef,
    redemption: ServiceHealthRef,
    user: ServiceHealthRef,
    category: ServiceHealthRef,
    notification: ServiceHealthRef,
    review: ServiceHealthRef,
  },
  {
    description: 'Health information for all voucher platform services',
    $id: '#/components/schemas/ServicesHealth',
  },
)
export type ServicesHealth = Static<typeof ServicesHealthSchema>
export const ServicesHealthRef = Type.Ref('#/components/schemas/ServicesHealth')

/**
 * PostgreSQL Health Schema
 */
export const PostgreSQLHealthSchema = Type.Object(
  {
    status: HealthStatusRef,
    url: Type.String({
      description: 'Database connection URL (masked)',
    }),
    response_time: Type.Number({
      description: 'Response time in milliseconds',
    }),
    resources: Type.Array(Type.String(), {
      description: 'Available resources',
    }),
  },
  {
    description: 'PostgreSQL health information',
    $id: '#/components/schemas/PostgreSQLHealth',
  },
)
export type PostgreSQLHealth = Static<typeof PostgreSQLHealthSchema>
export const PostgreSQLHealthRef = Type.Ref(
  '#/components/schemas/PostgreSQLHealth',
)

/**
 * Redis Health Schema
 */
export const RedisHealthSchema = Type.Object(
  {
    status: HealthStatusRef,
    host: Type.String({
      description: `Redis host`,
    }),
    port: Type.Number({
      description: `Redis port`,
    }),
    ttl: Type.Number({
      description: `Default TTL (${REDIS_DEFAULT_TTL}s)`,
    }),
    response_time: Type.Number({
      description: 'Response time in milliseconds',
    }),
  },
  {
    description: 'Redis health information',
    $id: '#/components/schemas/RedisHealth',
  },
)
export type RedisHealth = Static<typeof RedisHealthSchema>
export const RedisHealthRef = Type.Ref('#/components/schemas/RedisHealth')

/**
 * Databases Health Schema
 */
export const DatabasesHealthSchema = Type.Object(
  {
    pgsql: PostgreSQLHealthRef,
    redis: RedisHealthRef,
  },
  {
    description: 'Health information for all databases',
    $id: '#/components/schemas/DatabasesHealth',
  },
)
export type DatabasesHealth = Static<typeof DatabasesHealthSchema>
export const DatabasesHealthRef = Type.Ref(
  '#/components/schemas/DatabasesHealth',
)

/**
 * Queue Schema
 */
export const QueueSchema = Type.Object(
  {
    name: Type.String({
      description: 'Queue name',
    }),
    message_count: Type.Number({
      description: 'Number of messages in queue',
    }),
  },
  {
    description: 'Message queue information',
    $id: '#/components/schemas/Queue',
  },
)
export type Queue = Static<typeof QueueSchema>
export const QueueRef = Type.Ref('#/components/schemas/Queue')

/**
 * Event Bus Health Schema
 */
export const EventBusHealthSchema = Type.Object(
  {
    status: HealthStatusRef,
    host: Type.String({
      description: `Event Bus host`,
    }),
    port: Type.Number({
      description: `Event Bus port`,
    }),
    queues: Type.Array(QueueRef, {
      description: 'Queues in Event Bus',
    }),
  },
  {
    description: 'Event Bus health information',
    $id: '#/components/schemas/EventBusHealth',
  },
)
export type EventBusHealth = Static<typeof EventBusHealthSchema>
export const EventBusHealthRef = Type.Ref('#/components/schemas/EventBusHealth')

/**
 * Message Queue Health Schema
 */
export const MessageQueueHealthSchema = Type.Object(
  {
    event_bus: EventBusHealthRef,
  },
  {
    description: 'Health information for message queues',
    $id: '#/components/schemas/MessageQueueHealth',
  },
)
export type MessageQueueHealth = Static<typeof MessageQueueHealthSchema>
export const MessageQueueHealthRef = Type.Ref(
  '#/components/schemas/MessageQueueHealth',
)

/**
 * Health Check Response Schema
 */
export const HealthCheckResponseSchema = Type.Object(
  {
    status: HealthStatusRef,
    timestamp: Type.String({
      format: 'date-time',
      description: 'The current server time',
    }),
    version: Type.String({
      description: 'API version',
    }),
    uptime: Type.Number({
      description: 'Server uptime in seconds',
    }),
    memory_usage: MemoryUsageRef,
    services: ServicesHealthRef,
    databases: DatabasesHealthRef,
    message_queue: MessageQueueHealthRef,
  },
  {
    description: 'Health check response',
    $id: '#/components/schemas/HealthCheckResponse',
  },
)
export type HealthCheckResponse = Static<typeof HealthCheckResponseSchema>
export const HealthCheckResponseRef = Type.Ref(
  '#/components/schemas/HealthCheckResponse',
)

/**
 * API Documentation Response Schema
 */
export const APIDocsResponseSchema = Type.Object(
  {
    openapi: Type.String(),
    info: Type.Object({}),
    paths: Type.Object({}),
    components: Type.Object({}),
  },
  {
    description: 'OpenAPI documentation',
    $id: '#/components/schemas/APIDocsResponse',
  },
)
export type APIDocsResponse = Static<typeof APIDocsResponseSchema>
export const APIDocsResponseRef = Type.Ref(
  '#/components/schemas/APIDocsResponse',
)
