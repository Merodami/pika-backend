import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import type { Redemption } from '@redemption-read/domain/entities/Redemption.js'
import type {
  RedemptionReadRepositoryPort,
  RedemptionSearchQuery,
} from '@redemption-read/domain/port/redemption/RedemptionReadRepositoryPort.js'

/**
 * Query handler for retrieving redemptions by provider
 */
export class GetRedemptionsByProviderHandler {
  constructor(private readonly repository: RedemptionReadRepositoryPort) {}

  /**
   * Execute the query to get redemptions for a specific provider
   */
  async execute(
    providerId: string,
    query: RedemptionSearchQuery,
  ): Promise<PaginatedResult<Redemption>> {
    logger.debug('Getting redemptions by provider', { providerId, query })

    try {
      const queryWithDefaults: RedemptionSearchQuery = {
        page: 1,
        limit: 20,
        sortBy: 'redeemed_at',
        sortOrder: 'desc',
        ...query,
      }

      return await this.repository.getRedemptionsByProvider(
        providerId,
        queryWithDefaults,
      )
    } catch (error) {
      logger.error('Error retrieving provider redemptions', {
        error,
        providerId,
      })

      throw ErrorFactory.databaseError(
        'get_redemptions_by_provider',
        'Failed to retrieve provider redemptions',
        error,
        {
          source: 'GetRedemptionsByProviderHandler.execute',
          metadata: { providerId, query },
        },
      )
    }
  }
}
