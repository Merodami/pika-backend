import { ErrorFactory, logger } from '@pika/shared'
import { User } from '@user-read/domain/entities/User.js'
import { UserReadRepositoryPort } from '@user-read/domain/port/user/UserReadRepositoryPort.js'

import { GetUserQuery } from './GetUserQuery.js'

/**
 * Handler for retrieving a single user by ID
 */
export class GetUserByIdHandler {
  constructor(private readonly repository: UserReadRepositoryPort) {}

  /**
   * Executes the query to retrieve a user by ID
   *
   * @param query - Query with user ID and options
   * @returns Promise with the user or throws a NotFoundError if not found
   */
  public async execute(query: GetUserQuery): Promise<User> {
    logger.debug(`Executing GetUserByIdHandler with ID: ${query.id}`)

    try {
      const user = await this.repository.getUserById(query)

      if (!user) {
        logger.warn(`User with ID ${query.id} not found`)
        throw ErrorFactory.resourceNotFound('User', query.id, {
          source: 'GetUserByIdHandler.execute',
          suggestion:
            'Check that the user ID exists and is in the correct format',
        })
      }

      return user
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'context' in err &&
        'domain' in err.context
      ) {
        throw err
      }

      logger.error(`Error retrieving user ${query.id}:`, err)
      throw ErrorFactory.databaseError(
        'get_user_by_id',
        `Error retrieving user ${query.id}`,
        err,
        {
          source: 'GetUserByIdHandler.execute',
          metadata: { userId: query.id },
        },
      )
    }
  }
}
