import { z } from 'zod'

import { Email } from '../../shared/branded.js'

/**
 * Password management schemas for public API
 */

// ============= Forgot Password =============

/**
 * Forgot password request (raw Zod)
 */
export const ForgotPasswordRequest = z.object({
  email: Email,
})

/**
 * Forgot password request (OpenAPI documented)
 */
export const ForgotPasswordRequestSchema = ForgotPasswordRequest.openapi(
  'ForgotPasswordRequest',
  {
    description: 'Request password reset email',
  },
)

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequest>

/**
 * Forgot password response (raw Zod)
 */
export const ForgotPasswordResponse = z.object({
  message: z
    .string()
    .default(
      'If an account exists with this email, a password reset link has been sent.',
    ),
  // Don't reveal whether email exists for security
})

/**
 * Forgot password response (OpenAPI documented)
 */
export const ForgotPasswordResponseSchema = ForgotPasswordResponse.openapi(
  'ForgotPasswordResponse',
  {
    description: 'Password reset email sent response',
  },
)

export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponse>

// ============= Reset Password =============

/**
 * Reset password request (raw Zod)
 */
export const ResetPasswordRequest = z.object({
  token: z.string().min(1).describe('Password reset token from email'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .describe('New password meeting security requirements'),
})

/**
 * Reset password request (OpenAPI documented)
 */
export const ResetPasswordRequestSchema = ResetPasswordRequest.openapi(
  'ResetPasswordRequest',
  {
    description: 'Reset password with token',
  },
)

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequest>

/**
 * Reset password response (raw Zod)
 */
export const ResetPasswordResponse = z.object({
  message: z.string().default('Password reset successfully'),
})

/**
 * Reset password response (OpenAPI documented)
 */
export const ResetPasswordResponseSchema = ResetPasswordResponse.openapi(
  'ResetPasswordResponse',
  {
    description: 'Password reset success response',
  },
)

export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponse>

// ============= Change Password =============

/**
 * Change password request (for logged-in users) (raw Zod)
 */
export const ChangePasswordRequest = z
  .object({
    currentPassword: z
      .string()
      .min(1)
      .describe('Current password for verification'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .describe('New password meeting security requirements'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })

/**
 * Change password request (OpenAPI documented)
 */
export const ChangePasswordRequestSchema = ChangePasswordRequest.openapi(
  'ChangePasswordRequest',
  {
    description: 'Change password for authenticated user',
  },
)

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequest>

/**
 * Change password response (raw Zod)
 */
export const ChangePasswordResponse = z.object({
  message: z.string().default('Password changed successfully'),
})

/**
 * Change password response (OpenAPI documented)
 */
export const ChangePasswordResponseSchema = ChangePasswordResponse.openapi(
  'ChangePasswordResponse',
  {
    description: 'Password change success response',
  },
)

export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponse>
