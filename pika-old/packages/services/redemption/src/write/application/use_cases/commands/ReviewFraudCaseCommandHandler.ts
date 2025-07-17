import { ErrorFactory, logger, ProviderServiceClient } from '@pika/shared'
import { UserRole } from '@pika/types-core'

import type { ReviewFraudCaseDTO } from '../../../domain/dtos/FraudCaseDTO.js'
import type { FraudCase } from '../../../domain/entities/FraudCase.js'
import type { FraudCaseRepositoryPort } from '../../../domain/port/fraud/FraudCaseRepositoryPort.js'

/**
 * Command handler for reviewing fraud cases
 */
export class ReviewFraudCaseCommandHandler {
  constructor(
    private readonly fraudCaseRepository: FraudCaseRepositoryPort,
    private readonly providerService: ProviderServiceClient,
  ) {}

  /**
   * Review a fraud case
   */
  async execute(
    caseId: string,
    reviewerId: string,
    dto: ReviewFraudCaseDTO,
    userRole?: UserRole,
  ): Promise<FraudCase> {
    logger.debug('Reviewing fraud case', {
      caseId,
      reviewerId,
      status: dto.status,
      userRole,
    })

    try {
      // Get the fraud case
      const fraudCase = await this.fraudCaseRepository.getCaseById(caseId)

      if (!fraudCase) {
        throw ErrorFactory.resourceNotFound('FraudCase', caseId, {
          source: 'ReviewFraudCaseCommandHandler.execute',
        })
      }

      // Check provider access if user is a provider
      if (userRole === UserRole.PROVIDER) {
        const provider =
          await this.providerService.getProviderByUserId(reviewerId)

        if (!provider) {
          throw ErrorFactory.businessRuleViolation(
            'ACCESS_DENIED',
            'Provider not found for this user',
            {
              source: 'ReviewFraudCaseCommandHandler.execute',
            },
          )
        }

        if (fraudCase.providerId !== provider.id) {
          throw ErrorFactory.businessRuleViolation(
            'ACCESS_DENIED',
            'You can only review fraud cases for your own business',
            {
              source: 'ReviewFraudCaseCommandHandler.execute',
              metadata: {
                caseProviderId: fraudCase.providerId,
                userProviderId: provider.id,
              },
            },
          )
        }
      }

      // Check if case can be reviewed
      if (!fraudCase.isPending()) {
        throw ErrorFactory.businessRuleViolation(
          'CASE_NOT_PENDING',
          'Only pending cases can be reviewed',
          {
            source: 'ReviewFraudCaseCommandHandler.execute',
            metadata: {
              caseId,
              currentStatus: fraudCase.status,
            },
          },
        )
      }

      // Map actions to include timestamps and reviewer
      const actions = dto.actions?.map((action) => ({
        ...action,
        timestamp: new Date(),
        performedBy: reviewerId,
      }))

      // Review the case
      fraudCase.review(dto.status, reviewerId, dto.notes, actions)

      // Update in database
      const updatedCase = await this.fraudCaseRepository.updateCase(fraudCase)

      // Add history entry
      await this.fraudCaseRepository.addHistoryEntry(
        caseId,
        'case_reviewed',
        reviewerId,
        dto.notes,
        {
          previousStatus: fraudCase.status,
          newStatus: dto.status,
          actionsCount: actions?.length || 0,
        },
      )

      logger.info('Fraud case reviewed', {
        caseId: updatedCase.id,
        caseNumber: updatedCase.caseNumber,
        status: updatedCase.status,
        reviewerId,
      })

      return updatedCase
    } catch (error) {
      logger.error('Error reviewing fraud case', { error, caseId, dto })
      throw error
    }
  }
}
