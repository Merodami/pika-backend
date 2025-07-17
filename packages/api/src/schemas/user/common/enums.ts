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

export const AccountFlag = z.enum([
  'verified',
  'premium',
  'suspicious',
  'reported',
  'vip',
])

export type AccountFlag = z.infer<typeof AccountFlag>

export const AdminUserSortBy = z.enum([
  'createdAt',
  'lastLoginAt',
  'totalSpent',
  'email',
])

export type AdminUserSortBy = z.infer<typeof AdminUserSortBy>

export const SortOrder = z.enum([
  'asc',
  'desc',
])

export type SortOrder = z.infer<typeof SortOrder>

export const AdminNoteCategory = z.enum([
  'general',
  'security',
  'support',
  'billing',
])

export type AdminNoteCategory = z.infer<typeof AdminNoteCategory>

export const UserActivityCategory = z.enum([
  'auth',
  'profile',
  'payment',
  'other',
])

export type UserActivityCategory = z.infer<typeof UserActivityCategory>

// ============= Profile Enums =============

export const ImageFormat = z.enum([
  'jpeg',
  'png',
  'webp',
])

export type ImageFormat = z.infer<typeof ImageFormat>

export const Theme = z.enum([
  'light',
  'dark',
  'system',
])

export type Theme = z.infer<typeof Theme>

export const ProfileVisibility = z.enum([
  'public',
  'private',
])

export type ProfileVisibility = z.infer<typeof ProfileVisibility>

// ============= Internal Service Enums =============

export const InternalVerificationType = z.enum([
  'email',
  'phone',
  'identity',
])

export type InternalVerificationType = z.infer<typeof InternalVerificationType>

export const VerificationLevel = z.enum([
  'none',
  'email',
  'phone',
  'full',
])

export type VerificationLevel = z.infer<typeof VerificationLevel>

export const CreditOperation = z.enum([
  'add',
  'subtract',
  'set',
])

export type CreditOperation = z.infer<typeof CreditOperation>

export const PermissionAction = z.enum([
  'read',
  'create',
  'update',
  'delete',
])

export type PermissionAction = z.infer<typeof PermissionAction>