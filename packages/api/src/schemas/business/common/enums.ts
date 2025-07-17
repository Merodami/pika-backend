import { z } from 'zod'

/**
 * Business-specific enums and constants
 */

// Business sort fields
export const BusinessSortBy = z.enum([
  'businessName',
  'avgRating',
  'verified',
  'active',
  'createdAt',
  'updatedAt',
])

export type BusinessSortBy = z.infer<typeof BusinessSortBy>

// Business status filters
export const BusinessStatusFilter = z.enum(['all', 'active', 'inactive', 'verified', 'unverified'])

export type BusinessStatusFilter = z.infer<typeof BusinessStatusFilter>

// Business relations that can be included
export const BUSINESS_RELATIONS = ['user', 'category'] as const

export type BusinessRelations = (typeof BUSINESS_RELATIONS)[number]

// Admin-specific sort fields
export const AdminBusinessSortBy = z.enum([
  'businessName',
  'avgRating',
  'verified',
  'active',
  'createdAt',
  'updatedAt',
  'userId',
  'categoryId',
])

export type AdminBusinessSortBy = z.infer<typeof AdminBusinessSortBy>