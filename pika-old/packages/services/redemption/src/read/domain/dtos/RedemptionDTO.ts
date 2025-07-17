import type { schemas } from '@pika/api'

import type { RedemptionView } from '../entities/RedemptionView.js'

/**
 * DTO for redemption read operations
 */
export type RedemptionDTO = schemas.RedemptionView

/**
 * Convert domain entity to API DTO
 */
export function toRedemptionDTO(redemption: RedemptionView): RedemptionDTO {
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
