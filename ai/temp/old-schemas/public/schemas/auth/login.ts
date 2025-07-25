import { z } from 'zod'

import { Email, JWTToken, UserId } from '../../../common/schemas/branded.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Public API authentication schemas
 * Login, refresh, and token management
 */

// ============= Common Auth Types =============

/**
 * Authentication tokens
 */
export const AuthTokensResponse = openapi(
  z.object({
    accessToken: JWTToken.describe('JWT access token'),
    refreshToken: JWTToken.describe('JWT refresh token'),
    tokenType: z.literal('Bearer').default('Bearer'),
    expiresIn: z
      .number()
      .int()
      .positive()
      .describe('Access token expiration in seconds'),
  }),
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
 * Public user info returned after login
 */
export const AuthUserResponse = openapi(
  z.object({
    id: UserId,
    email: Email,
    firstName: z.string(),
    lastName: z.string(),
    profilePicture: z.string().url().optional(),
    role: z
      .enum(['USER', 'TRAINER'])
      .describe('User role (admin role excluded from public API)'),
  }),
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

/**
 * OAuth provider enum
 */
export const OAuthProvider = z.enum(['GOOGLE', 'FACEBOOK', 'APPLE'])

export type OAuthProvider = z.infer<typeof OAuthProvider>

/**
 * OAuth callback request
 */
export const OAuthCallbackRequest = z.object({
  code: z.string().min(1).describe('OAuth authorization code'),
  state: z.string().min(1).describe('OAuth state parameter'),
  provider: OAuthProvider,
})

export type OAuthCallbackRequest = z.infer<typeof OAuthCallbackRequest>

/**
 * OAuth link account request
 */
export const LinkOAuthAccountRequest = z.object({
  provider: OAuthProvider,
  redirectUri: z.string().url().optional().describe('Redirect after linking'),
})

export type LinkOAuthAccountRequest = z.infer<typeof LinkOAuthAccountRequest>

// ============= Session Management =============

/**
 * Active session info
 */
export const SessionInfoResponse = z.object({
  id: z.string().uuid(),
  deviceName: z.string().optional(),
  deviceType: z.enum(['MOBILE', 'TABLET', 'DESKTOP', 'OTHER']).optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  ip: z.string().ip().optional(),
  location: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  lastActive: z.string().datetime(),
  createdAt: z.string().datetime(),
})

export type SessionInfoResponse = z.infer<typeof SessionInfoResponse>

/**
 * Get active sessions response
 */
export const GetSessionsResponse = z.object({
  sessions: z.array(SessionInfoResponse),
  current: z.string().uuid().describe('Current session ID'),
})

export type GetSessionsResponse = z.infer<typeof GetSessionsResponse>

/**
 * Revoke session request
 */
export const RevokeSessionRequest = z.object({
  sessionId: z.string().uuid().describe('Session ID to revoke'),
})

export type RevokeSessionRequest = z.infer<typeof RevokeSessionRequest>
