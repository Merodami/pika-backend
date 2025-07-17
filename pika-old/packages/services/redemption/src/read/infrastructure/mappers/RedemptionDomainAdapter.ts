import type { RedemptionDTO } from '@redemption-read/domain/dtos/RedemptionDTO.js'
import { Redemption } from '@redemption-read/domain/entities/Redemption.js'

/**
 * Adapter to convert between Redemption domain entity and DTOs
 * Following the established pattern from Provider/Category services
 */
export class RedemptionDomainAdapter {
  static toDTO(redemption: Redemption): RedemptionDTO {
    return {
      id: redemption.id,
      voucher_id: redemption.voucherId,
      voucher_title: redemption.voucherTitle,
      voucher_discount: redemption.voucherDiscount,
      customer_id: redemption.customerId,
      customer_name: redemption.customerName,
      provider_id: redemption.providerId,
      provider_name: redemption.providerName,
      redeemed_at: redemption.redeemedAt.toISOString(),
      location: redemption.location,
    }
  }

  static fromDTO(dto: RedemptionDTO): Redemption {
    return Redemption.create({
      id: dto.id,
      voucherId: dto.voucher_id,
      voucherTitle: dto.voucher_title,
      voucherDiscount: dto.voucher_discount,
      customerId: dto.customer_id,
      customerName: dto.customer_name,
      customerEmail: undefined, // Not in RedemptionView DTO
      providerId: dto.provider_id,
      providerName: dto.provider_name,
      code: '', // Not in RedemptionView DTO
      redeemedAt: new Date(dto.redeemed_at),
      location: dto.location,
      offlineRedemption: false, // Not in RedemptionView DTO
      syncedAt: undefined, // Not in RedemptionView DTO
      createdAt: new Date(dto.redeemed_at), // Not in RedemptionView DTO, use redeemedAt
    })
  }
}
