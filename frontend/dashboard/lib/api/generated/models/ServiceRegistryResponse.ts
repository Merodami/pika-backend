/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * List of registered services
 */
export type ServiceRegistryResponse = {
  services: Array<{
    /**
     * Universally Unique Identifier
     */
    id: string
    serviceName: string
    serviceType:
      | 'API_GATEWAY'
      | 'MICROSERVICE'
      | 'DATABASE'
      | 'CACHE'
      | 'QUEUE'
      | 'STORAGE'
      | 'MONITORING'
    version: string
    instanceId: string
    endpoints: Array<{
      protocol: 'http' | 'https' | 'tcp' | 'grpc'
      host: string
      port: number
      path?: string
      healthCheckPath?: string
    }>
    environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'TEST'
    region?: string
    availabilityZone?: string
    status: 'STARTING' | 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'STOPPED'
    /**
     * ISO 8601 datetime with timezone
     */
    lastHealthCheck?: string
    healthCheckUrl?: string
    metadata?: Record<string, string>
    tags?: Array<string>
    metrics?: {
      cpuUsage?: number
      memoryUsage?: number
      diskUsage?: number
      requestCount?: number
      errorRate?: number
      responseTime?: number
    }
    registeredBy?: string
    /**
     * ISO 8601 datetime with timezone
     */
    lastSeen: string
    ttl?: number
    /**
     * When the record was created
     */
    createdAt: string
    /**
     * When the record was last updated
     */
    updatedAt: string
  }>
  totalCount: number
  /**
   * ISO 8601 datetime with timezone
   */
  lastUpdated: string
}
