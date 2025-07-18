/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise'
import { OpenAPI } from '../core/OpenAPI'
import { request as __request } from '../core/request'
export class AuthServiceService {
  /**
   * Validate JWT token
   * @returns any Token validation result
   * @throws ApiError
   */
  public static postAuthValidateToken({
    requestBody,
  }: {
    requestBody?: {
      token: string
      checkExpiry?: boolean
      requiredRoles?: Array<string>
    }
  }): CancelablePromise<{
    valid: boolean
    userId?: string
    email?: string
    roles: Array<string>
    permissions: Array<string>
    /**
     * ISO 8601 datetime with timezone
     */
    expiresAt?: string
    metadata?: Record<string, any>
  }> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/auth/validate-token',
      body: requestBody,
      mediaType: 'application/json',
    })
  }
  /**
   * Get user by email
   * @returns any User details
   * @throws ApiError
   */
  public static postAuthUserByEmail({
    requestBody,
  }: {
    requestBody?: {
      email: string
    }
  }): CancelablePromise<{
    id: string
    email: string
    emailVerified: boolean
    roles: Array<string>
    active: boolean
    /**
     * ISO 8601 datetime with timezone
     */
    lastLoginAt?: string
    /**
     * ISO 8601 datetime with timezone
     */
    createdAt: string
  }> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/auth/user-by-email',
      body: requestBody,
      mediaType: 'application/json',
      errors: {
        404: `User not found`,
      },
    })
  }
}
