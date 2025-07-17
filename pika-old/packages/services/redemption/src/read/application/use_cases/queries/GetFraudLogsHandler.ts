import type { ICacheService } from '@pika/redis'
import { ErrorFactory, logger } from '@pika/shared'

import { FraudDetectionService } from '../../../../write/infrastructure/services/FraudDetectionService.js'

export interface FraudLogQuery {
  type: 'customer' | 'provider' | 'admin'
  id?: string
}

export interface FraudLogDTO {
  voucherId: string
  customerId: string
  providerId: string
  location?: {
    lat: number
    lng: number
  }
  timestamp: string
  flags: Array<{
    type: string
    severity: string
    message: string
    details?: Record<string, any>
  }>
  riskScore: number
}

/**
 * Handler for retrieving fraud logs
 */
export class GetFraudLogsHandler {
  private readonly fraudDetectionService: FraudDetectionService

  constructor(private readonly cacheService: ICacheService) {
    this.fraudDetectionService = new FraudDetectionService(cacheService)
  }

  /**
   * Execute fraud logs query
   */
  async execute(query: FraudLogQuery): Promise<FraudLogDTO[]> {
    try {
      logger.debug('Getting fraud logs', query)

      // Validate query
      if (query.type !== 'admin' && !query.id) {
        throw ErrorFactory.validationError(
          { id: ['ID is required for customer and provider queries'] },
          {
            source: 'GetFraudLogsHandler.execute',
          },
        )
      }

      // Get logs from fraud detection service
      const logs = await this.fraudDetectionService.getFraudLogs(
        query.type,
        query.id,
      )

      // Map to DTOs
      return logs.map((log) => ({
        voucherId: log.voucherId,
        customerId: log.customerId,
        providerId: log.providerId,
        location: log.location
          ? {
              lat: log.location.lat,
              lng: log.location.lng,
            }
          : undefined,
        timestamp: log.timestamp,
        flags: log.flags,
        riskScore: log.riskScore,
      }))
    } catch (error) {
      logger.error('Error getting fraud logs', { error, query })
      throw ErrorFactory.fromError(error, 'Failed to get fraud logs', {
        source: 'GetFraudLogsHandler.execute',
        metadata: query,
      })
    }
  }
}
