/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * User communication preferences
 */
export type UserCommunicationPreferencesResponse = {
  userId: string
  email: {
    enabled: boolean
    categories: Record<string, boolean>
  }
  push: {
    enabled: boolean
    categories: Record<string, boolean>
    tokens: Array<{
      token: string
      platform: 'ios' | 'android' | 'web'
      active: boolean
    }>
  }
  sms: {
    enabled: boolean
    categories: Record<string, boolean>
    phoneNumber?: string
  }
  quietHours?: {
    enabled: boolean
    start: string
    end: string
    timezone: string
  }
  /**
   * ISO 8601 datetime with timezone
   */
  unsubscribedAt?: string
}
