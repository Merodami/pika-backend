/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Authentication token pair
 */
export type AuthTokensResponse = {
  /**
   * JWT access token
   */
  accessToken: string
  /**
   * JWT refresh token
   */
  refreshToken: string
  tokenType?: 'Bearer'
  /**
   * Access token expiration in seconds
   */
  expiresIn: number
}
