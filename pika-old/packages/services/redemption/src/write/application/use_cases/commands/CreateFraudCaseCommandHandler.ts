import { logger } from '@pika/shared'

import type { CreateFraudCaseDTO } from '../../../domain/dtos/FraudCaseDTO.js'
import type { FraudCase } from '../../../domain/entities/FraudCase.js'
import type { FraudCaseRepositoryPort } from '../../../domain/port/fraud/FraudCaseRepositoryPort.js'

/**
 * Command handler for creating fraud cases
 */
export class CreateFraudCaseCommandHandler {
  constructor(private readonly fraudCaseRepository: FraudCaseRepositoryPort) {}

  /**
   * Create a new fraud case
   */
  async execute(dto: CreateFraudCaseDTO): Promise<FraudCase> {
    logger.debug('Creating fraud case', {
      redemptionId: dto.redemptionId,
      riskScore: dto.riskScore,
      flagCount: dto.flags.length,
    })

    try {
      // Check if case already exists for this redemption
      const existingCase = await this.fraudCaseRepository.getCaseByRedemptionId(
        dto.redemptionId,
      )

      if (existingCase) {
        logger.warn('Fraud case already exists for redemption', {
          redemptionId: dto.redemptionId,
          caseId: existingCase.id,
        })

        return existingCase
      }

      // Create new fraud case
      const fraudCase = await this.fraudCaseRepository.createCase(dto)

      logger.info('Fraud case created', {
        caseId: fraudCase.id,
        caseNumber: fraudCase.caseNumber,
        riskScore: fraudCase.riskScore,
        isUrgent: fraudCase.isUrgent(),
      })

      return fraudCase
    } catch (error) {
      logger.error('Error creating fraud case', { error, dto })
      throw error
    }
  }
}
