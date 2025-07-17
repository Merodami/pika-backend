import { ErrorFactory, logger } from '@pika/shared'
import type { Redemption } from '@redemption-read/domain/entities/Redemption.js'
import type { RedemptionReadRepositoryPort } from '@redemption-read/domain/port/redemption/RedemptionReadRepositoryPort.js'

/**
 * Query handler for retrieving a single redemption by ID
 */
export class GetRedemptionByIdHandler {
  constructor(private readonly repository: RedemptionReadRepositoryPort) {}

  /**
   * Execute the query to get a redemption by ID
   */
  async execute(id: string): Promise<Redemption | null> {
    logger.debug('Getting redemption by ID', { id })

    try {
      const redemption = await this.repository.getRedemptionById(id)

      if (!redemption) {
        logger.debug('Redemption not found', { id })

        return null
      }

      return redemption
    } catch (error) {
      logger.error('Error retrieving redemption', { error, id })

      throw ErrorFactory.databaseError(
        'get_redemption_by_id',
        'Failed to retrieve redemption',
        error,
        {
          source: 'GetRedemptionByIdHandler.execute',
          metadata: { redemptionId: id },
        },
      )
    }
  }
}
