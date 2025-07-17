import { ErrorFactory, logger } from '@pika/shared'
import { User } from '@user-read/domain/entities/User.js'
import { UserReadRepositoryPort } from '@user-read/domain/port/user/UserReadRepositoryPort.js'

/**
 * Handler for retrieving a single user by email
 */
export class GetUserByEmailHandler {
  constructor(private readonly repository: UserReadRepositoryPort) {}

  /**
   * Executes the query to retrieve a user by email
   *
   * @param params - Object containing the email to search for
   * @returns Promise with the user or throws a NotFoundError if not found
   */
  public async execute(params: { email: string }): Promise<User> {
    logger.debug(`Executing GetUserByEmailHandler with email: ${params.email}`)

    try {
      const user = await this.repository.getUserByEmail(params)

      if (!user) {
        logger.warn(`User with email ${params.email} not found`)
        throw ErrorFactory.resourceNotFound('User', params.email, {
          source: 'GetUserByEmailHandler.execute',
          suggestion:
            'Check that the email exists and is in the correct format',
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

      logger.error(`Error retrieving user by email ${params.email}:`, err)
      throw ErrorFactory.databaseError(
        'get_user_by_email',
        `Error retrieving user by email ${params.email}`,
        err,
        {
          source: 'GetUserByEmailHandler.execute',
          metadata: { email: params.email },
        },
      )
    }
  }
}
