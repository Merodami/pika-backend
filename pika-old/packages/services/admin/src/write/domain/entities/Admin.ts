import { ErrorFactory } from '@pika/shared'
import { type MultilingualContent, SUPPORTED_LANGUAGES } from '@pika/types-core'
import { merge } from 'lodash-es'

// Local AdminDocument type for the write model
export interface AdminDocument {
  id: string
  userId: string
  role: AdminRole
  permissions: AdminPermission[]
  status: AdminStatus
  name: MultilingualContent
  email: string
  lastLoginAt: Date | null
  createdAt?: Date | null
  updatedAt?: Date | null
  createdBy?: string | null
  metadata?: Record<string, any> | null
}

/**
 * Value Object for multilingual text, enforcing at least English 'en' translation.
 */
export class MultilingualText {
  // Store language values directly without any nesting
  private readonly en: string
  private readonly es: string
  private readonly gn: string

  constructor(multilingualText: MultilingualContent) {
    // Use the multilingual content directly
    const source = multilingualText || {
      en: '',
      es: '',
      gn: '',
    }

    if (!source.en) {
      throw ErrorFactory.validationError(
        { name: ['At least English translation (en) is required'] },
        { source: 'MultilingualText.constructor' },
      )
    }

    // Extract language values
    this.en = source.en
    this.es = source.es || ''
    this.gn = source.gn || ''
  }

  /**
   * Get text in requested language, fallback to English.
   */
  public get(lang: (typeof SUPPORTED_LANGUAGES)[number]): string {
    if (lang === 'en') return this.en
    if (lang === 'es') return this.es
    if (lang === 'gn') return this.gn

    return this.en
  }

  /**
   * Serialize to plain object.
   */
  public toObject(): Record<string, string> {
    return {
      en: this.en,
      es: this.es,
      gn: this.gn,
    }
  }
}

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
 * Properties describing an Admin aggregate.
 */
export interface AdminProps {
  userId: string
  role: AdminRole
  permissions: AdminPermission[]
  status: AdminStatus
  name: MultilingualText
  email: string
  lastLoginAt: Date | null
  createdBy: string | null
  metadata: Record<string, any> | null
}

/**
 * Admin aggregate root, encapsulating business rules for admins.
 */
export class Admin {
  public readonly id: string
  private props: AdminProps
  private readonly createdAt: Date | null
  private updatedAt: Date | null

  /**
   * Private constructor; use static create or reconstitute methods.
   */
  private constructor(
    id: string,
    props: AdminProps,
    createdAt: Date | null,
    updatedAt: Date | null,
  ) {
    this.id = id
    this.props = props
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  /**
   * Factory for new Admin (MVP).
   */
  public static create(dto: AdminDocument, id: string): Admin {
    const nameVO = new MultilingualText(dto.name)

    const props: AdminProps = {
      userId: dto.userId,
      role: dto.role,
      permissions: dto.permissions || [],
      status: dto.status ?? AdminStatus.ACTIVE,
      name: nameVO,
      email: dto.email,
      lastLoginAt: dto.lastLoginAt || null,
      createdBy: dto.createdBy ?? null,
      metadata: dto.metadata ?? null,
    }

    return new Admin(
      id,
      props,
      dto.createdAt || new Date(),
      dto.updatedAt || new Date(),
    )
  }

  /**
   * Rehydrates an existing Admin from persistence.
   */
  public static reconstitute(
    id: string,
    raw: AdminDocument,
    createdAt: Date | null,
    updatedAt: Date | null,
  ): Admin {
    const props: AdminProps = {
      userId: raw.userId,
      role: raw.role,
      permissions: raw.permissions || [],
      status: raw.status,
      name: new MultilingualText(raw.name),
      email: raw.email,
      lastLoginAt: raw.lastLoginAt ? new Date(raw.lastLoginAt) : null,
      createdBy: raw.createdBy ?? null,
      metadata: raw.metadata ?? null,
    }

    return new Admin(id, props, createdAt, updatedAt)
  }

  /** Accessors **/
  public get userId(): string {
    return this.props.userId
  }

  public get role(): AdminRole {
    return this.props.role
  }

  public get permissions(): AdminPermission[] {
    return [...this.props.permissions]
  }

  public get status(): AdminStatus {
    return this.props.status
  }

  public get name(): MultilingualText {
    return this.props.name
  }

  public get email(): string {
    return this.props.email
  }

  public get lastLoginAt(): Date | null {
    return this.props.lastLoginAt ? new Date(this.props.lastLoginAt) : null
  }

  public get createdBy(): string | null {
    return this.props.createdBy
  }

  public get metadata(): Record<string, any> | null {
    return this.props.metadata
  }

  public getCreatedAt(): Date | null {
    return this.createdAt ? new Date(this.createdAt) : null
  }

  public getUpdatedAt(): Date | null {
    return this.updatedAt ? new Date(this.updatedAt) : null
  }

  /**
   * Business behaviors
   */
  public isActive(): boolean {
    return this.props.status === AdminStatus.ACTIVE
  }

  public hasPermission(permission: AdminPermission): boolean {
    return this.props.permissions.includes(permission)
  }

  public hasAnyPermission(permissions: AdminPermission[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission))
  }

  public hasAllPermissions(permissions: AdminPermission[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission))
  }

  public canManagePlatform(): boolean {
    return (
      this.hasPermission(AdminPermission.MANAGE_PLATFORM) && this.isActive()
    )
  }

  public canModerateContent(): boolean {
    return (
      this.hasAnyPermission([
        AdminPermission.MODERATE_VOUCHERS,
        AdminPermission.APPROVE_VOUCHERS,
        AdminPermission.MANAGE_PROVIDERS,
      ]) && this.isActive()
    )
  }

  public getLocalizedName(lang: (typeof SUPPORTED_LANGUAGES)[number]): string {
    return this.props.name.get(lang)
  }

  public update(dto: Partial<AdminDocument>): void {
    if (dto.name)
      this.props.name = new MultilingualText(
        merge({}, this.props.name.toObject(), dto.name),
      )
    if (dto.role !== undefined) this.props.role = dto.role
    if (dto.permissions !== undefined) this.props.permissions = dto.permissions
    if (dto.status !== undefined) this.props.status = dto.status
    if (dto.email !== undefined) this.props.email = dto.email
    if (dto.lastLoginAt !== undefined)
      this.props.lastLoginAt = dto.lastLoginAt
        ? new Date(dto.lastLoginAt)
        : null
    if (dto.metadata !== undefined) this.props.metadata = dto.metadata

    this.updatedAt = new Date()
  }

  public updateLastLogin(): void {
    this.props.lastLoginAt = new Date()
    this.updatedAt = new Date()
  }

  public suspend(): void {
    this.props.status = AdminStatus.SUSPENDED
    this.updatedAt = new Date()
  }

  public activate(): void {
    this.props.status = AdminStatus.ACTIVE
    this.updatedAt = new Date()
  }

  public deactivate(): void {
    this.props.status = AdminStatus.INACTIVE
    this.updatedAt = new Date()
  }

  public addPermission(permission: AdminPermission): void {
    if (!this.hasPermission(permission)) {
      this.props.permissions.push(permission)
      this.updatedAt = new Date()
    }
  }

  public removePermission(permission: AdminPermission): void {
    const index = this.props.permissions.indexOf(permission)

    if (index > -1) {
      this.props.permissions.splice(index, 1)
      this.updatedAt = new Date()
    }
  }

  /**
   * Serialize aggregate to plain object for persistence or DTO.
   */
  public toObject(): Record<string, any> {
    return {
      id: this.id,
      userId: this.props.userId,
      role: this.props.role,
      permissions: this.props.permissions,
      status: this.props.status,
      name: this.props.name.toObject(),
      email: this.props.email,
      lastLoginAt: this.props.lastLoginAt
        ? this.props.lastLoginAt.toISOString()
        : null,
      createdBy: this.props.createdBy,
      metadata: this.props.metadata,
      createdAt: this.createdAt ? this.createdAt.toISOString() : null,
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
    }
  }
}
