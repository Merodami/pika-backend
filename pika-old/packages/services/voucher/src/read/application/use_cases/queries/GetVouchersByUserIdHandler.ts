import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { Voucher } from '@voucher-read/domain/entities/Voucher.js'
import { VoucherReadRepositoryPort } from '@voucher-read/domain/port/voucher/VoucherReadRepositoryPort.js'

import { VoucherSearchQuery } from './VoucherSearchQuery.js'

/**
 * Handler for retrieving vouchers claimed by a user
 */
export class GetVouchersByUserIdHandler {
  constructor(private readonly repository: VoucherReadRepositoryPort) {}

  /**
   * Executes the query to retrieve vouchers claimed by a specific user
   *
   * @param userId - The user's ID
   * @param query - Additional search parameters for filtering and pagination
   * @returns Promise with paginated voucher results
   */
  public async execute(
    userId: string,
    query: VoucherSearchQuery = {},
  ): Promise<PaginatedResult<Voucher>> {
    logger.debug(`Executing GetVouchersByUserIdHandler for user: ${userId}`)

    try {
      const queryWithDefaults: VoucherSearchQuery = {
        page: 1,
        limit: 20,
        ...query,
      }

      return await this.repository.getVouchersByUserId(
        userId,
        queryWithDefaults,
      )
    } catch (err) {
      logger.error(`Error retrieving vouchers for user ${userId}:`, err)

      throw ErrorFactory.databaseError(
        'get_vouchers_by_user',
        `Error retrieving vouchers for user ${userId}`,
        err,
        {
          source: 'GetVouchersByUserIdHandler.execute',
          metadata: {
            userId,
            query,
          },
        },
      )
    }
  }
}
