import { Admin } from '@admin-read/domain/entities/Admin.js'
import { AdminReadRepositoryPort } from '@admin-read/domain/port/admin/AdminReadRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'

import { AdminSearchQuery } from './AdminSearchQuery.js'

/**
 * Handler for retrieving multiple admins based on search criteria
 */
export class GetAllAdminsHandler {
  constructor(private readonly repository: AdminReadRepositoryPort) {}

  /**
   * Executes the query to retrieve admins based on search parameters
   *
   * @param query - Search parameters for filtering and pagination
   * @returns Promise with paginated admin results
   */
  public async execute(
    query: AdminSearchQuery,
  ): Promise<PaginatedResult<Admin>> {
    logger.debug('Executing GetAllAdminsHandler with params:', query)

    try {
      const queryWithDefaults: AdminSearchQuery = {
        // Sensible defaults
        page: 1,
        limit: 20,
        // Override with provided values
        ...query,
      }

      return await this.repository.getAllAdmins(queryWithDefaults)
    } catch (err) {
      logger.error('Error retrieving admins:', err)

      throw ErrorFactory.databaseError(
        'get_all_admins',
        'Error retrieving admins',
        err,
        {
          source: 'GetAllAdminsHandler.execute',
          metadata: {
            query,
          },
        },
      )
    }
  }
}
