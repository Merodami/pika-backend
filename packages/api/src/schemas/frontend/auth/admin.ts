/**
 * Frontend Admin Form Schemas
 *
 * Forms for admin users to manage other users and businesses
 */

import { z } from 'zod'

import { AdminCreateBusinessRequest } from '../../business/admin/management.js'
import { SecurePassword } from '../../shared/primitives.js'
import { AdminCreateUserRequest } from '../../user/admin/management.js'

// ============= Admin Creates Business User =============

/**
 * Admin creates business user form
 * Extends backend AdminCreateUserRequest with frontend needs
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
 * Frontend options returned with the user creation
 */
export interface AdminCreateUserOptions {
  temporaryPassword: string
  sendWelcomeEmail: boolean
  requirePasswordChange: boolean
}

// ============= Admin Creates Business =============

/**
 * Admin creates business form
 * Direct reuse of backend AdminCreateBusinessRequest - no changes needed
 */
export const AdminCreateBusinessSchema = AdminCreateBusinessRequest

export type AdminCreateBusinessData = z.infer<typeof AdminCreateBusinessSchema>
