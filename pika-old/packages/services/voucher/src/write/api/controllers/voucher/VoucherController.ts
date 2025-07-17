import { schemas } from '@pika/api'
import { adaptFastifyMultipart, RequestContext } from '@pika/http'
import { VoucherDomain, VoucherMapper } from '@pika/sdk'
import {
  ErrorFactory,
  ErrorSeverity,
  FileStoragePort,
  logger,
} from '@pika/shared'
import { CreateVoucherCommandHandler } from '@voucher-write/application/use_cases/commands/CreateVoucherCommandHandler.js'
import { DeleteVoucherCommandHandler } from '@voucher-write/application/use_cases/commands/DeleteVoucherCommandHandler.js'
import { ExpireVoucherCommandHandler } from '@voucher-write/application/use_cases/commands/ExpireVoucherCommandHandler.js'
import { PublishVoucherCommandHandler } from '@voucher-write/application/use_cases/commands/PublishVoucherCommandHandler.js'
import { RedeemVoucherCommandHandler } from '@voucher-write/application/use_cases/commands/RedeemVoucherCommandHandler.js'
import { UpdateVoucherCommandHandler } from '@voucher-write/application/use_cases/commands/UpdateVoucherCommandHandler.js'
import { UpdateVoucherStateCommandHandler } from '@voucher-write/application/use_cases/commands/UpdateVoucherStateCommandHandler.js'
import {
  type VoucherCreateDTO,
  type VoucherRedeemDTO,
  type VoucherStateUpdateDTO,
  type VoucherUpdateDTO,
} from '@voucher-write/domain/dtos/VoucherDTO.js'
import { type FastifyReply, type FastifyRequest } from 'fastify'

/**
 * Controller for Voucher write operations
 * Handles HTTP requests, delegates to command handlers, and handles responses
 */
export class VoucherController {
  constructor(
    private readonly createHandler: CreateVoucherCommandHandler,
    private readonly updateHandler: UpdateVoucherCommandHandler,
    private readonly deleteHandler: DeleteVoucherCommandHandler,
    private readonly publishHandler: PublishVoucherCommandHandler,
    private readonly expireHandler: ExpireVoucherCommandHandler,
    private readonly redeemHandler: RedeemVoucherCommandHandler,
    private readonly updateStateHandler: UpdateVoucherStateCommandHandler,
    private readonly fileStorage: FileStoragePort,
  ) {}

  /**
   * Create a new voucher
   * POST /vouchers
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Extract user context using standard helper
      const context = RequestContext.fromHeaders(request)

      const dto = request.body as VoucherCreateDTO

      const voucher = await this.createHandler.execute(dto, context)

      // Map domain entity to DTO format using SDK mapper with proper typing
      const voucherDomain = voucher.toObject() as VoucherDomain
      const responseDTO = VoucherMapper.toDTO(voucherDomain)

      reply.code(201).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error creating voucher:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
      })

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to create voucher', {
        source: 'VoucherController.create',
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
   * Update an existing voucher
   * PATCH /vouchers/{voucher_id}
   */
  async update(
    request: FastifyRequest<{
      Params: schemas.VoucherId
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { voucher_id } = request.params

      // Extract user context
      const context = RequestContext.fromHeaders(request)

      const dto = request.body as VoucherUpdateDTO

      // Validate that the request contains at least one field to update
      if (Object.keys(dto).length === 0) {
        throw ErrorFactory.validationError(
          { _: ['No update fields provided'] },
          {
            source: 'VoucherController.update',
            suggestion: 'Provide at least one field to update',
          },
        )
      }

      // Execute the command and return the result
      const voucher = await this.updateHandler.execute(voucher_id, dto, context)

      // Map domain entity to DTO format using SDK mapper with proper typing
      const voucherDomain = voucher.toObject() as VoucherDomain
      const responseDTO = VoucherMapper.toDTO(voucherDomain)

      // Send response in the API schema format (snake_case)
      reply.code(200).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error updating voucher:', {
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
          'Voucher',
          request.params.voucher_id,
          {
            source: 'VoucherController.update',
            httpStatus: 404,
            suggestion: 'Check that the voucher ID exists',
          },
        )

        throw notFound
      }

      if (error.name === 'ResourceConflictError') {
        throw error // Pass through conflict errors
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to update voucher', {
        source: 'VoucherController.update',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          voucherId: request.params.voucher_id,
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
   * Delete an existing voucher
   * DELETE /vouchers/{voucher_id}
   */
  async delete(
    request: FastifyRequest<{
      Params: schemas.VoucherId
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { voucher_id } = request.params

      // Extract user context
      const context = RequestContext.fromHeaders(request)

      // Execute the command
      await this.deleteHandler.execute(voucher_id, context)

      // Return success with no content
      reply.code(204).send()
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error deleting voucher:', {
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
          'Voucher',
          request.params.voucher_id,
          {
            source: 'VoucherController.delete',
            httpStatus: 404,
            suggestion: 'Check that the voucher ID exists',
          },
        )

        throw notFound
      }

      // Special handling for constraint violations
      if (
        error.code === 'P2003' ||
        error.message?.includes('foreign key constraint') ||
        error.message?.includes('active redemptions') ||
        error.name === 'BusinessRuleViolationError'
      ) {
        throw ErrorFactory.validationError(
          {
            voucher: [
              'Cannot delete voucher with active redemptions or claims',
            ],
          },
          {
            source: 'VoucherController.delete',
            httpStatus: 400,
            suggestion: 'Expire the voucher instead of deleting it',
            metadata: { voucherId: request.params.voucher_id },
          },
        )
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to delete voucher', {
        source: 'VoucherController.delete',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: { voucherId: request.params.voucher_id },
        suggestion: 'Check if the voucher has dependencies and try again',
      })
    }
  }

  /**
   * Upload image for an existing voucher
   * POST /vouchers/{voucher_id}/image
   */
  async uploadImage(
    request: FastifyRequest<{
      Params: schemas.VoucherId
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { voucher_id } = request.params

      // Extract user context
      const context = RequestContext.fromHeaders(request)

      // Get the image file from the request
      const data = await request.file()

      if (!data) {
        throw ErrorFactory.validationError(
          { image: ['No file provided'] },
          {
            source: 'VoucherController.uploadImage',
            suggestion: 'Please provide an image file to upload',
          },
        )
      }

      // Upload the image file
      try {
        const result = await this.fileStorage.saveFile(
          adaptFastifyMultipart(data),
          'voucher-images',
        )

        logger.info('Voucher image uploaded successfully', {
          voucherId: voucher_id,
          filename: data.filename,
          url: result.url,
          size: result.size,
        })

        // Update the voucher with the new image URL
        const updatedVoucher = await this.updateHandler.execute(
          voucher_id,
          {
            imageUrl: result.url,
          },
          context,
        )

        // Map domain entity to DTO format using SDK mapper with proper typing
        const voucherDomain = updatedVoucher.toObject() as VoucherDomain
        const responseDTO = VoucherMapper.toDTO(voucherDomain)

        reply.code(200).send(responseDTO)
      } catch (uploadError) {
        logger.error('Failed to upload voucher image:', uploadError)
        throw ErrorFactory.fromError(
          uploadError,
          'Failed to upload voucher image',
          {
            source: 'VoucherController.uploadImage',
            suggestion: 'Check file format and size, then try again',
            metadata: {
              voucherId: voucher_id,
              filename: data.filename,
              mimetype: data.mimetype,
            },
          },
        )
      }
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error uploading voucher image:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError') {
        throw error // Pass through not found errors
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to upload voucher image', {
        source: 'VoucherController.uploadImage',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: { voucherId: request.params.voucher_id },
        suggestion: 'Please check your file and try again',
      })
    }
  }

  /**
   * Publish a voucher
   * POST /vouchers/{voucher_id}/publish
   */
  async publish(
    request: FastifyRequest<{
      Params: schemas.VoucherId
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { voucher_id } = request.params

      // Extract user context
      const context = RequestContext.fromHeaders(request)

      const voucher = await this.publishHandler.execute(voucher_id, context)

      // Map domain entity to DTO format using SDK mapper with proper typing
      const voucherDomain = voucher.toObject() as VoucherDomain
      const responseDTO = VoucherMapper.toDTO(voucherDomain)

      reply.code(200).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error publishing voucher:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError') {
        throw error // Pass through not found errors
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to publish voucher', {
        source: 'VoucherController.publish',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: { voucherId: request.params.voucher_id },
        suggestion: 'Check voucher state and try again',
      })
    }
  }

  /**
   * Expire a voucher
   * POST /vouchers/{voucher_id}/expire
   */
  async expire(
    request: FastifyRequest<{
      Params: schemas.VoucherId
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { voucher_id } = request.params

      // Extract user context
      const context = RequestContext.fromHeaders(request)

      const voucher = await this.expireHandler.execute(voucher_id, context)

      // Map domain entity to DTO format using SDK mapper with proper typing
      const voucherDomain = voucher.toObject() as VoucherDomain
      const responseDTO = VoucherMapper.toDTO(voucherDomain)

      reply.code(200).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error expiring voucher:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError') {
        throw error // Pass through not found errors
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to expire voucher', {
        source: 'VoucherController.expire',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: { voucherId: request.params.voucher_id },
        suggestion: 'Check voucher ID and permissions',
      })
    }
  }

  /**
   * Redeem a voucher
   * POST /vouchers/{voucher_id}/redeem
   */
  async redeem(
    request: FastifyRequest<{
      Params: schemas.VoucherId
      Body: schemas.VoucherRedeem
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { voucher_id } = request.params
      const { location } = request.body

      // Extract user context using standard helper
      const context = RequestContext.fromHeaders(request)

      const dto: VoucherRedeemDTO = {
        voucherId: voucher_id,
        userId: context.userId,
        location,
      }

      const voucher = await this.redeemHandler.execute(dto, context)

      // Map domain entity to DTO format using SDK mapper with proper typing
      const voucherDomain = voucher.toObject() as VoucherDomain
      const responseDTO = VoucherMapper.toDTO(voucherDomain)

      // Return success response with discount details
      reply.code(200).send({
        message: 'Voucher redeemed successfully',
        voucher_id: voucher_id,
        redeemed_at: new Date().toISOString(),
        discount_applied: responseDTO.discount_value,
        voucher: responseDTO,
      })
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error redeeming voucher:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
        userId: request.headers['x-user-id'],
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError') {
        throw error // Pass through not found errors
      }

      if (error.name === 'ConflictError') {
        throw error // Pass through conflict errors (already redeemed)
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to redeem voucher', {
        source: 'VoucherController.redeem',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          voucherId: request.params.voucher_id,
          hasCode: !!request.body.code,
          hasLocation: !!request.body.location,
        },
        suggestion: 'Check voucher validity and redemption eligibility',
      })
    }
  }

  /**
   * Update voucher state (inter-service call)
   * PUT /vouchers/{voucher_id}/state
   */
  async updateState(
    request: FastifyRequest<{
      Params: schemas.VoucherId
      Body: VoucherStateUpdateDTO
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { voucher_id } = request.params
      const dto = request.body

      // Extract service context from headers
      const context = {
        serviceName: request.headers['x-service-name'] as string,
        correlationId: request.headers['x-correlation-id'] as string,
        useServiceAuth: true,
      }

      logger.debug('Updating voucher state via inter-service call', {
        voucherId: voucher_id,
        newState: dto.state,
        source: context.serviceName,
      })

      const voucher = await this.updateStateHandler.execute(
        voucher_id,
        dto,
        context,
      )

      // Map domain entity to DTO format using SDK mapper with proper typing
      const voucherDomain = voucher.toObject() as VoucherDomain
      const responseDTO = VoucherMapper.toDTO(voucherDomain)

      reply.code(200).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error updating voucher state:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
        serviceName: request.headers['x-service-name'],
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError') {
        throw error // Pass through not found errors
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to update voucher state', {
        source: 'VoucherController.updateState',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          voucherId: request.params.voucher_id,
          newState: request.body?.state,
          serviceName: request.headers['x-service-name'],
        },
        suggestion: 'Check voucher ID and state transition validity',
      })
    }
  }
}
