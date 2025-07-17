import { type MultilingualText } from '@pika/types-core'
import { get } from 'lodash-es'

/**
 * Category Domain Entity - Read Side
 * Following Admin Service pattern for perfect CQRS separation
 * This entity contains business logic for read operations
 */
export class Category {
  public readonly id: string
  public readonly name: MultilingualText
  public readonly description: MultilingualText
  public readonly iconUrl: string | null
  public readonly slug: string
  public readonly parentId: string | null
  public readonly level: number
  public readonly path: string
  public readonly active: boolean
  public readonly sortOrder: number
  public readonly createdAt: Date | null
  public readonly updatedAt: Date | null
  public readonly children?: Category[]

  constructor({
    id,
    name,
    description,
    iconUrl,
    slug,
    parentId,
    level,
    path,
    active,
    sortOrder,
    createdAt,
    updatedAt,
    children,
  }: {
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
    children?: Category[]
  }) {
    this.id = id
    this.name = name
    this.description = description
    this.iconUrl = iconUrl
    this.slug = slug
    this.parentId = parentId
    this.level = level
    this.path = path
    this.active = active
    this.sortOrder = sortOrder
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.children = children
  }

  /**
   * Determines if this is a root category (no parent)
   */
  isRootCategory(): boolean {
    return this.parentId === null
  }

  /**
   * Checks if this category has any children
   */
  hasChildren(): boolean {
    return Array.isArray(this.children) && this.children.length > 0
  }

  /**
   * Check if category is visible in marketplace
   * Following Admin pattern of business logic methods
   */
  isMarketplaceVisible(): boolean {
    return this.active && this.level > 0
  }

  /**
   * Check if category can have more children
   * Business rule: Maximum depth of 5 levels
   */
  canHaveChildren(): boolean {
    return this.level < 5
  }

  /**
   * Get category hierarchy depth
   */
  getHierarchyDepth(): number {
    if (!this.hasChildren()) return 1

    const childDepths = this.children!.map((child) => child.getHierarchyDepth())

    return 1 + Math.max(...childDepths)
  }

  /**
   * Get all parent IDs from the path
   */
  getParentIds(): string[] {
    return this.path.split('/').filter((id) => id && id !== '')
  }

  /**
   * Check if this category is a descendant of another category
   */
  isDescendantOf(categoryId: string): boolean {
    return this.getParentIds().includes(categoryId)
  }

  /**
   * Get category display name for a specific language
   * Following Admin pattern exactly
   */
  getDisplayName(language: string): string {
    if (typeof this.name === 'string') {
      return this.name
    }

    return get(this.name, language) || this.name.en || this.name.es || this.slug
  }

  /**
   * Get category display description for a specific language
   * Following Admin pattern exactly
   */
  getDisplayDescription(language: string): string {
    if (typeof this.description === 'string') {
      return this.description
    }

    return (
      get(this.description, language) ||
      this.description.en ||
      this.description.es ||
      ''
    )
  }

  /**
   * Get all active children
   */
  getActiveChildren(): Category[] {
    if (!this.children) return []

    return this.children.filter((child) => child.active)
  }

  /**
   * Count total descendants
   */
  getTotalDescendantCount(): number {
    if (!this.children) return 0

    return this.children.reduce((total, child) => {
      return total + 1 + child.getTotalDescendantCount()
    }, 0)
  }

  /**
   * Convert to plain object for serialization
   * Following Admin pattern exactly
   */
  toObject(): {
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
    children?: any[]
  } {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      iconUrl: this.iconUrl,
      slug: this.slug,
      parentId: this.parentId,
      level: this.level,
      path: this.path,
      active: this.active,
      sortOrder: this.sortOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      children: this.children?.map((child) => child.toObject()),
    }
  }
}
