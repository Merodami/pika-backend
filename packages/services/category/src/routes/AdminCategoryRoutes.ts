import { Router } from 'express'
import { validateQuery, validateParams, validateBody } from '@pika/http'
import type {
  AdminCategoryQueryParams,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  MoveCategoryRequest,
  UpdateCategorySortOrderRequest,
  BulkDeleteCategoriesRequest,
} from '@pika/api/admin'
import { CategoryIdParam } from '@pika/api/common'

import type { AdminCategoryController } from '../controllers/AdminCategoryController.js'

/**
 * Creates admin category routes
 */
export function createAdminCategoryRoutes(
  adminCategoryController: AdminCategoryController,
): Router {
  const router = Router()

  // GET /admin/categories - List categories with admin filters
  router.get(
    '/',
    validateQuery(AdminCategoryQueryParams),
    adminCategoryController.getAllCategories,
  )

  // GET /admin/categories/hierarchy - Get hierarchical category tree for admin
  router.get('/hierarchy', adminCategoryController.getCategoryHierarchy)

  // GET /admin/categories/:id - Get category by ID for admin
  router.get(
    '/:id',
    validateParams(CategoryIdParam),
    adminCategoryController.getCategoryById,
  )

  // POST /admin/categories - Create new category
  router.post(
    '/',
    validateBody(CreateCategoryRequest),
    adminCategoryController.createCategory,
  )

  // PATCH /admin/categories/:id - Update category
  router.patch(
    '/:id',
    validateParams(CategoryIdParam),
    validateBody(UpdateCategoryRequest),
    adminCategoryController.updateCategory,
  )

  // DELETE /admin/categories/:id - Delete category
  router.delete(
    '/:id',
    validateParams(CategoryIdParam),
    adminCategoryController.deleteCategory,
  )

  // POST /admin/categories/:id/toggle-status - Toggle active/inactive
  router.post(
    '/:id/toggle-status',
    validateParams(CategoryIdParam),
    adminCategoryController.toggleCategoryStatus,
  )

  // POST /admin/categories/:id/move - Move category to different parent
  router.post(
    '/:id/move',
    validateParams(CategoryIdParam),
    validateBody(MoveCategoryRequest),
    adminCategoryController.moveCategory,
  )

  // POST /admin/categories/:id/sort-order - Update category sort order
  router.post(
    '/:id/sort-order',
    validateParams(CategoryIdParam),
    validateBody(UpdateCategorySortOrderRequest),
    adminCategoryController.updateCategorySortOrder,
  )

  // POST /admin/categories/bulk-delete - Bulk delete categories
  router.post(
    '/bulk-delete',
    validateBody(BulkDeleteCategoriesRequest),
    adminCategoryController.bulkDeleteCategories,
  )

  return router
}
