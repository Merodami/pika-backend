import { CreateCampaignCommandHandler } from '@campaign-write/application/use_cases/commands/CreateCampaignCommandHandler.js'
import { DeleteCampaignCommandHandler } from '@campaign-write/application/use_cases/commands/DeleteCampaignCommandHandler.js'
import { UpdateCampaignCommandHandler } from '@campaign-write/application/use_cases/commands/UpdateCampaignCommandHandler.js'
import {
  type CampaignCreateDTO,
  type CampaignUpdateDTO,
} from '@campaign-write/domain/dtos/CampaignDTO.js'
import { schemas } from '@pika/api'
import { RequestContext } from '@pika/http'
import { CampaignDomain, CampaignMapper } from '@pika/sdk'
import {
  ErrorFactory,
  ErrorSeverity,
  FileStoragePort,
  logger,
} from '@pika/shared'
import { type FastifyReply, type FastifyRequest } from 'fastify'

/**
 * Controller for Campaign write operations
 * Handles HTTP requests, delegates to command handlers, and handles responses
 * Follows the authentication context resolution pattern where controllers stay thin
 * and use cases handle the business logic of user-to-entity mapping
 */
export class CampaignController {
  constructor(
    private readonly createHandler: CreateCampaignCommandHandler,
    private readonly updateHandler: UpdateCampaignCommandHandler,
    private readonly deleteHandler: DeleteCampaignCommandHandler,
    private readonly fileStorage: FileStoragePort,
  ) {}

  /**
   * Create a new campaign
   * POST /campaigns
   *
   * Follows the industry standard RequestContext pattern:
   * - Controller extracts full user context using RequestContext
   * - Passes context to command handler for proper validation order
   * - Validation happens before authorization checks
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    // Extract user context - MUST always be present after auth middleware
    const context = RequestContext.fromHeaders(request)

    try {
      const dto = request.body as CampaignCreateDTO

      logger.debug('Creating campaign:', {
        userId: context.userId,
        role: context.role,
        campaignName: dto.name,
      })

      // Delegate to use case with full context
      const campaign = await this.createHandler.execute(dto, context)

      // Map domain entity to DTO format using SDK mapper with proper typing
      const campaignDomain = campaign.toObject() as CampaignDomain
      const responseDTO = CampaignMapper.toDTO(campaignDomain)

      logger.debug('Campaign created successfully:', {
        campaignId: campaign.id,
        userId: context.userId,
        providerId: campaign.providerId,
      })

      reply.code(201).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error creating campaign:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: context.userId,
        correlationId: request.id,
      })

      // Handle specific authentication and authorization errors
      if (
        error.code === 'NOT_AUTHORIZED' ||
        error.name === 'NotAuthorizedError'
      ) {
        reply.code(403)
        throw error
      }

      // Handle validation errors
      if (error.code === 'VALIDATION_ERROR') {
        reply.code(400)
        throw error
      }

      // Handle business rule violations
      if (error.code === 'BUSINESS_RULE_VIOLATION') {
        reply.code(400)
        throw error
      }

      // Handle unique constraint violations
      if (error.code === 'UNIQUE_CONSTRAINT_VIOLATION') {
        reply.code(409)
        throw error
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to create campaign', {
        source: 'CampaignController.create',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          requestBody:
            typeof request.body === 'object'
              ? Object.keys(request.body || {})
              : typeof request.body,
        },
        suggestion: 'Please check your input and provider authorization',
      })
    }
  }

  /**
   * Update an existing campaign
   * PATCH /campaigns/{campaign_id}
   *
   * Follows the industry standard RequestContext pattern:
   * - Controller extracts full user context
   * - Use case handles validation before authorization
   */
  async update(
    request: FastifyRequest<{
      Params: schemas.CampaignId
    }>,
    reply: FastifyReply,
  ) {
    // Extract user context - MUST always be present after auth middleware
    const context = RequestContext.fromHeaders(request)

    try {
      const { campaign_id } = request.params
      const dto = request.body as CampaignUpdateDTO

      // Validate that the request contains at least one field to update
      if (Object.keys(dto).length === 0) {
        throw ErrorFactory.validationError(
          { _: ['No update fields provided'] },
          {
            source: 'CampaignController.update',
            suggestion: 'Provide at least one field to update',
            correlationId: request.id,
          },
        )
      }

      logger.debug('Updating campaign:', {
        campaignId: campaign_id,
        userId: context.userId,
        role: context.role,
        updates: Object.keys(dto),
      })

      // Delegate to use case with full context
      const campaign = await this.updateHandler.execute(
        campaign_id,
        dto,
        context,
      )

      // Map domain entity to DTO format using SDK mapper with proper typing
      const campaignDomain = campaign.toObject() as CampaignDomain
      const responseDTO = CampaignMapper.toDTO(campaignDomain)

      logger.debug('Campaign updated successfully:', {
        campaignId: campaign.id,
        userId: context.userId,
        providerId: campaign.providerId,
      })

      // Send response in the API schema format (snake_case)
      reply.code(200).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error updating campaign:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        campaignId: request.params.campaign_id,
        userId: context.userId,
        correlationId: request.id,
      })

      // Handle specific authentication and authorization errors
      if (
        error.code === 'NOT_AUTHORIZED' ||
        error.name === 'NotAuthorizedError'
      ) {
        reply.code(403)
        throw error
      }

      // Handle not found errors
      if (
        error.code === 'RESOURCE_NOT_FOUND' ||
        error.name === 'ResourceNotFoundError'
      ) {
        reply.code(404)
        throw error
      }

      // Handle validation errors
      if (error.code === 'VALIDATION_ERROR') {
        reply.code(400)
        throw error
      }

      // Handle business rule violations
      if (error.code === 'BUSINESS_RULE_VIOLATION') {
        reply.code(400)
        throw error
      }

      // Handle unique constraint violations
      if (error.code === 'UNIQUE_CONSTRAINT_VIOLATION') {
        reply.code(409)
        throw error
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to update campaign', {
        source: 'CampaignController.update',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          campaignId: request.params.campaign_id,
          requestBody:
            typeof request.body === 'object'
              ? Object.keys(request.body || {})
              : typeof request.body,
          userId: context.userId,
        },
        suggestion: 'Check campaign ownership and update data',
      })
    }
  }

  /**
   * Delete a campaign
   * DELETE /campaigns/{campaign_id}
   *
   * Follows the industry standard RequestContext pattern:
   * - Controller extracts full user context
   * - Use case handles validation before authorization
   */
  async delete(
    request: FastifyRequest<{
      Params: schemas.CampaignId
    }>,
    reply: FastifyReply,
  ) {
    // Extract user context - MUST always be present after auth middleware
    const context = RequestContext.fromHeaders(request)

    try {
      const { campaign_id } = request.params

      logger.debug('Deleting campaign:', {
        campaignId: campaign_id,
        userId: context.userId,
        role: context.role,
      })

      // Delegate to use case with full context
      await this.deleteHandler.execute(campaign_id, context)

      logger.debug('Campaign deleted successfully:', {
        campaignId: campaign_id,
        userId: context.userId,
      })

      // Return 204 No Content for successful deletion
      reply.code(204).send()
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error deleting campaign:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        campaignId: request.params.campaign_id,
        userId: context.userId,
      })

      // Handle specific authentication and authorization errors
      if (
        error.code === 'NOT_AUTHORIZED' ||
        error.name === 'NotAuthorizedError'
      ) {
        reply.code(403)
        throw error
      }

      // Handle not found errors
      if (
        error.code === 'RESOURCE_NOT_FOUND' ||
        error.name === 'ResourceNotFoundError'
      ) {
        reply.code(404)
        throw error
      }

      // Handle business rule violations
      if (error.code === 'BUSINESS_RULE_VIOLATION') {
        reply.code(400)
        throw error
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to delete campaign', {
        source: 'CampaignController.delete',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          campaignId: request.params.campaign_id,
          userId: context.userId,
        },
        suggestion: 'Check campaign ownership and deletion constraints',
      })
    }
  }
}
