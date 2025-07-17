import type { AdminSearchQuery } from '@admin-read/application/use_cases/queries/AdminSearchQuery.js'
import type { GetAdminQuery } from '@admin-read/application/use_cases/queries/GetAdminQuery.js'
import {
  Admin,
  AdminPermission,
  AdminRole,
  AdminStatus,
} from '@admin-read/domain/entities/Admin.js'
import { AdminReadRepositoryPort } from '@admin-read/domain/port/admin/AdminReadRepositoryPort.js'
import { ICacheService } from '@pika/redis'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { PrismaClient } from '@prisma/client'

import {
  AdminOrderByInput,
} from '../types/PrismaTypes.js'

/**
 * Prisma implementation of the AdminReadRepository interface
 * Includes caching strategies for performance optimization
 */
export class PrismaAdminReadRepository implements AdminReadRepositoryPort {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Builds a Prisma WHERE clause from search parameters
   */
  private buildWhereClause(params: AdminSearchQuery): any {
    const where: any = {
      // Always exclude E2E test admins from queries
      email: {
        not: 'test-admin-e2e@example.com',
      },
    }

    // Filter by role
    if (params.role !== undefined) {
      where.role = params.role
    }

    // Filter by status
    if (params.status !== undefined) {
      where.status = params.status
    }

    // Filter by email
    if (params.email) {
      where.email = {
        contains: params.email,
        mode: 'insensitive',
      }
    }

    // Filter by permissions - admin must have at least one of the specified permissions
    if (params.permissions && params.permissions.length > 0) {
      where.permissions = {
        hasSome: params.permissions,
      }
    }

    // Filter by created_by
    if (params.created_by) {
      where.created_by = params.created_by
    }

    // Search across name and email fields
    if (params.search) {
      where.OR = [
        {
          email: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
        {
          name: {
            path: ['$[*]'],
            string_contains: params.search,
            mode: 'insensitive',
          },
        },
      ]
    }

    return where
  }

  /**
   * Builds a Prisma include clause for relations
   */
  private buildIncludeClause(): any {
    // Since we're using the User model, we don't need specific includes
    // Permissions are stored in metadata
    return {}
  }

  /**
   * Builds a Prisma order by clause from sort parameters
   * Uses the standardized sort utility from shared package
   */
  private buildOrderByClause(params: AdminSearchQuery): AdminOrderByInput {
    // Use toPrismaSort utility for consistent handling of sort parameters
    const { sortBy, sortOrder } = params

    // Default to created_at field if no sort is specified
    const sortField = sortBy || 'created_at'
    const direction = sortOrder || 'desc'

    // Create and return the orderBy object
    return { [sortField]: direction }
  }

  /**
   * Maps database document to domain entity
   */
  private mapDocumentToDomain(document: any): Admin {
    // Map user role to admin role
    const adminRole = this.mapUserRoleToAdminRole(document.role)

    // Map permissions based on role
    const permissions = this.getPermissionsForRole(adminRole)

    // Create multilingual name from firstName and lastName
    const fullName = `${document.firstName} ${document.lastName}`.trim()
    const name = {
      en: fullName,
      es: fullName,
      gn: fullName,
      pt: fullName,
    }

    return new Admin({
      id: document.id,
      userId: document.id, // Admin ID is the user ID
      role: adminRole,
      permissions,
      status:
        document.status === 'ACTIVE'
          ? AdminStatus.ACTIVE
          : document.status === 'SUSPENDED'
            ? AdminStatus.SUSPENDED
            : AdminStatus.INACTIVE,
      name,
      email: document.email,
      lastLoginAt: document.lastLoginAt,
      createdAt: document.createdAt || new Date(),
      updatedAt: document.updatedAt || new Date(),
      createdBy: null, // Not tracked in User model
      metadata: {
        avatarUrl: document.avatarUrl,
        phoneNumber: document.phoneNumber,
      },
    })
  }

  private mapUserRoleToAdminRole(userRole: string): AdminRole {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return AdminRole.SUPER_ADMIN
      case 'ADMIN':
        return AdminRole.PLATFORM_ADMIN
      case 'CONTENT_MODERATOR':
        return AdminRole.CONTENT_MODERATOR
      case 'ANALYTICS_VIEWER':
        return AdminRole.ANALYTICS_VIEWER
      default:
        return AdminRole.ANALYTICS_VIEWER
    }
  }

  private getPermissionsForRole(role: AdminRole): AdminPermission[] {
    switch (role) {
      case AdminRole.SUPER_ADMIN:
        return Object.values(AdminPermission) // All permissions
      case AdminRole.PLATFORM_ADMIN:
        return [
          AdminPermission.MANAGE_PLATFORM,
          AdminPermission.VIEW_PLATFORM_STATS,
          AdminPermission.MODERATE_VOUCHERS,
          AdminPermission.APPROVE_VOUCHERS,
          AdminPermission.MANAGE_PROVIDERS,
          AdminPermission.APPROVE_PROVIDERS,
          AdminPermission.MANAGE_BOOKS,
          AdminPermission.CREATE_BOOKS,
          AdminPermission.VIEW_REVENUE,
          AdminPermission.VIEW_ANALYTICS,
        ]
      case AdminRole.CONTENT_MODERATOR:
        return [
          AdminPermission.MODERATE_VOUCHERS,
          AdminPermission.APPROVE_VOUCHERS,
          AdminPermission.VIEW_PLATFORM_STATS,
        ]
      case AdminRole.ANALYTICS_VIEWER:
        return [
          AdminPermission.VIEW_ANALYTICS,
          AdminPermission.VIEW_PLATFORM_STATS,
          AdminPermission.VIEW_REVENUE,
        ]
      default:
        return []
    }
  }

  /**
   * Retrieves all admins with filtering, pagination and sorting
   * Uses caching to improve performance for common queries
   */
  // Repository-level caching removed as per MVP approach
  // Cache moved to controller level only
  async getAllAdmins(
    params: AdminSearchQuery,
  ): Promise<PaginatedResult<Admin>> {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    try {
      const where = this.buildWhereClause(params)
      const include = this.buildIncludeClause(params.includePermissions)
      const orderBy = this.buildOrderByClause(params)

      // Add filter for admin roles only
      const adminWhere = {
        ...where,
        role: 'ADMIN', // All admins have ADMIN role in database
      }

      // Execute queries in a transaction for consistency
      const [total, admins] = await this.prisma.$transaction([
        this.prisma.user.count({ where: adminWhere }),
        this.prisma.user.findMany({
          where: adminWhere,
          include,
          orderBy,
          skip,
          take: limit,
        }),
      ])

      // Map database documents to domain entities
      const data = admins.map((document: any) =>
        this.mapDocumentToDomain(document),
      )

      // Calculate pagination metadata
      const pages = Math.max(1, Math.ceil(total / limit))

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          pages,
          has_next: page < pages,
          has_prev: page > 1,
        },
      }
    } catch (error) {
      // Use our advanced error handling - detect and categorize database errors
      if (error?.name === 'PrismaClientKnownRequestError') {
        throw ErrorFactory.databaseError(
          'query_admins',
          'Failed to query admins from database',
          error,
          {
            severity: ErrorSeverity.ERROR,
            source: 'PrismaAdminReadRepository.getAllAdmins',
            metadata: {
              params,
              prismaErrorCode: error.code,
              prismaErrorMeta: error.meta,
            },
            suggestion: 'Check database connectivity and schema validity',
            retryable: true,
          },
        )
      }

      // Handle query parsing errors
      if (error?.name === 'PrismaClientValidationError') {
        throw ErrorFactory.databaseError(
          'validate_query',
          'Invalid query parameters for admin search',
          error,
          {
            severity: ErrorSeverity.WARNING,
            source: 'PrismaAdminReadRepository.getAllAdmins',
            metadata: { params },
            suggestion: 'Check the structure of the search parameters',
          },
        )
      }

      // Generic error fallback
      logger.error('Error retrieving admins:', error)
      throw ErrorFactory.fromError(
        error,
        'Failed to retrieve admins due to an unexpected error',
      )
    }
  }

  /**
   * Retrieves a single admin by ID
   * Uses caching to improve performance for individual admin lookups
   */
  // Repository-level caching removed as per MVP approach
  // Cache moved to controller level only
  async getAdminById(params: GetAdminQuery): Promise<Admin | null> {
    try {
      const include = this.buildIncludeClause(params.includePermissions)

      const admin = await this.prisma.user.findUnique({
        where: {
          id: params.id,
          role: 'ADMIN', // All admins have ADMIN role in database
        },
        include,
      })

      if (!admin) {
        return null
      }

      return this.mapDocumentToDomain(admin as any)
    } catch (error) {
      // Use our advanced error handling
      if (error?.name === 'PrismaClientKnownRequestError') {
        // Handle common Prisma error codes
        if (error.code === 'P2023') {
          // Invalid UUID format
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format for admin ID: ${params.id}`] },
            {
              source: 'PrismaAdminReadRepository.getAdminById',
              metadata: { adminId: params.id },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Generic database error
        throw ErrorFactory.databaseError(
          'get_admin',
          `Failed to retrieve admin with ID ${params.id}`,
          error,
          {
            severity: ErrorSeverity.ERROR,
            source: 'PrismaAdminReadRepository.getAdminById',
            metadata: {
              adminId: params.id,
              includePermissions: params.includePermissions,
              prismaErrorCode: error.code,
              prismaErrorMeta: error.meta,
            },
            retryable: true,
          },
        )
      }

      // Generic error fallback
      logger.error(`Error retrieving admin with ID ${params.id}:`, error)
      throw ErrorFactory.fromError(
        error,
        `Failed to retrieve admin with ID ${params.id}`,
      )
    }
  }

  /**
   * Retrieves an admin by user ID
   */
  async getAdminByUserId(userId: string): Promise<Admin | null> {
    try {
      const admin = await this.prisma.user.findUnique({
        where: {
          id: userId,
          role: 'ADMIN', // All admins have ADMIN role in database
        },
      })

      if (!admin) {
        return null
      }

      return this.mapDocumentToDomain(admin as any)
    } catch (error) {
      // Use our advanced error handling
      if (error?.name === 'PrismaClientKnownRequestError') {
        // Handle common Prisma error codes
        if (error.code === 'P2023') {
          // Invalid UUID format
          throw ErrorFactory.validationError(
            { user_id: [`Invalid UUID format for user ID: ${userId}`] },
            {
              source: 'PrismaAdminReadRepository.getAdminByUserId',
              metadata: { userId },
              suggestion: 'Ensure the user ID is a valid UUID format',
            },
          )
        }

        // Generic database error
        throw ErrorFactory.databaseError(
          'get_admin_by_user',
          `Failed to retrieve admin with user ID ${userId}`,
          error,
          {
            severity: ErrorSeverity.ERROR,
            source: 'PrismaAdminReadRepository.getAdminByUserId',
            metadata: {
              userId,
              prismaErrorCode: error.code,
              prismaErrorMeta: error.meta,
            },
            retryable: true,
          },
        )
      }

      // Generic error fallback
      logger.error(`Error retrieving admin with user ID ${userId}:`, error)
      throw ErrorFactory.fromError(
        error,
        `Failed to retrieve admin with user ID ${userId}`,
      )
    }
  }

  /**
   * Check if a user has admin privileges
   */
  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const admin = await this.prisma.user.findUnique({
        where: {
          id: userId,
          status: 'ACTIVE',
          role: 'ADMIN', // All admins have ADMIN role in database
        },
        select: { id: true },
      })

      return admin !== null
    } catch (error) {
      logger.error(`Error checking admin status for user ${userId}:`, error)

      // In case of error, err on the side of caution and return false
      return false
    }
  }
}
