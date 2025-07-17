import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'

import { VoucherBook } from '../../../domain/entities/VoucherBook.js'
import { PDFReadRepositoryPort } from '../../../domain/port/pdf/PDFReadRepositoryPort.js'
import { VoucherBookSearchQuery } from './VoucherBookSearchQuery.js'

/**
 * Handler for retrieving multiple voucher books based on search criteria
 */
export class GetAllVoucherBooksHandler {
  constructor(private readonly repository: PDFReadRepositoryPort) {}

  /**
   * Executes the query to retrieve voucher books based on search parameters
   *
   * @param query - Search parameters for filtering and pagination
   * @returns Promise with paginated voucher book results
   */
  public async execute(
    query: VoucherBookSearchQuery,
  ): Promise<PaginatedResult<VoucherBook>> {
    logger.debug('Executing GetAllVoucherBooksHandler with params:', query)

    try {
      const queryWithDefaults: VoucherBookSearchQuery = {
        // Sensible defaults
        page: 1,
        limit: 20,
        // Override with provided values
        ...query,
      }

      return await this.repository.getAllVoucherBooks(queryWithDefaults)
    } catch (err) {
      logger.error('Error retrieving voucher books:', err)

      throw ErrorFactory.databaseError(
        'get_all_voucher_books',
        'Error retrieving voucher books',
        err,
        {
          source: 'GetAllVoucherBooksHandler.execute',
          metadata: {
            query,
          },
        },
      )
    }
  }
}
