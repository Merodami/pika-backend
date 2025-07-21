/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { CancelablePromise } from '../core/CancelablePromise'
import { OpenAPI } from '../core/OpenAPI'
import { request as __request } from '../core/request'
export class HealthService {
  /**
   * Service health check
   * @returns any Service is healthy
   * @throws ApiError
   */
  public static getHealth(): CancelablePromise<{
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
    /**
     * Service URL
     */
    url: string
    /**
     * Response time in milliseconds
     */
    responseTime: number
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/health',
    })
  }
}
