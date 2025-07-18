import type {
  CategoryQueryParams,
  CategoryHierarchyQuery,
  CategoryPathParams,
} from '@pika/api/public'
import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import { getValidatedQuery } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { CategoryMapper } from '../mappers/CategoryMapper.js'
import type { NextFunction, Request, Response } from 'express'

import type { ICategoryService } from '../services/CategoryService.js'

/**
 * Handles public category operations
 */
export class CategoryController {
  constructor(private readonly categoryService: ICategoryService) {
    // Bind methods to preserve 'this' context
    this.getAllCategories = this.getAllCategories.bind(this)
    this.getCategoryById = this.getCategoryById.bind(this)
    this.getCategoryHierarchy = this.getCategoryHierarchy.bind(this)
    this.getCategoryPath = this.getCategoryPath.bind(this)
  }

  /**
   * GET /categories
   * Get all categories with filters and pagination
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'categories',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllCategories(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<CategoryQueryParams>(req)

      // Map API query to service params
      const params = {
        search: query.search,
        parentId: query.parentId,
        isActive: query.isActive,
        page: query.page,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      }

      const result = await this.categoryService.getAllCategories(params)

      // Convert to DTOs
      res.json({
        data: result.data.map((category) => CategoryMapper.toDTO(category)),
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /categories/:id
   * Get category by ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'category',
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

      res.json(CategoryMapper.toDTO(category))
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /categories/hierarchy
   * Get category hierarchy (tree structure)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'category:hierarchy',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCategoryHierarchy(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<CategoryHierarchyQuery>(req)

      const categories = await this.categoryService.getCategoryHierarchy(
        query.rootId,
      )

      res.json({
        data: categories.map((category) => CategoryMapper.toDTO(category)),
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /categories/:id/path
   * Get category path (breadcrumb trail)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'category:path',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCategoryPath(
    req: Request<CategoryPathParams>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      const path = await this.categoryService.getCategoryPath(id)

      res.json({
        data: path.map((category) => CategoryMapper.toDTO(category)),
      })
    } catch (error) {
      next(error)
    }
  }
}
