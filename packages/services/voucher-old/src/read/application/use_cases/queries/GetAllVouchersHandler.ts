import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { Voucher } from '@voucher-read/domain/entities/Voucher.js'
import { VoucherReadRepositoryPort } from '@voucher-read/domain/port/voucher/VoucherReadRepositoryPort.js'

import { VoucherSearchQuery } from './VoucherSearchQuery.js'

/**
 * Handler for retrieving multiple vouchers based on search criteria
 */
export class GetAllVouchersHandler {
  constructor(private readonly repository: VoucherReadRepositoryPort) {}

  /**
   * Executes the query to retrieve vouchers based on search parameters
   *
   * @param query - Search parameters for filtering and pagination
   * @returns Promise with paginated voucher results
   */
  public async execute(
    query: VoucherSearchQuery,
  ): Promise<PaginatedResult<Voucher>> {
    logger.debug('Executing GetAllVouchersHandler with params:', query)

    try {
      const queryWithDefaults: VoucherSearchQuery = {
        // Sensible defaults
        page: 1,
        limit: 20,
        // Override with provided values
        ...query,
      }

      return await this.repository.getAllVouchers(queryWithDefaults)
    } catch (err) {
      logger.error('Error retrieving vouchers:', err)

      throw ErrorFactory.databaseError(
        'get_all_vouchers',
        'Error retrieving vouchers',
        err,
        {
          source: 'GetAllVouchersHandler.execute',
          metadata: {
            query,
          },
        },
      )
    }
  }
}
