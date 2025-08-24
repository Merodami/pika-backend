import { Language, RegistrationSource } from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { AdminCreateBusinessRequest } from '../../business/admin/management.js'
import { Email } from '../../shared/branded.js'
import {
  DateOnlyString,
  PhoneNumber,
  SecurePassword,
} from '../../shared/primitives.js'
import { AdminCreateUserRequest } from '../../user/admin/management.js'
import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
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

// ============= Multi-Step User Registration =============

/**
 * Step 1: Basic user information (raw Zod)
 * Core user details for initial registration
 */
export const RegistrationStep1Schema = z
  .object({
    email: Email,
    password: SecurePassword,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

/**
 * Step 1: Basic user information (OpenAPI documented)
 */
export const RegistrationStep1SchemaDoc = RegistrationStep1Schema.openapi(
  'RegistrationStep1',
  {
    description: 'Step 1 of user registration - basic information',
    example: {
      email: 'user@example.com' as any,
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe',
    },
  },
)

export type RegistrationStep1Data = z.infer<typeof RegistrationStep1Schema>

/**
 * Step 2: Personal details and preferences (raw Zod)
 * Additional information and user preferences
 */
export const RegistrationStep2Schema = z.object({
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
})

/**
 * Step 2: Personal details and preferences (OpenAPI documented)
 */
export const RegistrationStep2SchemaDoc = RegistrationStep2Schema.openapi(
  'RegistrationStep2',
  {
    description: 'Step 2 of user registration - personal details and terms',
    example: {
      phoneNumber: '+1234567890' as any,
      dateOfBirth: '1990-01-01' as any,
      acceptTerms: true,
      marketingConsent: false,
    },
  },
)

export type RegistrationStep2Data = z.infer<typeof RegistrationStep2Schema>

/**
 * Step 3: Account type and final setup (raw Zod)
 * User role selection and final preferences
 */
export const RegistrationStep3Schema = z.object({
  registrationSource: createZodEnum(RegistrationSource)
    .optional()
    .default(RegistrationSource.PUBLIC)
    .describe('Source of registration to determine user role'),
  preferredLanguage: createZodEnum(Language)
    .optional()
    .default(Language.EN)
    .describe('Preferred language for the user interface'),
  timezone: z
    .string()
    .optional()
    .describe('User timezone (e.g., America/New_York)'),
  notifications: z
    .object({
      email: z.boolean().default(true).describe('Email notifications enabled'),
      sms: z.boolean().default(false).describe('SMS notifications enabled'),
      push: z.boolean().default(true).describe('Push notifications enabled'),
    })
    .optional()
    .describe('Notification preferences'),
})

/**
 * Step 3: Account type and final setup (OpenAPI documented)
 */
export const RegistrationStep3SchemaDoc = RegistrationStep3Schema.openapi(
  'RegistrationStep3',
  {
    description: 'Step 3 of user registration - final setup and preferences',
    example: {
      registrationSource: RegistrationSource.PUBLIC,
      preferredLanguage: Language.EN,
      timezone: 'America/New_York',
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
    },
  },
)

export type RegistrationStep3Data = z.infer<typeof RegistrationStep3Schema>

// ============= Export All =============

export {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  // Re-export backend schemas for convenience
  RegisterRequest,
  ResetPasswordRequest,
  TokenRequest,
} from '../public/index.js'
