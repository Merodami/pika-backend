import { VOUCHER_API_URL } from '@pika/environment'
import { ErrorFactory, logger } from '@pika/shared'

// Import VoucherDomain type directly since @pika/sdk doesn't export it
interface VoucherDomain {
  id: string
  providerId: string
  categoryId: string
  state: string
  title: any
  description: any
  terms: any
  discountType: string
  discountValue: number
  currency: string
  location: any
  imageUrl: string | null
  validFrom: Date
  expiresAt: Date
  maxRedemptions: number | null
  maxRedemptionsPerUser: number
  currentRedemptions: number
  metadata?: Record<string, any>
  createdAt: Date | null
  updatedAt: Date | null
}

export interface VoucherServicePort {
  getVoucherById(voucherId: string): Promise<VoucherDomain | null>
  getVoucherByCode(code: string): Promise<VoucherDomain | null>
}

/**
 * HTTP client for communicating with the Voucher Service
 * Follows the same pattern as NotificationClient
 */
export class VoucherServiceClient implements VoucherServicePort {
  private readonly voucherServiceUrl: string

  constructor(voucherServiceUrl: string = VOUCHER_API_URL) {
    this.voucherServiceUrl = voucherServiceUrl
  }

  /**
   * Get voucher by ID from the voucher service
   */
  async getVoucherById(voucherId: string): Promise<VoucherDomain | null> {
    try {
      const response = await fetch(
        `${this.voucherServiceUrl}/vouchers/${voucherId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        throw new Error(
          `Failed to fetch voucher: ${response.status} ${response.statusText}. ${errorData.message || ''}`,
        )
      }

      const data = await response.json()

      return this.mapToVoucherDomain(data)
    } catch (error) {
      logger.error('Error fetching voucher by ID', { error, voucherId })
      throw ErrorFactory.fromError(
        error,
        'Failed to fetch voucher from voucher service',
        {
          source: 'VoucherServiceClient.getVoucherById',
          metadata: { voucherId },
        },
      )
    }
  }

  /**
   * Get voucher by short code from the voucher service
   */
  async getVoucherByCode(code: string): Promise<VoucherDomain | null> {
    try {
      const response = await fetch(
        `${this.voucherServiceUrl}/vouchers/by-code/${code}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        throw new Error(
          `Failed to fetch voucher by code: ${response.status} ${response.statusText}. ${errorData.message || ''}`,
        )
      }

      const data = await response.json()

      return this.mapToVoucherDomain(data)
    } catch (error) {
      logger.error('Error fetching voucher by code', { error, code })
      throw ErrorFactory.fromError(
        error,
        'Failed to fetch voucher from voucher service',
        {
          source: 'VoucherServiceClient.getVoucherByCode',
          metadata: { code },
        },
      )
    }
  }

  /**
   * Map API response to VoucherDomain
   */
  private mapToVoucherDomain(data: any): VoucherDomain {
    return {
      id: data.id,
      providerId: data.provider_id,
      categoryId: data.category_id,
      state: data.state,
      title: this.ensureMultilingualText(data.title),
      description: this.ensureMultilingualText(data.description),
      terms: this.ensureMultilingualText(data.terms),
      discountType: data.discount_type,
      discountValue: data.discount_value || data.discount,
      currency: data.currency || 'PYG',
      location: data.location,
      imageUrl: data.image_url || null,
      validFrom: new Date(data.valid_from),
      expiresAt: new Date(data.expires_at || data.valid_to),
      maxRedemptions: data.max_redemptions,
      maxRedemptionsPerUser: data.max_redemptions_per_user || 1,
      currentRedemptions: data.current_redemptions || 0,
      metadata: data.metadata || {},
      createdAt: data.created_at ? new Date(data.created_at) : null,
      updatedAt: data.updated_at ? new Date(data.updated_at) : null,
    }
  }

  /**
   * Ensure multilingual text has required fields
   */
  private ensureMultilingualText(value: any): any {
    if (!value) {
      return { en: '', es: '', gn: '' }
    }
    if (typeof value === 'string') {
      return { en: value, es: value, gn: value }
    }

    return {
      en: value.en || '',
      es: value.es || '',
      gn: value.gn || '',
      ...value,
    }
  }
}
