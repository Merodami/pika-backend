import { Category } from '@category-write/domain/entities/Category.js'
import { type CategoryWriteRepositoryPort } from '@category-write/domain/port/category/CategoryWriteRepositoryPort.js'
import { CategoryDocument } from '@pika/sdk'
import { ErrorFactory, validateMultilingualContent } from '@pika/shared'
import { type MultilingualContent } from '@pika/types-core'

/**
 * Command handler for updating existing categories
 * Implements business logic, validation, and orchestrates the process
 */
export class UpdateCategoryCommandHandler {
  constructor(private readonly repository: CategoryWriteRepositoryPort) {}

  /**
   * Executes the update category command
   * Validates input, applies business rules, and persists the updated category
   */
  async execute(id: string, dto: Partial<CategoryDocument>): Promise<Category> {
    // Validate and normalize multilingual content if provided
    const validatedDto: Partial<CategoryDocument> = { ...dto }

    if (dto.name !== undefined) {
      validatedDto.name = validateMultilingualContent(dto.name, 'name', {
        maxLength: 100,
        minLength: 2,
        requiredDefault: false, // For updates, don't require default language
      }) as MultilingualContent
    }

    if (dto.description !== undefined) {
      validatedDto.description = validateMultilingualContent(
        dto.description,
        'description',
        {
          maxLength: 1000,
          requiredDefault: false,
          minLength: 0,
        },
      ) as MultilingualContent
    }

    try {
      // Call repository to handle the update
      return await this.repository.updateCategory(id, validatedDto)
    } catch (error) {
      // Handle specific known errors
      if (error.name === 'ResourceNotFoundError' || error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('Category', id, {
          source: 'UpdateCategoryCommandHandler.execute',
          suggestion: 'Check that the category ID exists',
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
      throw ErrorFactory.fromError(error, 'Failed to update category', {
        source: 'UpdateCategoryCommandHandler.execute',
        suggestion: 'Check category data and try again',
        metadata: {
          categoryId: id,
          categorySlug: dto.slug,
          updatedFields: Object.keys(dto),
        },
      })
    }
  }
}
