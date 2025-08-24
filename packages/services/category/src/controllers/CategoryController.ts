import { CategoryMapper } from '@category/mappers/CategoryMapper.js'
import type { ICategoryService } from '@category/types/interfaces.js'
import { categoryPublic } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import {
  getRequestLanguage,
  getValidatedQuery,
  paginatedResponse,
  validateResponse,
} from '@pika/http'
import type { NextFunction, Request, Response } from 'express'

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
  async getAllCategories(
    req: Request,
    res: Response<categoryPublic.CategoryListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<categoryPublic.CategoryQueryParams>(req)
      const language = getRequestLanguage(req)

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

      const result = await this.categoryService.getAllCategories(
        params,
        language,
      )

      // Use paginatedResponse utility + validation
      const response = paginatedResponse(result, CategoryMapper.toDTO)
      const validatedResponse = validateResponse(
        categoryPublic.CategoryListResponse,
        response,
        'CategoryController.getAllCategories',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /categories/:id
   * Get category by ID
   */
  async getCategoryById(
    req: Request<categoryPublic.CategoryPathParams>,
    res: Response<categoryPublic.CategoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const language = getRequestLanguage(req)

      const category = await this.categoryService.getCategoryById(id, language)

      // Transform to DTO
      const response = CategoryMapper.toDTO(category)

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryPublic.CategoryResponse,
        response,
        'CategoryController.getCategoryById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /categories/hierarchy
   * Get category hierarchy (tree structure)
   */
  async getCategoryHierarchy(
    req: Request,
    res: Response<categoryPublic.CategoryHierarchyResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query =
        getValidatedQuery<categoryPublic.CategoryHierarchyQuery>(req)
      const language = getRequestLanguage(req)

      const categories = await this.categoryService.getCategoryHierarchy(
        query.rootId,
        language,
      )

      // Transform to DTOs
      const response = {
        data: categories.map((category) => CategoryMapper.toDTO(category)),
      }

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryPublic.CategoryHierarchyResponse,
        response,
        'CategoryController.getCategoryHierarchy',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /categories/:id/path
   * Get category path (breadcrumb trail)
   */
  async getCategoryPath(
    req: Request<categoryPublic.CategoryPathParams>,
    res: Response<categoryPublic.CategoryPathResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const language = getRequestLanguage(req)

      const path = await this.categoryService.getCategoryPath(id, language)

      // Transform to DTOs
      const response = {
        data: path.map((category) => CategoryMapper.toDTO(category)),
      }

      // Validate response against Zod schema
      const validatedResponse = validateResponse(
        categoryPublic.CategoryPathResponse,
        response,
        'CategoryController.getCategoryPath',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
