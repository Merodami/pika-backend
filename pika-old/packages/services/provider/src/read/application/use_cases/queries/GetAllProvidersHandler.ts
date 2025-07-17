import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { Provider } from '@provider-read/domain/entities/Provider.js'
import { ProviderReadRepositoryPort } from '@provider-read/domain/port/provider/ProviderReadRepositoryPort.js'

import { ProviderSearchQuery } from './ProviderSearchQuery.js'

/**
 * Handler for retrieving multiple providers based on search criteria
 */
export class GetAllProvidersHandler {
  constructor(private readonly repository: ProviderReadRepositoryPort) {}

  /**
   * Executes the query to retrieve providers based on search parameters
   *
   * @param query - Search parameters for filtering and pagination
   * @returns Promise with paginated provider results
   */
  public async execute(
    query: ProviderSearchQuery,
  ): Promise<PaginatedResult<Provider>> {
    logger.debug('Executing GetAllProvidersHandler with params:', query)

    const queryWithDefaults: ProviderSearchQuery = {
      // Sensible defaults
      page: 1,
      limit: 20,
      // Override with provided values
      ...query,
    }

    try {
      return await this.repository.getAllProviders(queryWithDefaults)
    } catch (err) {
      logger.error('Error retrieving providers:', err)

      throw ErrorFactory.databaseError(
        'get_all_providers',
        'Error retrieving providers',
        err,
        {
          source: 'GetAllProvidersHandler.execute',
          metadata: {
            query,
          },
        },
      )
    }
  }
}
