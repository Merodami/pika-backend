/**
 * User Domain Models
 * These represent the core business entities used internally
 */

import type { UserRoleType, UserStatusType } from '@pika/types'

import type { FriendDomain } from './social.js'

// ============= User Domain =============

export interface UserDomain {
  id: string
  email: string
  emailVerified: boolean
  password?: string | null // Optional - only included for auth operations
  firstName: string
  lastName: string
  phoneNumber: string | null
  phoneVerified: boolean
  avatarUrl: string | null
  role: UserRoleType
  status: UserStatusType
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  // Gym platform specific fields
  dateOfBirth?: Date | null // Renamed from dob for consistency
  alias?: string | null
  appVersion?: string | null
  activeMembership: boolean
  guests: string[]
  stripeUserId?: string | null
  // Relations
  professional?: ProfessionalDomain | null
  parq?: ParqDomain | null
  friends?: FriendDomain[]
}

// ============= Professional Domain =============

export interface ProfessionalDomain {
  id: string
  userId: string
  description: string
  specialties: string[]
  favoriteGyms: string[]
  createdAt: Date
  updatedAt: Date
}

// ============= PARQ Domain =============

export interface ParqDomain {
  id: string
  userId: string
  medicalClearance: boolean
  existingInjuries: boolean
  symptomsCheck: boolean
  doctorConsultation: boolean
  experienceLevel: boolean
  properTechnique: boolean
  gymEtiquette: boolean
  createdAt: Date
  updatedAt: Date
}

// ============= Address Domain =============

export interface AddressDomain {
  id: string
  userId: string
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  location?: {
    latitude: number
    longitude: number
  } | null
  createdAt: Date
  updatedAt: Date
}

// ============= Payment Method Domain =============

export interface PaymentMethodDomain {
  id: string
  userId: string
  paymentType: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CASH'
  cardBrand?: string | null
  lastFour?: string | null
  expiryMonth?: number | null
  expiryYear?: number | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}
