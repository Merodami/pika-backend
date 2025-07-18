/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * New user registration data (avatar uploaded separately)
 */
export type RegisterRequest = {
  email: string
  /**
   * Password must meet security requirements
   */
  password: string
  firstName: string
  lastName: string
  /**
   * Phone number in E.164 format
   */
  phoneNumber?: string
  /**
   * Date of birth
   */
  dateOfBirth?: string
  /**
   * User must accept terms and conditions
   */
  acceptTerms: boolean
  /**
   * User consent for marketing emails
   */
  marketingConsent?: boolean
}
