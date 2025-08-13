import { RegistrationSource } from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { Email, UserId } from '../../shared/branded.js'
import { DateOnlyString, PhoneNumber } from '../../shared/primitives.js'

/**
 * User registration schemas for public API
 */

// ============= Registration =============

/**
 * Registration request (raw Zod)
 */
export const RegisterRequest = z.object({
  email: Email,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .describe('Password must meet security requirements'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(
      /^[a-zA-Z\s\-']+$/,
      'First name can only contain letters, spaces, hyphens, and apostrophes',
    ),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(
      /^[a-zA-Z\s\-']+$/,
      'Last name can only contain letters, spaces, hyphens, and apostrophes',
    ),
  phoneNumber: PhoneNumber.optional(),
  dateOfBirth: DateOnlyString.optional().describe(
    'Date of birth in YYYY-MM-DD format',
  ),
  acceptTerms: z
    .literal(true)
    .refine((value) => value === true, {
      message: 'You must accept the terms and conditions',
    })
    .describe('User must accept terms and conditions'),
  marketingConsent: z
    .boolean()
    .optional()
    .default(false)
    .describe('User consent for marketing emails'),
  registrationSource: createZodEnum(RegistrationSource)
    .optional()
    .default(RegistrationSource.PUBLIC)
    .describe('Source of registration to determine user role'),
})

/**
 * Registration request (OpenAPI documented)
 */
export const RegisterRequestSchema = RegisterRequest.openapi(
  'RegisterRequest',
  {
    description: 'New user registration data (avatar uploaded separately)',
    example: {
      email: 'newuser@example.com' as any,
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890' as any,
      acceptTerms: true,
      marketingConsent: true,
    },
  },
)

export type RegisterRequest = z.infer<typeof RegisterRequest>

/**
 * Registration response (raw Zod)
 */
export const RegisterResponse = z.object({
  message: z
    .string()
    .default(
      'Registration successful. Please check your email to verify your account.',
    ),
  userId: UserId.describe('Newly created user ID'),
  emailSent: z
    .boolean()
    .describe('Whether verification email was sent successfully'),
})

/**
 * Registration response (OpenAPI documented)
 */
export const RegisterResponseSchema = RegisterResponse.openapi(
  'RegisterResponse',
  {
    description: 'Registration success response',
  },
)

export type RegisterResponse = z.infer<typeof RegisterResponse>

// ============= Email Verification =============

/**
 * Email verification request (raw Zod)
 */
export const VerifyEmailRequest = z.object({
  token: z.string().min(1).describe('Email verification token from email link'),
})

/**
 * Email verification request (OpenAPI documented)
 */
export const VerifyEmailRequestSchema = VerifyEmailRequest.openapi(
  'VerifyEmailRequest',
  {
    description: 'Email verification token',
  },
)

export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequest>

/**
 * Email verification response (raw Zod)
 */
export const VerifyEmailResponse = z.object({
  message: z.string().default('Email verified successfully'),
  emailVerified: z.boolean().default(true),
})

/**
 * Email verification response (OpenAPI documented)
 */
export const VerifyEmailResponseSchema = VerifyEmailResponse.openapi(
  'VerifyEmailResponse',
  {
    description: 'Email verification success response',
  },
)

export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponse>

/**
 * Resend verification email request (raw Zod)
 */
export const ResendVerificationRequest = z.object({
  email: Email,
})

/**
 * Resend verification email request (OpenAPI documented)
 */
export const ResendVerificationRequestSchema =
  ResendVerificationRequest.openapi('ResendVerificationRequest', {
    description: 'Request to resend verification email',
  })

export type ResendVerificationRequest = z.infer<
  typeof ResendVerificationRequest
>

/**
 * Resend verification response (raw Zod)
 */
export const ResendVerificationResponse = z.object({
  message: z
    .string()
    .default(
      'If an account exists with this email, a verification link has been sent.',
    ),
  // Don't reveal whether email exists for security
})

/**
 * Resend verification response (OpenAPI documented)
 */
export const ResendVerificationResponseSchema =
  ResendVerificationResponse.openapi('ResendVerificationResponse', {
    description: 'Resend verification email response',
  })

export type ResendVerificationResponse = z.infer<
  typeof ResendVerificationResponse
>
