import { ErrorFactory, logger } from '@pika/shared'
import { Voucher } from '@voucher-read/domain/entities/Voucher.js'
import { VoucherReadRepositoryPort } from '@voucher-read/domain/port/voucher/VoucherReadRepositoryPort.js'

import { GetVoucherQuery } from './GetVoucherQuery.js'

/**
 * Handler for retrieving a single voucher by ID
 */
export class GetVoucherByIdHandler {
  constructor(private readonly repository: VoucherReadRepositoryPort) {}

  /**
   * Executes the query to retrieve a voucher by ID
   *
   * @param query - Query with voucher ID and options
   * @returns Promise with the voucher or throws a NotFoundError if not found
   */
  public async execute(query: GetVoucherQuery): Promise<Voucher> {
    logger.debug(`Executing GetVoucherByIdHandler with ID: ${query.id}`)

    try {
      const voucher = await this.repository.getVoucherById(query)

      if (!voucher) {
        logger.warn(`Voucher with ID ${query.id} not found`)
        throw ErrorFactory.resourceNotFound('Voucher', query.id, {
          source: 'GetVoucherByIdHandler.execute',
          suggestion:
            'Check that the voucher ID exists and is in the correct format',
        })
      }

      return voucher
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

      logger.error(`Error retrieving voucher ${query.id}:`, err)
      throw ErrorFactory.databaseError(
        'get_voucher_by_id',
        `Error retrieving voucher ${query.id}`,
        err,
        {
          source: 'GetVoucherByIdHandler.execute',
          metadata: { voucherId: query.id },
        },
      )
    }
  }
}
