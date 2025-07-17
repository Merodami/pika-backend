import { CategoryController } from '@category-read/api/controllers/category/index.js'
import {
  GetAllCategoriesHandler,
  GetCategoryByIdHandler,
} from '@category-read/application/use_cases/queries/index.js'
import { CategoryReadRepositoryPort } from '@category-read/domain/port/category/CategoryReadRepositoryPort.js'
import { schemas } from '@pika/api'
import { getPreferredLanguage, propertyTransformerHook } from '@pika/http'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'

/**
 * Creates a Fastify router for category read endpoints
 *
 * @param categoryRepository - Repository for category data access
 * @returns Fastify plugin for category routes
 */
export function createCategoryReadRouter(
  categoryRepository: CategoryReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize use case handlers
    const getAllCategoriesHandler = new GetAllCategoriesHandler(
      categoryRepository,
    )
    const getCategoryByIdHandler = new GetCategoryByIdHandler(
      categoryRepository,
    )

    // Initialize controller with the handlers
    const categoryController = new CategoryController(
      getAllCategoriesHandler,
      getCategoryByIdHandler,
    )

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Route for retrieving all categories with filtering and pagination
    fastify.get<{
      Querystring: schemas.CategorySearchQuery
    }>(
      '/',
      {
        schema: {
          querystring: schemas.CategorySearchQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Querystring: schemas.CategorySearchQuery
        }>,
        reply,
      ) => {
        const result = await categoryController.getAllCategories(request)

        // Add language header if a specific language was requested
        const language = getPreferredLanguage(request)

        if (language && language !== 'all') {
          reply.header('Content-Language', language)
        }

        reply.code(200).send(result)
      },
    )

    // Route for retrieving a specific category by ID
    fastify.get<{
      Params: schemas.CategoryId
      Querystring: {
        include_children?: boolean
        lang?: string
      }
    }>(
      '/:category_id',
      {
        schema: {
          params: schemas.CategoryIdSchema,
        },
      },
      async (
        request: FastifyRequest<{
          Params: schemas.CategoryId
          Querystring: {
            include_children?: boolean
            lang?: string
          }
        }>,
        reply,
      ) => {
        const result = await categoryController.getCategoryById(request)

        // Add language header if a specific language was requested
        const language = getPreferredLanguage(request)

        if (language && language !== 'all') {
          reply.header('Content-Language', language)
        }

        reply.code(200).send(result)
      },
    )
  }
}
