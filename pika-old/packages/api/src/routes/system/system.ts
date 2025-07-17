import { registry } from '@api/schemaRegistry.js'
import { OpenAPIV3 } from 'openapi-types'

/**
 * System API Specification
 */
export const SystemRoutes: Partial<OpenAPIV3.Document> = {
  paths: {
    '/api/v1/health': {
      get: {
        tags: ['System'],
        operationId: 'healthCheck',
        summary: 'API health check',
        description: 'Returns health status of the API and its components',
        parameters: [],
        responses: {
          '200': {
            description: 'System health information',
            content: {
              'application/json': {
                schema: registry.ref('HealthCheckResponse'),
              },
            },
          },
          '500': registry.refResponse('InternalServerError'),
        },
        security: [],
      },
    },
    '/api/v1/docs': {
      get: {
        tags: ['System'],
        operationId: 'getDocs',
        summary: 'API Documentation',
        description: 'Returns the OpenAPI documentation in JSON format',
        responses: {
          '200': {
            description: 'OpenAPI documentation',
            content: {
              'application/json': {
                schema: registry.ref('APIDocsResponse'),
              },
            },
          },
          '500': registry.refResponse('InternalServerError'),
        },
        security: [],
      },
    },
  },
}
