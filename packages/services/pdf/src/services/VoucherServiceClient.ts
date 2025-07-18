import { VOUCHER_API_URL } from '@pika/environment'
import { VoucherDomain } from '@pika/sdk'
import { BaseServiceClient, logger } from '@pika/shared'
import type { ServiceContext } from '@pika/types'

export class VoucherServiceClient extends BaseServiceClient {
  constructor(serviceUrl: string = VOUCHER_API_URL) {
    super({
      serviceUrl,
      serviceName: 'VoucherServiceClient',
    })
  }

  /**
   * Get vouchers by IDs for PDF generation
   * Returns a Map for easy lookup by ID
   */
  async getVouchersByIds(
    voucherIds: string[],
    context?: ServiceContext,
  ): Promise<Map<string, any>> {
    try {
      // Call the batch endpoint with proper payload
      const response = await this.post<Record<string, any>>(
        '/vouchers/batch',
        { voucher_ids: voucherIds },
        { ...context, useServiceAuth: true },
      )

      // Convert object response to Map
      const voucherMap = new Map<string, any>()

      for (const [id, voucher] of Object.entries(response)) {
        voucherMap.set(id, voucher)
      }

      logger.info('Fetched vouchers batch', {
        requested: voucherIds.length,
        received: voucherMap.size,
      })

      return voucherMap
    } catch (error) {
      logger.error('Failed to fetch vouchers batch', {
        voucherIds,
        error,
      })
      throw error
    }
  }

  /**
   * Get a single voucher by ID
   */
  async getVoucherById(
    voucherId: string,
    context?: ServiceContext,
  ): Promise<VoucherDomain | null> {
    try {
      return await this.get<VoucherDomain>(`/vouchers/${voucherId}`, {
        ...context,
        useServiceAuth: true,
      })
    } catch (error: any) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Get vouchers by provider ID
   */
  async getVouchersByProviderId(
    providerId: string,
    context?: ServiceContext,
  ): Promise<VoucherDomain[]> {
    try {
      const response = await this.get<{ data: VoucherDomain[] }>(
        `/vouchers/providers/${providerId}`,
        { ...context, useServiceAuth: true },
      )

      return response.data
    } catch (error) {
      logger.error('Failed to fetch vouchers by provider', {
        providerId,
        error,
      })
      throw error
    }
  }
}
