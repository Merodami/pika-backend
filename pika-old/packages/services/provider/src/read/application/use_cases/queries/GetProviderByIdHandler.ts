import { ErrorFactory, logger } from '@pika/shared'
import { Provider } from '@provider-read/domain/entities/Provider.js'
import { ProviderReadRepositoryPort } from '@provider-read/domain/port/provider/ProviderReadRepositoryPort.js'

import { GetProviderQuery } from './GetProviderQuery.js'

/**
 * Handler for retrieving a single provider by ID
 */
export class GetProviderByIdHandler {
  constructor(private readonly repository: ProviderReadRepositoryPort) {}

  /**
   * Executes the query to retrieve a provider by ID
   *
   * @param query - Query with provider ID
   * @returns Promise with the provider or throws a NotFoundError if not found
   */
  public async execute(query: GetProviderQuery): Promise<Provider> {
    logger.debug(`Executing GetProviderByIdHandler with ID: ${query.id}`)

    try {
      const provider = await this.repository.getProviderById(query)

      if (!provider) {
        logger.warn(`Provider with ID ${query.id} not found`)
        throw ErrorFactory.resourceNotFound('Provider', query.id, {
          source: 'GetProviderByIdHandler.execute',
          suggestion:
            'Check that the provider ID exists and is in the correct format',
        })
      }

      return provider
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

      logger.error(`Error retrieving provider ${query.id}:`, err)
      throw ErrorFactory.databaseError(
        'get_provider_by_id',
        `Error retrieving provider ${query.id}`,
        err,
        {
          source: 'GetProviderByIdHandler.execute',
          metadata: { providerId: query.id },
        },
      )
    }
  }
}
