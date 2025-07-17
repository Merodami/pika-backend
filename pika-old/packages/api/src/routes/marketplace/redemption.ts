import { OpenAPIV3 } from 'openapi-types'

// Redemption routes - placeholder for now
export const RedemptionRoutes: Partial<OpenAPIV3.Document> = {
  paths: {
    '/api/v1/redemptions': {
      get: {
        tags: ['Redemptions'],
        operationId: 'getRedemptions',
        summary: 'Get redemptions',
        description: 'Retrieve redemptions (placeholder)',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Redemption service not yet implemented',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
