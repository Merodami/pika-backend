import type { MultilingualContent } from '@pika/types-core'
import { get } from 'lodash-es'

/**
 * Redemption Read Domain Entity
 * Following Admin Service Gold Standard pattern
 */
export class Redemption {
  public readonly id: string
  public readonly voucherId: string
  public readonly voucherTitle: MultilingualContent
  public readonly voucherDiscount: string
  public readonly customerId: string
  public readonly customerName?: string
  public readonly customerEmail?: string
  public readonly providerId: string
  public readonly providerName: string
  public readonly code: string
  public readonly redeemedAt: Date
  public readonly location?: {
    lat: number
    lng: number
  }
  public readonly offlineRedemption: boolean
  public readonly syncedAt?: Date
  public readonly createdAt: Date

  private constructor(data: {
    id: string
    voucherId: string
    voucherTitle: MultilingualContent
    voucherDiscount: string
    customerId: string
    customerName?: string
    customerEmail?: string
    providerId: string
    providerName: string
    code: string
    redeemedAt: Date
    location?: {
      lat: number
      lng: number
    }
    offlineRedemption: boolean
    syncedAt?: Date
    createdAt: Date
  }) {
    this.id = data.id
    this.voucherId = data.voucherId
    this.voucherTitle = data.voucherTitle
    this.voucherDiscount = data.voucherDiscount
    this.customerId = data.customerId
    this.customerName = data.customerName
    this.customerEmail = data.customerEmail
    this.providerId = data.providerId
    this.providerName = data.providerName
    this.code = data.code
    this.redeemedAt = data.redeemedAt
    this.location = data.location
    this.offlineRedemption = data.offlineRedemption
    this.syncedAt = data.syncedAt
    this.createdAt = data.createdAt
  }

  // Factory method
  static create(data: {
    id: string
    voucherId: string
    voucherTitle: MultilingualContent
    voucherDiscount: string
    customerId: string
    customerName?: string
    customerEmail?: string
    providerId: string
    providerName: string
    code: string
    redeemedAt: Date
    location?: {
      lat: number
      lng: number
    }
    offlineRedemption: boolean
    syncedAt?: Date
    createdAt: Date
  }): Redemption {
    return new Redemption(data)
  }

  // Business methods
  isOfflineRedemption(): boolean {
    return this.offlineRedemption
  }

  hasLocation(): boolean {
    return !!this.location && !!this.location.lat && !!this.location.lng
  }

  canBeSynced(): boolean {
    return this.offlineRedemption && !this.syncedAt
  }

  isSynced(): boolean {
    return this.offlineRedemption && !!this.syncedAt
  }

  getDaysSinceRedemption(): number {
    const now = new Date()
    const diff = now.getTime() - this.redeemedAt.getTime()

    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  isRecentRedemption(days: number = 7): boolean {
    return this.getDaysSinceRedemption() <= days
  }

  getCustomerDisplayName(): string {
    return this.customerName || this.customerEmail || 'Unknown Customer'
  }

  getVoucherTitleInLanguage(language: string = 'es'): string {
    return (
      get(this.voucherTitle, language) ||
      this.voucherTitle.es ||
      this.voucherTitle.en ||
      ''
    )
  }

  // For debugging and logging
  toObject() {
    return {
      id: this.id,
      voucherId: this.voucherId,
      voucherTitle: this.voucherTitle,
      voucherDiscount: this.voucherDiscount,
      customerId: this.customerId,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      providerId: this.providerId,
      providerName: this.providerName,
      code: this.code,
      redeemedAt: this.redeemedAt,
      location: this.location,
      offlineRedemption: this.offlineRedemption,
      syncedAt: this.syncedAt,
      createdAt: this.createdAt,
    }
  }
}
