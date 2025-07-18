/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Internal user data for services
 */
export type InternalUserData = {
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
}
