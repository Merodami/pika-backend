import { UserRole, UserStatus } from '../../../domain/entities/User.js'

/**
 * User search query parameters
 * Used by application services to retrieve users with filtering, sorting, and pagination
 */
export interface UserSearchQuery {
  // Filter parameters
  email?: string
  role?: UserRole
  status?: UserStatus
  firstName?: string
  lastName?: string
  phoneNumber?: string
  emailVerified?: boolean
  phoneVerified?: boolean

  // Time-based filters
  createdAtStart?: Date
  createdAtEnd?: Date
  updatedAtStart?: Date
  updatedAtEnd?: Date
  lastLoginAtStart?: Date
  lastLoginAtEnd?: Date

  // Pagination parameters
  page?: number
  limit?: number

  // Sorting parameters
  sortBy?: string
  sortOrder?: 'asc' | 'desc'

  // Include relationships parameters
  includeAddresses?: boolean
  includePaymentMethods?: boolean
  includeCustomerProfile?: boolean
  includeProviderProfile?: boolean
}
