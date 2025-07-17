import { ProviderDocument } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import { type MultilingualContent } from '@pika/types-core'
import { SUPPORTED_LANGUAGES } from '@pika/types-core'
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
        { businessName: ['At least English translation (en) is required'] },
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
 * Properties describing a Provider aggregate.
 */
export interface ProviderProps {
  userId: string
  businessName: MultilingualText
  businessDescription: MultilingualText
  categoryId: string
  verified: boolean
  active: boolean
  avgRating: number
}

/**
 * Provider aggregate root, encapsulating business rules for service providers.
 */
export class Provider {
  public readonly id: string
  private props: ProviderProps
  private readonly createdAt: Date | null
  private updatedAt: Date | null
  private deletedAt: Date | null

  /**
   * Private constructor; use static create or reconstitute methods.
   */
  private constructor(
    id: string,
    props: ProviderProps,
    createdAt: Date | null,
    updatedAt: Date | null,
    deletedAt: Date | null = null,
  ) {
    this.id = id
    this.props = props
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.deletedAt = deletedAt
  }

  /**
   * Factory for new Provider.
   */
  public static create(
    dto: ProviderDocument,
    id: string,
    userId: string,
  ): Provider {
    const businessNameVO = new MultilingualText(
      dto.businessName as MultilingualContent,
    )
    const businessDescriptionVO = new MultilingualText(
      (dto.businessDescription ?? {
        en: '',
        es: '',
        gn: '',
      }) as MultilingualContent,
    )

    const props: ProviderProps = {
      userId,
      businessName: businessNameVO,
      businessDescription: businessDescriptionVO,
      categoryId: dto.categoryId,
      verified: dto.verified ?? false,
      active: dto.active ?? true,
      avgRating: dto.avgRating ?? 0,
    }

    return new Provider(
      id,
      props,
      dto.createdAt || new Date(),
      dto.updatedAt || new Date(),
      dto.deletedAt || null,
    )
  }

  /**
   * Rehydrates an existing Provider from persistence.
   */
  public static reconstitute(
    id: string,
    raw: ProviderDocument,
    createdAt: Date | null,
    updatedAt: Date | null,
    deletedAt: Date | null = null,
  ): Provider {
    const props: ProviderProps = {
      userId: raw.userId,
      businessName: new MultilingualText(
        raw.businessName as MultilingualContent,
      ),
      businessDescription: new MultilingualText(
        raw.businessDescription as MultilingualContent,
      ),
      categoryId: raw.categoryId,
      verified: raw.verified,
      active: raw.active,
      avgRating: raw.avgRating || 0,
    }

    return new Provider(id, props, createdAt, updatedAt, deletedAt)
  }

  /** Accessors **/
  public get userId(): string {
    return this.props.userId
  }

  public get businessName(): MultilingualText {
    return this.props.businessName
  }

  public get businessDescription(): MultilingualText {
    return this.props.businessDescription
  }

  public get categoryId(): string {
    return this.props.categoryId
  }

  public get verified(): boolean {
    return this.props.verified
  }

  public get active(): boolean {
    return this.props.active
  }

  public get avgRating(): number {
    return this.props.avgRating
  }

  public getCreatedAt(): Date | null {
    return this.createdAt ? new Date(this.createdAt) : null
  }

  public getUpdatedAt(): Date | null {
    return this.updatedAt ? new Date(this.updatedAt) : null
  }

  public getDeletedAt(): Date | null {
    return this.deletedAt ? new Date(this.deletedAt) : null
  }

  /**
   * Business behaviors
   */
  public isVerified(): boolean {
    return this.props.verified
  }

  public isActive(): boolean {
    return this.props.active && !this.deletedAt
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null
  }

  public getLocalizedBusinessName(
    lang: (typeof SUPPORTED_LANGUAGES)[number],
  ): string {
    return this.props.businessName.get(lang)
  }

  public getLocalizedBusinessDescription(
    lang: (typeof SUPPORTED_LANGUAGES)[number],
  ): string {
    return this.props.businessDescription.get(lang)
  }

  public update(dto: Partial<ProviderDocument>): void {
    if (dto.businessName)
      this.props.businessName = new MultilingualText(
        merge(
          {},
          this.props.businessName.toObject(),
          dto.businessName,
        ) as MultilingualContent,
      )
    if (dto.businessDescription)
      this.props.businessDescription = new MultilingualText(
        merge(
          {},
          this.props.businessDescription.toObject(),
          dto.businessDescription,
        ) as MultilingualContent,
      )
    if (dto.categoryId !== undefined) this.props.categoryId = dto.categoryId
    if (dto.verified !== undefined) this.props.verified = dto.verified
    if (dto.active !== undefined) this.props.active = dto.active
    if (dto.avgRating !== undefined) this.props.avgRating = dto.avgRating || 0

    this.updatedAt = new Date()
  }

  public verify(): void {
    this.props.verified = true
    this.updatedAt = new Date()
  }

  public deactivate(): void {
    this.props.active = false
    this.updatedAt = new Date()
  }

  public softDelete(): void {
    this.deletedAt = new Date()
    this.updatedAt = new Date()
  }

  public updateRating(newRating: number): void {
    if (newRating < 0 || newRating > 5) {
      throw ErrorFactory.validationError(
        { rating: ['Rating must be between 0 and 5'] },
        { source: 'Provider.updateRating' },
      )
    }
    this.props.avgRating = newRating
    this.updatedAt = new Date()
  }

  /**
   * Serialize aggregate to plain object for persistence or DTO.
   */
  public toObject(): Record<string, any> {
    return {
      id: this.id,
      userId: this.props.userId,
      businessName: this.props.businessName.toObject(),
      businessDescription: this.props.businessDescription.toObject(),
      categoryId: this.props.categoryId,
      verified: this.props.verified,
      active: this.props.active,
      avgRating: this.props.avgRating,
      createdAt: this.createdAt ? this.createdAt.toISOString() : null,
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    }
  }
}
