import { Router } from 'express'
import { validateQuery, validateParams, validateBody } from '@pika/http'
import type {
  InternalCategoryQueryParams,
  ValidateCategoryRequest,
  BulkCategoryRequest,
} from '@pika/api/internal'
import { CategoryIdParam } from '@pika/api/common'

import type { InternalCategoryController } from '../controllers/InternalCategoryController.js'

/**
 * Creates internal category routes for service-to-service communication
 */
export function createInternalCategoryRoutes(internalCategoryController: InternalCategoryController): Router {
  const router = Router()

  // GET /internal/categories - List categories for internal use
  router.get(
    '/',
    validateQuery(InternalCategoryQueryParams),
    internalCategoryController.getAllCategories
  )

  // GET /internal/categories/:id - Get category by ID for internal use
  router.get(
    '/:id',
    validateParams(CategoryIdParam),
    internalCategoryController.getCategoryById
  )

  // POST /internal/categories/validate - Validate category existence
  router.post(
    '/validate',
    validateBody(ValidateCategoryRequest),
    internalCategoryController.validateCategories
  )

  // POST /internal/categories/bulk - Get multiple categories by IDs
  router.post(
    '/bulk',
    validateBody(BulkCategoryRequest),
    internalCategoryController.getCategoriesByIds
  )

  // GET /internal/categories/hierarchy - Get category hierarchy for internal use
  router.get(
    '/hierarchy',
    internalCategoryController.getCategoryHierarchy
  )

  return router
}