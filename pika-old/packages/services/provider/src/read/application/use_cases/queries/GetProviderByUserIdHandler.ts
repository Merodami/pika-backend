import { ErrorFactory, logger } from '@pika/shared'
import { Provider } from '@provider-read/domain/entities/Provider.js'
import { ProviderReadRepositoryPort } from '@provider-read/domain/port/provider/ProviderReadRepositoryPort.js'

/**
 * Handler for retrieving a provider by user ID
 */
export class GetProviderByUserIdHandler {
  constructor(private readonly repository: ProviderReadRepositoryPort) {}

  /**
   * Executes the query to retrieve a provider by user ID
   *
   * @param userId - The user ID to search for
   * @returns Promise with the provider or throws a NotFoundError if not found
   */
  public async execute(userId: string): Promise<Provider> {
    logger.debug(`Executing GetProviderByUserIdHandler with user ID: ${userId}`)

    try {
      const provider = await this.repository.getProviderByUserId(userId)

      if (!provider) {
        logger.warn(`Provider for user ID ${userId} not found`)
        throw ErrorFactory.resourceNotFound('Provider', userId, {
          source: 'GetProviderByUserIdHandler.execute',
          suggestion: 'User may not be registered as a provider',
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

      logger.error(`Error retrieving provider for user ${userId}:`, err)
      throw ErrorFactory.databaseError(
        'get_provider_by_user_id',
        `Error retrieving provider for user ${userId}`,
        err,
        {
          source: 'GetProviderByUserIdHandler.execute',
          metadata: { userId },
        },
      )
    }
  }
}
