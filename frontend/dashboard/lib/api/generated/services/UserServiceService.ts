/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { CancelablePromise } from '../core/CancelablePromise'
import { OpenAPI } from '../core/OpenAPI'
import { request as __request } from '../core/request'
export class UserServiceService {
  /**
   * Get user details
   * @returns any User details
   * @throws ApiError
   */
  public static getUsers({ id }: { id: string }): CancelablePromise<{
    id: string
    email: string
    firstName: string
    lastName: string
    phoneNumber?: string
    isActive: boolean
    isVerified: boolean
    role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS'
    /**
     * ISO 8601 datetime with timezone
     */
    createdAt: string
    canMakePayments?: boolean
    canBookSessions?: boolean
    hasValidSubscription?: boolean
    stripeCustomerId?: string
    language?: string
    timezone?: string
    notificationPreferences: {
      email?: boolean
      push?: boolean
      sms?: boolean
    }
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/users/{id}',
      path: {
        id: id,
      },
      errors: {
        404: `User not found`,
      },
    })
  }
  /**
   * Get multiple users
   * @returns any User list
   * @throws ApiError
   */
  public static postUsersBatch({
    requestBody,
  }: {
    requestBody?: {
      userIds: Array<string>
      /**
       * Specific fields to return
       */
      fields?: Array<string>
    }
  }): CancelablePromise<
    Array<{
      id: string
      email: string
      firstName: string
      lastName: string
      phoneNumber?: string
      isActive: boolean
      isVerified: boolean
      role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS'
      /**
       * ISO 8601 datetime with timezone
       */
      createdAt: string
      canMakePayments?: boolean
      canBookSessions?: boolean
      hasValidSubscription?: boolean
      stripeCustomerId?: string
      language?: string
      timezone?: string
      notificationPreferences: {
        email?: boolean
        push?: boolean
        sms?: boolean
      }
    }>
  > {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/users/batch',
      body: requestBody,
      mediaType: 'application/json',
    })
  }
}
