/**
 * Frontend Login Form Schemas
 *
 * UI-specific schemas for authentication forms that extend backend API schemas
 * Architecture: Backend Schema → .extend() → Frontend Schema
 */

import { z } from 'zod'

import { Email } from '../../shared/branded.js'

// ============= Login Form =============

/**
 * Simple login form
 */
export const LoginFormSchema = z.object({
  email: Email,
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
