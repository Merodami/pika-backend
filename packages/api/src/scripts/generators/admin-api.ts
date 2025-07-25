// Updated imports to use @api paths
import type { ZodRegistry } from '@api/common/registry/base.js'
import * as adminBusinessSchemas from '@api/schemas/business/admin/management.js'
import * as businessParameters from '@api/schemas/business/common/parameters.js'
import * as adminCategorySchemas from '@api/schemas/category/admin/management.js'
import * as categoryParameters from '@api/schemas/category/common/parameters.js'
import * as adminPaymentSchemas from '@api/schemas/payment/admin/transactions.js'
import * as adminPdfSchemas from '@api/schemas/pdf/admin/voucher-book.js'
import * as pdfParameters from '@api/schemas/pdf/common/parameters.js'
import { UserId } from '@api/schemas/shared/branded.js'
import { ErrorResponse } from '@api/schemas/shared/errors.js'
import { DateTime, UUID } from '@api/schemas/shared/primitives.js'
import { MessageResponse } from '@api/schemas/shared/responses.js'
import * as adminStorageSchemas from '@api/schemas/storage/admin/management.js'
import * as storageParameters from '@api/schemas/storage/common/parameters.js'
import * as adminSupportSchemas from '@api/schemas/support/admin/tickets.js'
import * as supportParameterSchemas from '@api/schemas/support/common/parameters.js'
import * as adminUserSchemas from '@api/schemas/user/admin/index.js'
import * as userVerificationSchemas from '@api/schemas/user/public/verification.js'
import * as adminVoucherSchemas from '@api/schemas/voucher/admin/management.js'
import * as adminVoucherQueries from '@api/schemas/voucher/admin/queries.js'
import * as voucherParameters from '@api/schemas/voucher/public/parameters.js'
import { z } from 'zod'

/**
 * Register all admin API schemas and routes
 */
export function registerAdminAPI(registry: ZodRegistry): void {
  // ============= Business Management Schemas =============
  registry.registerSchema(
    'AdminBusinessResponse',
    adminBusinessSchemas.AdminBusinessResponse,
  )
  registry.registerSchema(
    'CreateBusinessRequest',
    adminBusinessSchemas.CreateBusinessRequest,
  )
  registry.registerSchema(
    'UpdateBusinessRequest',
    adminBusinessSchemas.UpdateBusinessRequest,
  )
  registry.registerSchema(
    'AdminBusinessQueryParams',
    adminBusinessSchemas.AdminBusinessQueryParams,
  )
  registry.registerSchema(
    'AdminBusinessListResponse',
    adminBusinessSchemas.AdminBusinessListResponse,
  )
  registry.registerSchema(
    'ToggleBusinessVerificationRequest',
    adminBusinessSchemas.ToggleBusinessVerificationRequest,
  )
  registry.registerSchema(
    'ToggleBusinessActivationRequest',
    adminBusinessSchemas.ToggleBusinessActivationRequest,
  )
  registry.registerSchema(
    'BulkBusinessUpdateRequest',
    adminBusinessSchemas.BulkBusinessUpdateRequest,
  )
  registry.registerSchema(
    'BulkBusinessOperationResponse',
    adminBusinessSchemas.BulkBusinessOperationResponse,
  )
  registry.registerSchema(
    'BulkDeleteBusinessesRequest',
    adminBusinessSchemas.BulkDeleteBusinessesRequest,
  )
  registry.registerSchema(
    'UpdateBusinessRatingRequest',
    adminBusinessSchemas.UpdateBusinessRatingRequest,
  )
  registry.registerSchema('BusinessIdParam', businessParameters.BusinessIdParam)

  // ============= Category Management Schemas =============
  registry.registerSchema(
    'AdminCategoryResponse',
    adminCategorySchemas.AdminCategoryResponse,
  )
  registry.registerSchema(
    'CreateCategoryRequest',
    adminCategorySchemas.CreateCategoryRequest,
  )
  registry.registerSchema(
    'UpdateCategoryRequest',
    adminCategorySchemas.UpdateCategoryRequest,
  )
  registry.registerSchema(
    'AdminCategoryQueryParams',
    adminCategorySchemas.AdminCategoryQueryParams,
  )
  registry.registerSchema(
    'AdminCategoryListResponse',
    adminCategorySchemas.AdminCategoryListResponse,
  )
  registry.registerSchema(
    'AdminCategoryTreeResponse',
    adminCategorySchemas.AdminCategoryTreeResponse,
  )
  registry.registerSchema(
    'MoveCategoryRequest',
    adminCategorySchemas.MoveCategoryRequest,
  )
  registry.registerSchema(
    'UpdateCategorySortOrderRequest',
    adminCategorySchemas.UpdateCategorySortOrderRequest,
  )
  registry.registerSchema(
    'ToggleCategoryActivationRequest',
    adminCategorySchemas.ToggleCategoryActivationRequest,
  )
  registry.registerSchema(
    'BulkCategoryUpdateRequest',
    adminCategorySchemas.BulkCategoryUpdateRequest,
  )
  registry.registerSchema(
    'BulkCategoryOperationResponse',
    adminCategorySchemas.BulkCategoryOperationResponse,
  )
  registry.registerSchema(
    'BulkDeleteCategoriesRequest',
    adminCategorySchemas.BulkDeleteCategoriesRequest,
  )

  // Category parameter schemas
  registry.registerSchema('CategoryIdParam', categoryParameters.CategoryIdParam)

  // ============= Storage Management Schemas =============
  registry.registerSchema(
    'AdminFileDetailResponse',
    adminStorageSchemas.AdminFileDetailResponse,
  )
  registry.registerSchema(
    'AdminFileQueryParams',
    adminStorageSchemas.AdminFileQueryParams,
  )
  registry.registerSchema(
    'AdminFileListResponse',
    adminStorageSchemas.AdminFileListResponse,
  )
  registry.registerSchema(
    'AdminUpdateFileRequest',
    adminStorageSchemas.AdminUpdateFileRequest,
  )
  registry.registerSchema(
    'AdminBulkFileActionRequest',
    adminStorageSchemas.AdminBulkFileActionRequest,
  )
  registry.registerSchema(
    'AdminBulkFileActionResponse',
    adminStorageSchemas.AdminBulkFileActionResponse,
  )
  registry.registerSchema(
    'StorageAnalyticsResponse',
    adminStorageSchemas.StorageAnalyticsResponse,
  )
  registry.registerSchema(
    'StorageConfigurationResponse',
    adminStorageSchemas.StorageConfigurationResponse,
  )
  registry.registerSchema(
    'UpdateStorageConfigurationRequest',
    adminStorageSchemas.UpdateStorageConfigurationRequest,
  )

  // Storage parameter schemas
  registry.registerSchema('FileIdParam', storageParameters.FileIdParam)

  // ============= Voucher Management Schemas =============
  registry.registerSchema(
    'AdminVoucherDetailResponse',
    adminVoucherSchemas.AdminVoucherDetailResponse,
  )
  registry.registerSchema(
    'AdminVoucherListResponse',
    adminVoucherSchemas.AdminVoucherListResponse,
  )
  registry.registerSchema(
    'CreateVoucherRequest',
    adminVoucherSchemas.CreateVoucherRequest,
  )
  registry.registerSchema(
    'UpdateVoucherRequest',
    adminVoucherSchemas.UpdateVoucherRequest,
  )
  registry.registerSchema(
    'AdminVoucherQueryParams',
    adminVoucherQueries.AdminVoucherQueryParams,
  )
  registry.registerSchema(
    'BulkVoucherUpdateRequest',
    adminVoucherSchemas.BulkVoucherUpdateRequest,
  )
  registry.registerSchema(
    'BulkVoucherOperationResponse',
    adminVoucherSchemas.BulkVoucherOperationResponse,
  )
  registry.registerSchema(
    'VoucherAnalyticsResponse',
    adminVoucherSchemas.VoucherAnalyticsResponse,
  )

  // Voucher parameter schemas
  registry.registerSchema('VoucherPathParams', voucherParameters.VoucherPathParams)

  // ============= Payment/Transaction Schemas =============
  registry.registerSchema(
    'AdminTransactionListResponse',
    adminPaymentSchemas.AdminTransactionListResponse,
  )
  registry.registerSchema(
    'AdminTransactionDetailResponse',
    adminPaymentSchemas.AdminTransactionDetailResponse,
  )
  registry.registerSchema(
    'AdminTransactionQueryParams',
    adminPaymentSchemas.AdminTransactionQueryParams,
  )
  registry.registerSchema(
    'RefundTransactionRequest',
    adminPaymentSchemas.RefundTransactionRequest,
  )
  registry.registerSchema(
    'PaymentStatsResponse',
    adminPaymentSchemas.PaymentStatsResponse,
  )
  registry.registerSchema(
    'PayoutListResponse',
    adminPaymentSchemas.PayoutListResponse,
  )
  registry.registerSchema(
    'CreatePayoutRequest',
    adminPaymentSchemas.CreatePayoutRequest,
  )
  registry.registerSchema('PayoutIdParam', adminPaymentSchemas.PayoutIdParam)

  // ============= Support/Ticket Schemas =============
  registry.registerSchema(
    'AdminTicketListResponse',
    adminSupportSchemas.AdminTicketListResponse,
  )
  registry.registerSchema(
    'AdminTicketDetailResponse',
    adminSupportSchemas.AdminTicketDetailResponse,
  )
  registry.registerSchema(
    'AdminTicketQueryParams',
    adminSupportSchemas.AdminTicketQueryParams,
  )
  registry.registerSchema(
    'AssignTicketRequest',
    adminSupportSchemas.AssignTicketRequest,
  )
  registry.registerSchema(
    'UpdateTicketStatusRequest',
    adminSupportSchemas.UpdateTicketStatusRequest,
  )
  registry.registerSchema(
    'TicketStatsResponse',
    adminSupportSchemas.TicketStatsResponse,
  )
  registry.registerSchema(
    'AgentPerformanceResponse',
    adminSupportSchemas.AgentPerformanceResponse,
  )
  registry.registerSchema(
    'TicketIdParam',
    supportParameterSchemas.TicketIdParam,
  )
  registry.registerSchema(
    'AdminUpdateProblemRequest',
    adminSupportSchemas.AdminUpdateProblemRequest,
  )

  // ============= User Management Schemas =============
  registry.registerSchema(
    'AdminUserListResponse',
    adminUserSchemas.AdminUserListResponse,
  )
  registry.registerSchema(
    'AdminUserDetailResponse',
    adminUserSchemas.AdminUserDetailResponse,
  )
  registry.registerSchema(
    'AdminUserQueryParams',
    adminUserSchemas.AdminUserQueryParams,
  )
  registry.registerSchema(
    'AdminCreateUserRequest',
    adminUserSchemas.AdminCreateUserRequest,
  )
  registry.registerSchema(
    'AdminUpdateUserRequest',
    adminUserSchemas.AdminUpdateUserRequest,
  )
  registry.registerSchema('BanUserRequest', adminUserSchemas.BanUserRequest)
  registry.registerSchema('UnbanUserRequest', adminUserSchemas.UnbanUserRequest)
  registry.registerSchema(
    'AdminUploadUserAvatarRequest',
    adminUserSchemas.AdminUploadUserAvatarRequest,
  )
  registry.registerSchema(
    'AdminUploadUserAvatarResponse',
    adminUserSchemas.AdminUploadUserAvatarResponse,
  )
  registry.registerSchema(
    'UpdateAdminProfileRequest',
    adminUserSchemas.UpdateAdminProfileRequest,
  )
  registry.registerSchema(
    'UserActivityResponse',
    adminUserSchemas.UserActivityResponse,
  )
  registry.registerSchema(
    'UserStatsResponse',
    adminUserSchemas.UserStatsResponse,
  )
  registry.registerSchema(
    'BulkUserActionRequest',
    adminUserSchemas.BulkUserActionRequest,
  )
  registry.registerSchema('UserIdParam', adminUserSchemas.UserIdParam)

  // ============= PDF/Voucher Book Management Schemas =============
  registry.registerSchema(
    'AdminVoucherBookResponse',
    adminPdfSchemas.AdminVoucherBookResponse,
  )
  registry.registerSchema(
    'AdminVoucherBookListResponse',
    adminPdfSchemas.AdminVoucherBookListResponse,
  )
  registry.registerSchema(
    'CreateVoucherBookRequest',
    adminPdfSchemas.CreateVoucherBookRequest,
  )
  registry.registerSchema(
    'UpdateVoucherBookRequest',
    adminPdfSchemas.UpdateVoucherBookRequest,
  )
  registry.registerSchema(
    'PublishVoucherBookRequest',
    adminPdfSchemas.PublishVoucherBookRequest,
  )
  registry.registerSchema(
    'ArchiveVoucherBookRequest',
    adminPdfSchemas.ArchiveVoucherBookRequest,
  )
  registry.registerSchema(
    'GeneratePdfRequest',
    adminPdfSchemas.GeneratePdfRequest,
  )
  registry.registerSchema(
    'GeneratePdfResponse',
    adminPdfSchemas.GeneratePdfResponse,
  )
  registry.registerSchema(
    'BulkVoucherBookOperationRequest',
    adminPdfSchemas.BulkVoucherBookOperationRequest,
  )
  registry.registerSchema(
    'BulkVoucherBookOperationResponse',
    adminPdfSchemas.BulkVoucherBookOperationResponse,
  )
  registry.registerSchema(
    'AdminVoucherBookQueryParams',
    adminPdfSchemas.AdminVoucherBookQueryParams,
  )

  // PDF parameter schemas
  registry.registerSchema(
    'VoucherBookIdParam',
    pdfParameters.VoucherBookIdParam,
  )

  // User Verification Schemas (Admin)
  registry.registerSchema(
    'UnifiedVerificationRequest',
    userVerificationSchemas.UnifiedVerificationRequest,
  )
  registry.registerSchema(
    'UnifiedResendVerificationRequest',
    userVerificationSchemas.UnifiedResendVerificationRequest,
  )
  registry.registerSchema(
    'UnifiedVerificationResponse',
    userVerificationSchemas.UnifiedVerificationResponse,
  )

  // ============= Register Routes =============
  registerAdminRoutes(registry)
}

/**
 * Register all admin API routes
 */
function registerAdminRoutes(registry: ZodRegistry): void {
  // ============= Category Management Routes =============
  
  // Get all categories
  registry.registerRoute({
    method: 'get',
    path: '/categories',
    summary: 'List all categories with admin details',
    tags: ['Category Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminCategorySchemas.AdminCategoryQueryParams,
    },
    responses: {
      200: {
        description: 'List of categories',
        content: {
          'application/json': {
            schema: adminCategorySchemas.AdminCategoryListResponse,
          },
        },
      },
    },
  })

  // Get category tree
  registry.registerRoute({
    method: 'get',
    path: '/categories/tree',
    summary: 'Get category hierarchy tree',
    tags: ['Category Management'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Category tree structure',
        content: {
          'application/json': {
            schema: adminCategorySchemas.AdminCategoryTreeResponse,
          },
        },
      },
    },
  })

  // Get category by ID
  registry.registerRoute({
    method: 'get',
    path: '/categories/{id}',
    summary: 'Get category details',
    tags: ['Category Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: categoryParameters.CategoryIdParam,
    },
    responses: {
      200: {
        description: 'Category details',
        content: {
          'application/json': {
            schema: adminCategorySchemas.AdminCategoryResponse,
          },
        },
      },
      404: {
        description: 'Category not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Create category
  registry.registerRoute({
    method: 'post',
    path: '/categories',
    summary: 'Create a new category',
    tags: ['Category Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminCategorySchemas.CreateCategoryRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Category created successfully',
        content: {
          'application/json': {
            schema: adminCategorySchemas.AdminCategoryResponse,
          },
        },
      },
      400: {
        description: 'Invalid category data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Update category
  registry.registerRoute({
    method: 'put',
    path: '/categories/{id}',
    summary: 'Update category information',
    tags: ['Category Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: categoryParameters.CategoryIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminCategorySchemas.UpdateCategoryRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Category updated successfully',
        content: {
          'application/json': {
            schema: adminCategorySchemas.AdminCategoryResponse,
          },
        },
      },
      404: {
        description: 'Category not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Delete category
  registry.registerRoute({
    method: 'delete',
    path: '/categories/{id}',
    summary: 'Delete a category',
    tags: ['Category Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: categoryParameters.CategoryIdParam,
    },
    responses: {
      204: {
        description: 'Category deleted successfully',
      },
      404: {
        description: 'Category not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Move category
  registry.registerRoute({
    method: 'patch',
    path: '/categories/{id}/move',
    summary: 'Move category to different parent',
    tags: ['Category Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: categoryParameters.CategoryIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminCategorySchemas.MoveCategoryRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Category moved successfully',
        content: {
          'application/json': {
            schema: adminCategorySchemas.AdminCategoryResponse,
          },
        },
      },
      404: {
        description: 'Category not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Toggle category activation
  registry.registerRoute({
    method: 'patch',
    path: '/categories/{id}/activation',
    summary: 'Toggle category activation status',
    tags: ['Category Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: categoryParameters.CategoryIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminCategorySchemas.ToggleCategoryActivationRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Category activation toggled successfully',
        content: {
          'application/json': {
            schema: adminCategorySchemas.AdminCategoryResponse,
          },
        },
      },
      404: {
        description: 'Category not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Bulk update categories
  registry.registerRoute({
    method: 'patch',
    path: '/categories/bulk-update',
    summary: 'Update multiple categories',
    tags: ['Category Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminCategorySchemas.BulkCategoryUpdateRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Categories updated successfully',
        content: {
          'application/json': {
            schema: adminCategorySchemas.BulkCategoryOperationResponse,
          },
        },
      },
      400: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Bulk delete categories
  registry.registerRoute({
    method: 'delete',
    path: '/categories/bulk-delete',
    summary: 'Delete multiple categories',
    tags: ['Category Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminCategorySchemas.BulkDeleteCategoriesRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Categories deleted successfully',
        content: {
          'application/json': {
            schema: adminCategorySchemas.BulkCategoryOperationResponse,
          },
        },
      },
      400: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // ============= Business Management Routes =============

  // Get all businesses
  registry.registerRoute({
    method: 'get',
    path: '/businesses',
    summary: 'List all businesses with admin details',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminBusinessSchemas.AdminBusinessQueryParams,
    },
    responses: {
      200: {
        description: 'List of businesses',
        content: {
          'application/json': {
            schema: adminBusinessSchemas.AdminBusinessListResponse,
          },
        },
      },
    },
  })

  // Create business
  registry.registerRoute({
    method: 'post',
    path: '/businesses',
    summary: 'Create a new business',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminBusinessSchemas.CreateBusinessRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Business created successfully',
        content: {
          'application/json': {
            schema: adminBusinessSchemas.AdminBusinessResponse,
          },
        },
      },
    },
  })

  // Get business by ID
  registry.registerRoute({
    method: 'get',
    path: '/businesses/{id}',
    summary: 'Get business details',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: businessParameters.BusinessIdParam,
    },
    responses: {
      200: {
        description: 'Business details',
        content: {
          'application/json': {
            schema: adminBusinessSchemas.AdminBusinessResponse,
          },
        },
      },
    },
  })

  // Update business
  registry.registerRoute({
    method: 'put',
    path: '/businesses/{id}',
    summary: 'Update business information',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: businessParameters.BusinessIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminBusinessSchemas.UpdateBusinessRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Business updated successfully',
        content: {
          'application/json': {
            schema: adminBusinessSchemas.AdminBusinessResponse,
          },
        },
      },
    },
  })

  // Delete business
  registry.registerRoute({
    method: 'delete',
    path: '/businesses/{id}',
    summary: 'Delete business',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: businessParameters.BusinessIdParam,
    },
    responses: {
      204: {
        description: 'Business deleted successfully',
      },
    },
  })

  // Toggle business verification
  registry.registerRoute({
    method: 'patch',
    path: '/businesses/{id}/verification',
    summary: 'Toggle business verification status',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: businessParameters.BusinessIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminBusinessSchemas.ToggleBusinessVerificationRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Business verification updated',
        content: {
          'application/json': {
            schema: adminBusinessSchemas.AdminBusinessResponse,
          },
        },
      },
    },
  })

  // Toggle business activation
  registry.registerRoute({
    method: 'patch',
    path: '/businesses/{id}/activation',
    summary: 'Toggle business activation status',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: businessParameters.BusinessIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminBusinessSchemas.ToggleBusinessActivationRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Business activation updated',
        content: {
          'application/json': {
            schema: adminBusinessSchemas.AdminBusinessResponse,
          },
        },
      },
    },
  })

  // Update business rating
  registry.registerRoute({
    method: 'patch',
    path: '/businesses/{id}/rating',
    summary: 'Update business rating',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: businessParameters.BusinessIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminBusinessSchemas.UpdateBusinessRatingRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Business rating updated',
        content: {
          'application/json': {
            schema: adminBusinessSchemas.AdminBusinessResponse,
          },
        },
      },
    },
  })

  // Bulk update businesses
  registry.registerRoute({
    method: 'patch',
    path: '/businesses/bulk',
    summary: 'Update multiple businesses at once',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminBusinessSchemas.BulkBusinessUpdateRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Bulk business update results',
        content: {
          'application/json': {
            schema: adminBusinessSchemas.BulkBusinessOperationResponse,
          },
        },
      },
    },
  })

  // Bulk delete businesses
  registry.registerRoute({
    method: 'delete',
    path: '/businesses/bulk',
    summary: 'Delete multiple businesses',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminBusinessSchemas.BulkDeleteBusinessesRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Bulk business deletion results',
        content: {
          'application/json': {
            schema: adminBusinessSchemas.BulkBusinessOperationResponse,
          },
        },
      },
    },
  })

  // ============= Storage Management Routes =============

  // Get all files
  registry.registerRoute({
    method: 'get',
    path: '/storage/files',
    summary: 'List all files with admin details',
    tags: ['Storage Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminStorageSchemas.AdminFileQueryParams,
    },
    responses: {
      200: {
        description: 'List of files',
        content: {
          'application/json': {
            schema: adminStorageSchemas.AdminFileListResponse,
          },
        },
      },
    },
  })

  // Get file by ID
  registry.registerRoute({
    method: 'get',
    path: '/storage/files/{fileId}',
    summary: 'Get file details',
    tags: ['Storage Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: storageParameters.FileIdParam,
    },
    responses: {
      200: {
        description: 'File details',
        content: {
          'application/json': {
            schema: adminStorageSchemas.AdminFileDetailResponse,
          },
        },
      },
      404: {
        description: 'File not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Update file
  registry.registerRoute({
    method: 'patch',
    path: '/storage/files/{fileId}',
    summary: 'Update file information',
    tags: ['Storage Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: storageParameters.FileIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminStorageSchemas.AdminUpdateFileRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'File updated successfully',
        content: {
          'application/json': {
            schema: adminStorageSchemas.AdminFileDetailResponse,
          },
        },
      },
      404: {
        description: 'File not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Delete file
  registry.registerRoute({
    method: 'delete',
    path: '/storage/files/{fileId}',
    summary: 'Delete a file',
    tags: ['Storage Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: storageParameters.FileIdParam,
    },
    responses: {
      204: {
        description: 'File deleted successfully',
      },
      404: {
        description: 'File not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Bulk file actions
  registry.registerRoute({
    method: 'post',
    path: '/storage/files/bulk-action',
    summary: 'Perform bulk actions on files',
    tags: ['Storage Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminStorageSchemas.AdminBulkFileActionRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Bulk action completed',
        content: {
          'application/json': {
            schema: adminStorageSchemas.AdminBulkFileActionResponse,
          },
        },
      },
      400: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Get storage analytics
  registry.registerRoute({
    method: 'get',
    path: '/storage/analytics',
    summary: 'Get storage usage analytics',
    tags: ['Storage Management'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Storage analytics data',
        content: {
          'application/json': {
            schema: adminStorageSchemas.StorageAnalyticsResponse,
          },
        },
      },
    },
  })

  // Get storage configuration
  registry.registerRoute({
    method: 'get',
    path: '/storage/configuration',
    summary: 'Get storage service configuration',
    tags: ['Storage Management'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Storage configuration',
        content: {
          'application/json': {
            schema: adminStorageSchemas.StorageConfigurationResponse,
          },
        },
      },
    },
  })

  // Update storage configuration
  registry.registerRoute({
    method: 'put',
    path: '/storage/configuration',
    summary: 'Update storage service configuration',
    tags: ['Storage Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminStorageSchemas.UpdateStorageConfigurationRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Configuration updated successfully',
        content: {
          'application/json': {
            schema: adminStorageSchemas.StorageConfigurationResponse,
          },
        },
      },
      400: {
        description: 'Invalid configuration data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // ============= Voucher Management Routes =============

  // Get all vouchers
  registry.registerRoute({
    method: 'get',
    path: '/vouchers',
    summary: 'List all vouchers with admin details',
    tags: ['Voucher Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminVoucherQueries.AdminVoucherQueryParams,
    },
    responses: {
      200: {
        description: 'List of vouchers',
        content: {
          'application/json': {
            schema: adminVoucherSchemas.AdminVoucherListResponse,
          },
        },
      },
    },
  })

  // Get voucher by ID
  registry.registerRoute({
    method: 'get',
    path: '/vouchers/{id}',
    summary: 'Get voucher details',
    tags: ['Voucher Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: voucherParameters.VoucherPathParams,
    },
    responses: {
      200: {
        description: 'Voucher details',
        content: {
          'application/json': {
            schema: adminVoucherSchemas.AdminVoucherDetailResponse,
          },
        },
      },
      404: {
        description: 'Voucher not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Create voucher
  registry.registerRoute({
    method: 'post',
    path: '/vouchers',
    summary: 'Create a new voucher',
    tags: ['Voucher Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminVoucherSchemas.CreateVoucherRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Voucher created successfully',
        content: {
          'application/json': {
            schema: adminVoucherSchemas.AdminVoucherDetailResponse,
          },
        },
      },
      400: {
        description: 'Invalid voucher data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Update voucher
  registry.registerRoute({
    method: 'put',
    path: '/vouchers/{id}',
    summary: 'Update voucher information',
    tags: ['Voucher Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: voucherParameters.VoucherPathParams,
      body: {
        content: {
          'application/json': {
            schema: adminVoucherSchemas.UpdateVoucherRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Voucher updated successfully',
        content: {
          'application/json': {
            schema: adminVoucherSchemas.AdminVoucherDetailResponse,
          },
        },
      },
      404: {
        description: 'Voucher not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Delete voucher
  registry.registerRoute({
    method: 'delete',
    path: '/vouchers/{id}',
    summary: 'Delete a voucher',
    tags: ['Voucher Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: voucherParameters.VoucherPathParams,
    },
    responses: {
      204: {
        description: 'Voucher deleted successfully',
      },
      404: {
        description: 'Voucher not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Bulk update vouchers
  registry.registerRoute({
    method: 'patch',
    path: '/vouchers/bulk-update',
    summary: 'Update multiple vouchers',
    tags: ['Voucher Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminVoucherSchemas.BulkVoucherUpdateRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Vouchers updated successfully',
        content: {
          'application/json': {
            schema: adminVoucherSchemas.BulkVoucherOperationResponse,
          },
        },
      },
      400: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Get voucher analytics
  registry.registerRoute({
    method: 'get',
    path: '/vouchers/analytics',
    summary: 'Get voucher analytics',
    tags: ['Voucher Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminVoucherQueries.VoucherAnalyticsQueryParams,
    },
    responses: {
      200: {
        description: 'Voucher analytics data',
        content: {
          'application/json': {
            schema: adminVoucherSchemas.VoucherAnalyticsResponse,
          },
        },
      },
    },
  })

  // User Management routes
  registry.registerRoute({
    method: 'get',
    path: '/users',
    summary: 'List all users with admin details',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminUserSchemas.AdminUserQueryParams,
    },
    responses: {
      200: {
        description: 'List of users',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(adminUserSchemas.AdminUserDetailResponse),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
              }),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/users/{id}',
    summary: 'Get user details',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'User details',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUserDetailResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'patch',
    path: '/users/{id}/status',
    summary: 'Update user status',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminUserSchemas.UpdateUserStatusRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User status updated',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUserDetailResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/users/{id}/ban',
    summary: 'Ban user',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              reason: z.string(),
              duration: z.number().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User banned',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/users/{id}/unban',
    summary: 'Unban user',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'User unbanned',
        content: {
          'application/json': {
            schema: MessageResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/users',
    summary: 'Create a new user (admin only)',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminCreateUserRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'User created successfully',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUserDetailResponse,
          },
        },
      },
      400: {
        description: 'Invalid user data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      409: {
        description: 'User already exists',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'patch',
    path: '/users/{id}',
    summary: 'Update user information (admin)',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUpdateUserRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'User updated successfully',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUserDetailResponse,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Delete user route
  registry.registerRoute({
    method: 'delete',
    path: '/users/{id}',
    summary: 'Delete user (admin only)',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      204: {
        description: 'User deleted successfully',
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/users/email/{email}',
    summary: 'Get user by email',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        email: z.string().email(),
      }),
    },
    responses: {
      200: {
        description: 'User details',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUserDetailResponse,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // User Verification routes (Admin)
  registry.registerRoute({
    method: 'post',
    path: '/admin/users/verify',
    summary: 'Admin verifies user email, phone, or account',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: userVerificationSchemas.UnifiedVerificationRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Verification successful',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
              user: adminUserSchemas.AdminUserDetailResponse,
            }),
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/admin/users/resend-verification',
    summary: 'Admin resends verification email or SMS',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: userVerificationSchemas.UnifiedResendVerificationRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Verification resent',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
            }),
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/admin/users/{id}/verification-status',
    summary: 'Get user verification status',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: adminUserSchemas.UserIdParam,
    },
    responses: {
      200: {
        description: 'User verification status retrieved successfully',
        content: {
          'application/json': {
            schema: adminUserSchemas.UserVerificationStatusResponse,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      403: {
        description: 'Forbidden - Admin access required',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/admin/users/{id}/avatar',
    summary: 'Upload avatar for a user (admin only)',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: adminUserSchemas.UserIdParam,
      body: {
        content: {
          'multipart/form-data': {
            schema: adminUserSchemas.AdminUploadUserAvatarRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Avatar uploaded successfully',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUploadUserAvatarResponse,
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/admin/users/me',
    summary: 'Get current admin user profile',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Admin user profile',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUserDetailResponse,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      403: {
        description: 'Forbidden - Admin access required',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'patch',
    path: '/admin/users/me',
    summary: 'Update current admin user profile',
    tags: ['User Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminUserSchemas.UpdateAdminProfileRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated admin user profile',
        content: {
          'application/json': {
            schema: adminUserSchemas.AdminUserDetailResponse,
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      401: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
      403: {
        description: 'Forbidden - Admin access required',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Transaction Management routes
  registry.registerRoute({
    method: 'get',
    path: '/transactions',
    summary: 'List all transactions',
    tags: ['Transaction Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminPaymentSchemas.AdminTransactionQueryParams,
    },
    responses: {
      200: {
        description: 'List of transactions',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(adminPaymentSchemas.AdminTransactionDetailResponse),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
              }),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/transactions/{id}',
    summary: 'Get transaction details',
    tags: ['Transaction Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Transaction details',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.AdminTransactionDetailResponse,
          },
        },
      },
    },
  })

  // Financial Management routes

  registry.registerRoute({
    method: 'get',
    path: '/payments/reports',
    summary: 'Generate financial reports',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminPaymentSchemas.FinancialReportRequest,
    },
    responses: {
      200: {
        description: 'Financial report data',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.FinancialReportResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/transactions/{id}/refund',
    summary: 'Refund a transaction',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminPaymentSchemas.RefundTransactionRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Refund processed',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.AdminTransactionDetailResponse,
          },
        },
      },
      404: {
        description: 'Transaction not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Promo Code Management routes
  registry.registerRoute({
    method: 'post',
    path: '/promo-codes',
    summary: 'Create promo code',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminPaymentSchemas.CreatePromoCodeRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Promo code created',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.AdminPromoCodeDetail,
          },
        },
      },
      400: {
        description: 'Invalid promo code data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'patch',
    path: '/promo-codes/{id}',
    summary: 'Update promo code',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminPaymentSchemas.UpdatePromoCodeRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Promo code updated',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.AdminPromoCodeDetail,
          },
        },
      },
      404: {
        description: 'Promo code not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/promo-codes',
    summary: 'List promo codes',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminPaymentSchemas.PromoCodeSearchParams,
    },
    responses: {
      200: {
        description: 'List of promo codes',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.PromoCodeListResponse,
          },
        },
      },
    },
  })

  // Subscription Plan Management routes
  registry.registerRoute({
    method: 'get',
    path: '/subscriptions',
    summary: 'List all subscriptions',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED']).optional(),
        planId: z.string().uuid().optional(),
        userId: UserId.optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      }),
    },
    responses: {
      200: {
        description: 'List of subscriptions',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(
                z.object({
                  id: UUID,
                  userId: UserId,
                  planId: UUID,
                  status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED']),
                  startDate: DateTime,
                  endDate: DateTime.optional(),
                  nextBillingDate: DateTime.optional(),
                }),
              ),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
              }),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/subscriptions/plans',
    summary: 'Create subscription plan',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminPaymentSchemas.CreateSubscriptionPlanRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Subscription plan created',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.AdminSubscriptionPlanDetail,
          },
        },
      },
      400: {
        description: 'Invalid plan data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'patch',
    path: '/subscriptions/plans/{id}',
    summary: 'Update subscription plan',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminPaymentSchemas.UpdateSubscriptionPlanRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Subscription plan updated',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.AdminSubscriptionPlanDetail,
          },
        },
      },
      404: {
        description: 'Plan not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/subscriptions/plans',
    summary: 'List subscription plans',
    tags: ['Financial Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminPaymentSchemas.SubscriptionPlanSearchParams,
    },
    responses: {
      200: {
        description: 'List of subscription plans',
        content: {
          'application/json': {
            schema: adminPaymentSchemas.SubscriptionPlanListResponse,
          },
        },
      },
    },
  })

  // Support Ticket Management routes
  registry.registerRoute({
    method: 'get',
    path: '/support/tickets',
    summary: 'List support tickets',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminSupportSchemas.AdminTicketQueryParams,
    },
    responses: {
      200: {
        description: 'List of support tickets',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(adminSupportSchemas.AdminTicketDetailResponse),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
              }),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/support/tickets/{id}',
    summary: 'Get support ticket details',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: 'Support ticket details',
        content: {
          'application/json': {
            schema: adminSupportSchemas.AdminTicketDetailResponse,
          },
        },
      },
    },
  })

  // Additional Support Management routes
  registry.registerRoute({
    method: 'put',
    path: '/support/tickets/{id}/status',
    summary: 'Update ticket status',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Ticket ID'),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminSupportSchemas.UpdateTicketStatusRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Ticket status updated successfully',
        content: {
          'application/json': {
            schema: adminSupportSchemas.AdminTicketDetailResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/support/tickets/{id}/assign',
    summary: 'Assign ticket to agent',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Ticket ID'),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminSupportSchemas.AssignTicketRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Ticket assigned successfully',
        content: {
          'application/json': {
            schema: adminSupportSchemas.AdminTicketDetailResponse,
          },
        },
      },
    },
  })

  // Admin Problem Management routes
  registry.registerRoute({
    method: 'get',
    path: '/admin/problems',
    summary: 'List all problems with admin details',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminSupportSchemas.AdminTicketQueryParams,
    },
    responses: {
      200: {
        description: 'List of problems',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(adminSupportSchemas.AdminTicketDetailResponse),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
                hasNext: z.boolean(),
                hasPrevious: z.boolean(),
              }),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/admin/problems/{id}',
    summary: 'Get problem details',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Problem ID'),
      }),
    },
    responses: {
      200: {
        description: 'Problem details',
        content: {
          'application/json': {
            schema: adminSupportSchemas.AdminTicketDetailResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/admin/problems/{id}',
    summary: 'Update problem',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Problem ID'),
      }),
      body: {
        content: {
          'application/json': {
            schema: adminSupportSchemas.AdminUpdateProblemRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Problem updated successfully',
        content: {
          'application/json': {
            schema: adminSupportSchemas.AdminTicketDetailResponse,
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'delete',
    path: '/admin/problems/{id}',
    summary: 'Delete problem',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Problem ID'),
      }),
    },
    responses: {
      204: {
        description: 'Problem deleted successfully',
      },
    },
  })

  // Admin Comment Management routes
  registry.registerRoute({
    method: 'get',
    path: '/admin/comments',
    summary: 'List all comments',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().max(100).optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['ASC', 'DESC']).optional(),
      }),
    },
    responses: {
      200: {
        description: 'List of comments',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(z.any()), // Should be SupportCommentResponse schema
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
                hasNext: z.boolean(),
                hasPrevious: z.boolean(),
              }),
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'get',
    path: '/admin/comments/problem/{problemId}',
    summary: 'Get comments by problem ID',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        problemId: UUID.describe('Problem ID'),
      }),
    },
    responses: {
      200: {
        description: 'List of comments for the problem',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(z.any()), // Should be SupportCommentResponse schema
            }),
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'post',
    path: '/admin/comments',
    summary: 'Create internal comment',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              problemId: UUID,
              content: z.string().min(1).max(5000),
              isInternal: z.boolean().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Comment created successfully',
        content: {
          'application/json': {
            schema: z.any(), // Should be SupportCommentResponse schema
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'put',
    path: '/admin/comments/{id}',
    summary: 'Update any comment',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Comment ID'),
      }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              content: z.string().min(1).max(5000),
              isInternal: z.boolean().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Comment updated successfully',
        content: {
          'application/json': {
            schema: z.any(), // Should be SupportCommentResponse schema
          },
        },
      },
    },
  })

  registry.registerRoute({
    method: 'delete',
    path: '/admin/comments/{id}',
    summary: 'Delete any comment',
    tags: ['Support Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: UUID.describe('Comment ID'),
      }),
    },
    responses: {
      204: {
        description: 'Comment deleted successfully',
      },
    },
  })

  // Communication Management routes
  registry.registerRoute({
    method: 'post',
    path: '/templates/seed',
    summary: 'Seed default email/SMS templates',
    tags: ['Communication Management'],
    security: [{ bearerAuth: [] }],
    responses: {
      201: {
        description: 'Templates seeded successfully',
        content: {
          'application/json': {
            schema: z.object({
              created: z.number(),
              message: z.string(),
            }),
          },
        },
      },
    },
  })

  // ============= PDF/Voucher Book Management Routes =============

  // Get all voucher books
  registry.registerRoute({
    method: 'get',
    path: '/admin/voucher-books',
    summary: 'List all voucher books with admin details',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      query: adminPdfSchemas.AdminVoucherBookQueryParams,
    },
    responses: {
      200: {
        description: 'List of voucher books',
        content: {
          'application/json': {
            schema: adminPdfSchemas.AdminVoucherBookListResponse,
          },
        },
      },
    },
  })

  // Get voucher book by ID
  registry.registerRoute({
    method: 'get',
    path: '/admin/voucher-books/{id}',
    summary: 'Get voucher book details',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: pdfParameters.VoucherBookIdParam,
    },
    responses: {
      200: {
        description: 'Voucher book details',
        content: {
          'application/json': {
            schema: adminPdfSchemas.AdminVoucherBookResponse,
          },
        },
      },
      404: {
        description: 'Voucher book not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Create voucher book
  registry.registerRoute({
    method: 'post',
    path: '/admin/voucher-books',
    summary: 'Create a new voucher book',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminPdfSchemas.CreateVoucherBookRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Voucher book created successfully',
        content: {
          'application/json': {
            schema: adminPdfSchemas.AdminVoucherBookResponse,
          },
        },
      },
      400: {
        description: 'Invalid voucher book data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Update voucher book
  registry.registerRoute({
    method: 'put',
    path: '/admin/voucher-books/{id}',
    summary: 'Update voucher book information',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: pdfParameters.VoucherBookIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminPdfSchemas.UpdateVoucherBookRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Voucher book updated successfully',
        content: {
          'application/json': {
            schema: adminPdfSchemas.AdminVoucherBookResponse,
          },
        },
      },
      404: {
        description: 'Voucher book not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Delete voucher book
  registry.registerRoute({
    method: 'delete',
    path: '/admin/voucher-books/{id}',
    summary: 'Delete a voucher book',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: pdfParameters.VoucherBookIdParam,
    },
    responses: {
      204: {
        description: 'Voucher book deleted successfully',
      },
      404: {
        description: 'Voucher book not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Update voucher book status
  registry.registerRoute({
    method: 'patch',
    path: '/admin/voucher-books/{id}/status',
    summary: 'Update voucher book status',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: pdfParameters.VoucherBookIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminPdfSchemas.PublishVoucherBookRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Voucher book status updated successfully',
        content: {
          'application/json': {
            schema: adminPdfSchemas.AdminVoucherBookResponse,
          },
        },
      },
      404: {
        description: 'Voucher book not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Generate PDF
  registry.registerRoute({
    method: 'post',
    path: '/admin/voucher-books/{id}/generate-pdf',
    summary: 'Generate PDF for voucher book',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: pdfParameters.VoucherBookIdParam,
      body: {
        content: {
          'application/json': {
            schema: adminPdfSchemas.GeneratePdfRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'PDF generated successfully',
        content: {
          'application/json': {
            schema: adminPdfSchemas.GeneratePdfResponse,
          },
        },
      },
      404: {
        description: 'Voucher book not found',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Bulk archive voucher books
  registry.registerRoute({
    method: 'post',
    path: '/admin/voucher-books/bulk-archive',
    summary: 'Archive multiple voucher books',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminPdfSchemas.BulkVoucherBookOperationRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Voucher books archived successfully',
        content: {
          'application/json': {
            schema: z.object({
              archived: z.number().describe('Number of books archived'),
              failed: z
                .number()
                .describe('Number of books that failed to archive'),
              errors: z
                .array(z.string())
                .describe('Error messages for failed operations'),
            }),
          },
        },
      },
      400: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: ErrorResponse,
          },
        },
      },
    },
  })

  // Get voucher book statistics
  registry.registerRoute({
    method: 'get',
    path: '/admin/voucher-books/statistics',
    summary: 'Get voucher book statistics',
    tags: ['PDF Management'],
    security: [{ bearerAuth: [] }],
    request: {},
    responses: {
      200: {
        description: 'Voucher book statistics',
        content: {
          'application/json': {
            schema: adminPdfSchemas.BulkVoucherBookOperationResponse,
          },
        },
      },
    },
  })
}
