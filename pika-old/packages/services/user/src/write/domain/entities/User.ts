import { ErrorFactory } from '@pika/shared'
import { UserRole, UserStatus } from '@pika/types-core'

/**
 * Properties for User aggregate
 */
export interface UserProps {
  email: string
  emailVerified: boolean
  firstName: string
  lastName: string
  phoneNumber: string | null
  phoneVerified: boolean
  avatarUrl: string | null
  role: UserRole
  status: UserStatus
  password: string | null
  lastLoginAt: Date | null
}

/**
 * User Write Domain Entity - Following Admin Service pattern
 * Rich domain model with business logic and validation for write operations
 */
export class User {
  public readonly id: string
  private props: UserProps
  private readonly createdAt: Date | null
  private updatedAt: Date | null

  /**
   * Private constructor; use static create or reconstitute methods
   */
  private constructor(
    id: string,
    props: UserProps,
    createdAt: Date | null,
    updatedAt: Date | null,
  ) {
    this.id = id
    this.props = props
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.validateInvariants()
  }

  /**
   * Factory for new User
   */
  public static create(data: {
    id: string
    email: string
    firstName: string
    lastName: string
    phoneNumber?: string
    role?: UserRole
    password?: string
  }): User {
    const props: UserProps = {
      email: data.email,
      emailVerified: false,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber || null,
      phoneVerified: false,
      avatarUrl: null,
      role: data.role || UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      password: data.password || null,
      lastLoginAt: null,
    }

    return new User(data.id, props, new Date(), new Date())
  }

  /**
   * Rehydrates an existing User from persistence
   */
  public static reconstitute(
    id: string,
    raw: {
      email: string
      emailVerified: boolean
      firstName: string
      lastName: string
      phoneNumber: string | null
      phoneVerified: boolean
      avatarUrl: string | null
      role: UserRole
      status: UserStatus
      password: string | null
      lastLoginAt: Date | null
    },
    createdAt: Date | null,
    updatedAt: Date | null,
  ): User {
    const props: UserProps = {
      email: raw.email,
      emailVerified: raw.emailVerified,
      firstName: raw.firstName,
      lastName: raw.lastName,
      phoneNumber: raw.phoneNumber,
      phoneVerified: raw.phoneVerified,
      avatarUrl: raw.avatarUrl,
      role: raw.role,
      status: raw.status,
      password: raw.password,
      lastLoginAt: raw.lastLoginAt ? new Date(raw.lastLoginAt) : null,
    }

    return new User(id, props, createdAt, updatedAt)
  }

  /** Accessors */
  public get email(): string {
    return this.props.email
  }

  public get emailVerified(): boolean {
    return this.props.emailVerified
  }

  public get firstName(): string {
    return this.props.firstName
  }

  public get lastName(): string {
    return this.props.lastName
  }

  public get phoneNumber(): string | null {
    return this.props.phoneNumber
  }

  public get phoneVerified(): boolean {
    return this.props.phoneVerified
  }

  public get avatarUrl(): string | null {
    return this.props.avatarUrl
  }

  public get role(): UserRole {
    return this.props.role
  }

  public get status(): UserStatus {
    return this.props.status
  }

  public get password(): string | null {
    return this.props.password
  }

  public get lastLoginAt(): Date | null {
    return this.props.lastLoginAt ? new Date(this.props.lastLoginAt) : null
  }

  public getCreatedAt(): Date | null {
    return this.createdAt ? new Date(this.createdAt) : null
  }

  public getUpdatedAt(): Date | null {
    return this.updatedAt ? new Date(this.updatedAt) : null
  }

  /** Business behaviors */
  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim()
  }

  public isActive(): boolean {
    return this.status === UserStatus.ACTIVE
  }

  public isCustomer(): boolean {
    return this.role === UserRole.CUSTOMER
  }

  public isProvider(): boolean {
    return this.role === UserRole.PROVIDER
  }

  public isAdmin(): boolean {
    return this.role === UserRole.ADMIN
  }

  public canCreateProvider(): boolean {
    return (
      (this.isCustomer() || this.isProvider()) &&
      this.isActive() &&
      this.emailVerified
    )
  }

  public hasVerifiedContact(): boolean {
    return this.emailVerified || this.phoneVerified
  }

  public getInitials(): string {
    const firstInitial = this.firstName.charAt(0).toUpperCase()
    const lastInitial = this.lastName.charAt(0).toUpperCase()

    return `${firstInitial}${lastInitial}`
  }

  /** Mutations */
  public update(
    updates: Partial<{
      email: string
      firstName: string
      lastName: string
      phoneNumber: string | null
      avatarUrl: string | null
      status: UserStatus
      emailVerified: boolean
      phoneVerified: boolean
    }>,
  ): void {
    if (updates.email !== undefined) this.props.email = updates.email
    if (updates.firstName !== undefined)
      this.props.firstName = updates.firstName
    if (updates.lastName !== undefined) this.props.lastName = updates.lastName
    if (updates.phoneNumber !== undefined)
      this.props.phoneNumber = updates.phoneNumber
    if (updates.avatarUrl !== undefined)
      this.props.avatarUrl = updates.avatarUrl
    if (updates.status !== undefined) this.props.status = updates.status
    if (updates.emailVerified !== undefined)
      this.props.emailVerified = updates.emailVerified
    if (updates.phoneVerified !== undefined)
      this.props.phoneVerified = updates.phoneVerified

    this.updatedAt = new Date()
    this.validateInvariants()
  }

  public updateLastLogin(): void {
    this.props.lastLoginAt = new Date()
    this.updatedAt = new Date()
  }

  public changePassword(newPassword: string): void {
    this.props.password = newPassword
    this.updatedAt = new Date()
  }

  public verifyEmail(): void {
    this.props.emailVerified = true
    this.updatedAt = new Date()
  }

  public verifyPhone(): void {
    this.props.phoneVerified = true
    this.updatedAt = new Date()
  }

  public suspend(): void {
    this.props.status = UserStatus.SUSPENDED
    this.updatedAt = new Date()
  }

  public activate(): void {
    this.props.status = UserStatus.ACTIVE
    this.updatedAt = new Date()
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

    if (!this.props.email) {
      throw ErrorFactory.validationError(
        { email: ['Email is required'] },
        { source: 'User.validateInvariants' },
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(this.props.email)) {
      throw ErrorFactory.validationError(
        { email: ['Email format is invalid'] },
        { source: 'User.validateInvariants' },
      )
    }

    if (!this.props.firstName?.trim()) {
      throw ErrorFactory.validationError(
        { firstName: ['First name is required'] },
        { source: 'User.validateInvariants' },
      )
    }

    if (!this.props.lastName?.trim()) {
      throw ErrorFactory.validationError(
        { lastName: ['Last name is required'] },
        { source: 'User.validateInvariants' },
      )
    }

    // Validate phone number format if provided
    if (this.props.phoneNumber) {
      const phoneRegex = /^\+\d{1,3}\d{6,14}$/

      if (!phoneRegex.test(this.props.phoneNumber)) {
        throw ErrorFactory.validationError(
          { phoneNumber: ['Phone number format is invalid'] },
          { source: 'User.validateInvariants' },
        )
      }
    }
  }

  /**
   * Serialize aggregate to plain object for persistence or DTO
   */
  public toObject(): Record<string, any> {
    return {
      id: this.id,
      email: this.props.email,
      emailVerified: this.props.emailVerified,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      phoneNumber: this.props.phoneNumber,
      phoneVerified: this.props.phoneVerified,
      avatarUrl: this.props.avatarUrl,
      role: this.props.role,
      status: this.props.status,
      password: this.props.password,
      lastLoginAt: this.props.lastLoginAt
        ? this.props.lastLoginAt.toISOString()
        : null,
      createdAt: this.createdAt ? this.createdAt.toISOString() : null,
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
    }
  }
}
