import type { MultilingualContent } from '@pika/types-core'

/**
 * Redemption Write Domain Entity
 * Following Admin Service Gold Standard pattern
 */
export class Redemption {
  public readonly id: string
  public readonly voucherId: string
  public readonly customerId: string
  public readonly providerId: string
  public readonly code: string
  public readonly redeemedAt: Date
  public readonly location?: {
    lat: number
    lng: number
  }
  public readonly offlineRedemption: boolean
  public readonly syncedAt?: Date
  public readonly metadata?: Record<string, any>
  public readonly createdAt: Date
  public readonly updatedAt: Date

  private constructor(data: {
    id: string
    voucherId: string
    customerId: string
    providerId: string
    code: string
    redeemedAt: Date
    location?: {
      lat: number
      lng: number
    }
    offlineRedemption: boolean
    syncedAt?: Date
    metadata?: Record<string, any>
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = data.id
    this.voucherId = data.voucherId
    this.customerId = data.customerId
    this.providerId = data.providerId
    this.code = data.code
    this.redeemedAt = data.redeemedAt
    this.location = data.location
    this.offlineRedemption = data.offlineRedemption
    this.syncedAt = data.syncedAt
    this.metadata = data.metadata
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  // Factory methods
  static create(data: {
    voucherId: string
    customerId: string
    providerId: string
    code: string
    redeemedAt?: Date
    location?: {
      lat: number
      lng: number
    }
    offlineRedemption?: boolean
    metadata?: Record<string, any>
  }): Redemption {
    const now = new Date()

    return new Redemption({
      id: '', // Will be assigned by persistence layer
      voucherId: data.voucherId,
      customerId: data.customerId,
      providerId: data.providerId,
      code: data.code,
      redeemedAt: data.redeemedAt || now,
      location: data.location,
      offlineRedemption: data.offlineRedemption || false,
      syncedAt: undefined,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstitute(data: {
    id: string
    voucherId: string
    customerId: string
    providerId: string
    code: string
    redeemedAt: Date
    location?: {
      lat: number
      lng: number
    }
    offlineRedemption: boolean
    syncedAt?: Date
    metadata?: Record<string, any>
    createdAt: Date
    updatedAt: Date
  }): Redemption {
    return new Redemption(data)
  }

  // Business methods
  isOfflineRedemption(): boolean {
    return this.offlineRedemption
  }

  hasBeenSynced(): boolean {
    return this.offlineRedemption && !!this.syncedAt
  }

  canBeSynced(): boolean {
    return this.offlineRedemption && !this.syncedAt
  }

  markAsSynced(): Redemption {
    if (!this.offlineRedemption) {
      throw new Error('Cannot mark online redemption as synced')
    }

    return Redemption.reconstitute({
      ...this,
      syncedAt: new Date(),
      updatedAt: new Date(),
    })
  }

  hasLocation(): boolean {
    return (
      !!this.location &&
      typeof this.location.lat === 'number' &&
      typeof this.location.lng === 'number'
    )
  }

  isWithinRadius(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
  ): boolean {
    if (!this.hasLocation()) {
      return false
    }

    // Haversine formula for distance calculation
    const R = 6371 // Earth's radius in km
    const dLat = ((this.location!.lat - centerLat) * Math.PI) / 180
    const dLng = ((this.location!.lng - centerLng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((centerLat * Math.PI) / 180) *
        Math.cos((this.location!.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance <= radiusKm
  }

  getTimeSinceRedemption(): number {
    return Date.now() - this.redeemedAt.getTime()
  }

  // For persistence and debugging
  toObject() {
    return {
      id: this.id,
      voucherId: this.voucherId,
      customerId: this.customerId,
      providerId: this.providerId,
      code: this.code,
      redeemedAt: this.redeemedAt,
      location: this.location,
      offlineRedemption: this.offlineRedemption,
      syncedAt: this.syncedAt,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}

/**
 * Redemption with voucher details for validation
 */
export interface RedemptionWithVoucher {
  redemption: Redemption
  voucher: {
    id: string
    title: MultilingualContent
    discount: string
    providerName: string
    state: string
    expiresAt: Date
    maxRedemptionsPerUser: number
  }
}

/**
 * JWT claims for redemption tokens
 */
export interface RedemptionTokenClaims {
  voucherId: string
  customerId: string
  iat: number
  exp: number
  jti?: string // JWT ID for one-time use tracking
}

/**
 * Short code information
 */
export interface ShortCodeInfo {
  voucherId: string
  code: string
  type: 'STATIC' | 'DYNAMIC'
  expiresAt?: Date
  metadata?: Record<string, any>
}
