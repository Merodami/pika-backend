import { Campaign } from '@campaign-read/domain/entities/Campaign.js'
import { CampaignReadRepositoryPort } from '@campaign-read/domain/port/campaign/CampaignReadRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'

import { CampaignSearchQuery } from './CampaignSearchQuery.js'

/**
 * Handler for retrieving multiple campaigns based on search criteria
 */
export class GetAllCampaignsHandler {
  constructor(private readonly repository: CampaignReadRepositoryPort) {}

  /**
   * Executes the query to retrieve campaigns based on search parameters
   *
   * @param query - Search parameters for filtering and pagination
   * @returns Promise with paginated campaign results
   */
  public async execute(
    query: CampaignSearchQuery,
  ): Promise<PaginatedResult<Campaign>> {
    logger.debug('Executing GetAllCampaignsHandler with params:', query)

    try {
      const queryWithDefaults: CampaignSearchQuery = {
        // Sensible defaults
        page: 1,
        limit: 20,
        // Override with provided values
        ...query,
      }

      return await this.repository.getAllCampaigns(queryWithDefaults)
    } catch (err) {
      logger.error('Error retrieving campaigns:', err)

      throw ErrorFactory.databaseError(
        'get_all_campaigns',
        'Error retrieving campaigns',
        err,
        {
          source: 'GetAllCampaignsHandler.execute',
          metadata: {
            query,
          },
        },
      )
    }
  }
}
