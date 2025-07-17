import { ErrorFactory, logger } from '@pika/shared'

import type {
  FraudCaseReadRepositoryPort,
  FraudStatisticsQuery,
  FraudStatisticsResult,
} from '../../../../domain/port/fraud/FraudCaseReadRepositoryPort.js'

/**
 * Handler for retrieving fraud statistics
 */
export class GetFraudStatisticsHandler {
  constructor(private readonly repository: FraudCaseReadRepositoryPort) {}

  /**
   * Executes the query to retrieve fraud statistics
   *
   * @param query - Query parameters for statistics
   * @returns Promise with fraud statistics
   */
  public async execute(
    query: FraudStatisticsQuery,
  ): Promise<FraudStatisticsResult> {
    logger.debug('Executing GetFraudStatisticsHandler with params:', query)

    try {
      return await this.repository.getStatistics(query)
    } catch (err) {
      logger.error('Error retrieving fraud statistics:', err)

      throw ErrorFactory.databaseError(
        'get_fraud_statistics',
        'Error retrieving fraud statistics',
        err,
        {
          source: 'GetFraudStatisticsHandler.execute',
          metadata: {
            query,
          },
        },
      )
    }
  }
}
