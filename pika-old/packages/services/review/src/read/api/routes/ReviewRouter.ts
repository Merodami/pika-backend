import { schemas } from '@pika/api'
import { propertyTransformerHook } from '@pika/http'
import { ReviewController } from '@review-read/api/controllers/review/index.js'
import {
  GetAllReviewsHandler,
  GetReviewByIdHandler,
  GetReviewStatsHandler,
} from '@review-read/application/use_cases/queries/index.js'
import { ReviewReadRepositoryPort } from '@review-read/domain/port/review/ReviewReadRepositoryPort.js'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'

/**
 * Creates a Fastify router for review read endpoints
 *
 * @param reviewRepository - Repository for review data access
 * @returns Fastify plugin for review routes
 */
export function createReviewReadRouter(
  reviewRepository: ReviewReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize use case handlers
    const getAllReviewsHandler = new GetAllReviewsHandler(reviewRepository)
    const getReviewByIdHandler = new GetReviewByIdHandler(reviewRepository)
    const getReviewStatsHandler = new GetReviewStatsHandler(reviewRepository)

    // Initialize controller with the handlers
    const reviewController = new ReviewController(
      getAllReviewsHandler,
      getReviewByIdHandler,
      getReviewStatsHandler,
    )

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Route for retrieving all reviews with filtering and pagination
    fastify.get<{
      Querystring: schemas.ReviewSearchQuery
    }>(
      '/',
      {
        schema: {
          querystring: schemas.ReviewSearchQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Querystring: schemas.ReviewSearchQuery
        }>,
        reply,
      ) => {
        const result = await reviewController.getAllReviews(request)

        reply.code(200).send(result)
      },
    )

    // Route for retrieving reviews by provider
    fastify.get<{
      Params: { providerId: string }
      Querystring: schemas.ReviewSearchQuery
    }>(
      '/providers/:providerId',
      {
        schema: {
          params: {
            type: 'object',
            properties: {
              providerId: { type: 'string', format: 'uuid' },
            },
            required: ['providerId'],
          },
          querystring: schemas.ReviewSearchQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Params: { providerId: string }
          Querystring: schemas.ReviewSearchQuery
        }>,
        reply,
      ) => {
        const result = await reviewController.getReviewsByProvider(request)

        reply.code(200).send(result)
      },
    )

    // Route for retrieving reviews by customer
    fastify.get<{
      Params: { customerId: string }
      Querystring: schemas.ReviewSearchQuery
    }>(
      '/customers/:customerId',
      {
        schema: {
          params: {
            type: 'object',
            properties: {
              customerId: { type: 'string', format: 'uuid' },
            },
            required: ['customerId'],
          },
          querystring: schemas.ReviewSearchQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Params: { customerId: string }
          Querystring: schemas.ReviewSearchQuery
        }>,
        reply,
      ) => {
        const result = await reviewController.getReviewsByCustomer(request)

        reply.code(200).send(result)
      },
    )

    // Route for retrieving provider review statistics
    fastify.get<{
      Params: { providerId: string }
    }>(
      '/providers/:providerId/stats',
      {
        schema: {
          params: {
            type: 'object',
            properties: {
              providerId: { type: 'string', format: 'uuid' },
            },
            required: ['providerId'],
          },
        },
      },
      async (
        request: FastifyRequest<{
          Params: { providerId: string }
        }>,
        reply,
      ) => {
        const result = await reviewController.getProviderStats(request)

        reply.code(200).send(result)
      },
    )

    // Route for retrieving a specific review by ID
    fastify.get<{
      Params: { id: string }
      Querystring: {
        include_relations?: boolean
      }
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
          querystring: {
            type: 'object',
            properties: {
              include_relations: { type: 'boolean' },
            },
          },
        },
      },
      async (
        request: FastifyRequest<{
          Params: { id: string }
          Querystring: {
            include_relations?: boolean
          }
        }>,
        reply,
      ) => {
        const result = await reviewController.getReviewById(request)

        reply.code(200).send(result)
      },
    )
  }
}
