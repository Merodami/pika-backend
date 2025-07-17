import { ErrorFactory, logger } from '@pika/shared'

import { VoucherBook } from '../../../domain/entities/VoucherBook.js'
import { PDFReadRepositoryPort } from '../../../domain/port/pdf/PDFReadRepositoryPort.js'
import { GetVoucherBookQuery } from './GetVoucherBookQuery.js'

/**
 * Handler for retrieving a single voucher book by ID
 */
export class GetVoucherBookByIdHandler {
  constructor(private readonly repository: PDFReadRepositoryPort) {}

  /**
   * Executes the query to retrieve a voucher book by ID
   *
   * @param query - Query with voucher book ID and options
   * @returns Promise with the voucher book or throws a NotFoundError if not found
   */
  public async execute(query: GetVoucherBookQuery): Promise<VoucherBook> {
    logger.debug(`Executing GetVoucherBookByIdHandler with ID: ${query.id}`)

    try {
      const voucherBook = await this.repository.getVoucherBookById(query)

      if (!voucherBook) {
        logger.warn(`Voucher book with ID ${query.id} not found`)
        throw ErrorFactory.resourceNotFound('VoucherBook', query.id, {
          source: 'GetVoucherBookByIdHandler.execute',
          suggestion:
            'Check that the voucher book ID exists and is in the correct format',
        })
      }

      return voucherBook
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

      logger.error(`Error retrieving voucher book ${query.id}:`, err)
      throw ErrorFactory.databaseError(
        'get_voucher_book_by_id',
        `Error retrieving voucher book ${query.id}`,
        err,
        {
          source: 'GetVoucherBookByIdHandler.execute',
          metadata: { voucherBookId: query.id },
        },
      )
    }
  }
}
