/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { CancelablePromise } from '../core/CancelablePromise'
import { OpenAPI } from '../core/OpenAPI'
import { request as __request } from '../core/request'
export class CommunicationManagementService {
  /**
   * Seed default email/SMS templates
   * @returns any Templates seeded successfully
   * @throws ApiError
   */
  public static postTemplatesSeed(): CancelablePromise<{
    created: number
    message: string
  }> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/templates/seed',
    })
  }
}
