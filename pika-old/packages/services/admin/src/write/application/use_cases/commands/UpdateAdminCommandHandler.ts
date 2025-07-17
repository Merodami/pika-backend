import { Admin, AdminDocument } from '@admin-write/domain/entities/Admin.js'
import { type AdminWriteRepositoryPort } from '@admin-write/domain/port/admin/AdminWriteRepositoryPort.js'
import { ErrorFactory, validateMultilingualContent } from '@pika/shared'
import { type MultilingualContent } from '@pika/types-core'

/**
 * Command handler for updating existing admins
 * Implements business logic, validation, and orchestrates the process
 */
export class UpdateAdminCommandHandler {
  constructor(private readonly repository: AdminWriteRepositoryPort) {}

  /**
   * Executes the update admin command
   * Validates input, applies business rules, and persists the updated admin
   */
  async execute(id: string, dto: Partial<AdminDocument>): Promise<Admin> {
    // Validate and normalize multilingual content if provided
    const validatedDto: Partial<AdminDocument> = { ...dto }

    if (dto.name !== undefined) {
      validatedDto.name = validateMultilingualContent(dto.name, 'name', {
        maxLength: 100,
        minLength: 2,
        requiredDefault: false, // For updates, don't require default language
      }) as MultilingualContent
    }

    try {
      // Call repository to handle the update
      return await this.repository.updateAdmin(id, validatedDto)
    } catch (error) {
      // Handle specific known errors
      if (error.name === 'ResourceNotFoundError' || error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('Admin', id, {
          source: 'UpdateAdminCommandHandler.execute',
          suggestion: 'Check that the admin ID exists',
        })
      }

      if (
        error.name === 'ValidationError' ||
        error.name === 'ResourceConflictError'
      ) {
        // Ensure ValidationError has the proper HTTP status
        if (error.name === 'ValidationError' && !error.getHttpStatus) {
          error.httpStatus = 400
        }
        throw error
      }

      // Enhance other errors with more context
      throw ErrorFactory.fromError(error, 'Failed to update admin', {
        source: 'UpdateAdminCommandHandler.execute',
        suggestion: 'Check admin data and try again',
        metadata: {
          adminId: id,
          adminEmail: dto.email,
          updatedFields: Object.keys(dto),
        },
      })
    }
  }
}
