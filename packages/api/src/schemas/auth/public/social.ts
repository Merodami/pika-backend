import { DeviceType, SocialProvider, UserRole } from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { Email, JWTToken } from '../../shared/branded.js'
import { DeviceTypeSchema, SocialProviderSchema } from '../common/enums.js'
import { AuthUserResponse } from './login.js'

/**
 * Social Authentication Schemas
 * For Firebase-based social login (Google, Facebook, Apple)
 */

// ============= Device Info =============

/**
 * Device information for tracking and security (raw Zod)
 */
export const DeviceInfo = z.object({
  deviceId: z.string().optional().describe('Unique device identifier'),
  deviceName: z.string().optional().describe('Device name or model'),
  deviceType: DeviceTypeSchema.optional(),
  browserInfo: z
    .object({
      name: z.string().optional(),
      version: z.string().optional(),
      userAgent: z.string().optional(),
    })
    .optional(),
  fcmToken: z.string().optional().describe('Firebase Cloud Messaging token'),
  ipAddress: z.string().optional().describe('Device IP address'),
  location: z
    .object({
      lat: z.number().optional(),
      lng: z.number().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
})

/**
 * Device information schema (OpenAPI documented)
 */
export const DeviceInfoSchema = openapi(DeviceInfo, {
  description: 'Device information for tracking and security',
  example: {
    deviceId: 'device-123',
    deviceType: DeviceType.IOS,
    fcmToken: 'fcm-token-123',
  },
})

export type DeviceInfo = z.infer<typeof DeviceInfo>

// ============= Social Login Request =============

/**
 * Social login request (raw Zod)
 */
export const SocialLoginRequest = z.object({
  provider: SocialProviderSchema.describe('Social auth provider'),
  idToken: z.string().min(1).describe('Firebase ID token from social provider'),
  accessToken: z
    .string()
    .optional()
    .describe('Provider access token (optional)'),
  deviceInfo: DeviceInfo.optional().describe('Device information for tracking'),
  marketingConsent: z
    .boolean()
    .optional()
    .default(false)
    .describe('Marketing consent'),
})

/**
 * Social login request (OpenAPI documented)
 */
export const SocialLoginRequestSchema = openapi(SocialLoginRequest, {
  description: 'Request to authenticate via social provider',
  example: {
    provider: SocialProvider.GOOGLE,
    idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE...',
    deviceInfo: {
      deviceId: 'device-123',
      deviceType: DeviceType.IOS,
      fcmToken: 'fcm-token-123',
    },
    marketingConsent: true,
  },
})

export type SocialLoginRequest = z.infer<typeof SocialLoginRequest>

// ============= Social Login Response =============

/**
 * Social login response (raw Zod)
 */
export const SocialLoginResponse = z.object({
  user: AuthUserResponse.describe('Authenticated user information'),
  accessToken: JWTToken.describe('JWT access token'),
  refreshToken: JWTToken.describe('JWT refresh token'),
  tokenType: z.literal('Bearer').describe('Token type'),
  expiresIn: z.number().int().positive().describe('Token lifetime in seconds'),
  isNewUser: z.boolean().describe('Whether this is a newly created user'),
  linkedAccounts: z
    .array(SocialProviderSchema)
    .optional()
    .describe('List of linked social accounts'),
})

/**
 * Social login response (OpenAPI documented)
 */
export const SocialLoginResponseSchema = openapi(SocialLoginResponse, {
  description: 'Response after successful social authentication',
  example: {
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000' as any,
      email: 'user@example.com' as any,
      firstName: 'John',
      lastName: 'Doe',
      profilePicture: 'https://example.com/avatar.jpg',
      role: UserRole.CUSTOMER,
    },
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' as any,
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' as any,
    tokenType: 'Bearer',
    expiresIn: 7200,
    isNewUser: false,
    linkedAccounts: [SocialProvider.GOOGLE, SocialProvider.FACEBOOK],
  },
})

export type SocialLoginResponse = z.infer<typeof SocialLoginResponse>

// ============= Link Account Request =============

/**
 * Link social account request (raw Zod)
 */
export const LinkAccountRequest = z.object({
  provider: SocialProviderSchema.describe('Social provider to link'),
  idToken: z.string().min(1).describe('Firebase ID token from provider'),
  replace: z
    .boolean()
    .optional()
    .default(false)
    .describe('Replace existing linked account'),
})

/**
 * Link account request (OpenAPI documented)
 */
export const LinkAccountRequestSchema = openapi(LinkAccountRequest, {
  description: 'Request to link a social account to existing user',
  example: {
    provider: SocialProvider.FACEBOOK,
    idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE...',
    replace: false,
  },
})

export type LinkAccountRequest = z.infer<typeof LinkAccountRequest>

// ============= Link Account Response =============

/**
 * Link account response (raw Zod)
 */
export const LinkAccountResponse = z.object({
  success: z.boolean().describe('Whether linking was successful'),
  message: z.string().describe('Success or error message'),
  linkedAccounts: z
    .array(SocialProviderSchema)
    .describe('Updated list of linked accounts'),
})

/**
 * Link account response (OpenAPI documented)
 */
export const LinkAccountResponseSchema = openapi(LinkAccountResponse, {
  description: 'Response after account linking attempt',
  example: {
    success: true,
    message: 'Facebook account linked successfully',
    linkedAccounts: [SocialProvider.GOOGLE, SocialProvider.FACEBOOK],
  },
})

export type LinkAccountResponse = z.infer<typeof LinkAccountResponse>

// ============= Unlink Account Request =============

/**
 * Unlink social account request (raw Zod)
 */
export const UnlinkAccountRequest = z.object({
  provider: SocialProviderSchema.describe('Social provider to unlink'),
})

/**
 * Unlink account request (OpenAPI documented)
 */
export const UnlinkAccountRequestSchema = openapi(UnlinkAccountRequest, {
  description: 'Request to unlink a social account',
  example: {
    provider: SocialProvider.FACEBOOK,
  },
})

export type UnlinkAccountRequest = z.infer<typeof UnlinkAccountRequest>

// ============= Unlink Account Response =============

/**
 * Unlink account response (raw Zod)
 */
export const UnlinkAccountResponse = z.object({
  success: z.boolean().describe('Whether unlinking was successful'),
  message: z.string().describe('Success or error message'),
  linkedAccounts: z
    .array(SocialProviderSchema)
    .describe('Updated list of linked accounts'),
})

/**
 * Unlink account response (OpenAPI documented)
 */
export const UnlinkAccountResponseSchema = openapi(UnlinkAccountResponse, {
  description: 'Response after account unlinking attempt',
  example: {
    success: true,
    message: 'Facebook account unlinked successfully',
    linkedAccounts: [SocialProvider.GOOGLE],
  },
})

export type UnlinkAccountResponse = z.infer<typeof UnlinkAccountResponse>

// ============= Get Linked Accounts Response =============

/**
 * Linked account details (raw Zod)
 */
export const LinkedAccountDetails = z.object({
  provider: SocialProviderSchema,
  email: Email.optional(),
  displayName: z.string().optional(),
  photoUrl: z.string().url().optional(),
  linkedAt: z.string().datetime(),
})

/**
 * Get linked accounts response (raw Zod)
 */
export const GetLinkedAccountsResponse = z.object({
  linkedAccounts: z
    .array(LinkedAccountDetails)
    .describe('List of linked social accounts with details'),
})

/**
 * Get linked accounts response (OpenAPI documented)
 */
export const GetLinkedAccountsResponseSchema = openapi(
  GetLinkedAccountsResponse,
  {
    description: 'List of linked social accounts',
    example: {
      linkedAccounts: [
        {
          provider: SocialProvider.GOOGLE,
          email: 'user@gmail.com' as any,
          displayName: 'John Doe',
          photoUrl: 'https://example.com/photo.jpg',
          linkedAt: '2024-01-01T12:00:00Z',
        },
        {
          provider: SocialProvider.FACEBOOK,
          displayName: 'John Doe',
          linkedAt: '2024-01-02T12:00:00Z',
        },
      ],
    },
  },
)

export type GetLinkedAccountsResponse = z.infer<
  typeof GetLinkedAccountsResponse
>
export type LinkedAccountDetails = z.infer<typeof LinkedAccountDetails>
