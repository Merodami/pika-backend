import { z } from 'zod'

import { AdminCreateBusinessRequest } from '../../business/admin/management.js'
// Note: Not using openapi() wrapper for frontend schemas as they don't need OpenAPI examples
import { Email } from '../../shared/branded.js'
import { SecurePassword } from '../../shared/primitives.js'
// Import admin schemas we need to extend
import { AdminCreateUserRequest } from '../../user/admin/management.js'
import { TokenRequest } from '../public/oauth.js'
import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../public/password.js'
import { RegisterRequest } from '../public/register.js'

/**
 * Frontend-optimized authentication schemas
 * These extend the backend API schemas with UI-specific concerns
 *
 * Architecture Pattern: Backend Schema → .extend() → Frontend Schema
 * Benefits: Single source of truth, automatic consistency, type safety
 */

// ============= Login Form =============

/**
 * Simple login form that maps to TokenRequest with password grant
 * Extends the OAuth TokenRequest for better UX
 */
export const LoginFormSchema = z.object({
  email: Email, // Using branded Email - form will handle with z.input/z.output types
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
})

/**
 * Admin/Business login form - extends base with stricter validation
 */
export const AdminBusinessLoginFormSchema = LoginFormSchema.extend({
  password: z
    .string()
    .min(12, 'Admin/Business passwords must be at least 12 characters')
    .max(128, 'Password must not exceed 128 characters'),
})

export type LoginFormData = z.infer<typeof LoginFormSchema>
export type AdminBusinessLoginFormData = z.infer<
  typeof AdminBusinessLoginFormSchema
>


// ============= Registration Form =============

/**
 * Registration form extending backend RegisterRequest
 * Adds UI-specific validation like password confirmation
 */
export const RegisterFormSchema = RegisterRequest.extend({
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  agreedToMarketing: z.boolean().optional().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof RegisterFormSchema>


// ============= Password Reset Forms =============

/**
 * Forgot password form (direct reuse of backend schema)
 */
export const ForgotPasswordFormSchema = ForgotPasswordRequest

export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordFormSchema>

/**
 * Reset password form with confirmation
 * Extends backend schema with password confirmation
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


// ============= Admin/Business Specific Forms =============

/**
 * Admin creates business user form
 * Properly extends backend AdminCreateUserRequest with frontend needs
 */
export const AdminCreateBusinessUserSchema = AdminCreateUserRequest.omit({
  role: true,
  status: true,
}) // Remove fields we'll set automatically
  .extend({
    // Add password fields
    temporaryPassword: SecurePassword,
    confirmPassword: z.string().min(1, 'Please confirm password'),
    // Frontend options
    sendWelcomeEmail: z.boolean().default(true),
    requirePasswordChange: z.boolean().default(true),
  })
  .refine((data) => data.temporaryPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type AdminCreateBusinessUserData = z.infer<
  typeof AdminCreateBusinessUserSchema
>


/**
 * Admin creates business form
 * Properly extends backend AdminCreateBusinessRequest - no changes needed
 */
export const AdminCreateBusinessSchema = AdminCreateBusinessRequest

export type AdminCreateBusinessData = z.infer<typeof AdminCreateBusinessSchema>

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


// ============= Export All =============

export {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  // Re-export backend schemas for convenience
  RegisterRequest,
  ResetPasswordRequest,
  TokenRequest,
} from '../public/index.js'
