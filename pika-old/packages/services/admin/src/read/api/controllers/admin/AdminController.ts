import { adaptAdminSearchQuery } from '@admin-read/application/adapters/sortingAdapter.js'
import {
  GetAdminByIdHandler,
  GetAllAdminsHandler,
} from '@admin-read/application/use_cases/queries/index.js'
import { AdminDomainAdapter } from '@admin-read/infrastructure/mappers/AdminDomainAdapter.js'
import { schemas } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { getPreferredLanguage } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { AdminMapper } from '@pika/sdk'
import { adminLocalizationConfig } from '@pika/sdk'
import {
  ErrorFactory,
  ErrorSeverity,
  processMultilingualContent,
} from '@pika/shared'
import type { FastifyRequest } from 'fastify'

/**
 * Controller handling HTTP requests for admin read operations
 * Implements proper caching for performance
 */
export class AdminController {
  constructor(
    private readonly getAllAdminsHandler: GetAllAdminsHandler,
    private readonly getAdminByIdHandler: GetAdminByIdHandler,
  ) {
    this.getAllAdmins = this.getAllAdmins.bind(this)
    this.getAdminById = this.getAdminById.bind(this)
  }

  /**
   * GET /admins
   * Get all admins with filtering, pagination and sorting
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admins',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllAdmins(
    request: FastifyRequest<{
      Querystring: schemas.AdminSearchQuery
    }>,
  ) {
    try {
      const query = request.query as schemas.AdminSearchQuery

      // Use the adapter to convert API query to domain model format
      // This properly handles type conversions for sort parameters
      const searchParams = adaptAdminSearchQuery(query)

      const result = await this.getAllAdminsHandler.execute(searchParams)

      // Convert domain models to API DTOs with safe date conversion
      const dtoResult = {
        data: result.data.map((admin) =>
          AdminMapper.toDTO(AdminDomainAdapter.toDomain(admin)),
        ),
        pagination: result.pagination,
      }

      // Get the preferred language from the request.language property
      // This is set by the languageNegotiation plugin
      const preferredLanguage = getPreferredLanguage(request)

      // Use the reusable multilingual content processor
      // It handles both 'all' and specific language cases
      return processMultilingualContent(
        dtoResult,
        {
          multilingualFields: [],
          recursiveFields: [
            {
              field: 'data',
              config: adminLocalizationConfig,
            },
          ],
        },
        preferredLanguage,
      )
    } catch (error) {
      // Transform the error using our new error system
      if (error.code === 'INVALID_QUERY_PARAMETERS') {
        throw ErrorFactory.validationError(
          {
            query: [`Invalid query parameters: ${error.message}`],
          },
          {
            correlationId: request.id,
            source: 'AdminController.getAllAdmins',
            suggestion:
              'Check the API documentation for valid query parameters',
          },
        )
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_all_admins',
          'Failed to fetch admins from database',
          error,
          {
            correlationId: request.id,
            source: 'AdminController.getAllAdmins',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * GET /admins/:adminId
   * Get a specific admin by ID
   */
  @Cache({
    ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10),
    prefix: 'admins',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getAdminById(
    request: FastifyRequest<{
      Params: schemas.AdminId
      Querystring: {
        include_permissions?: boolean
      }
    }>,
  ) {
    try {
      const { admin_id } = request.params
      const { include_permissions } = request.query

      const admin = await this.getAdminByIdHandler.execute({
        id: admin_id,
        includePermissions:
          include_permissions === undefined
            ? undefined
            : Boolean(include_permissions),
      })

      if (!admin) {
        throw ErrorFactory.resourceNotFound('Admin', admin_id, {
          correlationId: request.id,
          source: 'AdminController.getAdminById',
          suggestion:
            'Check that the admin ID exists and is in the correct format',
          metadata: {
            requestParams: request.params,
            includePermissions: include_permissions,
          },
        })
      }

      // Convert to API DTO
      const dto = AdminMapper.toDTO(AdminDomainAdapter.toDomain(admin))

      // Get the preferred language from the Accept-Language header via request.language
      const preferredLanguage = getPreferredLanguage(request)

      // Use our reusable multilingual processor for consistent handling
      return processMultilingualContent(
        dto,
        adminLocalizationConfig,
        preferredLanguage,
      )
    } catch (error) {
      // If it's already a BaseError, just rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle specific error cases
      if (error.message?.includes('not found')) {
        throw ErrorFactory.resourceNotFound('Admin', request.params.admin_id, {
          correlationId: request.id,
          source: 'AdminController.getAdminById',
        })
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_admin_by_id',
          'Failed to fetch admin from database',
          error,
          {
            correlationId: request.id,
            source: 'AdminController.getAdminById',
            metadata: { adminId: request.params.admin_id },
          },
        )
      }

      // For any other unexpected errors
      throw ErrorFactory.fromError(error)
    }
  }
}
