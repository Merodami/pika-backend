import type { ZodRegistry } from '@api/common/registry/base.js'
import * as businessSettingsSchemas from '@api/schemas/business/business/settings.js'
import * as businessParameters from '@api/schemas/business/common/parameters.js'
import * as businessSchemas from '@api/schemas/business/public/business.js'
import * as businessDetailsSchemas from '@api/schemas/business/public/businessDetails.js'

/**
 * Register all business owner API schemas and routes
 * These endpoints are for authenticated business owners to manage their own businesses
 */
export function registerBusinessAPI(registry: ZodRegistry): void {
  // ============= Business Management Schemas =============

  // Business CRUD schemas for owners
  registry.registerSchema(
    'CreateMyBusinessRequest',
    businessSchemas.CreateMyBusinessRequest,
  )
  registry.registerSchema(
    'UpdateMyBusinessRequest',
    businessSchemas.UpdateMyBusinessRequest,
  )
  registry.registerSchema('BusinessResponse', businessSchemas.BusinessResponse)
  registry.registerSchema('BusinessIdParam', businessParameters.BusinessIdParam)

  // ============= Business Details Schemas =============

  registry.registerSchema(
    'BusinessDetailsResponse',
    businessDetailsSchemas.BusinessDetailsResponse,
  )
  registry.registerSchema(
    'UpdateBusinessDetailsRequest',
    businessDetailsSchemas.UpdateBusinessDetailsRequest,
  )

  // ============= Business Settings Schemas =============

  registry.registerSchema(
    'BusinessSettings',
    businessSettingsSchemas.BusinessSettings,
  )
  registry.registerSchema(
    'BusinessSettingsResponse',
    businessSettingsSchemas.BusinessSettingsResponse,
  )
  registry.registerSchema(
    'UpdateBusinessSettingsRequest',
    businessSettingsSchemas.UpdateBusinessSettingsRequest,
  )
  registry.registerSchema(
    'ResetBusinessSettingsRequest',
    businessSettingsSchemas.ResetBusinessSettingsRequest,
  )
  registry.registerSchema(
    'BusinessSettingsPathParams',
    businessSettingsSchemas.BusinessSettingsPathParams,
  )

  // ============= Business Owner Routes =============

  // Create a new business
  registry.registerRoute({
    method: 'post',
    path: '/businesses',
    operationId: 'createMyBusiness',
    summary: 'Create a new business',
    description: 'Create a new business for the authenticated user',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: businessSchemas.CreateMyBusinessRequest,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Business created successfully',
        content: {
          'application/json': {
            schema: businessSchemas.BusinessResponse,
          },
        },
      },
    },
  })

  // Update own business
  registry.registerRoute({
    method: 'patch',
    path: '/businesses/{id}',
    operationId: 'updateMyBusiness',
    summary: 'Update business information',
    description:
      'Update business information for a business owned by the authenticated user',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: businessParameters.BusinessIdParam,
      body: {
        content: {
          'application/json': {
            schema: businessSchemas.UpdateMyBusinessRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Business updated successfully',
        content: {
          'application/json': {
            schema: businessSchemas.BusinessResponse,
          },
        },
      },
    },
  })

  // Get own business details
  registry.registerRoute({
    method: 'get',
    path: '/businesses/{id}/details',
    operationId: 'getMyBusinessDetails',
    summary: 'Get detailed business information',
    description:
      'Get detailed information for a business owned by the authenticated user',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: businessParameters.BusinessIdParam,
    },
    responses: {
      200: {
        description: 'Business details retrieved successfully',
        content: {
          'application/json': {
            schema: businessDetailsSchemas.BusinessDetailsResponse,
          },
        },
      },
    },
  })

  // Update business details
  registry.registerRoute({
    method: 'patch',
    path: '/businesses/{id}/details',
    operationId: 'updateMyBusinessDetails',
    summary: 'Update business details',
    description:
      'Update detailed information for a business owned by the authenticated user',
    tags: ['Business Management'],
    security: [{ bearerAuth: [] }],
    request: {
      params: businessParameters.BusinessIdParam,
      body: {
        content: {
          'application/json': {
            schema: businessDetailsSchemas.UpdateBusinessDetailsRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Business details updated successfully',
        content: {
          'application/json': {
            schema: businessDetailsSchemas.BusinessDetailsResponse,
          },
        },
      },
    },
  })

  // ============= Business Settings Routes =============

  // Get business settings
  registry.registerRoute({
    method: 'get',
    path: '/businesses/{id}/settings',
    operationId: 'getBusinessSettings',
    summary: 'Get business settings',
    description:
      'Get configuration settings for a business owned by the authenticated user',
    tags: ['Business Settings'],
    security: [{ bearerAuth: [] }],
    request: {
      params: businessSettingsSchemas.BusinessSettingsPathParams,
    },
    responses: {
      200: {
        description: 'Business settings retrieved successfully',
        content: {
          'application/json': {
            schema: businessSettingsSchemas.BusinessSettingsResponse,
          },
        },
      },
      403: {
        description: 'Forbidden - User does not own this business',
      },
      404: {
        description: 'Business not found',
      },
    },
  })

  // Update business settings
  registry.registerRoute({
    method: 'patch',
    path: '/businesses/{id}/settings',
    operationId: 'updateBusinessSettings',
    summary: 'Update business settings',
    description:
      'Update configuration settings for a business owned by the authenticated user. Supports partial updates.',
    tags: ['Business Settings'],
    security: [{ bearerAuth: [] }],
    request: {
      params: businessSettingsSchemas.BusinessSettingsPathParams,
      body: {
        content: {
          'application/json': {
            schema: businessSettingsSchemas.UpdateBusinessSettingsRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Business settings updated successfully',
        content: {
          'application/json': {
            schema: businessSettingsSchemas.BusinessSettingsResponse,
          },
        },
      },
      400: {
        description: 'Invalid settings data',
      },
      403: {
        description: 'Forbidden - User does not own this business',
      },
      404: {
        description: 'Business not found',
      },
    },
  })

  // Reset business settings
  registry.registerRoute({
    method: 'post',
    path: '/businesses/{id}/settings/reset',
    operationId: 'resetBusinessSettings',
    summary: 'Reset business settings to defaults',
    description:
      'Reset business settings to default values. Can reset all settings or specific sections only.',
    tags: ['Business Settings'],
    security: [{ bearerAuth: [] }],
    request: {
      params: businessSettingsSchemas.BusinessSettingsPathParams,
      body: {
        content: {
          'application/json': {
            schema: businessSettingsSchemas.ResetBusinessSettingsRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Business settings reset successfully',
        content: {
          'application/json': {
            schema: businessSettingsSchemas.BusinessSettingsResponse,
          },
        },
      },
      400: {
        description: 'Invalid reset request',
      },
      403: {
        description: 'Forbidden - User does not own this business',
      },
      404: {
        description: 'Business not found',
      },
    },
  })
}
