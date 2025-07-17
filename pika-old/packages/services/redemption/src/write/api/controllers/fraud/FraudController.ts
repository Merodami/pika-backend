import type { schemas } from '@pika/api'
import { RequestContext } from '@pika/http'
import { ErrorFactory, logger } from '@pika/shared'
import type { ReviewFraudCaseCommandHandler } from '@redemption-write/application/use_cases/commands/index.js'
import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Controller for fraud write operations
 */
export class FraudController {
  constructor(
    private readonly reviewFraudCaseHandler: ReviewFraudCaseCommandHandler,
  ) {
    this.reviewFraudCase = this.reviewFraudCase.bind(this)
  }

  /**
   * Review fraud case
   */
  async reviewFraudCase(
    request: FastifyRequest<{
      Params: { id: string }
      Body: schemas.ReviewFraudCaseDTO
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params
      const context = RequestContext.fromHeaders(request)
      const dto = request.body

      logger.info('Reviewing fraud case', {
        id,
        reviewerId: context.userId,
        status: dto.status,
      })

      // Access control should be handled in the use case layer
      // to maintain clean architecture separation

      const result = await this.reviewFraudCaseHandler.execute(
        id,
        context.userId,
        {
          status: dto.status as any,
          notes: dto.notes,
          actions: dto.actions?.map((a) => ({
            type: a.type as any,
            details: a.details,
          })),
        },
        context.role,
      )

      // Map to DTO with snake_case
      reply.code(200).send({
        id: result.id,
        case_number: result.caseNumber,
        redemption_id: result.redemptionId,
        detected_at: result.detectedAt.toISOString(),
        risk_score: result.riskScore,
        flags: result.flags,
        customer_id: result.customerId,
        provider_id: result.providerId,
        voucher_id: result.voucherId,
        status: result.status,
        reviewed_at: result.reviewedAt?.toISOString(),
        reviewed_by: result.reviewedBy,
        review_notes: result.reviewNotes,
        actions_taken: result.actionsTaken,
        created_at: result.createdAt.toISOString(),
        updated_at: result.updatedAt.toISOString(),
      })
    } catch (error: any) {
      logger.error('Error reviewing fraud case', {
        error: error.message,
        stack: error.stack,
        context: error.context,
      })
      throw ErrorFactory.fromError(error, 'Failed to review fraud case', {
        source: 'FraudController.reviewFraudCase',
        correlationId: request.id,
      })
    }
  }
}
