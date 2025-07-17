import { Admin } from '@admin-read/domain/entities/Admin.js'
import { AdminReadRepositoryPort } from '@admin-read/domain/port/admin/AdminReadRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'

import { GetAdminQuery } from './GetAdminQuery.js'

/**
 * Handler for retrieving a single admin by ID
 */
export class GetAdminByIdHandler {
  constructor(private readonly repository: AdminReadRepositoryPort) {}

  /**
   * Executes the query to retrieve an admin by ID
   *
   * @param query - Query with admin ID and options
   * @returns Promise with the admin or throws a NotFoundError if not found
   */
  public async execute(query: GetAdminQuery): Promise<Admin> {
    logger.debug(`Executing GetAdminByIdHandler with ID: ${query.id}`)

    try {
      const admin = await this.repository.getAdminById(query)

      if (!admin) {
        logger.warn(`Admin with ID ${query.id} not found`)
        throw ErrorFactory.resourceNotFound('Admin', query.id, {
          source: 'GetAdminByIdHandler.execute',
          suggestion:
            'Check that the admin ID exists and is in the correct format',
        })
      }

      return admin
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

      logger.error(`Error retrieving admin ${query.id}:`, err)
      throw ErrorFactory.databaseError(
        'get_admin_by_id',
        `Error retrieving admin ${query.id}`,
        err,
        {
          source: 'GetAdminByIdHandler.execute',
          metadata: { adminId: query.id },
        },
      )
    }
  }
}
