import { Category } from '@category-read/domain/entities/Category.js'
import { CategoryReadRepositoryPort } from '@category-read/domain/port/category/CategoryReadRepositoryPort.js'
import { logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'

import { CategorySearchQuery } from './CategorySearchQuery.js'

/**
 * Handler for retrieving multiple categories based on search criteria
 * Following Admin Service pattern with proper domain entities
 */
export class GetAllCategoriesHandler {
  constructor(private readonly repository: CategoryReadRepositoryPort) {}

  /**
   * Executes the query to retrieve categories based on search parameters
   *
   * @param query - Search parameters for filtering and pagination
   * @returns Promise with paginated category results
   */
  public async execute(
    query: CategorySearchQuery,
  ): Promise<PaginatedResult<Category>> {
    logger.debug('Executing GetAllCategoriesHandler with params:', query)

    try {
      const queryWithDefaults: CategorySearchQuery = {
        // Sensible defaults
        page: 1,
        limit: 20,
        // Override with provided values
        ...query,
      }

      // Use new repository method with domain entities
      return await this.repository.getAllCategories(queryWithDefaults)
    } catch (err) {
      // Error is already properly categorized by repository
      // Just log and rethrow
      logger.error('Error in GetAllCategoriesHandler:', err)
      throw err
    }
  }
}
