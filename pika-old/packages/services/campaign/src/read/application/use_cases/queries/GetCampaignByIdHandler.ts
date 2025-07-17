import { Campaign } from '@campaign-read/domain/entities/Campaign.js'
import { CampaignReadRepositoryPort } from '@campaign-read/domain/port/campaign/CampaignReadRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'

import { GetCampaignQuery } from './GetCampaignQuery.js'

/**
 * Handler for retrieving a single campaign by ID
 */
export class GetCampaignByIdHandler {
  constructor(private readonly repository: CampaignReadRepositoryPort) {}

  /**
   * Executes the query to retrieve a campaign by ID
   *
   * @param query - Query with campaign ID and options
   * @returns Promise with the campaign or throws a NotFoundError if not found
   */
  public async execute(query: GetCampaignQuery): Promise<Campaign> {
    logger.debug(`Executing GetCampaignByIdHandler with ID: ${query.id}`)

    try {
      const campaign = await this.repository.getCampaignById(query)

      if (!campaign) {
        logger.warn(`Campaign with ID ${query.id} not found`)
        throw ErrorFactory.resourceNotFound('Campaign', query.id, {
          source: 'GetCampaignByIdHandler.execute',
          suggestion:
            'Check that the campaign ID exists and is in the correct format',
        })
      }

      return campaign
    } catch (err) {
      // If the error is already a BaseError from our system, just rethrow it
      if (
        err &&
        typeof err === 'object' &&
        'context' in err &&
        'domain' in err.context
      ) {
        throw err
      }

      logger.error(`Error retrieving campaign ${query.id}:`, err)
      throw ErrorFactory.databaseError(
        'get_campaign_by_id',
        `Error retrieving campaign ${query.id}`,
        err,
        {
          source: 'GetCampaignByIdHandler.execute',
          metadata: { campaignId: query.id },
        },
      )
    }
  }
}
