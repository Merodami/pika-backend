import { CategoryDocument } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import { type MultilingualContent, SUPPORTED_LANGUAGES } from '@pika/types-core'
import { merge } from 'lodash-es'

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
 * Value Object for slug, enforcing lowercase, numbers, and hyphens.
 */
export class Slug {
  private static readonly PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  private readonly value: string

  constructor(value: string) {
    if (!Slug.PATTERN.test(value)) {
      throw ErrorFactory.validationError(
        { slug: ['Invalid slug: use lowercase letters, numbers, hyphens'] },
        { source: 'Slug.constructor' },
      )
    }
    this.value = value
  }

  public get(): string {
    return this.value
  }
}

/**
 * Properties describing a Category aggregate.
 */
export interface CategoryProps {
  name: MultilingualText
  description: MultilingualText
  iconUrl?: string
  slug: Slug
  parentId?: string
  level: number
  path: string
  active: boolean
  sortOrder: number
  children: Category[]
}

/**
 * Category aggregate root, encapsulating business rules for categories.
 * Following Admin Service pattern for architectural excellence
 */
export class Category {
  public readonly id: string
  private props: CategoryProps
  private readonly createdAt: Date | null
  private updatedAt: Date | null

  /**
   * Private constructor; use static create or reconstitute methods.
   */
  private constructor(
    id: string,
    props: CategoryProps,
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
   * Factory for new Category (MVP); repository will assign level/path.
   */
  public static create(dto: CategoryDocument, id: string): Category {
    const nameVO = new MultilingualText(dto.name)
    const descVO = new MultilingualText(
      dto.description ?? { en: '', es: '', gn: '' },
    )
    const slugVO = new Slug(dto.slug)

    const props: CategoryProps = {
      name: nameVO,
      description: descVO,
      iconUrl: dto.iconUrl ?? undefined,
      slug: slugVO,
      parentId: dto.parentId ?? undefined,
      // Use the level from the DTO if provided (from repository calculation), or default to 1
      level: dto.level || 1,
      // Use the path from the DTO if provided, or default to empty
      path: dto.path || '',
      active: dto.active ?? true,
      sortOrder: dto.sortOrder ?? 0,
      children: [],
    }

    return new Category(
      id,
      props,
      dto.createdAt || new Date(),
      dto.updatedAt || new Date(),
    )
  }

  /**
   * Rehydrates an existing Category from persistence.
   */
  public static reconstitute(
    id: string,
    raw: CategoryDocument,
    createdAt: Date | null,
    updatedAt: Date | null,
  ): Category {
    const props: CategoryProps = {
      name: new MultilingualText(raw.name),
      description: new MultilingualText(raw.description),
      iconUrl: raw.iconUrl ?? undefined,
      slug: new Slug(raw.slug),
      parentId: raw.parentId ?? undefined,
      level: raw.level,
      path: raw.path,
      active: raw.active,
      sortOrder: raw.sortOrder,
      children: (raw.children ?? []).map((c: CategoryDocument) =>
        Category.reconstitute(
          c.id,
          c,
          c.createdAt ? new Date(c.createdAt) : null,
          c.updatedAt ? new Date(c.updatedAt) : null,
        ),
      ),
    }

    return new Category(id, props, createdAt, updatedAt)
  }

  /** Accessors **/
  public get name(): MultilingualText {
    return this.props.name
  }

  public get description(): MultilingualText {
    return this.props.description
  }

  public get iconUrl(): string | undefined {
    return this.props.iconUrl
  }

  public get slug(): string {
    return this.props.slug.get()
  }

  public get parentId(): string | undefined {
    return this.props.parentId
  }

  public get level(): number {
    return this.props.level
  }

  public get path(): string {
    return this.props.path
  }

  public get active(): boolean {
    return this.props.active
  }

  public get sortOrder(): number {
    return this.props.sortOrder
  }

  public get children(): Category[] {
    return [...this.props.children]
  }

  public getCreatedAt(): Date | null {
    return this.createdAt ? new Date(this.createdAt) : null
  }

  public getUpdatedAt(): Date | null {
    return this.updatedAt ? new Date(this.updatedAt) : null
  }

  /**
   * Business behaviors - Following Admin pattern
   */
  public isRoot(): boolean {
    return !this.props.parentId
  }

  public hasChildren(): boolean {
    return this.props.children.length > 0
  }

  public getLocalizedName(lang: (typeof SUPPORTED_LANGUAGES)[number]): string {
    return this.props.name.get(lang)
  }

  public getLocalizedDescription(
    lang: (typeof SUPPORTED_LANGUAGES)[number],
  ): string {
    return this.props.description.get(lang)
  }

  /**
   * Check if category is visible in marketplace
   * Business rule: Only active categories above root level are visible
   */
  public isMarketplaceVisible(): boolean {
    return this.props.active && this.props.level > 0
  }

  /**
   * Check if category can have more children
   * Business rule: Maximum depth of 5 levels
   */
  public canHaveChildren(): boolean {
    return this.props.level < 5
  }

  /**
   * Get all parent IDs from the path
   */
  public getParentIds(): string[] {
    return this.props.path.split('/').filter((id) => id && id !== '')
  }

  /**
   * Check if this category is a descendant of another category
   */
  public isDescendantOf(categoryId: string): boolean {
    return this.getParentIds().includes(categoryId)
  }

  /**
   * Validate domain invariants
   */
  private validateInvariants(): void {
    if (!this.id) {
      throw ErrorFactory.validationError(
        { id: ['Category ID is required'] },
        { source: 'Category.validateInvariants' },
      )
    }

    if (this.props.level < 1) {
      throw ErrorFactory.validationError(
        { level: ['Category level must be >= 1'] },
        { source: 'Category.validateInvariants' },
      )
    }

    if (this.props.parentId === this.id) {
      throw ErrorFactory.validationError(
        { parentId: ['Category cannot be its own parent'] },
        { source: 'Category.validateInvariants' },
      )
    }

    // Validate path consistency
    if (this.props.parentId && !this.props.path.includes(this.props.parentId)) {
      throw ErrorFactory.validationError(
        { path: ['Category path must include parent ID'] },
        { source: 'Category.validateInvariants' },
      )
    }
  }

  public update(dto: Partial<CategoryDocument>): void {
    if (dto.name)
      this.props.name = new MultilingualText(
        merge({}, this.props.name.toObject(), dto.name),
      )
    if (dto.description)
      this.props.description = new MultilingualText(
        merge({}, this.props.description.toObject(), dto.description),
      )
    if (dto.iconUrl !== undefined) this.props.iconUrl = dto.iconUrl ?? undefined
    if (dto.slug) this.props.slug = new Slug(dto.slug)
    if (dto.parentId !== undefined)
      this.props.parentId = dto.parentId ?? undefined
    if (dto.active !== undefined) this.props.active = dto.active
    if (dto.sortOrder !== undefined) this.props.sortOrder = dto.sortOrder

    this.updatedAt = new Date()
  }

  public deactivate(): void {
    this.props.active = false
    this.updatedAt = new Date()
  }

  public activate(): void {
    this.props.active = true
    this.updatedAt = new Date()
  }

  /**
   * Move category to a new parent
   * Note: Level and path recalculation should be done by repository
   */
  public changeParent(newParentId: string | undefined): void {
    if (newParentId === this.id) {
      throw ErrorFactory.validationError(
        { parentId: ['Category cannot be its own parent'] },
        { source: 'Category.changeParent' },
      )
    }

    if (newParentId && this.isDescendantOf(this.id)) {
      throw ErrorFactory.validationError(
        { parentId: ['Cannot move category to its own descendant'] },
        { source: 'Category.changeParent' },
      )
    }

    this.props.parentId = newParentId
    this.updatedAt = new Date()
    // Repository will handle level and path recalculation
  }

  /**
   * Update sort order for display ordering
   */
  public updateSortOrder(sortOrder: number): void {
    if (sortOrder < 0) {
      throw ErrorFactory.validationError(
        { sortOrder: ['Sort order must be non-negative'] },
        { source: 'Category.updateSortOrder' },
      )
    }

    this.props.sortOrder = sortOrder
    this.updatedAt = new Date()
  }

  /**
   * Serialize aggregate to plain object for persistence or DTO.
   */
  public toObject(): Record<string, any> {
    return {
      id: this.id,
      name: this.props.name.toObject(),
      description: this.props.description.toObject(),
      iconUrl: this.props.iconUrl,
      slug: this.props.slug.get(),
      parentId: this.props.parentId,
      level: this.props.level,
      path: this.props.path,
      active: this.props.active,
      sortOrder: this.props.sortOrder,
      createdAt: this.createdAt ? this.createdAt.toISOString() : null,
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
      children: this.props.children.map((c) => c.toObject()),
    }
  }
}
