/**
 * Business Domain Models
 * These represent the core business entities used internally
 */

import type { CategoryDomain } from './category.js'
import type { UserDomain } from './user.js'

// ============= Business Details Domain =============

export interface BusinessDetailsDomain {
  id: string
  businessId: string
  // Contact Information
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  // Address Information
  street: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  // Operating Information
  operatingHours: any | null // JSON
  socialMedia: any | null // JSON
  additionalInfo: any | null // JSON
  createdAt: Date
  updatedAt: Date
}

// ============= Business Domain =============

export interface BusinessDomain {
  id: string
  userId: string
  businessNameKey: string
  businessDescriptionKey: string | null
  // Resolved translations (populated by TranslationResolver in service layer)
  businessName?: string
  businessDescription?: string | null
  categoryId: string | null
  verified: boolean
  active: boolean
  approved: boolean
  approvedBy: string | null
  approvedAt: Date | null
  avgRating: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  // Optional relations
  user?: UserDomain
  category?: CategoryDomain
  businessDetails?: BusinessDetailsDomain
  businessRegistration?: {
    id: string
    userId: string
    businessId: string | null
    currentStep: number
    registrationStatus: string
    startedAt: Date
    completedAt: Date | null
    submittedAt: Date | null
    rejectionReason: string | null
    createdAt: Date
    updatedAt: Date
  }
}

// ============= Business Creation and Update =============

export interface CreateBusinessData {
  userId: string
  businessNameKey: string
  businessDescriptionKey?: string | null
  categoryId?: string | null
  verified?: boolean
  active?: boolean
  approved?: boolean
}

export interface UpdateBusinessData {
  businessNameKey?: string
  businessDescriptionKey?: string | null
  categoryId?: string | null
  verified?: boolean
  active?: boolean
  approved?: boolean
  approvedBy?: string | null
  approvedAt?: Date | null
}
