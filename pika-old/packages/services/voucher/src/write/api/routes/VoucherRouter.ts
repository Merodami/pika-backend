import fastifyMultipart from '@fastify/multipart'
import { schemas } from '@pika/api'
import { propertyTransformerHook, requireServiceAuth } from '@pika/http'
import { FileStoragePort, logger } from '@pika/shared'
import { VoucherController } from '@voucher-write/api/controllers/voucher/VoucherController.js'
import { CreateVoucherCommandHandler } from '@voucher-write/application/use_cases/commands/CreateVoucherCommandHandler.js'
import { DeleteVoucherCommandHandler } from '@voucher-write/application/use_cases/commands/DeleteVoucherCommandHandler.js'
import { ExpireVoucherCommandHandler } from '@voucher-write/application/use_cases/commands/ExpireVoucherCommandHandler.js'
import { PublishVoucherCommandHandler } from '@voucher-write/application/use_cases/commands/PublishVoucherCommandHandler.js'
import { RedeemVoucherCommandHandler } from '@voucher-write/application/use_cases/commands/RedeemVoucherCommandHandler.js'
import { UpdateVoucherCommandHandler } from '@voucher-write/application/use_cases/commands/UpdateVoucherCommandHandler.js'
import { UpdateVoucherStateCommandHandler } from '@voucher-write/application/use_cases/commands/UpdateVoucherStateCommandHandler.js'
import { VoucherWriteRepositoryPort } from '@voucher-write/domain/port/voucher/VoucherWriteRepositoryPort.js'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

// Note: Authentication is handled at the API Gateway level
// Services receive x-user-id, x-user-email, and x-user-role headers from the gateway
// Authorization logic is implemented in the use case handlers

/**
 * Creates a Fastify router for voucher write endpoints
 *
 * @param voucherRepository - Repository for voucher write operations
 * @param fileStorage - Storage service for handling file uploads
 * @returns Fastify plugin for voucher write routes
 */
export function createVoucherWriteRouter(
  voucherRepository: VoucherWriteRepositoryPort,
  fileStorage: FileStoragePort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Check if multipart is already registered to avoid duplicate registration
    if (!fastify.hasContentTypeParser('multipart/form-data')) {
      // Register multipart plugin for file uploads
      fastify.register(fastifyMultipart, {
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB
          files: 1, // Maximum one file per request
          fields: 10, // Maximum fields in the request
        },
      })

      logger.info('Registered multipart handler for file uploads')
    } else {
      logger.info('Multipart handler already registered')
    }

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Initialize use case handlers
    const createHandler = new CreateVoucherCommandHandler(voucherRepository)
    const updateHandler = new UpdateVoucherCommandHandler(voucherRepository)
    const deleteHandler = new DeleteVoucherCommandHandler(voucherRepository)
    const publishHandler = new PublishVoucherCommandHandler(voucherRepository)
    const expireHandler = new ExpireVoucherCommandHandler(voucherRepository)
    const redeemHandler = new RedeemVoucherCommandHandler(voucherRepository)
    const updateStateHandler = new UpdateVoucherStateCommandHandler(
      voucherRepository,
    )

    // Initialize controller with the handlers and file storage
    const voucherController = new VoucherController(
      createHandler,
      updateHandler,
      deleteHandler,
      publishHandler,
      expireHandler,
      redeemHandler,
      updateStateHandler,
      fileStorage,
    )

    // Route for creating a voucher
    fastify.post<{
      Body: schemas.VoucherCreate
    }>(
      '/',
      {
        schema: {
          body: schemas.VoucherCreateSchema,
        },
      },
      async (request, reply) => {
        await voucherController.create(request, reply)
      },
    )

    // Route for updating a voucher
    fastify.patch<{
      Params: { voucher_id: string }
      Body: schemas.VoucherUpdate
    }>(
      '/:voucher_id',
      {
        schema: {
          params: schemas.VoucherIdSchema,
          body: schemas.VoucherUpdateSchema,
        },
      },
      async (request, reply) => {
        await voucherController.update(request, reply)
      },
    )

    // Route for deleting a voucher
    fastify.delete<{
      Params: { voucher_id: string }
    }>(
      '/:voucher_id',
      {
        schema: {
          params: schemas.VoucherIdSchema,
        },
      },
      async (request, reply) => {
        await voucherController.delete(request, reply)
      },
    )

    // Route for uploading a voucher image
    fastify.post<{
      Params: { voucher_id: string }
    }>(
      '/:voucher_id/image',
      {
        schema: {
          params: schemas.VoucherIdSchema,
        },
      },
      async (request, reply) => {
        await voucherController.uploadImage(request, reply)
      },
    )

    // Route for publishing a voucher
    fastify.post<{
      Params: { voucher_id: string }
    }>(
      '/:voucher_id/publish',
      {
        schema: {
          params: schemas.VoucherIdSchema,
        },
      },
      async (request, reply) => {
        await voucherController.publish(request, reply)
      },
    )

    // Route for expiring a voucher
    fastify.post<{
      Params: { voucher_id: string }
    }>(
      '/:voucher_id/expire',
      {
        schema: {
          params: schemas.VoucherIdSchema,
        },
      },
      async (request, reply) => {
        await voucherController.expire(request, reply)
      },
    )

    // Route for redeeming a voucher
    fastify.post<{
      Params: { voucher_id: string }
      Body: schemas.VoucherRedeem
    }>(
      '/:voucher_id/redeem',
      {
        schema: {
          params: schemas.VoucherIdSchema,
          body: schemas.VoucherRedeemSchema,
        },
      },
      async (request, reply) => {
        await voucherController.redeem(request, reply)
      },
    )

    // Route for updating voucher state (inter-service communication)
    fastify.put<{
      Params: { voucher_id: string }
      Body: {
        state: string
        redeemedAt?: string
        redeemedBy?: string
        location?: {
          lat: number
          lng: number
          address?: string
        }
      }
    }>(
      '/:voucher_id/state',
      {
        preHandler: requireServiceAuth(),
        schema: {
          params: schemas.VoucherIdSchema,
          body: {
            type: 'object',
            required: ['state'],
            properties: {
              state: { type: 'string' },
              redeemed_at: { type: 'string' },
              redeemed_by: { type: 'string' },
              location: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' },
                  address: { type: 'string' },
                },
              },
            },
          },
        },
      },
      async (request, reply) => {
        await voucherController.updateState(request, reply)
      },
    )
  }
}
