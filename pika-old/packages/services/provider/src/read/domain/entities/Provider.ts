import {
  PROVIDER_HIGH_RATING_THRESHOLD,
  PROVIDER_MAX_RATING,
  PROVIDER_MIN_RATING,
  PROVIDER_NEW_DAYS_THRESHOLD,
} from '@pika/environment'
import { ErrorFactory } from '@pika/shared'
import { UserSummary } from '@pika/types-core'

/**
 * MultilingualText type for Provider domain
 * Matches database schema where es and gn are optional
 */
export interface MultilingualText {
  en: string
  es?: string
  gn?: string
}

/**
 * Provider Read Domain Entity - Following Admin Service pattern
 * Rich domain model with business logic and validation
 */
export class Provider {
  // Private fields for encapsulation
  private readonly id: string
  private readonly userId: string
  private readonly businessName: MultilingualText
  private readonly businessDescription: MultilingualText
  private readonly categoryId: string
  private readonly verified: boolean
  private readonly active: boolean
  private readonly avgRating: number
  private readonly createdAt: Date | null
  private readonly updatedAt: Date | null
  private readonly deletedAt: Date | null
  private readonly user?: UserSummary

  /**
   * Private constructor following Admin pattern
   * Use factory methods for creation
   */
  private constructor({
    id,
    userId,
    businessName,
    businessDescription,
    categoryId,
    verified,
    active,
    avgRating,
    createdAt,
    updatedAt,
    deletedAt,
    user,
  }: {
    id: string
    userId: string
    businessName: MultilingualText
    businessDescription: MultilingualText
    categoryId: string
    verified: boolean
    active: boolean
    avgRating: number
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
    user?: UserSummary
  }) {
    this.id = id
    this.userId = userId
    this.businessName = businessName
    this.businessDescription = businessDescription
    this.categoryId = categoryId
    this.verified = verified
    this.active = active
    this.avgRating = avgRating
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.deletedAt = deletedAt
    this.user = user

    // Validate invariants
    this.validateInvariants()
  }

  /**
   * Getters following Admin pattern
   */
  get getId(): string {
    return this.id
  }

  get getUserId(): string {
    return this.userId
  }

  get getBusinessName(): MultilingualText {
    return this.businessName
  }

  get getBusinessDescription(): MultilingualText {
    return this.businessDescription
  }

  get getCategoryId(): string {
    return this.categoryId
  }

  get getVerified(): boolean {
    return this.verified
  }

  get getActive(): boolean {
    return this.active
  }

  get getAvgRating(): number {
    return this.avgRating
  }

  get getCreatedAt(): Date | null {
    return this.createdAt
  }

  get getUpdatedAt(): Date | null {
    return this.updatedAt
  }

  get getDeletedAt(): Date | null {
    return this.deletedAt
  }

  get getUser(): UserSummary | undefined {
    return this.user
  }

  /**
   * Business logic methods
   */
  isVerified(): boolean {
    return this.verified
  }

  isActive(): boolean {
    return this.active && !this.deletedAt
  }

  isDeleted(): boolean {
    return this.deletedAt !== null
  }

  /**
   * Check if provider can create vouchers
   * Business rule: Must be verified and active
   */
  canCreateVouchers(): boolean {
    return this.isVerified() && this.isActive()
  }

  /**
   * Check if provider has high rating
   * Business rule: Uses configurable threshold from environment
   */
  hasHighRating(): boolean {
    return this.avgRating >= PROVIDER_HIGH_RATING_THRESHOLD
  }

  /**
   * Check if provider is new
   * Business rule: Uses configurable threshold from environment
   */
  isNewProvider(): boolean {
    if (!this.createdAt) return false

    const thresholdDate = new Date()

    thresholdDate.setDate(thresholdDate.getDate() - PROVIDER_NEW_DAYS_THRESHOLD)

    return this.createdAt > thresholdDate
  }

  /**
   * Get provider status for display
   */
  getStatus(): 'active' | 'inactive' | 'deleted' | 'unverified' {
    if (this.isDeleted()) return 'deleted'
    if (!this.verified) return 'unverified'
    if (!this.active) return 'inactive'

    return 'active'
  }

  /**
   * Get business name in specified language
   * Following Admin pattern for localization
   */
  getDisplayBusinessName(language = 'en'): string {
    if (language === 'en') return this.businessName.en
    if (language === 'es') return this.businessName.es || this.businessName.en
    if (language === 'gn')
      return (
        this.businessName.gn || this.businessName.es || this.businessName.en
      )

    return this.businessName.en
  }

  /**
   * Get business description in specified language
   * Following Admin pattern for localization
   */
  getDisplayBusinessDescription(language = 'en'): string {
    if (language === 'en') return this.businessDescription.en
    if (language === 'es')
      return this.businessDescription.es || this.businessDescription.en
    if (language === 'gn')
      return (
        this.businessDescription.gn ||
        this.businessDescription.es ||
        this.businessDescription.en
      )

    return this.businessDescription.en
  }

  /**
   * Get rating display text
   */
  getRatingDisplay(): string {
    if (this.avgRating === 0) return 'No rating'

    return `${this.avgRating.toFixed(1)} stars`
  }

  /**
   * Validate domain invariants
   */
  private validateInvariants(): void {
    if (!this.id) {
      throw ErrorFactory.validationError(
        { id: ['Provider ID is required'] },
        { source: 'Provider.validateInvariants' },
      )
    }

    if (!this.userId) {
      throw ErrorFactory.validationError(
        { userId: ['User ID is required'] },
        { source: 'Provider.validateInvariants' },
      )
    }

    if (!this.businessName?.en) {
      throw ErrorFactory.validationError(
        { businessName: ['Business name in English is required'] },
        { source: 'Provider.validateInvariants' },
      )
    }

    if (!this.categoryId) {
      throw ErrorFactory.validationError(
        { categoryId: ['Category ID is required'] },
        { source: 'Provider.validateInvariants' },
      )
    }

    if (
      this.avgRating < PROVIDER_MIN_RATING ||
      this.avgRating > PROVIDER_MAX_RATING
    ) {
      throw ErrorFactory.validationError(
        {
          avgRating: [
            `Average rating must be between ${PROVIDER_MIN_RATING} and ${PROVIDER_MAX_RATING}`,
          ],
        },
        { source: 'Provider.validateInvariants' },
      )
    }
  }

  /**
   * Convert to plain object for serialization
   * Following Admin pattern
   */
  toObject(): {
    id: string
    userId: string
    businessName: MultilingualText
    businessDescription: MultilingualText
    categoryId: string
    verified: boolean
    active: boolean
    avgRating: number
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
    user?: UserSummary
  } {
    return {
      id: this.id,
      userId: this.userId,
      businessName: this.businessName,
      businessDescription: this.businessDescription,
      categoryId: this.categoryId,
      verified: this.verified,
      active: this.active,
      avgRating: this.avgRating,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      user: this.user,
    }
  }

  /**
   * Factory method for creating Provider instances
   * Following Admin pattern
   */
  static create(data: {
    id: string
    userId: string
    businessName: MultilingualText
    businessDescription: MultilingualText
    categoryId: string
    verified: boolean
    active: boolean
    avgRating: number
    createdAt: Date | null
    updatedAt: Date | null
    deletedAt: Date | null
    user?: UserSummary
  }): Provider {
    return new Provider(data)
  }

  /**
   * Factory method for creating new providers
   * Sets sensible defaults for new providers
   */
  static createNew(data: {
    id: string
    userId: string
    businessName: MultilingualText
    businessDescription: MultilingualText
    categoryId: string
    user?: UserSummary
  }): Provider {
    return new Provider({
      ...data,
      verified: false,
      active: true,
      avgRating: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })
  }
}
