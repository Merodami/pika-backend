import { z } from 'zod'

import { Email, JWTToken, UserId } from '../../shared/branded.js'
import { UserRoleSchema } from '../../user/common/enums.js'
import { DeviceTypeSchema, OAuthProviderSchema } from '../common/enums.js'

/**
 * Public API authentication schemas
 * Login, refresh, and token management
 */

// ============= Common Auth Types =============

/**
 * Authentication tokens (raw Zod)
 */
export const AuthTokensResponse = z.object({
  accessToken: JWTToken.describe('JWT access token'),
  refreshToken: JWTToken.describe('JWT refresh token'),
  tokenType: z.literal('Bearer').default('Bearer'),
  expiresIn: z
    .number()
    .int()
    .positive()
    .describe('Access token expiration in seconds'),
})

/**
 * Authentication tokens (OpenAPI documented)
 */
export const AuthTokensResponseSchema = AuthTokensResponse.openapi(
  'AuthTokensResponse',
  {
    description: 'Authentication token pair',
    example: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' as any,
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' as any,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes
    },
  },
)

export type AuthTokensResponse = z.infer<typeof AuthTokensResponse>

/**
 * Public user info returned after login (raw Zod)
 */
export const AuthUserResponse = z.object({
  id: UserId,
  email: Email,
  firstName: z.string(),
  lastName: z.string(),
  profilePicture: z.string().url().optional(),
  role: UserRoleSchema,
})

/**
 * Public user info returned after login (OpenAPI documented)
 */
export const AuthUserResponseSchema = AuthUserResponse.openapi(
  'AuthUserResponse',
  {
    description: 'Basic user information for authentication context',
  },
)

export type AuthUserResponse = z.infer<typeof AuthUserResponse>

// Note: Login, refresh, and logout functionality has been moved to OAuth 2.0 endpoints.
// Use /auth/token for login and refresh, /auth/revoke for logout.
// These types are kept for backward compatibility but are deprecated.

// Note: Password reset schemas are in password.ts
// Note: Email verification schemas are in register.ts

// ============= OAuth =============
// OAuth provider enum is now imported from ../common/enums.js

/**
 * OAuth callback request (raw Zod)
 */
export const OAuthCallbackRequest = z.object({
  code: z.string().min(1).describe('OAuth authorization code'),
  state: z.string().min(1).describe('OAuth state parameter'),
  provider: OAuthProviderSchema,
})

/**
 * OAuth callback request (OpenAPI documented)
 */
export const OAuthCallbackRequestSchema = OAuthCallbackRequest.openapi(
  'OAuthCallbackRequest',
  {
    description: 'OAuth authorization callback parameters',
  },
)

export type OAuthCallbackRequest = z.infer<typeof OAuthCallbackRequest>

/**
 * OAuth link account request (raw Zod)
 */
export const LinkOAuthAccountRequest = z.object({
  provider: OAuthProviderSchema,
  redirectUri: z.string().url().optional().describe('Redirect after linking'),
})

/**
 * OAuth link account request (OpenAPI documented)
 */
export const LinkOAuthAccountRequestSchema = LinkOAuthAccountRequest.openapi(
  'LinkOAuthAccountRequest',
  {
    description: 'Link OAuth account to existing user',
  },
)

export type LinkOAuthAccountRequest = z.infer<typeof LinkOAuthAccountRequest>

// ============= Session Management =============

/**
 * Active session info (raw Zod)
 */
export const SessionInfoResponse = z.object({
  id: z.string().uuid(),
  deviceName: z.string().optional(),
  deviceType: DeviceTypeSchema.optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  ip: z.string().optional(),
  location: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  lastActive: z.string().datetime(),
  createdAt: z.string().datetime(),
})

/**
 * Active session info (OpenAPI documented)
 */
export const SessionInfoResponseSchema = SessionInfoResponse.openapi(
  'SessionInfoResponse',
  {
    description: 'Active session information',
  },
)

export type SessionInfoResponse = z.infer<typeof SessionInfoResponse>

/**
 * Get active sessions response (raw Zod)
 */
export const GetSessionsResponse = z.object({
  sessions: z.array(SessionInfoResponse),
  current: z.string().uuid().describe('Current session ID'),
})

/**
 * Get active sessions response (OpenAPI documented)
 */
export const GetSessionsResponseSchema = GetSessionsResponse.openapi(
  'GetSessionsResponse',
  {
    description: 'List of active user sessions',
  },
)

export type GetSessionsResponse = z.infer<typeof GetSessionsResponse>

/**
 * Revoke session request (raw Zod)
 */
export const RevokeSessionRequest = z.object({
  sessionId: z.string().uuid().describe('Session ID to revoke'),
})

/**
 * Revoke session request (OpenAPI documented)
 */
export const RevokeSessionRequestSchema = RevokeSessionRequest.openapi(
  'RevokeSessionRequest',
  {
    description: 'Request to revoke a session',
  },
)

export type RevokeSessionRequest = z.infer<typeof RevokeSessionRequest>
