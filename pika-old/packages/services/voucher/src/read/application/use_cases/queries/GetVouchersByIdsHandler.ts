import { logger } from '@pika/shared'
import { Voucher } from '@voucher-read/domain/entities/Voucher.js'
import { VoucherReadRepositoryPort } from '@voucher-read/domain/port/voucher/VoucherReadRepositoryPort.js'

export interface GetVouchersByIdsQuery {
  voucherIds: string[]
}

export class GetVouchersByIdsHandler {
  constructor(private readonly voucherRepository: VoucherReadRepositoryPort) {}

  async execute(
    query: GetVouchersByIdsQuery,
  ): Promise<Map<string, Voucher>> {
    logger.info('Executing GetVouchersByIdsHandler', {
      voucherCount: query.voucherIds.length,
    })

    try {
      // Get vouchers by IDs
      const vouchers = await this.voucherRepository.findByIds(query.voucherIds)

      // Convert to Map for easy lookup
      const voucherMap = new Map<string, Voucher>()

      for (const voucher of vouchers) {
        voucherMap.set(voucher.id, voucher)
      }

      logger.info('Vouchers retrieved by IDs', {
        requested: query.voucherIds.length,
        found: voucherMap.size,
      })

      return voucherMap
    } catch (error) {
      logger.error('Error fetching vouchers by IDs', {
        error,
        voucherIds: query.voucherIds,
      })
      throw error
    }
  }
}
