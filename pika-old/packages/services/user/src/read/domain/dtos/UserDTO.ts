import {
  Address,
  PaymentMethod,
  UserRole,
  UserStatus,
} from '../entities/User.js'

/**
 * Data Transfer Object for Users
 * Used for transferring user data between application layers
 */
export interface UserDTO {
  id: string
  email: string
  emailVerified: boolean
  firstName: string
  lastName: string
  phoneNumber: string | null
  phoneVerified: boolean
  avatarUrl: string | null
  role: UserRole
  status: UserStatus
  lastLoginAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null

  // Optional related entities
  addresses?: Address[]
  paymentMethods?: PaymentMethod[]

  // Convenience properties
  fullName?: string
}

/**
 * Address DTO
 */
export interface AddressDTO extends Address {}

/**
 * Payment method DTO
 */
export interface PaymentMethodDTO extends PaymentMethod {}

/**
 * User list response structure
 * Includes pagination metadata
 */
export interface UserListResponseDTO {
  data: UserDTO[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}

/**
 * Address list response structure
 */
export interface AddressListResponseDTO {
  data: AddressDTO[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}

/**
 * Payment method list response structure
 */
export interface PaymentMethodListResponseDTO {
  data: PaymentMethodDTO[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}
