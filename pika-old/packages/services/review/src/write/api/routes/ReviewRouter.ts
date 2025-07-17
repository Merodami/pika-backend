import { schemas } from '@pika/api'
import { propertyTransformerHook } from '@pika/http'
import { logger } from '@pika/shared'
import { ReviewController } from '@review-write/api/controllers/review/ReviewController.js'
import { AddProviderResponseCommandHandler } from '@review-write/application/use_cases/commands/AddProviderResponseCommandHandler.js'
import { CreateReviewCommandHandler } from '@review-write/application/use_cases/commands/CreateReviewCommandHandler.js'
import { DeleteReviewCommandHandler } from '@review-write/application/use_cases/commands/DeleteReviewCommandHandler.js'
import { UpdateReviewCommandHandler } from '@review-write/application/use_cases/commands/UpdateReviewCommandHandler.js'
import { ReviewWriteRepositoryPort } from '@review-write/domain/port/review/ReviewWriteRepositoryPort.js'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

/**
 * Creates a Fastify router for review write endpoints
 *
 * @param reviewRepository - Repository for review write operations
 * @returns Fastify plugin for review write routes
 */
export function createReviewWriteRouter(
  reviewRepository: ReviewWriteRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Initialize use case handlers
    const createHandler = new CreateReviewCommandHandler(reviewRepository)
    const updateHandler = new UpdateReviewCommandHandler(reviewRepository)
    const deleteHandler = new DeleteReviewCommandHandler(reviewRepository)
    const addProviderResponseHandler = new AddProviderResponseCommandHandler(
      reviewRepository,
    )

    // Initialize controller with the handlers
    const reviewController = new ReviewController(
      createHandler,
      updateHandler,
      deleteHandler,
      addProviderResponseHandler,
    )

    // Route for creating a review
    fastify.post<{
      Body: schemas.ReviewCreate
    }>(
      '/',
      {
        schema: {
          body: schemas.ReviewCreateSchema,
        },
      },
      async (request, reply) => {
        await reviewController.create(request, reply)
      },
    )

    // Route for updating a review
    fastify.put<{
      Params: { id: string }
      Body: schemas.ReviewUpdate
    }>(
      '/:id',
      {
        schema: {
          params: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
            },
            required: ['id'],
          },
          body: schemas.ReviewUpdateSchema,
        },
      },
      async (request, reply) => {
        await reviewController.update(request, reply)
      },
    )

    // Route for deleting a review
    fastify.delete<{
      Params: { id: string }
    }>(
      '/:id',
      {
        schema: {
          params: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
            },
            required: ['id'],
          },
        },
      },
      async (request, reply) => {
        await reviewController.delete(request, reply)
      },
    )

    // Route for adding provider response
    fastify.post<{
      Params: { id: string }
      Body: schemas.ReviewResponseCreate
    }>(
      '/:id/response',
      {
        schema: {
          params: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
            },
            required: ['id'],
          },
          body: schemas.ReviewResponseCreateSchema,
        },
      },
      async (request, reply) => {
        await reviewController.addProviderResponse(request, reply)
      },
    )

    logger.info('Review write routes registered')
  }
}
