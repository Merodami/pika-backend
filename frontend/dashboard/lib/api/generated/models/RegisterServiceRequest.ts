/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Register a service instance
 */
export type RegisterServiceRequest = {
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
  healthCheckUrl?: string
  healthCheckInterval?: number
  metadata?: Record<string, string>
  tags?: Array<string>
  ttl?: number
  autoDeregister?: boolean
}
