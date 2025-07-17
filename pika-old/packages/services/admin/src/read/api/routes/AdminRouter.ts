import { AdminController } from '@admin-read/api/controllers/admin/index.js'
import {
  GetAdminByIdHandler,
  GetAllAdminsHandler,
} from '@admin-read/application/use_cases/queries/index.js'
import { AdminReadRepositoryPort } from '@admin-read/domain/port/admin/AdminReadRepositoryPort.js'
import { schemas } from '@pika/api'
import { getPreferredLanguage, propertyTransformerHook } from '@pika/http'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'

/**
 * Creates a Fastify router for admin read endpoints
 *
 * @param adminRepository - Repository for admin data access
 * @returns Fastify plugin for admin routes
 */
export function createAdminReadRouter(
  adminRepository: AdminReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize use case handlers
    const getAllAdminsHandler = new GetAllAdminsHandler(adminRepository)
    const getAdminByIdHandler = new GetAdminByIdHandler(adminRepository)

    // Initialize controller with the handlers
    const adminController = new AdminController(
      getAllAdminsHandler,
      getAdminByIdHandler,
    )

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // Route for retrieving all admins with filtering and pagination
    fastify.get<{
      Querystring: schemas.AdminSearchQuery
    }>(
      '/',
      {
        schema: {
          querystring: schemas.AdminSearchQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Querystring: schemas.AdminSearchQuery
        }>,
        reply,
      ) => {
        const result = await adminController.getAllAdmins(request)

        // Add language header if a specific language was requested
        const language = getPreferredLanguage(request)

        if (language && language !== 'all') {
          reply.header('Content-Language', language)
        }

        reply.code(200).send(result)
      },
    )

    // Route for retrieving a specific admin by ID
    fastify.get<{
      Params: schemas.AdminId
      Querystring: {
        include_permissions?: boolean
        lang?: string
      }
    }>(
      '/:admin_id',
      {
        schema: {
          params: schemas.AdminIdSchema,
        },
      },
      async (
        request: FastifyRequest<{
          Params: schemas.AdminId
          Querystring: {
            include_permissions?: boolean
            lang?: string
          }
        }>,
        reply,
      ) => {
        const result = await adminController.getAdminById(request)

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
