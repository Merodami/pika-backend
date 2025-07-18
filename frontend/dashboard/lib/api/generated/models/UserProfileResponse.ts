/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Authenticated user's complete profile
 */
export type UserProfileResponse = {
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
}
