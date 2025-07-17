import { ErrorFactory } from '@pika/shared'
import {
  type MultilingualText,
  VoucherDiscountType,
  VoucherState,
} from '@pika/types-core'
import { get, merge } from 'lodash-es'

import type { VoucherCreateDTO, VoucherUpdateDTO } from '../dtos/VoucherDTO.js'

/**
 * Properties describing a Voucher aggregate.
 */
export interface VoucherProps {
  providerId: string
  categoryId: string
  state: VoucherState
  title: MultilingualText
  description: MultilingualText
  terms: MultilingualText
  discountType: VoucherDiscountType
  discountValue: number
  currency: string
  imageUrl?: string
  validFrom: Date
  expiresAt: Date
  maxRedemptions?: number | null
  maxRedemptionsPerUser: number
  currentRedemptions: number
}

/**
 * Voucher aggregate root, encapsulating business rules for vouchers.
 */
export class Voucher {
  public readonly id: string
  private props: VoucherProps
  private readonly createdAt: Date | null
  private updatedAt: Date | null

  /**
   * Private constructor; use static create or reconstitute methods.
   */
  private constructor(
    id: string,
    props: VoucherProps,
    createdAt: Date | null,
    updatedAt: Date | null,
  ) {
    this.id = id
    this.props = props
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  /**
   * Factory for new Voucher.
   */
  public static create(dto: VoucherCreateDTO, id: string): Voucher {
    // Validate multilingual text has at least English
    if (!dto.title?.en) {
      throw ErrorFactory.validationError(
        { title: ['English translation (en) is required'] },
        { source: 'Voucher.create' },
      )
    }

    const props: VoucherProps = {
      providerId: dto.providerId,
      categoryId: dto.categoryId,
      state: 'NEW' as VoucherState,
      title: dto.title,
      description: dto.description || { en: '', es: '', gn: '' },
      terms: dto.terms || { en: '', es: '', gn: '' },
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      currency: dto.currency || 'PYG',
      imageUrl: dto.imageUrl,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
      expiresAt: new Date(dto.expiresAt),
      maxRedemptions: dto.maxRedemptions,
      maxRedemptionsPerUser: dto.maxRedemptionsPerUser ?? 1,
      currentRedemptions: 0,
    }

    return new Voucher(id, props, new Date(), new Date())
  }

  /**
   * Rehydrates an existing Voucher from persistence.
   */
  public static reconstitute(
    id: string,
    raw: any,
    createdAt: Date | null,
    updatedAt: Date | null,
  ): Voucher {
    const props: VoucherProps = {
      providerId: raw.providerId,
      categoryId: raw.categoryId,
      state: raw.state as VoucherState,
      title: raw.title,
      description: raw.description,
      terms: raw.terms,
      discountType: raw.discountType as VoucherDiscountType,
      discountValue: raw.discountValue,
      currency: raw.currency,
      imageUrl: raw.imageUrl ?? undefined,
      validFrom: new Date(raw.validFrom),
      expiresAt: new Date(raw.expiresAt),
      maxRedemptions: raw.maxRedemptions,
      maxRedemptionsPerUser: raw.maxRedemptionsPerUser,
      currentRedemptions: raw.currentRedemptions || 0,
    }

    return new Voucher(id, props, createdAt, updatedAt)
  }

  /** Accessors **/
  public get providerId(): string {
    return this.props.providerId
  }

  public get categoryId(): string {
    return this.props.categoryId
  }

  public get state(): VoucherState {
    return this.props.state
  }

  public get title(): MultilingualText {
    return this.props.title
  }

  public get description(): MultilingualText {
    return this.props.description
  }

  public get terms(): MultilingualText {
    return this.props.terms
  }

  public get discountType(): VoucherDiscountType {
    return this.props.discountType
  }

  public get discountValue(): number {
    return this.props.discountValue
  }

  public get currency(): string {
    return this.props.currency
  }

  public get imageUrl(): string | undefined {
    return this.props.imageUrl
  }

  public get validFrom(): Date {
    return new Date(this.props.validFrom)
  }

  public get expiresAt(): Date {
    return new Date(this.props.expiresAt)
  }

  public get maxRedemptions(): number | null | undefined {
    return this.props.maxRedemptions
  }

  public get maxRedemptionsPerUser(): number {
    return this.props.maxRedemptionsPerUser
  }

  public get currentRedemptions(): number {
    return this.props.currentRedemptions
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
  public canBePublished(): boolean {
    const now = new Date()

    return (
      this.props.state === VoucherState.NEW &&
      this.props.validFrom <= now &&
      this.props.expiresAt > now
    )
  }

  public isExpired(): boolean {
    const now = new Date()

    return (
      this.props.expiresAt <= now ||
      (this.props.maxRedemptions !== null &&
        this.props.maxRedemptions !== undefined &&
        this.props.currentRedemptions >= this.props.maxRedemptions)
    )
  }

  public getLocalizedTitle(lang: string): string {
    return get(this.props.title, lang) || this.props.title.en || ''
  }

  public getLocalizedTerms(lang: string): string {
    return get(this.props.terms, lang) || this.props.terms.en || ''
  }

  public update(dto: VoucherUpdateDTO): void {
    if (dto.title) this.props.title = merge({}, this.props.title, dto.title)
    if (dto.terms) this.props.terms = merge({}, this.props.terms, dto.terms)
    if (dto.description)
      this.props.description = merge(
        {},
        this.props.description,
        dto.description,
      )
    if (dto.imageUrl !== undefined)
      this.props.imageUrl = dto.imageUrl ?? undefined
    if (dto.discountType !== undefined)
      this.props.discountType = dto.discountType
    if (dto.discountValue !== undefined)
      this.props.discountValue = dto.discountValue
    if (dto.validFrom !== undefined)
      this.props.validFrom = new Date(dto.validFrom)
    if (dto.expiresAt !== undefined)
      this.props.expiresAt = new Date(dto.expiresAt)
    if (dto.maxRedemptions !== undefined)
      this.props.maxRedemptions = dto.maxRedemptions
    if (dto.maxRedemptionsPerUser !== undefined)
      this.props.maxRedemptionsPerUser = dto.maxRedemptionsPerUser

    this.updatedAt = new Date()
  }

  public publish(): void {
    if (!this.canBePublished()) {
      throw ErrorFactory.validationError(
        { state: ['Voucher cannot be published in current state'] },
        { source: 'Voucher.publish' },
      )
    }
    this.props.state = VoucherState.PUBLISHED
    this.updatedAt = new Date()
  }

  public expire(): void {
    this.props.state = VoucherState.EXPIRED
    this.updatedAt = new Date()
  }

  public incrementRedemptions(): void {
    this.props.currentRedemptions += 1
    this.updatedAt = new Date()

    if (
      this.props.maxRedemptions !== null &&
      this.props.maxRedemptions !== undefined &&
      this.props.currentRedemptions >= this.props.maxRedemptions
    ) {
      this.expire()
    }
  }

  /**
   * Serialize aggregate to plain object for persistence or DTO.
   */
  public toObject(): Record<string, any> {
    return {
      id: this.id,
      providerId: this.props.providerId,
      categoryId: this.props.categoryId,
      state: this.props.state,
      title: this.props.title,
      description: this.props.description,
      terms: this.props.terms,
      discountType: this.props.discountType,
      discountValue: this.props.discountValue,
      currency: this.props.currency,
      imageUrl: this.props.imageUrl,
      validFrom: this.props.validFrom.toISOString(),
      expiresAt: this.props.expiresAt.toISOString(),
      maxRedemptions: this.props.maxRedemptions,
      maxRedemptionsPerUser: this.props.maxRedemptionsPerUser,
      currentRedemptions: this.props.currentRedemptions,
      createdAt: this.createdAt ? this.createdAt.toISOString() : null,
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
    }
  }
}
