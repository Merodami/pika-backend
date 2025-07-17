import { VOUCHER_API_URL } from '@pika/environment'
import type {
  ServiceContext,
  VoucherDomain,
  VoucherStateUpdate,
} from '@pika/types-core'

import { BaseServiceClient } from '../BaseServiceClient.js'

/**
 * Client for communicating with the Voucher service
 * Handles voucher lookups and state transitions
 */
export class VoucherServiceClient extends BaseServiceClient {
  constructor(serviceUrl: string = VOUCHER_API_URL) {
    super({
      serviceUrl,
      serviceName: 'VoucherServiceClient',
    })
  }

  /**
   * Get a voucher by ID
   */
  async getVoucherById(
    voucherId: string,
    context?: ServiceContext,
  ): Promise<VoucherDomain | null> {
    try {
      return await this.get<VoucherDomain>(`/vouchers/${voucherId}`, {
        useServiceAuth: true,
        context,
      })
    } catch (error: any) {
      if (error.context?.metadata?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Get voucher by short code
   */
  async getVoucherByCode(
    code: string,
    context?: ServiceContext,
  ): Promise<VoucherDomain | null> {
    try {
      return await this.get<VoucherDomain>(`/vouchers/by-code/${code}`, {
        useServiceAuth: true,
        context,
      })
    } catch (error: any) {
      if (error.context?.metadata?.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Update voucher state after redemption
   * This is called by the redemption service after successful redemption
   */
  async updateVoucherState(
    voucherId: string,
    update: VoucherStateUpdate,
    context?: ServiceContext,
  ): Promise<VoucherDomain> {
    return this.put<VoucherDomain>(`/vouchers/${voucherId}/state`, update, {
      ...context,
      useServiceAuth: true,
    })
  }

  /**
   * Increment redemption count for a voucher
   * Used for tracking purposes
   */
  async incrementRedemptionCount(
    voucherId: string,
    context?: ServiceContext,
  ): Promise<void> {
    await this.post(
      `/vouchers/${voucherId}/increment-redemptions`,
      {},
      {
        ...context,
        useServiceAuth: true,
      },
    )
  }

  /**
   * Check if a voucher exists and can be redeemed
   */
  async canRedeem(
    voucherId: string,
    customerId: string,
    context?: ServiceContext,
  ): Promise<boolean> {
    try {
      await this.get(`/vouchers/${voucherId}/can-redeem/${customerId}`, {
        useServiceAuth: true,
        context,
      })

      return true
    } catch (error: any) {
      if (
        error.context?.metadata?.status === 404 ||
        error.context?.metadata?.status === 409
      ) {
        return false
      }
      throw error
    }
  }

  /**
   * Check if a voucher exists
   */
  async voucherExists(
    voucherId: string,
    context?: ServiceContext,
  ): Promise<boolean> {
    return this.exists(`/vouchers/${voucherId}`, context)
  }
}
