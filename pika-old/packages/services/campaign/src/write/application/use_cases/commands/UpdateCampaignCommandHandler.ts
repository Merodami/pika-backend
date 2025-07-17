import { type CampaignUpdateDTO } from '@campaign-write/domain/dtos/CampaignDTO.js'
import { Campaign } from '@campaign-write/domain/entities/Campaign.js'
import { type CampaignWriteRepositoryPort } from '@campaign-write/domain/port/campaign/CampaignWriteRepositoryPort.js'
import { type UserContext } from '@pika/http'
import { ErrorFactory, ProviderServiceClient } from '@pika/shared'
import { UserRole } from '@pika/types-core'

/**
 * Command handler for updating existing campaigns
 * Implements business logic, validation, provider ownership verification and orchestrates the process
 */
export class UpdateCampaignCommandHandler {
  constructor(
    private readonly repository: CampaignWriteRepositoryPort,
    private readonly providerService: ProviderServiceClient,
  ) {}

  /**
   * Executes the update campaign command
   * Following industry standards: validates permissions first, then ownership
   */
  async execute(
    campaignId: string,
    dto: CampaignUpdateDTO,
    context: UserContext,
  ): Promise<Campaign> {
    try {
      // 1. VALIDATION FIRST: Check if user has the right to update campaigns
      if (
        context.role !== UserRole.PROVIDER &&
        context.role !== UserRole.ADMIN
      ) {
        throw ErrorFactory.unauthorized(
          'Only providers and admins can update campaigns',
          {
            source: 'UpdateCampaignCommandHandler.execute',
            metadata: { role: context.role, campaignId },
            suggestion: 'Ensure the user has provider or admin privileges',
          },
        )
      }

      // 2. For providers, verify they own the campaign
      if (context.role === UserRole.PROVIDER) {
        // Look up provider by user ID
        const provider = await this.providerService.getProviderByUserId(
          context.userId,
          {
            serviceName: 'campaign-service',
            correlationId:
              context.correlationId || `update-campaign-${campaignId}`,
          },
        )

        if (!provider || !provider.active) {
          throw ErrorFactory.unauthorized('User is not an active provider', {
            source: 'UpdateCampaignCommandHandler.execute',
            metadata: { userId: context.userId, campaignId },
            suggestion: 'Ensure the user has an active provider account',
          })
        }

        // First get the existing campaign to verify ownership
        const existingCampaign = await this.repository.findById(campaignId)

        if (!existingCampaign) {
          throw ErrorFactory.resourceNotFound('Campaign', campaignId, {
            source: 'UpdateCampaignCommandHandler.execute',
            metadata: { campaignId, userId: context.userId },
          })
        }

        // Verify the provider owns this campaign
        if (existingCampaign.providerId !== provider.id) {
          throw ErrorFactory.forbidden('Provider does not own this campaign', {
            source: 'UpdateCampaignCommandHandler.execute',
            metadata: {
              campaignId,
              userId: context.userId,
              providerId: provider.id,
              campaignProviderId: existingCampaign.providerId,
            },
            suggestion: 'Providers can only update their own campaigns',
          })
        }

        // Update without changing ownership (never include providerId in updates)
        return await this.repository.updateCampaign(campaignId, dto)
      } else {
        // Admin can update any campaign
        return await this.repository.updateCampaign(campaignId, dto)
      }
    } catch (error) {
      // Re-throw known application errors without wrapping
      if (
        error.code === 'NOT_AUTHORIZED' ||
        error.name === 'NotAuthorizedError' ||
        error.code === 'RESOURCE_NOT_FOUND' ||
        error.name === 'ResourceNotFoundError'
      ) {
        throw error
      }

      throw ErrorFactory.fromError(error, 'Failed to update campaign', {
        source: 'UpdateCampaignCommandHandler.execute',
        suggestion: 'Check campaign data and provider authorization',
        metadata: {
          campaignId,
          userId: context.userId,
        },
      })
    }
  }
}
