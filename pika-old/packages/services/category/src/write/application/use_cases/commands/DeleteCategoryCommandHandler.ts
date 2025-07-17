import { type CategoryWriteRepositoryPort } from '@category-write/domain/port/category/CategoryWriteRepositoryPort.js'
import { ErrorFactory } from '@pika/shared'

/**
 * Command handler for deleting categories
 * Implements business logic, validation, and orchestrates the process
 */
export class DeleteCategoryCommandHandler {
  constructor(private readonly repository: CategoryWriteRepositoryPort) {}

  /**
   * Executes the delete category command
   * Validates input, applies business rules, and handles the deletion
   */
  async execute(id: string): Promise<void> {
    // Validate UUID format
    this.validateId(id)

    try {
      // Delegate to repository for actual deletion
      await this.repository.deleteCategory(id)
    } catch (error) {
      // Handle specific known errors
      if (error.name === 'ResourceNotFoundError') {
        throw ErrorFactory.resourceNotFound('Category', id, {
          source: 'DeleteCategoryCommandHandler.execute',
          suggestion: 'Check that the category ID exists',
        })
      }

      // Specific error for dependency constraint violations
      if (
        error.name === 'ValidationError' &&
        error.context?.field === 'category'
      ) {
        throw error
      }

      // Handle database constraint errors that may come from the repository
      if (
        error.code === 'P2003' ||
        error.message?.includes('foreign key constraint') ||
        error.message?.includes('has child categories') ||
        error.name === 'BusinessRuleViolationError'
      ) {
        throw ErrorFactory.validationError(
          {
            category: [
              'Cannot delete category with child categories or services',
            ],
          },
          {
            source: 'DeleteCategoryCommandHandler.execute',
            suggestion:
              'Remove child categories and services first or deactivate instead of deleting',
            httpStatus: 400, // Ensure status code is set to 400
          },
        )
      }

      // Enhance other errors with more context
      throw ErrorFactory.fromError(error, 'Failed to delete category', {
        source: 'DeleteCategoryCommandHandler.execute',
        suggestion: 'Check if the category has dependencies and try again',
        metadata: { categoryId: id },
      })
    }
  }

  /**
   * Validates that a UUID is in the correct format
   */
  private validateId(id: string): void {
    if (!id) {
      throw ErrorFactory.validationError(
        { id: ['Category ID is required'] },
        { source: 'DeleteCategoryCommandHandler.validateId' },
      )
    }

    // Check UUID format using a regex
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!uuidPattern.test(id)) {
      throw ErrorFactory.validationError(
        { id: ['Invalid category ID format'] },
        {
          source: 'DeleteCategoryCommandHandler.validateId',
          suggestion: 'Provide a valid UUID',
        },
      )
    }
  }
}
