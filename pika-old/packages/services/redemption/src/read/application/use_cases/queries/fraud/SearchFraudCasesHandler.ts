import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import type {
  FraudCaseReadRepositoryPort,
  FraudCaseSearchQuery,
} from '@redemption-read/domain/port/fraud/FraudCaseReadRepositoryPort.js'
import type { FraudCase } from '@redemption-write/domain/entities/FraudCase.js'

/**
 * Handler for searching fraud cases based on criteria
 */
export class SearchFraudCasesHandler {
  constructor(private readonly repository: FraudCaseReadRepositoryPort) {}

  /**
   * Executes the query to search fraud cases based on parameters
   *
   * @param query - Search parameters for filtering and pagination
   * @returns Promise with paginated fraud case results
   */
  public async execute(
    query: FraudCaseSearchQuery,
  ): Promise<PaginatedResult<FraudCase>> {
    logger.debug('Executing SearchFraudCasesHandler with params:', query)

    try {
      const queryWithDefaults: FraudCaseSearchQuery = {
        // Sensible defaults
        page: 1,
        limit: 20,
        // Override with provided values
        ...query,
      }

      return await this.repository.searchCases(queryWithDefaults)
    } catch (err) {
      logger.error('Error searching fraud cases:', err)

      throw ErrorFactory.databaseError(
        'search_fraud_cases',
        'Error searching fraud cases',
        err,
        {
          source: 'SearchFraudCasesHandler.execute',
          metadata: {
            query,
          },
        },
      )
    }
  }
}
