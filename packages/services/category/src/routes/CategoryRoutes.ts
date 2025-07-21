import { categoryCommon,categoryPublic } from '@pika/api'
import { validateParams,validateQuery } from '@pika/http'
import { Router } from 'express'

import type { CategoryController } from '../controllers/CategoryController.js'

/**
 * Creates public category routes
 */
export function createCategoryRoutes(
  categoryController: CategoryController,
): Router {
  const router = Router()

  // GET /categories - List categories with pagination and filtering
  router.get(
    '/',
    validateQuery(categoryPublic.CategoryQueryParams),
    categoryController.getAllCategories,
  )

  // GET /categories/hierarchy - Get hierarchical category tree
  router.get(
    '/hierarchy',
    validateQuery(categoryPublic.CategoryHierarchyQuery),
    categoryController.getCategoryHierarchy,
  )

  // GET /categories/:id - Get category by ID
  router.get(
    '/:id',
    validateParams(categoryCommon.CategoryIdParam),
    categoryController.getCategoryById,
  )

  // GET /categories/:id/path - Get category path (breadcrumb)
  router.get(
    '/:id/path',
    validateParams(categoryPublic.CategoryPathParams),
    categoryController.getCategoryPath,
  )

  return router
}
