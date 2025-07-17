import { type AdminCreateDTO } from '@admin-write/domain/dtos/AdminDTO.js'
import { Admin, AdminDocument } from '@admin-write/domain/entities/Admin.js'
import { type AdminWriteRepositoryPort } from '@admin-write/domain/port/admin/AdminWriteRepositoryPort.js'
import { AdminMetadataAdapter } from '@admin-write/infrastructure/adapters/AdminMetadataAdapter.js'
import { AdminRoleAdapter } from '@admin-write/infrastructure/adapters/AdminRoleAdapter.js'
import { ErrorFactory, logger } from '@pika/shared'
import { Prisma, type PrismaClient, UserStatus } from '@prisma/client'

/**
 * Prisma implementation of the AdminWriteRepository
 * Handles persistence and data mapping to/from the database
 */
export class PrismaAdminWriteRepository implements AdminWriteRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Maps database record to domain entity
   * @private
   */
  private mapToDomainEntity(record: any): Admin {
    // Extract admin data from metadata
    const metadata = (record.metadata as any) || {}
    const permissions = metadata.adminPermissions || []
    const createdBy = metadata.adminCreatedBy || null
    const adminRole = AdminRoleAdapter.fromMetadata(metadata)

    // Create multilingual name from firstName and lastName
    const fullName = `${record.firstName} ${record.lastName}`.trim()
    const name = {
      en: fullName,
      es: fullName,
      gn: fullName,
      pt: fullName,
    }

    const adminDoc: AdminDocument = {
      id: record.id,
      userId: record.id, // User ID is the admin ID
      role: adminRole,
      permissions,
      status: record.status,
      name,
      email: record.email,
      lastLoginAt: record.lastLoginAt,
      createdAt: record.createdAt || new Date(),
      updatedAt: record.updatedAt || new Date(),
      createdBy,
      metadata,
    }

    return Admin.reconstitute(
      record.id,
      adminDoc,
      record.createdAt || new Date(),
      record.updatedAt || new Date(),
    )
  }

  /**
   * Creates a new admin in the database
   */
  async createAdmin(dto: AdminCreateDTO): Promise<Admin> {
    try {
      // Prepare data for database using SDK mapper to ensure proper formatting
      logger.debug('dto', { dto })

      // For admin creation, we're actually updating an existing user
      // The user should already exist before being promoted to admin
      const existingUser = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      })

      if (!existingUser) {
        throw ErrorFactory.resourceNotFound('User', dto.userId, {
          source: 'PrismaAdminWriteRepository.createAdmin',
        })
      }

      // Extract name parts from multilingual name
      const nameText =
        typeof dto.name === 'string'
          ? dto.name
          : dto.name.en || dto.name.es || ''
      const nameParts = nameText.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const createData = {
        email: dto.email,
        firstName,
        lastName,
        role: AdminRoleAdapter.toDatabaseRole(dto.role),
        status: UserStatus.ACTIVE,
        lastLoginAt: null,
      }

      logger.debug('Final createData for Prisma:', createData)

      // Update the user to admin role
      const created = await this.prisma.user.update({
        where: { id: dto.userId },
        data: createData,
      })

      logger.debug('Admin created in database:', {
        id: created.id,
        userId: created.id,
        role: created.role,
        email: created.email,
      })

      // Store admin metadata separately
      const adminMetadata = AdminRoleAdapter.toMetadata(dto.role, {
        adminPermissions: dto.permissions || [],
        adminCreatedBy: dto.createdBy,
        ...(dto.metadata || {}),
      })

      AdminMetadataAdapter.setMetadata(created.id, adminMetadata)

      return this.mapToDomainEntity(created)
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (error.code === 'P2002') {
          // Extract the field name from the error
          const metaTarget = error.meta?.target as string[] | undefined
          const field =
            metaTarget && metaTarget.length > 0 ? metaTarget[0] : 'email'
          const value = (dto[field as keyof typeof dto] as string) || 'unknown'

          throw ErrorFactory.uniqueConstraintViolation(
            'Admin',
            field,
            typeof value === 'string' ? value : JSON.stringify(value),
            {
              source: 'PrismaAdminWriteRepository.createAdmin',
            },
          )
        }

        // Foreign key constraint failure
        if (error.code === 'P2003') {
          // This is a true validation error as the client provided an invalid user ID
          throw ErrorFactory.validationError(
            { userId: ['User does not exist'] },
            {
              source: 'PrismaAdminWriteRepository.createAdmin',
            },
          )
        }
      }

      // Handle other database errors
      throw ErrorFactory.databaseError(
        'create_admin',
        'Failed to create admin',
        error,
        {
          source: 'PrismaAdminWriteRepository.createAdmin',
          metadata: {
            email: dto.email,
            userId: dto.userId,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  /**
   * Updates an existing admin in the database
   */
  async updateAdmin(id: string, dto: Partial<AdminDocument>): Promise<Admin> {
    try {
      // Check if the admin exists
      const exists = await this.prisma.user.count({ where: { id } })

      if (exists === 0) {
        logger.debug('Admin not found for update:', id)
        throw ErrorFactory.resourceNotFound('Admin', id, {
          source: 'PrismaAdminWriteRepository.updateAdmin',
          httpStatus: 404,
        })
      }

      // Log the update attempt
      logger.debug('Updating admin:', {
        id,
        updatedFields: Object.keys(dto),
      })

      // Prepare update data, only include fields that are actually changing
      const updateData: Record<string, any> = {}

      if (dto.role !== undefined) {
        // Admin role is always ADMIN in database, store specific role in metadata
        updateData.role = AdminRoleAdapter.toDatabaseRole(dto.role)
      }
      if (dto.status !== undefined) updateData.status = dto.status
      if (dto.email !== undefined) updateData.email = dto.email
      if (dto.lastLoginAt !== undefined)
        updateData.lastLoginAt = dto.lastLoginAt

      // Handle name update
      if (dto.name !== undefined) {
        const nameText =
          typeof dto.name === 'string'
            ? dto.name
            : dto.name.en || dto.name.es || ''
        const nameParts = nameText.split(' ')

        updateData.firstName = nameParts[0] || ''
        updateData.lastName = nameParts.slice(1).join(' ') || ''
      }

      // Handle admin metadata updates separately
      const adminMetadata = AdminMetadataAdapter.getMetadata(id)

      // Update admin role in metadata if provided
      if (dto.role !== undefined) {
        AdminMetadataAdapter.setMetadata(id, AdminRoleAdapter.toMetadata(dto.role, adminMetadata))
      }

      // Update permissions if provided
      if (dto.permissions !== undefined) {
        const currentMetadata = AdminMetadataAdapter.getMetadata(id)

        currentMetadata.adminPermissions = dto.permissions
        AdminMetadataAdapter.setMetadata(id, currentMetadata)
      }

      // Update other metadata if provided
      if (dto.metadata !== undefined) {
        const currentMetadata = AdminMetadataAdapter.getMetadata(id)

        AdminMetadataAdapter.setMetadata(id, { ...currentMetadata, ...dto.metadata })
      }

      // Always update the updated_at timestamp
      updateData.updatedAt = new Date()

      logger.debug('Final updateData for Prisma:', updateData)

      // Perform the update
      const updated = await this.prisma.user.update({
        where: { id },
        data: updateData,
      })

      logger.debug('Admin updated in database:', {
        id: updated.id,
        updatedFields: Object.keys(updateData),
      })

      return this.mapToDomainEntity(updated)
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Record not found during update
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Admin', id, {
            source: 'PrismaAdminWriteRepository.updateAdmin',
          })
        }

        // Unique constraint violation
        if (error.code === 'P2002') {
          const metaTarget = error.meta?.target as string[] | undefined
          const field =
            metaTarget && metaTarget.length > 0 ? metaTarget[0] : 'email'
          const value = dto[field as keyof AdminDocument] || 'unknown'

          throw ErrorFactory.uniqueConstraintViolation(
            'Admin',
            field,
            typeof value === 'string' ? value : JSON.stringify(value),
            {
              source: 'PrismaAdminWriteRepository.updateAdmin',
            },
          )
        }

        // Foreign key constraint failure
        if (error.code === 'P2003') {
          throw ErrorFactory.validationError(
            { userId: ['Referenced user does not exist'] },
            {
              source: 'PrismaAdminWriteRepository.updateAdmin',
            },
          )
        }
      }

      // If it's already a BaseError, rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle other database errors
      throw ErrorFactory.databaseError(
        'update_admin',
        'Failed to update admin',
        error,
        {
          source: 'PrismaAdminWriteRepository.updateAdmin',
          metadata: {
            adminId: id,
            updatedFields: Object.keys(dto),
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  /**
   * Deletes an admin from the database
   */
  async deleteAdmin(id: string): Promise<void> {
    try {
      // Check if the admin exists before attempting deletion
      const admin = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true },
      })

      if (!admin) {
        throw ErrorFactory.resourceNotFound('Admin', id, {
          source: 'PrismaAdminWriteRepository.deleteAdmin',
        })
      }

      logger.debug('Deleting admin:', {
        id,
        email: admin.email,
      })

      // Check for dependencies that would prevent deletion
      // Admin entities typically don't have many dependencies, but we could check
      // for things like audit logs, created records, etc.

      // Perform the deletion
      await this.prisma.user.delete({
        where: { id },
      })

      logger.debug('Admin deleted successfully:', id)
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Record not found during deletion
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Admin', id, {
            source: 'PrismaAdminWriteRepository.deleteAdmin',
          })
        }

        // Foreign key constraint violations (dependencies exist)
        if (error.code === 'P2003') {
          throw ErrorFactory.validationError(
            {
              admin: [
                'Cannot delete admin with existing dependencies. Consider deactivating instead.',
              ],
            },
            {
              source: 'PrismaAdminWriteRepository.deleteAdmin',
              suggestion: 'Remove dependencies or deactivate the admin instead',
            },
          )
        }
      }

      // If it's already a BaseError, rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle other database errors
      throw ErrorFactory.databaseError(
        'delete_admin',
        'Failed to delete admin',
        error,
        {
          source: 'PrismaAdminWriteRepository.deleteAdmin',
          metadata: {
            adminId: id,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }
}
