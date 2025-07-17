import { DEFAULT_LANGUAGE } from '@pika/environment'
import { ErrorFactory } from '@pika/shared'
import { type ProviderCreateDTO } from '@provider-write/domain/dtos/ProviderDTO.js'
import { Provider } from '@provider-write/domain/entities/Provider.js'
import { type ProviderWriteRepositoryPort } from '@provider-write/domain/port/provider/ProviderWriteRepositoryPort.js'
import { get } from 'lodash-es'

/**
 * Command handler for creating new providers
 * Implements business logic, validation, and orchestrates the process
 */
export class CreateProviderCommandHandler {
  constructor(private readonly repository: ProviderWriteRepositoryPort) {}

  /**
   * Executes the create provider command
   * Validates input, applies business rules, and persists the new provider
   * IMPORTANT: Following the authentication pattern - userId comes from headers
   */
  async execute(dto: ProviderCreateDTO, userId: string): Promise<Provider> {
    try {
      // Check if user already has a provider account
      const existingProviderId =
        await this.repository.getProviderByUserId(userId)

      if (existingProviderId) {
        throw ErrorFactory.resourceConflict(
          'Provider',
          'User already has a provider account',
          {
            source: 'CreateProviderCommandHandler.execute',
            suggestion: 'Use the update endpoint to modify existing provider',
            metadata: { userId, existingProviderId },
          },
        )
      }

      return await this.repository.createProvider(dto, userId)
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to create provider', {
        source: 'CreateProviderCommandHandler.execute',
        suggestion: 'Check provider data and try again',
        metadata: {
          businessName:
            get(dto.businessName, DEFAULT_LANGUAGE) ||
            dto.businessName.en ||
            '',
          categoryId: dto.categoryId,
        },
      })
    }
  }
}
