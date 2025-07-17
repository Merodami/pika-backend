import { z } from 'zod'

/**
 * User-specific enums
 */

export const UserSortBy = z.enum([
  'name',
  'email',
  'createdAt',
  'updatedAt',
  'lastLogin',
])

export type UserSortBy = z.infer<typeof UserSortBy>

export const UserRole = z.enum([
  'customer',
  'admin',
  'business',
])

export type UserRole = z.infer<typeof UserRole>

export const UserStatus = z.enum([
  'active',
  'inactive',
  'suspended',
  'pending_verification',
])

export type UserStatus = z.infer<typeof UserStatus>

export const VerificationStatus = z.enum([
  'verified',
  'unverified',
  'pending',
])

export type VerificationStatus = z.infer<typeof VerificationStatus>

export const VerificationType = z.enum([
  'email',
  'phone',
  'identity',
])

export type VerificationType = z.infer<typeof VerificationType>