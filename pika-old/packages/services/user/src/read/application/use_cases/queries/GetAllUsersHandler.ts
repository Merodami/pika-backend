import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { User } from '@user-read/domain/entities/User.js'
import { UserReadRepositoryPort } from '@user-read/domain/port/user/UserReadRepositoryPort.js'

import { UserSearchDefaults } from './UserSearchDefaults.js'
import { UserSearchQuery } from './UserSearchQuery.js'

/**
 * Handler for retrieving multiple users based on search criteria
 */
export class GetAllUsersHandler {
  constructor(private readonly repository: UserReadRepositoryPort) {}

  /**
   * Executes the query to retrieve users based on search parameters
   *
   * @param query - Search parameters for filtering and pagination
   * @returns Promise with paginated user results
   */
  public async execute(
    query: UserSearchQuery = {},
  ): Promise<PaginatedResult<User>> {
    logger.debug('Executing GetAllUsersHandler with params:', query)

    try {
      // Apply default values if not provided in query
      const queryWithDefaults: UserSearchQuery = {
        ...UserSearchDefaults.createDefault(),
        ...query,
      }

      return await this.repository.getAllUsers(queryWithDefaults)
    } catch (err) {
      logger.error('Error retrieving users:', err)

      throw ErrorFactory.databaseError(
        'get_all_users',
        'Error retrieving users',
        err,
        {
          source: 'GetAllUsersHandler.execute',
          metadata: {
            query,
          },
        },
      )
    }
  }

  /**
   * Get all active users
   */
  public async getActiveUsers(): Promise<PaginatedResult<User>> {
    return this.execute(UserSearchDefaults.forActiveUsers())
  }

  /**
   * Get all customers
   */
  public async getCustomers(): Promise<PaginatedResult<User>> {
    return this.execute(UserSearchDefaults.forCustomers())
  }

  /**
   * Get all service providers
   */
  public async getProviders(): Promise<PaginatedResult<User>> {
    return this.execute(UserSearchDefaults.forProviders())
  }

  /**
   * Get recently active users
   */
  public async getRecentlyActiveUsers(
    daysAgo = 30,
  ): Promise<PaginatedResult<User>> {
    return this.execute(UserSearchDefaults.forRecentlyActive(daysAgo))
  }

  /**
   * Get recently created users
   */
  public async getRecentlyCreatedUsers(
    daysAgo = 30,
  ): Promise<PaginatedResult<User>> {
    return this.execute(UserSearchDefaults.forRecentlyCreated(daysAgo))
  }
}
