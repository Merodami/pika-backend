import { NonEmptyString } from '@api/schemas/utils/uuid.js'
import { Static, Type } from '@sinclair/typebox'

// User registration schema
export const UserRegistrationSchema = Type.Object(
  {
    email: Type.String({ format: 'email' }),
    password: Type.String({ format: 'password', minLength: 8 }),
    first_name: NonEmptyString(100),
    last_name: NonEmptyString(100),
    phone_number: Type.Optional(
      Type.String({
        pattern: '^\\+[1-9]\\d{1,14}$',
        description:
          'Phone number in E.164 international format (e.g., +1234567890)',
      }),
    ),
    role: Type.Union([
      Type.Literal('CUSTOMER'),
      Type.Literal('PROVIDER'),
      Type.Literal('ADMIN'),
    ]),
    avatar_url: Type.Optional(Type.String({ format: 'uri' })),
  },
  { $id: '#/components/schemas/UserRegistration' },
)

export type UserRegistration = Static<typeof UserRegistrationSchema>

// Login schema
export const LoginSchema = Type.Object(
  {
    email: Type.String({ format: 'email' }),
    password: Type.String({ format: 'password' }),
  },
  { $id: '#/components/schemas/Login' },
)

export type Login = Static<typeof LoginSchema>

// Auth response schema
export const AuthResponseSchema = Type.Object(
  {
    user: Type.Object({
      id: Type.String({ format: 'uuid' }),
      email: Type.String({ format: 'email' }),
      email_verified: Type.Boolean(),
      first_name: Type.String(),
      last_name: Type.String(),
      phone_number: Type.Optional(Type.String()),
      phone_verified: Type.Boolean(),
      avatar_url: Type.Optional(Type.String({ format: 'uri' })),
      role: Type.Union([
        Type.Literal('ADMIN'),
        Type.Literal('CUSTOMER'),
        Type.Literal('PROVIDER'),
      ]),
      status: Type.Union([
        Type.Literal('ACTIVE'),
        Type.Literal('SUSPENDED'),
        Type.Literal('BANNED'),
      ]),
      last_login_at: Type.Optional(Type.String({ format: 'date-time' })),
      created_at: Type.String({ format: 'date-time' }),
      updated_at: Type.String({ format: 'date-time' }),
    }),
    tokens: Type.Object({
      access_token: Type.String(),
      refresh_token: Type.String(),
      expires_in: Type.Integer(),
    }),
  },
  { $id: '#/components/schemas/AuthResponse' },
)

export type AuthResponse = Static<typeof AuthResponseSchema>

// Refresh token request schema
export const RefreshTokenRequestSchema = Type.Object(
  {
    refresh_token: Type.String(),
  },
  { $id: '#/components/schemas/RefreshTokenRequest' },
)

export type RefreshTokenRequest = Static<typeof RefreshTokenRequestSchema>

// Refresh token response schema
export const RefreshTokenResponseSchema = Type.Object(
  {
    success: Type.Boolean(),
    data: Type.Object({
      tokens: Type.Object({
        access_token: Type.String(),
        refresh_token: Type.String(),
        expires_at: Type.String({ format: 'date-time' }),
        refresh_expires_at: Type.String({ format: 'date-time' }),
      }),
    }),
  },
  { $id: '#/components/schemas/RefreshTokenResponse' },
)

export type RefreshTokenResponse = Static<typeof RefreshTokenResponseSchema>

// Forgot password request schema
export const ForgotPasswordRequestSchema = Type.Object(
  {
    email: Type.String({ format: 'email' }),
  },
  { $id: '#/components/schemas/ForgotPasswordRequest' },
)

export type ForgotPasswordRequest = Static<typeof ForgotPasswordRequestSchema>

// Reset password request schema
export const ResetPasswordRequestSchema = Type.Object(
  {
    token: Type.String(),
    password: Type.String({ format: 'password', minLength: 8 }),
    password_confirmation: Type.String({ format: 'password' }),
  },
  { $id: '#/components/schemas/ResetPasswordRequest' },
)

export type ResetPasswordRequest = Static<typeof ResetPasswordRequestSchema>

// Verify email request schema
export const VerifyEmailRequestSchema = Type.Object(
  {
    token: Type.String(),
  },
  { $id: '#/components/schemas/VerifyEmailRequest' },
)

export type VerifyEmailRequest = Static<typeof VerifyEmailRequestSchema>

// Success message response schema
export const MessageResponseSchema = Type.Object(
  {
    message: Type.String(),
  },
  { $id: '#/components/schemas/MessageResponse' },
)

export type MessageResponse = Static<typeof MessageResponseSchema>
