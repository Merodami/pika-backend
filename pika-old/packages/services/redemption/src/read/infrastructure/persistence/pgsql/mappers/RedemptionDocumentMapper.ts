import type { MultilingualContent } from '@pika/types-core'
import { Redemption } from '@redemption-read/domain/entities/Redemption.js'

/**
 * Maps between Prisma VoucherRedemption documents and Redemption domain entities
 * Following the established pattern from Admin Service
 */
export interface RedemptionDocument {
  id: string
  voucherId: string
  userId: string
  codeUsed: string
  redeemedAt: Date
  metadata: any
  createdAt: Date
  voucher: {
    id: string
    title: any
    discountType: string
    discountValue: any
    currency: string
    providerId: string
    provider: {
      id: string
      name: string
    }
  }
  user: {
    id: string
    name?: string | null
    email: string
  }
}

export class RedemptionDocumentMapper {
  static mapDocumentToDomain(document: RedemptionDocument): Redemption {
    const metadata = (document.metadata as any) || {}

    // Format discount display
    const voucherDiscount =
      document.voucher.discountType === 'PERCENTAGE'
        ? `${document.voucher.discountValue}%`
        : `${document.voucher.currency} ${document.voucher.discountValue}`

    return Redemption.create({
      id: document.id,
      voucherId: document.voucherId,
      voucherTitle: this.ensureMultilingualContent(document.voucher.title),
      voucherDiscount,
      customerId: document.userId,
      customerName: document.user.name || undefined,
      customerEmail: document.user.email,
      providerId: document.voucher.providerId,
      providerName: document.voucher.provider.name,
      code: document.codeUsed,
      redeemedAt: new Date(document.redeemedAt),
      location: metadata.location,
      offlineRedemption: metadata.offlineRedemption || false,
      syncedAt: metadata.syncedAt ? new Date(metadata.syncedAt) : undefined,
      createdAt: new Date(document.createdAt),
    })
  }

  private static ensureMultilingualContent(value: any): MultilingualContent {
    if (!value || typeof value !== 'object') {
      return { es: '', en: '', gn: '', pt: '' }
    }

    return {
      es: value.es || '',
      en: value.en || '',
      gn: value.gn || '',
      pt: value.pt || '',
    }
  }
}
