/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Available endpoints for a service
 */
export type ServiceEndpointsResponse = {
  serviceName: string
  instances: Array<{
    instanceId: string
    endpoints: Array<{
      protocol: 'http' | 'https' | 'tcp' | 'grpc'
      host: string
      port: number
      path?: string
      healthCheckPath?: string
    }>
    status: 'STARTING' | 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'STOPPED'
    /**
     * ISO 8601 datetime with timezone
     */
    lastSeen: string
    loadBalanceWeight?: number
  }>
  loadBalancingStrategy?: 'ROUND_ROBIN' | 'LEAST_CONNECTIONS' | 'WEIGHTED'
}
