/**
 * System and infrastructure related enums
 */

/**
 * System component types for monitoring
 */
export enum SystemComponentType {
  API_GATEWAY = 'apiGateway',
  DATABASE = 'database',
  CACHE = 'cache',
  MESSAGE_QUEUE = 'messageQueue',
  STORAGE = 'storage',
  EMAIL = 'email',
  SMS = 'sms',
  MONITORING = 'monitoring',
}

/**
 * Maintenance types for system operations
 */
export enum MaintenanceType {
  SCHEDULED = 'scheduled',
  EMERGENCY = 'emergency',
  UPGRADE = 'upgrade',
  PATCH = 'patch',
  ROLLBACK = 'rollback',
}

/**
 * Maintenance status tracking
 */
export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * System metric types for monitoring
 */
export enum SystemMetricType {
  CPU_USAGE = 'cpuUsage',
  MEMORY_USAGE = 'memoryUsage',
  DISK_USAGE = 'diskUsage',
  NETWORK_IO = 'networkIo',
  REQUEST_COUNT = 'requestCount',
  RESPONSE_TIME = 'responseTime',
  ERROR_RATE = 'errorRate',
  ACTIVE_CONNECTIONS = 'activeConnections',
}
