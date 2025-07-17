import { Router } from 'express'
import { validateQuery, validateParams } from '@pika/http'
import type {
  CategoryQueryParams,
  CategoryHierarchyQuery,
  CategoryPathParams,
} from '@pika/api/public'
import { CategoryIdParam } from '@pika/api/common'

import type { CategoryController } from '../controllers/CategoryController.js'

/**
 * Creates public category routes
 */
export function createCategoryRoutes(categoryController: CategoryController): Router {
  const router = Router()

  // GET /categories - List categories with pagination and filtering
  router.get(
    '/',
    validateQuery(CategoryQueryParams),
    categoryController.getAllCategories
  )

  // GET /categories/hierarchy - Get hierarchical category tree
  router.get(
    '/hierarchy',
    validateQuery(CategoryHierarchyQuery),
    categoryController.getCategoryHierarchy
  )

  // GET /categories/:id - Get category by ID
  router.get(
    '/:id',
    validateParams(CategoryIdParam),
    categoryController.getCategoryById
  )

  // GET /categories/:id/path - Get category path (breadcrumb)
  router.get(
    '/:id/path',
    validateParams(CategoryPathParams),
    categoryController.getCategoryPath
  )

  return router
}