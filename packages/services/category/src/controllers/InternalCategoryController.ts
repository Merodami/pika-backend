import { categoryInternal } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { getValidatedQuery } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import type { NextFunction, Request, Response } from 'express'

import { CategoryMapper } from '../mappers/CategoryMapper.js'
import type { ICategoryService } from '../types/interfaces.js'

/**
 * Handles internal category operations for service-to-service communication
 */
export class InternalCategoryController {
  constructor(private readonly categoryService: ICategoryService) {
    // Bind methods to preserve 'this' context
    this.getAllCategories = this.getAllCategories.bind(this)
    this.getCategoryById = this.getCategoryById.bind(this)
    this.getCategoriesByIds = this.getCategoriesByIds.bind(this)
    this.validateCategories = this.validateCategories.bind(this)
    this.getActiveCategoriesOnly = this.getActiveCategoriesOnly.bind(this)
    this.getCategoryHierarchy = this.getCategoryHierarchy.bind(this)
  }

  /**
   * GET /internal/categories/:id
   * Get category by ID (internal service use)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'internal:category',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCategoryById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      const category = await this.categoryService.getCategoryById(id)

      // Return minimal data for internal use
      res.json(CategoryMapper.toInternalDTO(category))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/categories/bulk
   * Get multiple categories by IDs (internal service use)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'internal:categories:bulk',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCategoriesByIds(
    req: Request<{}, {}, categoryInternal.BulkCategoryRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { categoryIds } = req.body

      const categories =
        await this.categoryService.getCategoriesByIds(categoryIds)

      res.json({
        data: categories.map((category) =>
          CategoryMapper.toInternalDTO(category),
        ),
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/categories/validate
   * Validate category IDs exist and are active (internal service use)
   */
  async validateCategories(
    req: Request<{}, {}, categoryInternal.ValidateCategoryRequest>,
    res: Response<categoryInternal.ValidateCategoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { categoryIds } = req.body

      const validationResults: categoryInternal.CategoryValidationResult[] =
        await Promise.all(
          categoryIds.map(
            async (
              categoryId,
            ): Promise<categoryInternal.CategoryValidationResult> => {
              try {
                const category =
                  await this.categoryService.getCategoryById(categoryId)

                return {
                  categoryId,
                  exists: true,
                  isActive: category.isActive,
                  valid: category.isActive,
                }
              } catch {
                return {
                  categoryId,
                  exists: false,
                  isActive: false,
                  valid: false,
                }
              }
            },
          ),
        )

      const allValid = validationResults.every((result) => result.valid)

      res.json({
        valid: allValid,
        results: validationResults,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/categories/active
   * Get all active categories (internal service use)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'internal:categories:active',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getActiveCategoriesOnly(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const params = {
        isActive: true,
        page: 1,
        limit: 1000, // High limit for internal use
        sortBy: 'sortOrder' as const,
        sortOrder: 'asc' as const,
      }

      const result = await this.categoryService.getAllCategories(params)

      res.json({
        data: result.data.map((category) =>
          CategoryMapper.toInternalDTO(category),
        ),
        total: result.pagination.total,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/categories
   * Get all categories (internal service use)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'internal:categories',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getAllCategories(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query =
        getValidatedQuery<categoryInternal.InternalCategoryQueryParams>(req)

      const params = {
        isActive: query.isActive,
        page: 1,
        limit: 1000, // High limit for internal use
        sortBy: 'sortOrder' as const,
        sortOrder: 'asc' as const,
      }

      const result = await this.categoryService.getAllCategories(params)

      res.json({
        data: result.data.map((category) =>
          CategoryMapper.toInternalDTO(category),
        ),
        total: result.pagination.total,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/categories/hierarchy
   * Get category hierarchy (internal service use)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'internal:categories:hierarchy',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCategoryHierarchy(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const categories = await this.categoryService.getCategoryHierarchy()

      res.json({
        data: categories.map((category) =>
          CategoryMapper.toInternalDTO(category),
        ),
      })
    } catch (error) {
      next(error)
    }
  }
}
