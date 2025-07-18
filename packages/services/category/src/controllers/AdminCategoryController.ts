import type {
  AdminCategoryQueryParams,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  MoveCategoryRequest,
  UpdateCategorySortOrderRequest,
  BulkDeleteCategoriesRequest,
} from '@pika/api/admin'
import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import { getValidatedQuery, RequestContext } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { CategoryMapper } from '../mappers/CategoryMapper.js'
import type { NextFunction, Request, Response } from 'express'

import type { ICategoryService } from '../services/CategoryService.js'

/**
 * Handles admin category management operations
 */
export class AdminCategoryController {
  constructor(private readonly categoryService: ICategoryService) {
    // Bind methods to preserve 'this' context
    this.getAllCategories = this.getAllCategories.bind(this)
    this.getCategoryById = this.getCategoryById.bind(this)
    this.createCategory = this.createCategory.bind(this)
    this.updateCategory = this.updateCategory.bind(this)
    this.deleteCategory = this.deleteCategory.bind(this)
    this.toggleCategoryStatus = this.toggleCategoryStatus.bind(this)
    this.moveCategory = this.moveCategory.bind(this)
    this.updateCategorySortOrder = this.updateCategorySortOrder.bind(this)
    this.bulkDeleteCategories = this.bulkDeleteCategories.bind(this)
    this.getCategoryHierarchy = this.getCategoryHierarchy.bind(this)
  }

  /**
   * GET /admin/categories
   * Get all categories with admin filters and pagination
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:categories',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllCategories(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<AdminCategoryQueryParams>(req)

      // Map API query to service params
      const params = {
        search: query.search,
        parentId: query.parentId,
        isActive: query.isActive,
        createdBy: query.createdBy,
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
   * GET /admin/categories/:id
   * Get category by ID for admin
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:category',
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
   * POST /admin/categories
   * Create new category
   */
  async createCategory(
    req: Request<{}, {}, CreateCategoryRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const data = req.body

      const categoryData = {
        ...data,
        createdBy: context.userId,
      }

      const category = await this.categoryService.createCategory(categoryData)

      const dto = CategoryMapper.toDTO(category)

      res.status(201).json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /admin/categories/:id
   * Update category information
   */
  async updateCategory(
    req: Request<{ id: string }, {}, UpdateCategoryRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const { id } = req.params
      const data = req.body

      const updateData = {
        ...data,
        updatedBy: context.userId,
      }

      const category = await this.categoryService.updateCategory(id, updateData)

      res.json(CategoryMapper.toDTO(category))
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/categories/:id
   * Delete category
   */
  async deleteCategory(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      await this.categoryService.deleteCategory(id)

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/categories/:id/toggle-status
   * Toggle category active/inactive status
   */
  async toggleCategoryStatus(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      const category = await this.categoryService.toggleCategoryStatus(id)

      res.json(CategoryMapper.toDTO(category))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/categories/:id/move
   * Move category to different parent
   */
  async moveCategory(
    req: Request<{ id: string }, {}, MoveCategoryRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const { newParentId } = req.body

      const category = await this.categoryService.moveCategory(id, newParentId)

      res.json(CategoryMapper.toDTO(category))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/categories/:id/sort-order
   * Update category sort order
   */
  async updateCategorySortOrder(
    req: Request<{ id: string }, {}, UpdateCategorySortOrderRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const { sortOrder } = req.body

      const category = await this.categoryService.updateCategorySortOrder(
        id,
        sortOrder,
      )

      res.json(CategoryMapper.toDTO(category))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/categories/bulk-delete
   * Bulk delete categories
   */
  async bulkDeleteCategories(
    req: Request<{}, {}, BulkDeleteCategoriesRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { categoryIds } = req.body

      // Delete categories one by one (repository handles children check)
      for (const categoryId of categoryIds) {
        await this.categoryService.deleteCategory(categoryId)
      }

      res.json({
        message: `Successfully deleted ${categoryIds.length} categories`,
        deletedCount: categoryIds.length,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/categories/hierarchy
   * Get category hierarchy for admin management
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:category:hierarchy',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCategoryHierarchy(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<{ rootId?: string }>(req)

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
}
