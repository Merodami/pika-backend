import { categoryCommon,categoryInternal } from '@pika/api'
import { validateBody,validateParams, validateQuery } from '@pika/http'
import { Router } from 'express'

import type { InternalCategoryController } from '../controllers/InternalCategoryController.js'

/**
 * Creates internal category routes for service-to-service communication
 */
export function createInternalCategoryRoutes(
  internalCategoryController: InternalCategoryController,
): Router {
  const router = Router()

  // GET /internal/categories - List categories for internal use
  router.get(
    '/',
    validateQuery(categoryInternal.InternalCategoryQueryParams),
    internalCategoryController.getAllCategories,
  )

  // GET /internal/categories/:id - Get category by ID for internal use
  router.get(
    '/:id',
    validateParams(categoryCommon.CategoryIdParam),
    internalCategoryController.getCategoryById,
  )

  // POST /internal/categories/validate - Validate category existence
  router.post(
    '/validate',
    validateBody(categoryInternal.ValidateCategoryRequest),
    internalCategoryController.validateCategories,
  )

  // POST /internal/categories/bulk - Get multiple categories by IDs
  router.post(
    '/bulk',
    validateBody(categoryInternal.BulkCategoryRequest),
    internalCategoryController.getCategoriesByIds,
  )

  // GET /internal/categories/hierarchy - Get category hierarchy for internal use
  router.get('/hierarchy', internalCategoryController.getCategoryHierarchy)

  return router
}
