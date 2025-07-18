import { DEFAULT_LANGUAGE } from '@pika/environment'
import {
  type MultilingualText,
  VoucherDiscountType,
  VoucherState,
} from '@pika/types-core'

export type { MultilingualText }

/**
 * Voucher READ Domain Entity
 * Following Category Service pattern with simple public readonly fields
 */
export class Voucher {
  public readonly id: string
  public readonly providerId: string
  public readonly categoryId: string
  public readonly state: VoucherState
  public readonly title: MultilingualText
  public readonly description: MultilingualText
  public readonly terms: MultilingualText
  public readonly discountType: VoucherDiscountType
  public readonly discountValue: number
  public readonly currency: string
  public readonly location?: {
    lat: number
    lng: number
    radius?: number
  } | null
  public readonly imageUrl: string | null
  public readonly validFrom: Date
  public readonly expiresAt: Date
  public readonly maxRedemptions: number | null
  public readonly maxRedemptionsPerUser: number
  public readonly currentRedemptions: number
  public readonly metadata?: Record<string, any> | null
  public readonly createdAt: Date | null
  public readonly updatedAt: Date | null
  public readonly codes?: Array<{
    id: string
    code: string
    type: string
    isActive: boolean
    metadata?: Record<string, any>
  }>

  constructor({
    id,
    providerId,
    categoryId,
    state,
    title,
    description,
    terms,
    discountType,
    discountValue,
    currency,
    location,
    imageUrl,
    validFrom,
    expiresAt,
    maxRedemptions,
    maxRedemptionsPerUser,
    currentRedemptions,
    metadata,
    createdAt,
    updatedAt,
    codes,
  }: {
    id: string
    providerId: string
    categoryId: string
    state: VoucherState
    title: MultilingualText
    description: MultilingualText
    terms: MultilingualText
    discountType: VoucherDiscountType
    discountValue: number
    currency: string
    location?: { lat: number; lng: number; radius?: number } | null
    imageUrl: string | null
    validFrom: Date
    expiresAt: Date
    maxRedemptions: number | null
    maxRedemptionsPerUser: number
    currentRedemptions: number
    metadata?: Record<string, any> | null
    createdAt: Date | null
    updatedAt: Date | null
    codes?: Array<{
      id: string
      code: string
      type: string
      isActive: boolean
      metadata?: Record<string, any>
    }>
  }) {
    this.id = id
    this.providerId = providerId
    this.categoryId = categoryId
    this.state = state
    this.title = title
    this.description = description
    this.terms = terms
    this.discountType = discountType
    this.discountValue = discountValue
    this.currency = currency
    this.location = location
    this.imageUrl = imageUrl
    this.validFrom = validFrom
    this.expiresAt = expiresAt
    this.maxRedemptions = maxRedemptions
    this.maxRedemptionsPerUser = maxRedemptionsPerUser
    this.currentRedemptions = currentRedemptions
    this.metadata = metadata
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.codes = codes
  }

  /**
   * Business logic: Check if voucher can be published
   */
  canBePublished(): boolean {
    const now = new Date()

    return (
      this.state === VoucherState.NEW &&
      this.validFrom <= now &&
      this.expiresAt > now
    )
  }

  /**
   * Business logic: Check if voucher is expired
   */
  isExpired(): boolean {
    const now = new Date()

    return (
      this.expiresAt <= now ||
      (this.maxRedemptions !== null &&
        this.currentRedemptions >= this.maxRedemptions)
    )
  }

  /**
   * Business logic: Check if voucher is active
   */
  isActive(): boolean {
    const now = new Date()

    return (
      this.state === VoucherState.PUBLISHED &&
      this.validFrom <= now &&
      this.expiresAt > now &&
      (this.maxRedemptions === null ||
        this.currentRedemptions < this.maxRedemptions)
    )
  }

  /**
   * Business logic: Check if voucher has reached redemption limit
   */
  hasReachedRedemptionLimit(): boolean {
    return (
      this.maxRedemptions !== null &&
      this.currentRedemptions >= this.maxRedemptions
    )
  }

  /**
   * Business logic: Get remaining redemptions
   */
  getRemainingRedemptions(): number | null {
    if (this.maxRedemptions === null) {
      return null
    }

    return Math.max(0, this.maxRedemptions - this.currentRedemptions)
  }

  /**
   * Business logic: Check if voucher is valid for a specific date
   */
  isValidOn(date: Date): boolean {
    return date >= this.validFrom && date <= this.expiresAt
  }

  /**
   * Get localized title
   */
  getLocalizedTitle(lang: string = DEFAULT_LANGUAGE): string {
    return this.title[lang as keyof MultilingualText] || this.title.en || ''
  }

  /**
   * Get localized description
   */
  getLocalizedDescription(lang: string = DEFAULT_LANGUAGE): string {
    return (
      this.description[lang as keyof MultilingualText] ||
      this.description.en ||
      ''
    )
  }

  /**
   * Get localized terms
   */
  getLocalizedTerms(lang: string = DEFAULT_LANGUAGE): string {
    return this.terms[lang as keyof MultilingualText] || this.terms.en || ''
  }

  /**
   * Get discount display value
   */
  getDiscountDisplay(): string {
    if (this.discountType === VoucherDiscountType.PERCENTAGE) {
      return `${this.discountValue}%`
    }

    return `${this.currency} ${this.discountValue}`
  }

  /**
   * Calculate discount amount for a given price
   */
  calculateDiscount(originalPrice: number): number {
    if (this.discountType === VoucherDiscountType.PERCENTAGE) {
      return (originalPrice * this.discountValue) / 100
    }

    return Math.min(this.discountValue, originalPrice)
  }

  /**
   * Convert to plain object for serialization
   * Following Category pattern
   */
  toObject(): {
    id: string
    providerId: string
    categoryId: string
    state: VoucherState
    title: MultilingualText
    description: MultilingualText
    terms: MultilingualText
    discountType: VoucherDiscountType
    discountValue: number
    currency: string
    location?: { lat: number; lng: number; radius?: number } | null
    imageUrl: string | null
    validFrom: Date
    expiresAt: Date
    maxRedemptions: number | null
    maxRedemptionsPerUser: number
    currentRedemptions: number
    metadata?: Record<string, any> | null
    createdAt: Date | null
    updatedAt: Date | null
    codes?: Array<{
      id: string
      code: string
      type: string
      isActive: boolean
      metadata?: Record<string, any>
    }>
  } {
    return {
      id: this.id,
      providerId: this.providerId,
      categoryId: this.categoryId,
      state: this.state,
      title: this.title,
      description: this.description,
      terms: this.terms,
      discountType: this.discountType,
      discountValue: this.discountValue,
      currency: this.currency,
      location: this.location,
      imageUrl: this.imageUrl,
      validFrom: this.validFrom,
      expiresAt: this.expiresAt,
      maxRedemptions: this.maxRedemptions,
      maxRedemptionsPerUser: this.maxRedemptionsPerUser,
      currentRedemptions: this.currentRedemptions,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      codes: this.codes,
    }
  }
}
