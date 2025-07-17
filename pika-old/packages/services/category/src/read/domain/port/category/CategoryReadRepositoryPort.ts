import { CategorySearchQuery } from '@category-read/application/use_cases/queries/CategorySearchQuery.js'
import { GetCategoryQuery } from '@category-read/application/use_cases/queries/GetCategoryQuery.js'
import { Category } from '@category-read/domain/entities/Category.js'
import type { PaginatedResult } from '@pika/types-core'

/**
 * CategoryReadRepositoryPort defines the contract for category data access in the read model.
 * Following Admin Service gold standard pattern with proper domain entities.
 * NO LEGACY CODE - Pure architectural excellence.
 */
export interface CategoryReadRepositoryPort {
  /**
   * Retrieve all categories matching the provided search criteria
   * Using proper domain entities following Admin pattern
   */
  getAllCategories(
    query: CategorySearchQuery,
  ): Promise<PaginatedResult<Category>>

  /**
   * Retrieve a single category by its unique identifier
   */
  getCategoryById(query: GetCategoryQuery): Promise<Category | null>

  /**
   * Get category by slug - Business logic method
   */
  getCategoryBySlug(slug: string): Promise<Category | null>

  /**
   * Get categories by level - Business logic method
   */
  getCategoriesByLevel(level: number): Promise<Category[]>

  /**
   * Check if category has active children
   */
  hasActiveChildren(categoryId: string): Promise<boolean>

  /**
   * Get full category hierarchy from root to specified category
   */
  getCategoryHierarchy(categoryId: string): Promise<Category[]>

  /**
   * Get marketplace visible categories (active and level > 0)
   */
  getMarketplaceCategories(): Promise<Category[]>

  /**
   * Get all root categories (no parent)
   */
  getRootCategories(): Promise<Category[]>

  /**
   * Get all active categories
   */
  getActiveCategories(): Promise<Category[]>
}
