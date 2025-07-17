import { schemas } from '@pika/api'
import {
  propertyTransformerHook,
  requireAdmin,
  requirePermissions,
} from '@pika/http'
import { FileStoragePort, logger } from '@pika/shared'
import { UserController } from '@user-write/api/controllers/user/UserController.js'
import { UserWriteRepositoryPort } from '@user-write/domain/port/user/UserWriteRepositoryPort.js'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

/**
 * Creates a Fastify router for user write endpoints
 *
 * @param userRepository - Repository for user write operations
 * @param fileStorage - Storage service for handling file uploads
 * @returns Fastify plugin for user write routes
 */
export function createUserRouter(
  userRepository: UserWriteRepositoryPort,
  fileStorage: FileStoragePort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Initialize controller
    const userController = new UserController(userRepository, fileStorage)

    // Register routes
    // Create a new user - only admins can create users directly
    // (regular users are created through the auth/register endpoint)
    fastify.post<{
      Body: schemas.UserCreate
    }>('/', {
      preHandler: requireAdmin(),
      schema: {
        body: schemas.UserCreateSchema,
      },
      handler: async (request, reply) => {
        const result = await userController.create(request)

        return reply.code(201).send(result)
      },
    })

    // Update an existing user - requires authentication
    // Authorization is handled in the controller (users can update own profile, admins can update any)
    fastify.patch<{
      Params: { user_id: string }
      Body: schemas.UserUpdate
    }>('/:user_id', {
      preHandler: requirePermissions('users:write'),
      schema: {
        params: schemas.UserIdParamSchema,
        body: schemas.UserUpdateSchema,
      },
      handler: userController.update,
    })

    // Delete an existing user - only admins
    fastify.delete<{
      Params: { user_id: string }
    }>('/:user_id', {
      preHandler: requireAdmin(),
      schema: {
        params: schemas.UserIdParamSchema,
      },
      handler: async (request, reply) => {
        await userController.delete(request)

        return reply.code(204).send()
      },
    })

    logger.info('User write routes registered')
  }
}
