import { VoucherMapper } from '@pika/sdk'
import { Voucher } from '@voucher-read/domain/entities/Voucher.js'

/**
 * Adapter to bridge between local Voucher domain entity and SDK's VoucherDomain
 *
 * WHY THIS EXISTS:
 * Our domain entity uses simplified structure with public readonly fields
 * while the SDK's VoucherDomain expects specific formats and validations.
 *
 * This adapter ensures compatibility while maintaining our domain model integrity.
 * Following the same pattern as ProviderDomainAdapter and CategoryDomainAdapter.
 */
export class VoucherDomainAdapter {
  /**
   * Convert our local Voucher entity to SDK's VoucherDomain format
   * Ensures all fields are properly mapped
   */
  static toSdkDomain(voucher: Voucher): any {
    return {
      id: voucher.id,
      providerId: voucher.providerId,
      categoryId: voucher.categoryId,
      state: voucher.state,
      title: voucher.title,
      description: voucher.description,
      terms: voucher.terms,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      currency: voucher.currency,
      location: voucher.location,
      imageUrl: voucher.imageUrl,
      validFrom: voucher.validFrom,
      expiresAt: voucher.expiresAt,
      maxRedemptions: voucher.maxRedemptions,
      maxRedemptionsPerUser: voucher.maxRedemptionsPerUser,
      currentRedemptions: voucher.currentRedemptions,
      metadata: voucher.metadata,
      createdAt: voucher.createdAt,
      updatedAt: voucher.updatedAt,
      codes: voucher.codes,
    }
  }

  /**
   * Convert our Voucher entity to API DTO using SDK mapper
   * This method chains our adapter with SDK's mapper for proper DTO conversion
   */
  static toDTO(voucher: Voucher): any {
    const sdkDomain = this.toSdkDomain(voucher)

    return VoucherMapper.toDTO(sdkDomain)
  }
}
