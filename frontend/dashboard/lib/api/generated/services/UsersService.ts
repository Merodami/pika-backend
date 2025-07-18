/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise'
import { OpenAPI } from '../core/OpenAPI'
import { request as __request } from '../core/request'
export class UsersService {
  /**
   * Get current user profile
   * @returns any User profile
   * @throws ApiError
   */
  public static getUsersProfile(): CancelablePromise<{
    id: string
    email: string
    firstName: string
    lastName: string
    displayName?: string
    /**
     * Phone number in E.164 format
     */
    phoneNumber?: string
    avatarUrl?: string
    bio?: string
    /**
     * Date in YYYY-MM-DD format
     */
    dateOfBirth?: string
    preferredLanguage?: string
    role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS'
    emailVerified: boolean
    phoneVerified?: boolean
    /**
     * ISO 8601 datetime with timezone
     */
    createdAt: string
    /**
     * ISO 8601 datetime with timezone
     */
    updatedAt: string
  }> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/users/profile',
      errors: {
        401: `Unauthorized`,
      },
    })
  }
  /**
   * Update user profile
   * @returns any Updated profile
   * @throws ApiError
   */
  public static patchUsersProfile({
    requestBody,
  }: {
    requestBody?: {
      firstName?: string
      lastName?: string
      displayName?: string
      /**
       * Phone number in E.164 format
       */
      phoneNumber?: string
      bio?: string
      /**
       * Date in YYYY-MM-DD format
       */
      dateOfBirth?: string
      preferredLanguage?: string
    }
  }): CancelablePromise<{
    id: string
    email: string
    firstName: string
    lastName: string
    displayName?: string
    /**
     * Phone number in E.164 format
     */
    phoneNumber?: string
    avatarUrl?: string
    bio?: string
    /**
     * Date in YYYY-MM-DD format
     */
    dateOfBirth?: string
    preferredLanguage?: string
    role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS'
    emailVerified: boolean
    phoneVerified?: boolean
    /**
     * ISO 8601 datetime with timezone
     */
    createdAt: string
    /**
     * ISO 8601 datetime with timezone
     */
    updatedAt: string
  }> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/users/profile',
      body: requestBody,
      mediaType: 'application/json',
    })
  }
}
