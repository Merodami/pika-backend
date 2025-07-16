/**
 * User DTOs (Data Transfer Objects)
 * These represent the API contract for user-related endpoints
 */

import type { FriendDTO } from './social.dto.js'

// ============= Address DTO =============

export interface AddressDTO {
  id: string
  userId: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  location?: {
    lat: number
    lng: number
  }
  createdAt: string
  updatedAt: string
}

// ============= Payment Method DTO =============

export interface PaymentMethodDTO {
  id: string
  userId: string
  paymentType: string
  cardBrand?: string
  lastFour?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// ============= Professional DTO =============

export interface ProfessionalDTO {
  id: string
  userId: string
  description: string
  specialties: string[]
  favoriteGyms: string[]
  createdAt: string
  updatedAt: string
}

// ============= PARQ DTO =============

export interface ParqDTO {
  id: string
  userId: string
  medicalClearance: boolean
  existingInjuries: boolean
  symptomsCheck: boolean
  doctorConsultation: boolean
  experienceLevel: boolean
  properTechnique: boolean
  gymEtiquette: boolean
  createdAt: string
  updatedAt: string
}

// Friend DTO is defined in social.dto.ts to avoid duplication

// ============= User DTO =============

export interface UserDTO {
  id: string
  email: string
  emailVerified: boolean
  firstName: string
  lastName: string
  phoneNumber?: string
  phoneVerified: boolean
  avatarUrl?: string
  role: string
  status: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
  // Gym platform specific fields
  dateOfBirth?: string
  alias?: string
  appVersion?: string
  activeMembership: boolean
  guests: string[]
  stripeUserId?: string
  // Relations
  professional?: ProfessionalDTO
  parq?: ParqDTO
  friends?: FriendDTO[]
}

// ============= Create/Update DTOs =============

export interface CreateUserDTO {
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  dateOfBirth?: string
  alias?: string
}

export interface UpdateUserDTO {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  avatarUrl?: string
  dateOfBirth?: string
  alias?: string
  appVersion?: string
}

export interface CreateAddressDTO {
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault?: boolean
}

export interface UpdateAddressDTO {
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  isDefault?: boolean
}
