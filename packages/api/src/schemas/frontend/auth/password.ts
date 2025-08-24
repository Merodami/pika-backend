/**
 * Frontend Password Management Form Schemas
 *
 * Password reset, change, and recovery forms
 */

import { z } from 'zod'

import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
} from '../../auth/public/password.js'
import { SecurePassword } from '../../shared/primitives.js'

// ============= Forgot Password Form =============

/**
 * Forgot password form (direct reuse of backend schema)
 */
export const ForgotPasswordFormSchema = ForgotPasswordRequest

export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordFormSchema>

// ============= Reset Password Form =============

/**
 * Reset password form with confirmation
 */
export const ResetPasswordFormSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type ResetPasswordFormData = z.infer<typeof ResetPasswordFormSchema>

// ============= Change Password Form =============

/**
 * Admin/Business change password form
 * Properly extends base ChangePasswordRequest
 */
export const AdminBusinessChangePasswordSchema = ChangePasswordRequest.omit({
  newPassword: true,
})
  .extend({
    newPassword: SecurePassword,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type AdminBusinessChangePasswordData = z.infer<
  typeof AdminBusinessChangePasswordSchema
>
