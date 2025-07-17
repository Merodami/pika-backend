import { Category } from '@category-read/domain/entities/Category.js'
import { CategoryReadRepositoryPort } from '@category-read/domain/port/category/CategoryReadRepositoryPort.js'
import { ErrorFactory, logger } from '@pika/shared'

import { GetCategoryQuery } from './GetCategoryQuery.js'

/**
 * Handler for retrieving a single category by ID
 * Following Admin Service pattern with proper domain entities
 */
export class GetCategoryByIdHandler {
  constructor(private readonly repository: CategoryReadRepositoryPort) {}

  /**
   * Executes the query to retrieve a category by ID
   *
   * @param query - Query with category ID and options
   * @returns Promise with the category or throws a NotFoundError if not found
   */
  public async execute(query: GetCategoryQuery): Promise<Category> {
    logger.debug(`Executing GetCategoryByIdHandler with ID: ${query.id}`)

    try {
      // Use new repository method with domain entities
      const category = await this.repository.getCategoryById(query)

      if (!category) {
        logger.warn(`Category with ID ${query.id} not found`)
        throw ErrorFactory.resourceNotFound('Category', query.id, {
          source: 'GetCategoryByIdHandler.execute',
          suggestion:
            'Check that the category ID exists and is in the correct format',
        })
      }

      return category
    } catch (err) {
      // Error is already properly categorized by repository
      // Just log and rethrow
      logger.error('Error in GetCategoryByIdHandler:', err)
      throw err
    }
  }
}
