import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { Voucher } from '@voucher-read/domain/entities/Voucher.js'
import { VoucherReadRepositoryPort } from '@voucher-read/domain/port/voucher/VoucherReadRepositoryPort.js'

import { VoucherSearchQuery } from './VoucherSearchQuery.js'

/**
 * Handler for retrieving vouchers by provider ID
 */
export class GetVouchersByProviderIdHandler {
  constructor(private readonly repository: VoucherReadRepositoryPort) {}

  /**
   * Executes the query to retrieve vouchers for a specific provider
   *
   * @param providerId - The provider's ID
   * @param query - Additional search parameters for filtering and pagination
   * @returns Promise with paginated voucher results
   */
  public async execute(
    providerId: string,
    query: VoucherSearchQuery = {},
  ): Promise<PaginatedResult<Voucher>> {
    logger.debug(
      `Executing GetVouchersByProviderIdHandler for provider: ${providerId}`,
    )

    try {
      const queryWithDefaults: VoucherSearchQuery = {
        page: 1,
        limit: 20,
        ...query,
      }

      return await this.repository.getVouchersByProviderId(
        providerId,
        queryWithDefaults,
      )
    } catch (err) {
      logger.error(`Error retrieving vouchers for provider ${providerId}:`, err)

      throw ErrorFactory.databaseError(
        'get_vouchers_by_provider',
        `Error retrieving vouchers for provider ${providerId}`,
        err,
        {
          source: 'GetVouchersByProviderIdHandler.execute',
          metadata: {
            providerId,
            query,
          },
        },
      )
    }
  }
}
