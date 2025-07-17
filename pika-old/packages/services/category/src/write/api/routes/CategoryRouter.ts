import { CategoryController } from '@category-write/api/controllers/category/CategoryController.js'
import { CreateCategoryCommandHandler } from '@category-write/application/use_cases/commands/CreateCategoryCommandHandler.js'
import { DeleteCategoryCommandHandler } from '@category-write/application/use_cases/commands/DeleteCategoryCommandHandler.js'
import { UpdateCategoryCommandHandler } from '@category-write/application/use_cases/commands/UpdateCategoryCommandHandler.js'
import { CategoryWriteRepositoryPort } from '@category-write/domain/port/category/CategoryWriteRepositoryPort.js'
import fastifyMultipart from '@fastify/multipart'
import { schemas } from '@pika/api'
import { propertyTransformerHook, requirePermissions } from '@pika/http'
import { FileStoragePort, logger } from '@pika/shared'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

/**
 * Creates a Fastify router for category write endpoints
 *
 * @param categoryRepository - Repository for category write operations
 * @param fileStorage - Storage service for handling file uploads
 * @returns Fastify plugin for category write routes
 */
export function createCategoryWriteRouter(
  categoryRepository: CategoryWriteRepositoryPort,
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
    const createHandler = new CreateCategoryCommandHandler(categoryRepository)
    const updateHandler = new UpdateCategoryCommandHandler(categoryRepository)
    const deleteHandler = new DeleteCategoryCommandHandler(categoryRepository)

    // Initialize controller with the handlers and file storage
    const categoryController = new CategoryController(
      createHandler,
      updateHandler,
      deleteHandler,
      fileStorage,
    )

    // Route for creating a category
    fastify.post<{
      Body: schemas.CategoryCreate
    }>(
      '/',
      {
        preHandler: requirePermissions('categories:write'),
        schema: {
          body: schemas.CategoryCreateSchema,
        },
      },
      async (request, reply) => {
        await categoryController.create(request, reply)
      },
    )

    // Route for updating a category
    fastify.patch<{
      Params: { category_id: string }
      Body: schemas.CategoryUpdate
    }>(
      '/:category_id',
      {
        preHandler: requirePermissions('categories:write'),
        schema: {
          params: schemas.CategoryIdSchema,
          body: schemas.CategoryUpdateSchema,
        },
      },
      async (request, reply) => {
        await categoryController.update(request, reply)
      },
    )

    // Route for deleting a category
    fastify.delete<{
      Params: { category_id: string }
    }>(
      '/:category_id',
      {
        preHandler: requirePermissions('categories:write'),
        schema: {
          params: schemas.CategoryIdSchema,
        },
      },
      async (request, reply) => {
        await categoryController.delete(request, reply)
      },
    )

    // Route for uploading a category icon standalone
    fastify.post<{
      Params: { category_id: string }
    }>(
      '/:category_id/icon',
      {
        preHandler: requirePermissions('categories:write'),
        schema: {
          params: schemas.CategoryIdSchema,
        },
      },
      async (request, reply) => {
        await categoryController.uploadIcon(request, reply)
      },
    )
  }
}
