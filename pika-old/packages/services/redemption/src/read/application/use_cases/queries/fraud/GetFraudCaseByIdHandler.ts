import { ErrorFactory, logger } from '@pika/shared'
import type { FraudCaseReadRepositoryPort } from '@redemption-read/domain/port/fraud/FraudCaseReadRepositoryPort.js'
import type { FraudCase } from '@redemption-write/domain/entities/FraudCase.js'

/**
 * Handler for retrieving a single fraud case by ID
 */
export class GetFraudCaseByIdHandler {
  constructor(private readonly repository: FraudCaseReadRepositoryPort) {}

  /**
   * Executes the query to retrieve a fraud case by ID
   *
   * @param id - Fraud case ID
   * @returns Promise with the fraud case or throws a NotFoundError if not found
   */
  public async execute(id: string): Promise<FraudCase> {
    logger.debug(`Executing GetFraudCaseByIdHandler with ID: ${id}`)

    try {
      const fraudCase = await this.repository.getCaseById(id)

      if (!fraudCase) {
        logger.warn(`Fraud case with ID ${id} not found`)
        throw ErrorFactory.resourceNotFound('FraudCase', id, {
          source: 'GetFraudCaseByIdHandler.execute',
          suggestion:
            'Check that the fraud case ID exists and is in the correct format',
        })
      }

      return fraudCase
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

      logger.error(`Error retrieving fraud case ${id}:`, err)
      throw ErrorFactory.databaseError(
        'get_fraud_case_by_id',
        `Error retrieving fraud case ${id}`,
        err,
        {
          source: 'GetFraudCaseByIdHandler.execute',
          metadata: { fraudCaseId: id },
        },
      )
    }
  }
}
