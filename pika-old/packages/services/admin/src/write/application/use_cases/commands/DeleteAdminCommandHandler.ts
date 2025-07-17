import { type AdminWriteRepositoryPort } from '@admin-write/domain/port/admin/AdminWriteRepositoryPort.js'
import { ErrorFactory } from '@pika/shared'

/**
 * Command handler for deleting admins
 * Implements business logic, validation, and orchestrates the process
 */
export class DeleteAdminCommandHandler {
  constructor(private readonly repository: AdminWriteRepositoryPort) {}

  /**
   * Executes the delete admin command
   * Validates input, applies business rules, and handles the deletion
   */
  async execute(id: string): Promise<void> {
    // Validate UUID format
    this.validateId(id)

    try {
      // Delegate to repository for actual deletion
      await this.repository.deleteAdmin(id)
    } catch (error) {
      // Handle specific known errors
      if (error.name === 'ResourceNotFoundError') {
        throw ErrorFactory.resourceNotFound('Admin', id, {
          source: 'DeleteAdminCommandHandler.execute',
          suggestion: 'Check that the admin ID exists',
        })
      }

      // Specific error for dependency constraint violations
      if (
        error.name === 'ValidationError' &&
        error.context?.field === 'admin'
      ) {
        throw error
      }

      // Handle database constraint errors that may come from the repository
      if (
        error.code === 'P2003' ||
        error.message?.includes('foreign key constraint') ||
        error.message?.includes('has dependencies') ||
        error.name === 'BusinessRuleViolationError'
      ) {
        throw ErrorFactory.validationError(
          {
            admin: ['Cannot delete admin with existing dependencies'],
          },
          {
            source: 'DeleteAdminCommandHandler.execute',
            suggestion:
              'Remove dependencies first or deactivate instead of deleting',
            httpStatus: 400, // Ensure status code is set to 400
          },
        )
      }

      // Enhance other errors with more context
      throw ErrorFactory.fromError(error, 'Failed to delete admin', {
        source: 'DeleteAdminCommandHandler.execute',
        suggestion: 'Check if the admin has dependencies and try again',
        metadata: { adminId: id },
      })
    }
  }

  /**
   * Validates that a UUID is in the correct format
   */
  private validateId(id: string): void {
    if (!id) {
      throw ErrorFactory.validationError(
        { id: ['Admin ID is required'] },
        { source: 'DeleteAdminCommandHandler.validateId' },
      )
    }

    // Check UUID format using a regex
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!uuidPattern.test(id)) {
      throw ErrorFactory.validationError(
        { id: ['Invalid admin ID format'] },
        {
          source: 'DeleteAdminCommandHandler.validateId',
          suggestion: 'Provide a valid UUID',
        },
      )
    }
  }
}
