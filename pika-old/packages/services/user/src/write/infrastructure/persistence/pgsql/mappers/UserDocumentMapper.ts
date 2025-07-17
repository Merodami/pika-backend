import { UserRole, UserStatus } from '@pika/types-core'
import { User } from '@user-write/domain/entities/User.js'

/**
 * Database document structure for User WRITE operations
 * Matches the Prisma schema with snake_case fields
 */
export interface UserDocument {
  id: string
  email: string
  email_verified: boolean
  first_name: string
  last_name: string
  phone_number: string | null
  phone_verified: boolean
  avatar_url: string | null
  role: UserRole
  status: UserStatus
  password: string | null
  last_login_at: Date | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

/**
 * Maps between database documents and domain entities for WRITE operations
 * Following Admin Service pattern - NO SDK dependencies
 */
export class UserDocumentMapper {
  /**
   * Map database document to domain entity
   * Handles both snake_case (from DB) and camelCase formats
   */
  static mapDocumentToDomain(document: UserDocument | any): User {
    // Handle both snake_case and camelCase field names
    const id = document.id
    const email = document.email
    const emailVerified =
      document.email_verified ?? document.emailVerified ?? false
    const firstName = document.first_name ?? document.firstName
    const lastName = document.last_name ?? document.lastName
    const phoneNumber = document.phone_number ?? document.phoneNumber ?? null
    const phoneVerified =
      document.phone_verified ?? document.phoneVerified ?? false
    const avatarUrl = document.avatar_url ?? document.avatarUrl ?? null
    const role = document.role
    const status = document.status
    const password = document.password
    const lastLoginAt = document.last_login_at ?? document.lastLoginAt
    const createdAt = document.created_at ?? document.createdAt
    const updatedAt = document.updated_at ?? document.updatedAt

    return User.reconstitute(
      id,
      {
        email,
        emailVerified,
        firstName,
        lastName,
        phoneNumber,
        phoneVerified,
        avatarUrl,
        role,
        status,
        password,
        lastLoginAt: lastLoginAt ? new Date(lastLoginAt) : null,
      },
      new Date(createdAt),
      new Date(updatedAt),
    )
  }

  /**
   * Map multiple documents to domain entities
   */
  static mapDocumentsToDomain(documents: UserDocument[]): User[] {
    return documents.map((doc) => this.mapDocumentToDomain(doc))
  }

  /**
   * Map domain entity to database document format
   * Converts to snake_case for database
   */
  static mapDomainToDocument(user: User): Partial<UserDocument> {
    const data = user.toObject()

    return {
      id: data.id,
      email: data.email,
      email_verified: data.emailVerified,
      first_name: data.firstName,
      last_name: data.lastName,
      phone_number: data.phoneNumber,
      phone_verified: data.phoneVerified,
      avatar_url: data.avatarUrl,
      role: data.role,
      status: data.status,
      password: data.password,
      last_login_at: data.lastLoginAt ? new Date(data.lastLoginAt) : null,
      created_at: data.createdAt ? new Date(data.createdAt) : new Date(),
      updated_at: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    }
  }

  /**
   * Map domain entity to create data format
   * Used for Prisma create operations
   */
  static mapDomainToCreateData(user: User): {
    id: string
    email: string
    email_verified: boolean
    first_name: string
    last_name: string
    phone_number: string | null
    phone_verified: boolean
    avatar_url: string | null
    role: UserRole
    status: UserStatus
    password: string | null
    last_login_at: Date | null
    created_at: Date
    updated_at: Date
  } {
    const data = user.toObject()

    return {
      id: data.id,
      email: data.email,
      email_verified: data.emailVerified,
      first_name: data.firstName,
      last_name: data.lastName,
      phone_number: data.phoneNumber,
      phone_verified: data.phoneVerified,
      avatar_url: data.avatarUrl,
      role: data.role,
      status: data.status,
      password: data.password,
      last_login_at: data.lastLoginAt ? new Date(data.lastLoginAt) : null,
      created_at: data.createdAt ? new Date(data.createdAt) : new Date(),
      updated_at: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    }
  }

  /**
   * Map domain entity to update data format
   * Used for Prisma update operations
   */
  static mapDomainToUpdateData(user: User): {
    email?: string
    email_verified?: boolean
    first_name?: string
    last_name?: string
    phone_number?: string | null
    phone_verified?: boolean
    avatar_url?: string | null
    role?: UserRole
    status?: UserStatus
    password?: string | null
    last_login_at?: Date | null
    updated_at: Date
  } {
    const data = user.toObject()

    return {
      email: data.email,
      email_verified: data.emailVerified,
      first_name: data.firstName,
      last_name: data.lastName,
      phone_number: data.phoneNumber,
      phone_verified: data.phoneVerified,
      avatar_url: data.avatarUrl,
      role: data.role,
      status: data.status,
      password: data.password,
      last_login_at: data.lastLoginAt ? new Date(data.lastLoginAt) : null,
      updated_at: new Date(),
    }
  }
}
