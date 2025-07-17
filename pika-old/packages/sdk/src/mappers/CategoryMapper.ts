import { LocalizationConfig, MultilingualContent } from '@pika/types-core'
import { get } from 'lodash-es'

import { categoryLocalizationConfig } from '../localization/CategoryLocalization.js'
import { Category } from '../openapi/models/Category.js'
import type { MultilingualText } from '../types/multilingual.js'
import { localizeObject } from './LocalizationUtils.js'

/**
 * Interface representing a database Category document
 * Uses snake_case for fields as they come from the database
 */
export interface CategoryDocument {
  id: string
  name: MultilingualText
  description: MultilingualText
  iconUrl: string | null
  slug: string
  parentId: string | null
  level: number
  path: string
  active: boolean
  sortOrder: number
  createdAt: Date | null
  updatedAt: Date | null
  children?: CategoryDocument[]
}

/**
 * Interface representing a domain Category entity with camelCase property names
 * This is the central domain model used across the application
 */
export interface CategoryDomain {
  id: string
  name: MultilingualText
  description: MultilingualText
  iconUrl: string | null
  slug: string
  parentId: string | null
  level: number
  path: string
  active: boolean
  sortOrder: number
  createdAt: Date | null
  updatedAt: Date | null
  children?: CategoryDomain[]
  // Optional localized fields that might be added by mappers
  localizedName?: string
  localizedDescription?: string
}

/**
 * Comprehensive Category mapper that handles all transformations:
 * - Database document to Domain entity
 * - Domain entity to API DTO
 * - API DTO to Domain entity
 * - Localization for any of the above
 */
export class CategoryMapper {
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
  static fromDocument(doc: CategoryDocument): CategoryDomain {
    return {
      id: doc.id,
      name: this.ensureMultilingualText(doc.name),
      description: this.ensureMultilingualText(doc.description),
      iconUrl: doc.iconUrl,
      slug: doc.slug,
      parentId: doc.parentId,
      level: doc.level,
      path: doc.path,
      active: doc.active,
      sortOrder: doc.sortOrder,
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
      children: doc.children?.map((child) => this.fromDocument(child)) ?? [],
    }
  }

  /**
   * Maps a domain entity to an API DTO
   * Transforms camelCase to snake_case and handles date formatting
   */
  static toDTO(domain: CategoryDomain): Category {
    // Format date to ISO string safely
    const formatDate = (date: Date | string | undefined | null): string => {
      if (!date) return new Date().toISOString()
      if (typeof date === 'string') return date
      if (date instanceof Date) return date.toISOString()

      return new Date().toISOString()
    }

    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      icon_url: domain.iconUrl || undefined,
      slug: domain.slug,
      parent_id: domain.parentId || undefined,
      level: domain.level,
      path: domain.path,
      active: domain.active,
      sort_order: domain.sortOrder,
      created_at: formatDate(domain.createdAt),
      updated_at: formatDate(domain.updatedAt),
      children: domain.children?.map((child) => this.toDTO(child)),
    }
  }

  /**
   * Maps an API DTO to a domain entity
   * Transforms snake_case to camelCase and handles date parsing
   */
  static fromDTO(dto: Category): CategoryDomain {
    return {
      id: dto.id,
      name: this.ensureMultilingualText(dto.name),
      description: this.ensureMultilingualText(dto.description),
      iconUrl: dto.icon_url || null,
      slug: dto.slug,
      parentId: dto.parent_id || null,
      level: dto.level,
      path: dto.path,
      active: dto.active,
      sortOrder: dto.sort_order,
      createdAt: dto.created_at ? new Date(dto.created_at) : null,
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : null,
      children: dto.children?.map((child) => this.fromDTO(child)) ?? [],
    }
  }

  /**
   * Localizes a domain entity by extracting the specified language
   * from multilingual fields
   */
  static localize(
    entity: CategoryDomain,
    language: string = 'en',
  ): CategoryDomain {
    // First create a copy with localized fields preserved
    const result = { ...entity }

    // Process name field
    result.localizedName =
      get(entity.name, language) ||
      get(entity.name, 'en') ||
      get(entity.name, 'es') ||
      ''

    // Process description field
    result.localizedDescription =
      get(entity.description, language) ||
      get(entity.description, 'en') ||
      get(entity.description, 'es') ||
      ''

    // Recursively localize children
    if (entity.children?.length) {
      result.children = entity.children.map((child) =>
        this.localize(child, language),
      )
    }

    return result
  }

  /**
   * Localizes a Category DTO using the localizationUtils
   * This is useful when you need to convert multilingual objects to simple strings
   */
  static localizeDTO(dto: Category, language: string = 'en'): Category {
    return localizeObject(dto, language, 'en')
  }

  /**
   * Gets the localization configuration for Categories
   */
  static getLocalizationConfig(): LocalizationConfig<Category> {
    return categoryLocalizationConfig
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
}
