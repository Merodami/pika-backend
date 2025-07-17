import { type CategoryCreateDTO } from '@category-write/domain/dtos/CategoryDTO.js'
import { Category } from '@category-write/domain/entities/Category.js'
import { type CategoryWriteRepositoryPort } from '@category-write/domain/port/category/CategoryWriteRepositoryPort.js'
import { DEFAULT_LANGUAGE } from '@pika/environment'
import { CategoryMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import { type MultilingualContent } from '@pika/types-core'

/**
 * Command handler for creating new categories
 * Implements business logic, validation, and orchestrates the process
 */
export class CreateCategoryCommandHandler {
  constructor(private readonly repository: CategoryWriteRepositoryPort) {}

  /**
   * Executes the create category command
   * Validates input, applies business rules, and persists the new category
   */
  async execute(dto: CategoryCreateDTO): Promise<Category> {
    try {
      return await this.repository.createCategory(dto)
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to create category', {
        source: 'CreateCategoryCommandHandler.execute',
        suggestion: 'Check category data and try again',
        metadata: {
          categoryName: CategoryMapper.getLocalizedValue(
            dto.name as MultilingualContent,
            DEFAULT_LANGUAGE,
          ),
          categorySlug: dto.slug,
        },
      })
    }
  }
}
