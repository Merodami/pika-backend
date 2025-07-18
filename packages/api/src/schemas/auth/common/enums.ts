import { z } from 'zod'

/**
 * Auth-specific enums
 */

export const TokenType = z.enum(['accessToken', 'refreshToken'])

export type TokenType = z.infer<typeof TokenType>

export const GrantType = z.enum([
  'password',
  'refreshToken',
  'clientCredentials',
])

export type GrantType = z.infer<typeof GrantType>

export const OAuthProvider = z.enum(['google', 'facebook', 'apple'])

export type OAuthProvider = z.infer<typeof OAuthProvider>

export const OAuthError = z.enum([
  'invalidRequest',
  'invalidClient',
  'invalidGrant',
  'unauthorizedClient',
  'unsupportedGrantType',
  'invalidScope',
  'serverError',
  'temporarilyUnavailable',
])

export type OAuthError = z.infer<typeof OAuthError>

export const DeviceType = z.enum(['mobile', 'tablet', 'desktop', 'other'])

export type DeviceType = z.infer<typeof DeviceType>
