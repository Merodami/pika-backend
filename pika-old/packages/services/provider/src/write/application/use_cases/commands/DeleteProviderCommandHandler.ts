import { RequestContext, type UserContext } from '@pika/http'
import { ErrorFactory } from '@pika/shared'
import { type ProviderWriteRepositoryPort } from '@provider-write/domain/port/provider/ProviderWriteRepositoryPort.js'

/**
 * Command handler for deleting providers (soft delete)
 * Implements business logic, validation, and orchestrates the process
 */
export class DeleteProviderCommandHandler {
  constructor(private readonly repository: ProviderWriteRepositoryPort) {}

  /**
   * Executes the delete provider command (soft delete)
   * Validates input, applies business rules, and handles the deletion
   * IMPORTANT: Following the authentication pattern - userId comes from headers
   */
  async execute(id: string, context: UserContext): Promise<void> {
    // Validate UUID format
    this.validateId(id)

    try {
      // Check if user is admin or owns the provider
      const isAdmin = RequestContext.isAdmin(context)

      if (!isAdmin) {
        // Non-admin users can only delete their own provider profile
        const providerId = await this.repository.getProviderByUserId(
          context.userId,
        )

        if (!providerId || providerId !== id) {
          throw ErrorFactory.forbidden(
            'You can only delete your own provider profile',
            {
              source: 'DeleteProviderCommandHandler.execute',
              metadata: { providerId: id, userId: context.userId },
            },
          )
        }
      }

      // Delegate to repository for soft deletion
      await this.repository.deleteProvider(id)
    } catch (error) {
      // Re-throw authorization errors
      if (error.name === 'NotAuthorizedError') {
        throw error
      }

      // Handle specific known errors
      if (error.name === 'ResourceNotFoundError') {
        throw ErrorFactory.resourceNotFound('Provider', id, {
          source: 'DeleteProviderCommandHandler.execute',
          suggestion: 'Check that the provider ID exists',
        })
      }

      // Handle database constraint errors that may come from the repository
      if (
        error.code === 'P2003' ||
        error.message?.includes('foreign key constraint') ||
        error.message?.includes('has active services')
      ) {
        throw ErrorFactory.validationError(
          {
            provider: ['Cannot delete provider with active services'],
          },
          {
            source: 'DeleteProviderCommandHandler.execute',
            suggestion:
              'Deactivate or remove all services before deleting provider profile',
            httpStatus: 400,
          },
        )
      }

      // Enhance other errors with more context
      throw ErrorFactory.fromError(error, 'Failed to delete provider', {
        source: 'DeleteProviderCommandHandler.execute',
        suggestion: 'Check if the provider has active services and try again',
        metadata: { providerId: id },
      })
    }
  }

  /**
   * Validates that a UUID is in the correct format
   */
  private validateId(id: string): void {
    if (!id) {
      throw ErrorFactory.validationError(
        { id: ['Provider ID is required'] },
        { source: 'DeleteProviderCommandHandler.validateId' },
      )
    }

    // Check UUID format using a regex
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!uuidPattern.test(id)) {
      throw ErrorFactory.validationError(
        { id: ['Invalid provider ID format'] },
        {
          source: 'DeleteProviderCommandHandler.validateId',
          suggestion: 'Provide a valid UUID',
        },
      )
    }
  }
}
