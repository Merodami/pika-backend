import { ErrorFactory } from '@pika/shared'

/**
 * User role type definition
 */
export type UserRole = 'ADMIN' | 'CUSTOMER' | 'PROVIDER'

/**
 * User status type definition
 */
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED'

/**
 * Address entity definition for User domain
 */
export interface Address {
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
    latitude: number
    longitude: number
  }
  createdAt: Date
  updatedAt: Date
}

/**
 * Payment method entity definition for User domain
 */
export interface PaymentMethod {
  id: string
  userId: string
  paymentType: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CASH'
  cardBrand?: string
  lastFour?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * User Read Domain Entity - Following Admin Service pattern
 * Rich domain model with business logic and validation
 */
export class User {
  // Private fields for encapsulation
  private readonly id: string
  private readonly email: string
  private readonly emailVerified: boolean
  private readonly firstName: string
  private readonly lastName: string
  private readonly phoneNumber: string | null
  private readonly phoneVerified: boolean
  private readonly avatarUrl: string | null
  private readonly role: UserRole
  private readonly status: UserStatus
  private readonly lastLoginAt: Date | null
  private readonly createdAt: Date
  private readonly updatedAt: Date
  private readonly deletedAt: Date | null
  private readonly addresses?: Address[]
  private readonly paymentMethods?: PaymentMethod[]

  /**
   * Private constructor following Admin pattern
   * Use factory methods for creation
   */
  private constructor({
    id,
    email,
    emailVerified,
    firstName,
    lastName,
    phoneNumber,
    phoneVerified,
    avatarUrl,
    role,
    status,
    lastLoginAt,
    createdAt,
    updatedAt,
    deletedAt,
    addresses,
    paymentMethods,
  }: {
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
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    addresses?: Address[]
    paymentMethods?: PaymentMethod[]
  }) {
    this.id = id
    this.email = email
    this.emailVerified = emailVerified
    this.firstName = firstName
    this.lastName = lastName
    this.phoneNumber = phoneNumber
    this.phoneVerified = phoneVerified
    this.avatarUrl = avatarUrl
    this.role = role
    this.status = status
    this.lastLoginAt = lastLoginAt
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.deletedAt = deletedAt
    this.addresses = addresses
    this.paymentMethods = paymentMethods

    // Validate invariants
    this.validateInvariants()
  }

  /**
   * Getters following Admin pattern
   */
  get getId(): string {
    return this.id
  }

  get getEmail(): string {
    return this.email
  }

  get getEmailVerified(): boolean {
    return this.emailVerified
  }

  get getFirstName(): string {
    return this.firstName
  }

  get getLastName(): string {
    return this.lastName
  }

  get getPhoneNumber(): string | null {
    return this.phoneNumber
  }

  get getPhoneVerified(): boolean {
    return this.phoneVerified
  }

  get getAvatarUrl(): string | null {
    return this.avatarUrl
  }

  get getRole(): UserRole {
    return this.role
  }

  get getStatus(): UserStatus {
    return this.status
  }

  get getLastLoginAt(): Date | null {
    return this.lastLoginAt
  }

  get getCreatedAt(): Date {
    return this.createdAt
  }

  get getUpdatedAt(): Date {
    return this.updatedAt
  }

  get getDeletedAt(): Date | null {
    return this.deletedAt
  }

  get getAddresses(): Address[] {
    return this.addresses || []
  }

  get getPaymentMethods(): PaymentMethod[] {
    return this.paymentMethods || []
  }

  /**
   * Business logic methods
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim()
  }

  /**
   * Check if the user is active
   */
  isActive(): boolean {
    return this.status === 'ACTIVE' && !this.deletedAt
  }

  /**
   * Check if the user is deleted
   */
  isDeleted(): boolean {
    return this.deletedAt !== null
  }

  /**
   * Check if the user is suspended
   */
  isSuspended(): boolean {
    return this.status === 'SUSPENDED'
  }

  /**
   * Check if the user is banned
   */
  isBanned(): boolean {
    return this.status === 'BANNED'
  }

  /**
   * Check if the user is a customer
   */
  isCustomer(): boolean {
    return this.role === 'CUSTOMER'
  }

  /**
   * Check if the user is a service provider
   */
  isProvider(): boolean {
    return this.role === 'PROVIDER'
  }

  /**
   * Check if the user is an admin
   */
  isAdmin(): boolean {
    return this.role === 'ADMIN'
  }

  /**
   * Check if user can access admin features
   */
  canAccessAdmin(): boolean {
    return this.isAdmin() && this.isActive()
  }

  /**
   * Check if user can create provider profile
   */
  canCreateProvider(): boolean {
    return (
      (this.isCustomer() || this.isProvider()) &&
      this.isActive() &&
      this.emailVerified
    )
  }

  /**
   * Check if user has verified contact info
   */
  hasVerifiedContact(): boolean {
    return this.emailVerified || this.phoneVerified
  }

  /**
   * Check if user is a new user (less than 7 days)
   */
  isNewUser(): boolean {
    const sevenDaysAgo = new Date()

    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return this.createdAt > sevenDaysAgo
  }

  /**
   * Check if user has been inactive for more than 30 days
   */
  isInactive(): boolean {
    if (!this.lastLoginAt) return true

    const thirtyDaysAgo = new Date()

    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return this.lastLoginAt < thirtyDaysAgo
  }

  /**
   * Get user initials
   */
  getInitials(): string {
    const firstInitial = this.firstName.charAt(0).toUpperCase()
    const lastInitial = this.lastName.charAt(0).toUpperCase()

    return `${firstInitial}${lastInitial}`
  }

  /**
   * Get default address
   */
  getDefaultAddress(): Address | undefined {
    return this.addresses?.find((addr) => addr.isDefault)
  }

  /**
   * Get default payment method
   */
  getDefaultPaymentMethod(): PaymentMethod | undefined {
    return this.paymentMethods?.find((pm) => pm.isDefault)
  }

  /**
   * Get user status for display
   */
  getDisplayStatus(): string {
    if (this.isDeleted()) return 'Deleted'
    if (this.isBanned()) return 'Banned'
    if (this.isSuspended()) return 'Suspended'
    if (this.isActive()) return 'Active'

    return 'Unknown'
  }

  /**
   * Validate domain invariants
   */
  private validateInvariants(): void {
    if (!this.id) {
      throw ErrorFactory.validationError(
        { id: ['User ID is required'] },
        { source: 'User.validateInvariants' },
      )
    }

    if (!this.email) {
      throw ErrorFactory.validationError(
        { email: ['Email is required'] },
        { source: 'User.validateInvariants' },
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(this.email)) {
      throw ErrorFactory.validationError(
        { email: ['Email format is invalid'] },
        { source: 'User.validateInvariants' },
      )
    }

    if (!this.firstName?.trim()) {
      throw ErrorFactory.validationError(
        { firstName: ['First name is required'] },
        { source: 'User.validateInvariants' },
      )
    }

    if (!this.lastName?.trim()) {
      throw ErrorFactory.validationError(
        { lastName: ['Last name is required'] },
        { source: 'User.validateInvariants' },
      )
    }

    if (!this.role) {
      throw ErrorFactory.validationError(
        { role: ['User role is required'] },
        { source: 'User.validateInvariants' },
      )
    }

    if (!this.status) {
      throw ErrorFactory.validationError(
        { status: ['User status is required'] },
        { source: 'User.validateInvariants' },
      )
    }
  }

  /**
   * Convert to plain object for serialization
   * Following Admin pattern
   */
  toObject(): {
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
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    addresses?: Address[]
    paymentMethods?: PaymentMethod[]
  } {
    return {
      id: this.id,
      email: this.email,
      emailVerified: this.emailVerified,
      firstName: this.firstName,
      lastName: this.lastName,
      phoneNumber: this.phoneNumber,
      phoneVerified: this.phoneVerified,
      avatarUrl: this.avatarUrl,
      role: this.role,
      status: this.status,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      addresses: this.addresses,
      paymentMethods: this.paymentMethods,
    }
  }

  /**
   * Factory method for creating User instances
   * Following Admin pattern
   */
  static create(data: {
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
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    addresses?: Address[]
    paymentMethods?: PaymentMethod[]
  }): User {
    return new User(data)
  }

  /**
   * Factory method for creating new users
   * Sets sensible defaults for new users
   */
  static createNew(data: {
    id: string
    email: string
    firstName: string
    lastName: string
    phoneNumber?: string
    role?: UserRole
  }): User {
    return new User({
      ...data,
      emailVerified: false,
      phoneNumber: data.phoneNumber || null,
      phoneVerified: false,
      avatarUrl: null,
      role: data.role || 'CUSTOMER',
      status: 'ACTIVE',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })
  }
}
