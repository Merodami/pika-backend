import { MultilingualText } from '@pika/types-core'
import { get } from 'lodash-es'

/**
 * Admin permissions enum
 */
export enum AdminPermission {
  // Platform Management
  MANAGE_PLATFORM = 'MANAGE_PLATFORM',
  VIEW_PLATFORM_STATS = 'VIEW_PLATFORM_STATS',

  // Voucher Management
  MODERATE_VOUCHERS = 'MODERATE_VOUCHERS',
  APPROVE_VOUCHERS = 'APPROVE_VOUCHERS',
  DELETE_VOUCHERS = 'DELETE_VOUCHERS',

  // Provider Management
  MANAGE_PROVIDERS = 'MANAGE_PROVIDERS',
  APPROVE_PROVIDERS = 'APPROVE_PROVIDERS',
  SUSPEND_PROVIDERS = 'SUSPEND_PROVIDERS',

  // Book Management
  MANAGE_BOOKS = 'MANAGE_BOOKS',
  CREATE_BOOKS = 'CREATE_BOOKS',
  PUBLISH_BOOKS = 'PUBLISH_BOOKS',

  // Revenue Management
  VIEW_REVENUE = 'VIEW_REVENUE',
  MANAGE_PRICING = 'MANAGE_PRICING',
  GENERATE_REPORTS = 'GENERATE_REPORTS',

  // Analytics
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  EXPORT_DATA = 'EXPORT_DATA',
}

/**
 * Admin role enum
 */
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  CONTENT_MODERATOR = 'CONTENT_MODERATOR',
  ANALYTICS_VIEWER = 'ANALYTICS_VIEWER',
}

/**
 * Admin status enum
 */
export enum AdminStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

/**
 * Admin Domain Entity
 * Represents an admin user with specific permissions and capabilities
 */
export class Admin {
  public readonly id: string
  public readonly userId: string
  public readonly role: AdminRole
  public readonly permissions: AdminPermission[]
  public readonly status: AdminStatus
  public readonly name: MultilingualText
  public readonly email: string
  public readonly lastLoginAt: Date | null
  public readonly createdAt: Date
  public readonly updatedAt: Date
  public readonly createdBy: string | null
  public readonly metadata: Record<string, any> | null

  constructor({
    id,
    userId,
    role,
    permissions,
    status,
    name,
    email,
    lastLoginAt,
    createdAt,
    updatedAt,
    createdBy,
    metadata,
  }: {
    id: string
    userId: string
    role: AdminRole
    permissions: AdminPermission[]
    status: AdminStatus
    name: MultilingualText
    email: string
    lastLoginAt: Date | null
    createdAt: Date
    updatedAt: Date
    createdBy: string | null
    metadata?: Record<string, any> | null
  }) {
    this.id = id
    this.userId = userId
    this.role = role
    this.permissions = permissions
    this.status = status
    this.name = name
    this.email = email
    this.lastLoginAt = lastLoginAt
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.createdBy = createdBy
    this.metadata = metadata || null
  }

  /**
   * Check if admin has a specific permission
   */
  hasPermission(permission: AdminPermission): boolean {
    return this.permissions.includes(permission)
  }

  /**
   * Check if admin has any of the specified permissions
   */
  hasAnyPermission(permissions: AdminPermission[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission))
  }

  /**
   * Check if admin has all specified permissions
   */
  hasAllPermissions(permissions: AdminPermission[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission))
  }

  /**
   * Check if admin is active
   */
  isActive(): boolean {
    return this.status === AdminStatus.ACTIVE
  }

  /**
   * Check if admin can perform platform management
   */
  canManagePlatform(): boolean {
    return (
      this.hasPermission(AdminPermission.MANAGE_PLATFORM) && this.isActive()
    )
  }

  /**
   * Check if admin can moderate content
   */
  canModerateContent(): boolean {
    return (
      this.hasAnyPermission([
        AdminPermission.MODERATE_VOUCHERS,
        AdminPermission.APPROVE_VOUCHERS,
        AdminPermission.MANAGE_PROVIDERS,
      ]) && this.isActive()
    )
  }

  /**
   * Get admin display name for a specific language
   */
  getDisplayName(language: string): string {
    if (typeof this.name === 'string') {
      return this.name
    }

    return (
      get(this.name, language) ||
      this.name.en ||
      this.name.es ||
      Object.values(this.name)[0] ||
      this.email
    )
  }

  /**
   * Convert to plain object for serialization
   */
  toObject() {
    return {
      id: this.id,
      userId: this.userId,
      role: this.role,
      permissions: this.permissions,
      status: this.status,
      name: this.name,
      email: this.email,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      metadata: this.metadata,
    }
  }
}
