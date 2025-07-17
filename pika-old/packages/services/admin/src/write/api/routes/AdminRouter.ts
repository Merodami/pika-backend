import { AdminController } from '@admin-write/api/controllers/admin/AdminController.js'
import { CreateAdminCommandHandler } from '@admin-write/application/use_cases/commands/CreateAdminCommandHandler.js'
import { DeleteAdminCommandHandler } from '@admin-write/application/use_cases/commands/DeleteAdminCommandHandler.js'
import { UpdateAdminCommandHandler } from '@admin-write/application/use_cases/commands/UpdateAdminCommandHandler.js'
import { AdminWriteRepositoryPort } from '@admin-write/domain/port/admin/AdminWriteRepositoryPort.js'
import fastifyMultipart from '@fastify/multipart'
import { schemas } from '@pika/api'
import { propertyTransformerHook, requirePermissions } from '@pika/http'
import { FileStoragePort, logger } from '@pika/shared'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

/**
 * Creates a Fastify router for admin write endpoints
 *
 * @param adminRepository - Repository for admin write operations
 * @param fileStorage - Storage service for handling file uploads
 * @returns Fastify plugin for admin write routes
 */
export function createAdminWriteRouter(
  adminRepository: AdminWriteRepositoryPort,
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

      logger.info('Registered multipart handler for admin file uploads')
    } else {
      logger.info('Multipart handler already registered')
    }

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Initialize use case handlers
    const createHandler = new CreateAdminCommandHandler(adminRepository)
    const updateHandler = new UpdateAdminCommandHandler(adminRepository)
    const deleteHandler = new DeleteAdminCommandHandler(adminRepository)

    // Initialize controller with the handlers and file storage
    const adminController = new AdminController(
      createHandler,
      updateHandler,
      deleteHandler,
      fileStorage,
    )

    // POST /admins - Create a new admin
    fastify.post<{
      Body: schemas.AdminCreateDTO
    }>(
      '/',
      {
        preHandler: requirePermissions('MANAGE_PLATFORM', 'MANAGE_PROVIDERS'),
        schema: {
          body: schemas.AdminCreateDTOSchema,
          response: {
            201: schemas.AdminSchema,
          },
        },
      },
      async (request, reply) => {
        await adminController.create(request, reply)
      },
    )

    // PATCH /admins/:admin_id - Update an admin
    fastify.patch<{
      Params: schemas.AdminId
      Body: schemas.AdminUpdateDTO
    }>(
      '/:admin_id',
      {
        preHandler: requirePermissions('MANAGE_PLATFORM'),
        schema: {
          params: schemas.AdminIdSchema,
          body: schemas.AdminUpdateDTOSchema,
          response: {
            200: schemas.AdminSchema,
          },
        },
      },
      async (request, reply) => {
        await adminController.update(request, reply)
      },
    )

    // DELETE /admins/:admin_id - Delete an admin
    fastify.delete<{
      Params: schemas.AdminId
    }>(
      '/:admin_id',
      {
        preHandler: requirePermissions('MANAGE_PLATFORM'),
        schema: {
          params: schemas.AdminIdSchema,
          response: {
            204: { type: 'null' },
          },
        },
      },
      async (request, reply) => {
        await adminController.delete(request, reply)
      },
    )

    // POST /admins/:admin_id/upload - Upload admin profile image
    fastify.post<{
      Params: schemas.AdminId
    }>(
      '/:admin_id/upload',
      {
        preHandler: requirePermissions('MANAGE_PLATFORM', 'MANAGE_PROVIDERS'),
        schema: {
          params: schemas.AdminIdSchema,
          response: {
            200: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                filename: { type: 'string' },
                size: { type: 'number' },
                mime_type: { type: 'string' },
              },
            },
          },
        },
      },
      async (request, reply) => {
        await adminController.uploadImage(request, reply)
      },
    )

    logger.info(
      'Admin write router registered with inter-service communication',
    )
  }
}
