import { type CampaignCreateDTO } from '@campaign-write/domain/dtos/CampaignDTO.js'
import { Campaign } from '@campaign-write/domain/entities/Campaign.js'
import { type CampaignWriteRepositoryPort } from '@campaign-write/domain/port/campaign/CampaignWriteRepositoryPort.js'
import { DEFAULT_LANGUAGE } from '@pika/environment'
import { type UserContext } from '@pika/http'
import { CampaignMapper } from '@pika/sdk'
import { ErrorFactory, ProviderServiceClient } from '@pika/shared'
import { type MultilingualContent, UserRole } from '@pika/types-core'

/**
 * Command handler for creating new campaigns
 * Implements business logic, validation, provider verification and orchestrates the process
 */
export class CreateCampaignCommandHandler {
  constructor(
    private readonly repository: CampaignWriteRepositoryPort,
    private readonly providerService: ProviderServiceClient,
  ) {}

  /**
   * Executes the create campaign command
   * Following industry standards: validates input FIRST, then verifies authorization
   */
  async execute(
    dto: CampaignCreateDTO,
    context: UserContext,
  ): Promise<Campaign> {
    try {
      // 1. VALIDATION FIRST: Check if user has the right role
      if (
        context.role !== UserRole.PROVIDER &&
        context.role !== UserRole.ADMIN
      ) {
        throw ErrorFactory.unauthorized(
          'Only providers and admins can create campaigns',
          {
            source: 'CreateCampaignCommandHandler.execute',
            metadata: { role: context.role },
            suggestion: 'Ensure the user has provider or admin privileges',
          },
        )
      }

      // 2. For providers, look up their provider ID via inter-service communication
      let providerId: string

      if (context.role === UserRole.PROVIDER) {
        const provider = await this.providerService.getProviderByUserId(
          context.userId,
          {
            serviceName: 'campaign-service',
            correlationId:
              context.correlationId || `create-campaign-${Date.now()}`,
          },
        )

        if (!provider || !provider.active) {
          throw ErrorFactory.unauthorized('User is not an active provider', {
            source: 'CreateCampaignCommandHandler.execute',
            metadata: { userId: context.userId },
            suggestion: 'Ensure the user has an active provider account',
          })
        }

        providerId = provider.id
      } else {
        // Admin creating campaign - must provide providerId in DTO
        if (!dto.providerId) {
          throw ErrorFactory.validationError(
            {
              providerId: [
                'Provider ID is required when admin creates campaign',
              ],
            },
            {
              source: 'CreateCampaignCommandHandler.execute',
              suggestion: 'Provide providerId in the request body',
            },
          )
        }
        providerId = dto.providerId
      }

      // 3. Create campaign with the resolved provider ID
      const campaignData: CampaignCreateDTO = {
        ...dto,
        providerId,
      }

      // 4. Execute domain operation (repository will do additional validation)
      return await this.repository.createCampaign(campaignData)
    } catch (error) {
      // Re-throw known application errors without wrapping
      if (
        error.code === 'NOT_AUTHORIZED' ||
        error.name === 'NotAuthorizedError'
      ) {
        throw error
      }

      throw ErrorFactory.fromError(error, 'Failed to create campaign', {
        source: 'CreateCampaignCommandHandler.execute',
        suggestion: 'Check campaign data and provider authorization',
        metadata: {
          campaignName: CampaignMapper.getLocalizedValue(
            dto.name as MultilingualContent,
            DEFAULT_LANGUAGE,
          ),
          userId: context.userId,
        },
      })
    }
  }
}
