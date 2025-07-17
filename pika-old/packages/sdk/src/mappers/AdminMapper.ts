import { LocalizationConfig, MultilingualContent } from '@pika/types-core'
import { get } from 'lodash-es'

import { adminLocalizationConfig } from '../localization/AdminLocalization.js'
import { Admin } from '../openapi/models/Admin.js'
import type { MultilingualText } from '../types/multilingual.js'
import { localizeObject } from './LocalizationUtils.js'

/**
 * Interface representing a database Admin document
 * Uses snake_case for fields as they come from the database
 */
export interface AdminDocument {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  permissions: string[]
  status: string
  lastLoginAt: Date | null
  metadata: Record<string, any>
  profileData: {
    bio: MultilingualText
    phone: string | null
    timezone: string
    language: string
    avatarUrl?: string | null
  }
  createdAt: Date | null
  updatedAt: Date | null
}

/**
 * Interface representing a domain Admin entity with camelCase property names
 * This is the central domain model used across the application
 */
export interface AdminDomain {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  permissions: string[]
  status: string
  lastLoginAt: Date | null
  metadata: Record<string, any>
  profileData: {
    bio: MultilingualText
    phone: string | null
    timezone: string
    language: string
    avatarUrl?: string | null
  }
  createdAt: Date | null
  updatedAt: Date | null
  // Optional localized fields that might be added by mappers
  localizedBio?: string
  fullName?: string
}

/**
 * Comprehensive Admin mapper that handles all transformations:
 * - Database document to Domain entity
 * - Domain entity to API DTO
 * - API DTO to Domain entity
 * - Localization for any of the above
 */
export class AdminMapper {
  /**
   * Ensures a value is a valid MultilingualText
   * Adds required fields if missing
   */
  static ensureMultilingualText(value: any): MultilingualText {
    // If it's not an object, return empty multilingual text
    if (!value || typeof value !== 'object') {
      return {
        en: '',
        es: '',
        gn: '',
      }
    }

    // Return a multilingual object with the values that exist
    return {
      en: String(value.en || ''),
      es: String(value.es || ''),
      gn: String(value.gn || ''),
    }
  }

  /**
   * Maps a database document to a domain entity
   * Handles nested objects and transforms snake_case to camelCase
   */
  static fromDocument(doc: AdminDocument): AdminDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      role: doc.role,
      permissions: doc.permissions || [],
      status: doc.status,
      lastLoginAt: doc.lastLoginAt
        ? doc.lastLoginAt instanceof Date
          ? doc.lastLoginAt
          : new Date(doc.lastLoginAt)
        : null,
      metadata: doc.metadata || {},
      profileData: {
        bio: this.ensureMultilingualText(doc.profileData?.bio),
        phone: doc.profileData?.phone || null,
        timezone: doc.profileData?.timezone || 'UTC',
        language: doc.profileData?.language || 'en',
        avatarUrl: doc.profileData?.avatarUrl || null,
      },
      createdAt: doc.createdAt
        ? doc.createdAt instanceof Date
          ? doc.createdAt
          : new Date(doc.createdAt)
        : null,
      updatedAt: doc.updatedAt
        ? doc.updatedAt instanceof Date
          ? doc.updatedAt
          : new Date(doc.updatedAt)
        : null,
      fullName: `${doc.firstName} ${doc.lastName}`.trim(),
    }
  }

  /**
   * Maps a domain entity to an API DTO
   * Transforms camelCase to snake_case and handles date formatting
   */
  static toDTO(domain: AdminDomain): Admin {
    // Format date to ISO string safely
    const formatDate = (date: Date | string | undefined | null): string => {
      if (!date) return new Date().toISOString()
      if (typeof date === 'string') return date
      if (date instanceof Date) return date.toISOString()

      return new Date().toISOString()
    }

    return {
      id: domain.id,
      user_id: domain.userId,
      email: domain.email,
      first_name: domain.firstName,
      last_name: domain.lastName,
      role: domain.role as 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR',
      permissions: domain.permissions,
      status: domain.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
      last_login_at: domain.lastLoginAt
        ? formatDate(domain.lastLoginAt)
        : undefined,
      metadata: domain.metadata,
      profile_data: {
        bio: domain.profileData.bio,
        phone: domain.profileData.phone || undefined,
        timezone: domain.profileData.timezone,
        language: domain.profileData.language,
        avatar_url: domain.profileData.avatarUrl || undefined,
      },
      created_at: formatDate(domain.createdAt),
      updated_at: formatDate(domain.updatedAt),
      full_name:
        domain.fullName || `${domain.firstName} ${domain.lastName}`.trim(),
    }
  }

  /**
   * Maps an API DTO to a domain entity
   * Transforms snake_case to camelCase and handles date parsing
   */
  static fromDTO(dto: Admin): AdminDomain {
    return {
      id: dto.id,
      userId: dto.user_id,
      email: dto.email,
      firstName: dto.first_name,
      lastName: dto.last_name,
      role: dto.role,
      permissions: dto.permissions || [],
      status: dto.status,
      lastLoginAt: dto.last_login_at ? new Date(dto.last_login_at) : null,
      metadata: dto.metadata || {},
      profileData: {
        bio: this.ensureMultilingualText(dto.profile_data?.bio),
        phone: dto.profile_data?.phone || null,
        timezone: dto.profile_data?.timezone || 'UTC',
        language: dto.profile_data?.language || 'en',
        avatarUrl: dto.profile_data?.avatar_url || null,
      },
      createdAt: dto.created_at ? new Date(dto.created_at) : null,
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : null,
      fullName: dto.full_name || `${dto.first_name} ${dto.last_name}`.trim(),
    }
  }

  /**
   * Localizes a domain entity by extracting the specified language
   * from multilingual fields
   */
  static localize(entity: AdminDomain, language: string = 'en'): AdminDomain {
    // First create a copy with localized fields preserved
    const result = { ...entity }

    // Process bio field
    result.localizedBio =
      get(entity.profileData.bio, language) ||
      get(entity.profileData.bio, 'en') ||
      get(entity.profileData.bio, 'es') ||
      ''

    // Ensure fullName is populated
    result.fullName =
      result.fullName || `${entity.firstName} ${entity.lastName}`.trim()

    return result
  }

  /**
   * Localizes an Admin DTO using the localizationUtils
   * This is useful when you need to convert multilingual objects to simple strings
   */
  static localizeDTO(dto: Admin, language: string = 'en'): Admin {
    return localizeObject(dto, language, 'en')
  }

  /**
   * Gets the localization configuration for Admins
   */
  static getLocalizationConfig(): LocalizationConfig<Admin> {
    return adminLocalizationConfig
  }

  /**
   * Helper method to extract a localized value from a multilingual object
   */
  static getLocalizedValue(
    multilingualObj: MultilingualContent | null | undefined,
    language: string = 'en',
    defaultLanguage: string = 'en',
  ): string {
    if (!multilingualObj) return ''

    // Direct access to multilingual content

    return (
      get(multilingualObj, language) ||
      get(multilingualObj, defaultLanguage) ||
      ''
    )
  }

  /**
   * Helper method to get admin display name
   */
  static getDisplayName(admin: AdminDomain | Admin): string {
    if ('fullName' in admin && admin.fullName) {
      return admin.fullName
    }
    if ('full_name' in admin && admin.full_name) {
      return admin.full_name
    }
    if ('firstName' in admin && 'lastName' in admin) {
      return `${admin.firstName} ${admin.lastName}`.trim()
    }
    if ('first_name' in admin && 'last_name' in admin) {
      return `${admin.first_name} ${admin.last_name}`.trim()
    }

    return (admin as any).email || 'Unknown Admin'
  }

  /**
   * Helper method to check if admin has specific permission
   */
  static hasPermission(
    admin: AdminDomain | Admin,
    permission: string,
  ): boolean {
    return admin.permissions?.includes(permission) || false
  }

  /**
   * Helper method to check if admin is active
   */
  static isActive(admin: AdminDomain | Admin): boolean {
    return admin.status === 'ACTIVE'
  }
}
