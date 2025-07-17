import { schemas } from '@pika/api'
import { RequestContext } from '@pika/http'
import { ProviderDocument, ProviderProfile } from '@pika/sdk'
import {
  ErrorFactory,
  ErrorSeverity,
  FileStoragePort,
  logger,
} from '@pika/shared'
import { CreateProviderCommandHandler } from '@provider-write/application/use_cases/commands/CreateProviderCommandHandler.js'
import { DeleteProviderCommandHandler } from '@provider-write/application/use_cases/commands/DeleteProviderCommandHandler.js'
import { UpdateProviderCommandHandler } from '@provider-write/application/use_cases/commands/UpdateProviderCommandHandler.js'
import { type ProviderCreateDTO } from '@provider-write/domain/dtos/ProviderDTO.js'
import { type FastifyReply, type FastifyRequest } from 'fastify'

/**
 * Controller for Provider write operations
 * Handles HTTP requests, delegates to command handlers, and handles responses
 */
export class ProviderController {
  constructor(
    private readonly createHandler: CreateProviderCommandHandler,
    private readonly updateHandler: UpdateProviderCommandHandler,
    private readonly deleteHandler: DeleteProviderCommandHandler,
    private readonly fileStorage: FileStoragePort,
  ) {}

  /**
   * Create a new provider
   * POST /providers
   */
  async createProvider(request: FastifyRequest, reply: FastifyReply) {
    try {
      const context = RequestContext.fromHeaders(request)

      if (!context.userId) {
        throw ErrorFactory.unauthorized('User ID not found in headers', {
          correlationId: request.id,
          source: 'ProviderController.createProvider',
          suggestion: 'Ensure you are authenticated',
        })
      }

      // Check if user has PROVIDER role
      if (context.role !== 'PROVIDER') {
        throw ErrorFactory.forbidden(
          'Only providers can create provider profiles',
          {
            correlationId: request.id,
            source: 'ProviderController.createProvider',
            suggestion:
              'You must have PROVIDER role to create a provider profile',
            metadata: { userRole: context.role },
          },
        )
      }

      const dto = request.body as ProviderCreateDTO

      const provider = await this.createHandler.execute(dto, context.userId)

      // Map domain entity to DTO format
      const responseDTO = this.toProviderProfile(provider)

      reply.code(201).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error creating provider:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
      })

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to create provider', {
        source: 'ProviderController.createProvider',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          requestBody:
            typeof request.body === 'object'
              ? Object.keys(request.body || {})
              : typeof request.body,
        },
        suggestion: 'Please check your input and try again',
      })
    }
  }

  /**
   * Update an existing provider
   * PATCH /providers/{provider_id}
   */
  async updateProvider(
    request: FastifyRequest<{
      Params: schemas.ProviderId
    }>,
    reply: FastifyReply,
  ) {
    try {
      const context = RequestContext.fromHeaders(request)

      const { provider_id } = request.params

      const dto = request.body as Partial<ProviderDocument>

      // Validate that the request contains at least one field to update
      if (Object.keys(dto).length === 0) {
        throw ErrorFactory.validationError(
          { _: ['No update fields provided'] },
          {
            source: 'ProviderController.updateProvider',
            suggestion: 'Provide at least one field to update',
          },
        )
      }

      // Execute the command and return the result (dto is already in domain format)
      const provider = await this.updateHandler.execute(
        provider_id,
        dto,
        context,
      )

      // Map domain entity to DTO format
      const responseDTO = this.toProviderProfile(provider)

      // Send response in the API schema format (snake_case)
      reply.code(200).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error updating provider:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError' || error.code === 'P2025') {
        const notFound = ErrorFactory.resourceNotFound(
          'Provider',
          request.params.provider_id,
          {
            source: 'ProviderController.updateProvider',
            httpStatus: 404,
            suggestion: 'Check that the provider ID exists',
          },
        )

        throw notFound
      }

      if (error.name === 'ResourceConflictError') {
        throw error // Pass through conflict errors
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to update provider', {
        source: 'ProviderController.updateProvider',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          providerId: request.params.provider_id,
          requestBody:
            typeof request.body === 'object'
              ? Object.keys(request.body || {})
              : typeof request.body,
        },
        suggestion: 'Please check your input and try again',
      })
    }
  }

  /**
   * Delete an existing provider
   * DELETE /providers/{provider_id}
   */
  async deleteProvider(
    request: FastifyRequest<{
      Params: schemas.ProviderId
    }>,
    reply: FastifyReply,
  ) {
    try {
      const context = RequestContext.fromHeaders(request)

      const { provider_id } = request.params

      // Execute the command
      await this.deleteHandler.execute(provider_id, context)

      // Return success with no content
      reply.code(204).send()
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error deleting provider:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError' || error.code === 'P2025') {
        const notFound = ErrorFactory.resourceNotFound(
          'Provider',
          request.params.provider_id,
          {
            source: 'ProviderController.deleteProvider',
            httpStatus: 404,
            suggestion: 'Check that the provider ID exists',
          },
        )

        throw notFound
      }

      // Special handling for constraint violations
      if (
        error.code === 'P2003' ||
        error.message?.includes('foreign key constraint') ||
        error.message?.includes('active services') ||
        error.name === 'BusinessRuleViolationError'
      ) {
        throw ErrorFactory.validationError(
          {
            provider: [
              'Cannot delete provider with active services or bookings',
            ],
          },
          {
            source: 'ProviderController.deleteProvider',
            httpStatus: 400,
            suggestion:
              'Remove all active services and complete all bookings first',
            metadata: { providerId: request.params.provider_id },
          },
        )
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to delete provider', {
        source: 'ProviderController.deleteProvider',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: { providerId: request.params.provider_id },
        suggestion: 'Check if the provider has dependencies and try again',
      })
    }
  }

  /**
   * Convert provider domain entity to API DTO format
   */
  private toProviderProfile(provider: any): ProviderProfile {
    const providerObj = provider.toObject()

    return {
      id: providerObj.id,
      user_id: providerObj.userId,
      business_name: providerObj.businessName,
      business_description: providerObj.businessDescription,
      category_id: providerObj.categoryId,
      verified: providerObj.verified,
      active: providerObj.active,
      avg_rating: providerObj.avgRating,
      created_at: providerObj.createdAt,
      updated_at: providerObj.updatedAt,
    }
  }

  /**
   * Convert API DTO format to domain format for updates
   */
  private fromProviderProfile(
    profile: Partial<ProviderProfile>,
  ): Partial<ProviderDocument> {
    const result: Partial<ProviderDocument> = {}

    if (profile.business_name !== undefined) {
      result.businessName = profile.business_name
    }
    if (profile.business_description !== undefined) {
      result.businessDescription = profile.business_description
    }
    if (profile.category_id !== undefined) {
      result.categoryId = profile.category_id
    }
    if (profile.verified !== undefined) {
      result.verified = profile.verified
    }
    if (profile.active !== undefined) {
      result.active = profile.active
    }
    if (profile.avg_rating !== undefined) {
      result.avgRating = profile.avg_rating
    }

    return result
  }
}
