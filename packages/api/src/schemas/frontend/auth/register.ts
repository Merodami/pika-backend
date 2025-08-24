/**
 * Frontend Registration Form Schemas
 *
 * User registration forms with UI-specific validations
 */

import { z } from 'zod'

import { RegisterRequest } from '../../auth/public/register.js'

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
