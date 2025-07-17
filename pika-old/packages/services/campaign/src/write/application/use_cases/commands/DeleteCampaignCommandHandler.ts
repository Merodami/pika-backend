import { type CampaignWriteRepositoryPort } from '@campaign-write/domain/port/campaign/CampaignWriteRepositoryPort.js'
import { type UserContext } from '@pika/http'
import { ErrorFactory, ProviderServiceClient } from '@pika/shared'
import { UserRole } from '@pika/types-core'

/**
 * Command handler for deleting campaigns
 * Implements business logic, validation, provider ownership verification and orchestrates the process
 */
export class DeleteCampaignCommandHandler {
  constructor(
    private readonly repository: CampaignWriteRepositoryPort,
    private readonly providerService: ProviderServiceClient,
  ) {}

  /**
   * Executes the delete campaign command
   * Following industry standards: validates permissions first, then ownership
   */
  async execute(campaignId: string, context: UserContext): Promise<void> {
    try {
      // 1. VALIDATION FIRST: Check if user has the right to delete campaigns
      if (
        context.role !== UserRole.PROVIDER &&
        context.role !== UserRole.ADMIN
      ) {
        throw ErrorFactory.unauthorized(
          'Only providers and admins can delete campaigns',
          {
            source: 'DeleteCampaignCommandHandler.execute',
            metadata: { role: context.role, campaignId },
            suggestion: 'Ensure the user has provider or admin privileges',
          },
        )
      }

      // 2. First, check if campaign exists and get its details
      const campaign = await this.repository.findById(campaignId)

      if (!campaign) {
        throw ErrorFactory.resourceNotFound('Campaign', campaignId, {
          source: 'DeleteCampaignCommandHandler.execute',
          suggestion: 'Check that the campaign ID exists',
        })
      }

      // 3. For providers, verify they own the campaign
      if (context.role === UserRole.PROVIDER) {
        // Look up provider by user ID
        const provider = await this.providerService.getProviderByUserId(
          context.userId,
          {
            serviceName: 'campaign-service',
            correlationId:
              context.correlationId || `delete-campaign-${campaignId}`,
          },
        )

        if (!provider || !provider.active) {
          throw ErrorFactory.unauthorized('User is not an active provider', {
            source: 'DeleteCampaignCommandHandler.execute',
            metadata: { userId: context.userId, campaignId },
            suggestion: 'Ensure the user has an active provider account',
          })
        }

        // Verify ownership
        const campaignData = campaign.toObject()

        if (campaignData.providerId !== provider.id) {
          throw ErrorFactory.forbidden('Provider does not own this campaign', {
            source: 'DeleteCampaignCommandHandler.execute',
            metadata: {
              campaignId,
              providerId: provider.id,
              campaignProviderId: campaignData.providerId,
            },
            suggestion: 'Providers can only delete their own campaigns',
          })
        }
      }

      // 4. Execute deletion (admin can delete any, provider can delete own)
      await this.repository.deleteCampaign(campaignId)
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

      throw ErrorFactory.fromError(error, 'Failed to delete campaign', {
        source: 'DeleteCampaignCommandHandler.execute',
        suggestion: 'Check campaign ID and provider authorization',
        metadata: {
          campaignId,
          userId: context.userId,
        },
      })
    }
  }
}
