/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User address with metadata
 */
export type UserAddress = {
  /**
   * Universally Unique Identifier
   */
  id: string
  userId: string
  street: string
  /**
   * Apartment, suite, etc.
   */
  street2?: string
  city: string
  /**
   * State or province
   */
  state: string
  postalCode: string
  /**
   * ISO 3166-1 alpha-2 country code
   */
  country: string
  /**
   * Geographic point with latitude and longitude
   */
  coordinates?: {
    /**
     * Latitude
     */
    lat: number
    /**
     * Longitude
     */
    lng: number
  }
  type: 'HOME' | 'WORK' | 'BILLING' | 'SHIPPING' | 'OTHER'
  /**
   * Custom label
   */
  label?: string
  isDefault?: boolean
  isPrimary?: boolean
  isVerified?: boolean
  verifiedAt?: string
  /**
   * Delivery instructions
   */
  instructions?: string
  accessCode?: string
  /**
   * When the record was created
   */
  createdAt: string
  /**
   * When the record was last updated
   */
  updatedAt: string
}
