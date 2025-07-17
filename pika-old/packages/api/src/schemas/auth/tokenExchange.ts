import { Static, Type } from '@sinclair/typebox'

import { UUIDSchema } from '../utils/index.js'

// Device info schema
export const DeviceInfoSchema = Type.Object(
  {
    device_id: UUIDSchema,
    device_name: Type.Optional(Type.String({ maxLength: 100 })),
    device_type: Type.Union([
      Type.Literal('ios'),
      Type.Literal('android'),
      Type.Literal('web'),
      Type.Literal('desktop'),
    ]),
    fcm_token: Type.Optional(Type.String({ maxLength: 500 })),
  },
  { $id: '#/components/schemas/DeviceInfo' },
)

// Token exchange request schema
export const TokenExchangeRequestSchema = Type.Object(
  {
    firebase_id_token: Type.String({
      minLength: 1,
      maxLength: 5000,
      description: 'Firebase ID token obtained from client authentication',
    }),
    provider: Type.Optional(
      Type.Union(
        [
          Type.Literal('google'),
          Type.Literal('facebook'),
          Type.Literal('apple'),
          Type.Literal('twitter'),
          Type.Literal('github'),
        ],
        {
          description:
            'Authentication provider (optional, will be extracted from token if not provided)',
        },
      ),
    ),
    device_info: DeviceInfoSchema,
  },
  { $id: '#/components/schemas/TokenExchangeRequest' },
)

// User info in response
export const TokenExchangeUserSchema = Type.Object(
  {
    id: UUIDSchema,
    email: Type.String({ format: 'email' }),
    first_name: Type.String({ maxLength: 100 }),
    last_name: Type.String({ maxLength: 100 }),
    role: Type.String({ maxLength: 50 }),
    is_new_user: Type.Boolean({
      description: 'Whether this is a newly created user',
    }),
    requires_additional_info: Type.Boolean({
      description:
        'Whether user needs to provide additional profile information',
    }),
    requires_mfa: Type.Boolean({
      description: 'Whether multi-factor authentication is required',
    }),
  },
  { $id: '#/components/schemas/TokenExchangeUser' },
)

// Token exchange response (standard format like AuthResponse)
export const TokenExchangeResponseSchema = Type.Object(
  {
    user: TokenExchangeUserSchema,
    tokens: Type.Object({
      access_token: Type.String({
        minLength: 1,
        description: 'JWT access token for API authentication',
      }),
      refresh_token: Type.String({
        minLength: 1,
        description: 'JWT refresh token for obtaining new access tokens',
      }),
      expires_in: Type.Number({
        minimum: 1,
        description: 'Access token expiry time in seconds',
      }),
    }),
  },
  { $id: '#/components/schemas/TokenExchangeResponse' },
)

// TypeScript types
export type DeviceInfo = Static<typeof DeviceInfoSchema>
export type TokenExchangeRequest = Static<typeof TokenExchangeRequestSchema>
export type TokenExchangeUser = Static<typeof TokenExchangeUserSchema>
export type TokenExchangeResponse = Static<typeof TokenExchangeResponseSchema>
