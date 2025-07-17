import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import type { Redemption } from '@redemption-read/domain/entities/Redemption.js'
import type {
  RedemptionReadRepositoryPort,
  RedemptionSearchQuery,
} from '@redemption-read/domain/port/redemption/RedemptionReadRepositoryPort.js'

/**
 * Query handler for retrieving redemptions by customer
 */
export class GetRedemptionsByCustomerHandler {
  constructor(private readonly repository: RedemptionReadRepositoryPort) {}

  /**
   * Execute the query to get redemptions for a specific customer
   */
  async execute(
    customerId: string,
    query: RedemptionSearchQuery,
  ): Promise<PaginatedResult<Redemption>> {
    logger.debug('Getting redemptions by customer', { customerId, query })

    try {
      const queryWithDefaults: RedemptionSearchQuery = {
        page: 1,
        limit: 20,
        sortBy: 'redeemed_at',
        sortOrder: 'desc',
        ...query,
      }

      return await this.repository.getRedemptionsByCustomer(
        customerId,
        queryWithDefaults,
      )
    } catch (error) {
      logger.error('Error retrieving customer redemptions', {
        error,
        customerId,
      })

      throw ErrorFactory.databaseError(
        'get_redemptions_by_customer',
        'Failed to retrieve customer redemptions',
        error,
        {
          source: 'GetRedemptionsByCustomerHandler.execute',
          metadata: { customerId, query },
        },
      )
    }
  }
}
