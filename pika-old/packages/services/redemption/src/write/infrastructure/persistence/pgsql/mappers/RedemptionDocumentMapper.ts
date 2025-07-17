import { Redemption } from '@redemption-write/domain/entities/Redemption.js'

/**
 * Maps between Prisma VoucherRedemption documents and Redemption domain entities
 * Following the established pattern from Admin Service
 */
export interface RedemptionWriteDocument {
  id: string
  voucherId: string
  userId: string
  codeUsed: string
  redeemedAt: Date
  metadata: any
  createdAt: Date
  updatedAt: Date
}

export class RedemptionDocumentMapper {
  static mapDocumentToDomain(document: RedemptionWriteDocument): Redemption {
    const metadata = (document.metadata as any) || {}

    return Redemption.reconstitute({
      id: document.id,
      voucherId: document.voucherId,
      customerId: document.userId,
      providerId: metadata.providerId || '', // Should always be in metadata
      code: document.codeUsed,
      redeemedAt: new Date(document.redeemedAt),
      location: metadata.location,
      offlineRedemption: metadata.offlineRedemption || false,
      syncedAt: metadata.syncedAt ? new Date(metadata.syncedAt) : undefined,
      metadata: metadata,
      createdAt: new Date(document.createdAt),
      updatedAt: new Date(document.updatedAt),
    })
  }

  static mapDomainToCreateData(
    redemption: Redemption,
  ): Omit<RedemptionWriteDocument, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      voucherId: redemption.voucherId,
      userId: redemption.customerId,
      codeUsed: redemption.code,
      redeemedAt: redemption.redeemedAt,
      metadata: {
        ...redemption.metadata,
        providerId: redemption.providerId,
        location: redemption.location,
        offlineRedemption: redemption.offlineRedemption,
        syncedAt: redemption.syncedAt,
      },
    }
  }
}
