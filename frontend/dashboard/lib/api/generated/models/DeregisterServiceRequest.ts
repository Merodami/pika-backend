/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Deregister service instance
 */
export type DeregisterServiceRequest = {
  reason?: 'SHUTDOWN' | 'MAINTENANCE' | 'ERROR' | 'SCALE_DOWN'
  gracefulShutdown?: boolean
  drainConnections?: boolean
  drainTimeoutSeconds?: number
}
