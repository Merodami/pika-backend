/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User information from access token
 */
export type UserInfoResponse = {
  /**
   * User ID
   */
  id: string
  email: string
  emailVerified?: boolean
  firstName: string
  lastName: string
  /**
   * Combined first and last name
   */
  fullName?: string
  profilePicture?: string
  role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS'
  /**
   * User permissions
   */
  permissions?: Array<string>
  /**
   * User locale
   */
  locale?: string
  createdAt?: string
  updatedAt?: string
}
