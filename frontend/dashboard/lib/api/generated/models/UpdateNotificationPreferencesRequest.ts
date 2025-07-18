/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateNotificationPreferencesRequest = {
  email?: {
    enabled?: boolean
    categories?: Array<string>
  }
  inApp?: {
    enabled?: boolean
    categories?: Array<string>
  }
  sms?: {
    enabled?: boolean
    categories?: Array<string>
  }
  push?: {
    enabled?: boolean
    categories?: Array<string>
    token?: string
  }
  quietHours?: {
    enabled?: boolean
    start?: string
    end?: string
    timezone?: string
  }
}
