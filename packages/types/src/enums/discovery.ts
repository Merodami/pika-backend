/**
 * Service discovery related enums
 */

/**
 * Service status values
 */
export enum ServiceStatus {
  STARTING = 'starting',
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  STOPPED = 'stopped',
}

/**
 * Service types
 */
export enum ServiceType {
  API_GATEWAY = 'apiGateway',
  MICROSERVICE = 'microservice',
  DATABASE = 'database',
  CACHE = 'cache',
  QUEUE = 'queue',
  STORAGE = 'storage',
  MONITORING = 'monitoring',
}

/**
 * Environment types
 */
export enum EnvironmentType {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * Load balancing strategies
 */
export enum LoadBalancingStrategy {
  ROUND_ROBIN = 'roundRobin',
  LEAST_CONNECTIONS = 'leastConnections',
  WEIGHTED = 'weighted',
}

/**
 * Service deregistration reasons
 */
export enum DeregistrationReason {
  SHUTDOWN = 'shutdown',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  SCALE_DOWN = 'scaleDown',
}

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'halfOpen',
}

/**
 * Health check status
 */
export enum HealthCheckStatus {
  PASS = 'pass',
  FAIL = 'fail',
  WARN = 'warn',
}

/**
 * Network protocols for service endpoints
 */
export enum NetworkProtocol {
  HTTP = 'http',
  HTTPS = 'https',
  TCP = 'tcp',
  GRPC = 'grpc',
}
