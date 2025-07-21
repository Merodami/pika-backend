/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Service registration confirmation
 */
export type RegisterServiceResponse = {
  /**
   * Universally Unique Identifier
   */
  instanceId: string
  serviceName: string
  /**
   * ISO 8601 datetime with timezone
   */
  registeredAt: string
  /**
   * ISO 8601 datetime with timezone
   */
  expiresAt: string
  healthCheckUrl?: string
}
