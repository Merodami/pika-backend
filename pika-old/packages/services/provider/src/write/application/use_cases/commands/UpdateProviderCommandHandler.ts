import { RequestContext, type UserContext } from '@pika/http'
import { ProviderDocument } from '@pika/sdk'
import { ErrorFactory, validateMultilingualContent } from '@pika/shared'
import { type MultilingualContent } from '@pika/types-core'
import { Provider } from '@provider-write/domain/entities/Provider.js'
import { type ProviderWriteRepositoryPort } from '@provider-write/domain/port/provider/ProviderWriteRepositoryPort.js'

/**
 * Command handler for updating existing providers
 * Implements business logic, validation, and orchestrates the process
 */
export class UpdateProviderCommandHandler {
  constructor(private readonly repository: ProviderWriteRepositoryPort) {}

  /**
   * Executes the update provider command
   * Validates input, applies business rules, and persists the updated provider
   * IMPORTANT: Following the authentication pattern - userId comes from headers
   */
  async execute(
    id: string,
    dto: Partial<ProviderDocument>,
    context: UserContext,
  ): Promise<Provider> {
    try {
      // STEP 1: Check if user is admin or owns the provider
      const isAdmin = RequestContext.isAdmin(context)

      if (!isAdmin) {
        // Non-admin users can only update their own provider profile
        const providerId = await this.repository.getProviderByUserId(
          context.userId,
        )

        if (!providerId || providerId !== id) {
          throw ErrorFactory.forbidden(
            'You can only update your own provider profile',
            {
              source: 'UpdateProviderCommandHandler.execute',
              metadata: { providerId: id, userId: context.userId },
            },
          )
        }
      }

      // STEP 2: Validate multilingual content if provided (but don't normalize - let domain merge handle it)
      const validatedDto: Partial<ProviderDocument> = { ...dto }

      if (dto.businessName !== undefined) {
        // Just validate without normalizing - the domain merge will handle preservation
        validateMultilingualContent(dto.businessName, 'businessName', {
          maxLength: 200,
          minLength: 2,
          requiredDefault: false, // Don't require all languages in updates
        })
        validatedDto.businessName = dto.businessName as MultilingualContent
      }

      if (dto.businessDescription !== undefined) {
        // Just validate without normalizing - the domain merge will handle preservation
        validateMultilingualContent(
          dto.businessDescription,
          'businessDescription',
          {
            maxLength: 2000,
            requiredDefault: false,
            minLength: 0,
          },
        )
        validatedDto.businessDescription =
          dto.businessDescription as MultilingualContent
      }

      // STEP 3: Call repository to handle the update
      // The repository now handles fetching existing data, domain merging, and persistence
      return await this.repository.updateProvider(id, validatedDto)
    } catch (error) {
      // Handle specific known errors
      if (error.name === 'ResourceNotFoundError' || error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('Provider', id, {
          source: 'UpdateProviderCommandHandler.execute',
          suggestion: 'Check that the provider ID exists',
        })
      }

      if (
        error.name === 'ValidationError' ||
        error.name === 'ResourceConflictError'
      ) {
        // Ensure ValidationError has the proper HTTP status
        if (error.name === 'ValidationError' && !error.getHttpStatus) {
          error.httpStatus = 400
        }
        throw error
      }

      // Enhance other errors with more context
      throw ErrorFactory.fromError(error, 'Failed to update provider', {
        source: 'UpdateProviderCommandHandler.execute',
        suggestion: 'Check provider data and try again',
        metadata: {
          providerId: id,
          updatedFields: Object.keys(dto),
        },
      })
    }
  }
}
