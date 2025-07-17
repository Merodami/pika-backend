import { registry } from '@api/schemaRegistry.js'
import { OpenAPIV3 } from 'openapi-types'

// Provider routes for Pika voucher platform
export const ProviderRoutes: Partial<OpenAPIV3.Document> = {
  paths: {
    '/api/v1/providers': {
      get: {
        tags: ['Providers'],
        operationId: 'getProviders',
        summary: 'Get voucher providers',
        description:
          'Retrieve a paginated list of voucher providers with optional filtering',
        parameters: [
          registry.refParameter('categoryIdParam'),
          registry.refParameter('providerVerifiedParam'),
          registry.refParameter('providerActiveParam'),
          registry.refParameter('providerBusinessNameParam'),
          registry.refParameter('providerMinRatingParam'),
          registry.refParameter('providerMaxRatingParam'),
          registry.refParameter('paginationPageParam'),
          registry.refParameter('paginationLimitParam'),
          registry.refParameter('sortParam'),
        ],
        responses: {
          '200': {
            description: 'Providers retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('ProviderProfileListResponse'),
              },
            },
          },
          '500': registry.refResponse('ServerError'),
        },
      },
      post: {
        tags: ['Providers'],
        operationId: 'createProvider',
        summary: 'Create provider profile',
        description: 'Create a new provider profile',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('ProviderProfileCreate'),
            },
          },
        },
        responses: {
          '201': {
            description: 'Provider profile created successfully',
            content: {
              'application/json': {
                schema: registry.ref('ProviderProfile'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '422': registry.refResponse('ValidationError'),
        },
      },
    },
    '/api/v1/providers/{provider_id}': {
      parameters: [registry.refParameter('providerIdParam')],
      get: {
        tags: ['Providers'],
        operationId: 'getProviderById',
        summary: 'Get provider by ID',
        description: 'Retrieve detailed information about a voucher provider',
        parameters: [
          {
            name: 'include_user',
            in: 'query',
            description: 'Include user data',
            schema: {
              type: 'boolean',
              default: false,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Provider retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('ProviderProfile'),
              },
            },
          },
          '404': registry.refResponse('NotFoundError'),
          '500': registry.refResponse('ServerError'),
        },
      },
      patch: {
        tags: ['Providers'],
        operationId: 'updateProvider',
        summary: 'Update provider profile',
        description: 'Update an existing provider profile',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('ProviderProfileUpdate'),
            },
          },
        },
        responses: {
          '200': {
            description: 'Provider profile updated successfully',
            content: {
              'application/json': {
                schema: registry.ref('ProviderProfile'),
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '404': registry.refResponse('NotFoundError'),
          '422': registry.refResponse('ValidationError'),
        },
      },
      delete: {
        tags: ['Providers'],
        operationId: 'deleteProvider',
        summary: 'Delete provider profile',
        description: 'Soft delete a provider profile',
        security: [{ BearerAuth: [] }],
        responses: {
          '204': {
            description: 'Provider profile deleted successfully',
          },
          '401': registry.refResponse('UnauthorizedError'),
          '404': registry.refResponse('NotFoundError'),
        },
      },
    },
    '/api/v1/providers/user': {
      get: {
        tags: ['Providers'],
        operationId: 'getProviderByUser',
        summary: 'Get provider by user',
        description: 'Get provider profile for current authenticated user',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Provider profile retrieved successfully',
            content: {
              'application/json': {
                schema: registry.ref('ProviderProfile'),
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
          '404': registry.refResponse('NotFoundError'),
        },
      },
    },
  },
}
