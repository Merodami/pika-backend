import { UserRole, UserStatus } from '@pika/types-core'

import { User } from '../../entities/User.js'

export interface CreateUserData {
  email: string
  password?: string
  firstName: string
  lastName: string
  phoneNumber?: string
  role: UserRole
  avatarUrl?: string
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  avatarUrl?: string
  emailVerified?: boolean
  phoneVerified?: boolean
  status?: UserStatus
  lastLoginAt?: Date
}

export interface UpdatePasswordData {
  hashedPassword: string
  updatedAt: Date
}

/**
 * UserWriteRepositoryPort defines the contract for user data mutation operations.
 * Implementations of this interface handle creation, update, and deletion operations.
 */
export interface UserWriteRepositoryPort {
  /**
   * Create a new user
   */
  create(userData: CreateUserData): Promise<User>

  /**
   * Update user by ID
   */
  updateById(userId: string, userData: UpdateUserData): Promise<User>

  /**
   * Update user password
   */
  updatePassword(
    userId: string,
    passwordData: UpdatePasswordData,
  ): Promise<void>

  /**
   * Update user last login time
   */
  updateLastLogin(userId: string, loginTime: Date): Promise<void>

  /**
   * Update user email verification status
   */
  updateEmailVerification(userId: string, verified: boolean): Promise<void>

  /**
   * Update user phone verification status
   */
  updatePhoneVerification(userId: string, verified: boolean): Promise<void>

  /**
   * Update user status (active, suspended, banned)
   */
  updateStatus(userId: string, status: UserStatus): Promise<void>

  /**
   * Soft delete user (set deletedAt timestamp)
   */
  softDelete(userId: string): Promise<void>

  /**
   * Restore soft-deleted user
   */
  restore(userId: string): Promise<void>

  /**
   * Hard delete user (permanent removal)
   */
  hardDelete(userId: string): Promise<void>

  /**
   * Check if email exists (for uniqueness validation)
   */
  emailExists(email: string): Promise<boolean>

  /**
   * Check if phone number exists (for uniqueness validation)
   */
  phoneExists(phoneNumber: string): Promise<boolean>

  /**
   * Find user by email (for authentication)
   */
  findByEmail(email: string): Promise<User | null>

  /**
   * Find user by ID (for token refresh and validation)
   */
  findById(userId: string): Promise<User | null>
}
