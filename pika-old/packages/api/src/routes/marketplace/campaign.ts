import { OpenAPIV3 } from 'openapi-types'

/**
 * Campaign API routes for the marketplace
 */
export const CampaignRoutes: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: { title: '', version: '' },
  paths: {
    '/api/v1/campaigns': {
      get: {
        tags: ['Campaigns'],
        summary: 'List campaigns',
        description:
          'Get a paginated list of campaigns with optional filtering',
        operationId: 'listCampaigns',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'provider_id',
            in: 'query',
            description: 'Filter by provider ID',
            required: false,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by campaign status',
            required: false,
            schema: {
              type: 'string',
              enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
            },
          },
          {
            name: 'active',
            in: 'query',
            description: 'Filter by active status',
            required: false,
            schema: { type: 'boolean' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          {
            name: 'sort_by',
            in: 'query',
            description: 'Field to sort by',
            required: false,
            schema: {
              type: 'string',
              enum: [
                'name',
                'created_at',
                'updated_at',
                'start_date',
                'end_date',
                'budget',
                'status',
              ],
              default: 'created_at',
            },
          },
          {
            name: 'sort_order',
            in: 'query',
            description: 'Sort order',
            required: false,
            schema: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc',
            },
          },
        ],
        responses: {
          200: {
            description: 'Campaigns retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CampaignListResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequestError' },
          401: { $ref: '#/components/responses/UnauthorizedError' },
          403: { $ref: '#/components/responses/ForbiddenError' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
      post: {
        tags: ['Campaigns'],
        summary: 'Create a new campaign',
        description: 'Create a new marketing campaign',
        operationId: 'createCampaign',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CampaignCreate' },
            },
          },
        },
        responses: {
          201: {
            description: 'Campaign created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Campaign' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequestError' },
          401: { $ref: '#/components/responses/UnauthorizedError' },
          403: { $ref: '#/components/responses/ForbiddenError' },
          422: { $ref: '#/components/responses/ValidationError' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/v1/campaigns/{campaign_id}': {
      get: {
        tags: ['Campaigns'],
        summary: 'Get campaign by ID',
        description: 'Retrieve a specific campaign by its ID',
        operationId: 'getCampaignById',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'campaign_id',
            in: 'path',
            description: 'Campaign ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Campaign retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Campaign' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequestError' },
          401: { $ref: '#/components/responses/UnauthorizedError' },
          403: { $ref: '#/components/responses/ForbiddenError' },
          404: { $ref: '#/components/responses/NotFoundError' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
      patch: {
        tags: ['Campaigns'],
        summary: 'Update campaign',
        description: 'Update an existing campaign',
        operationId: 'updateCampaign',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'campaign_id',
            in: 'path',
            description: 'Campaign ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CampaignUpdate' },
            },
          },
        },
        responses: {
          200: {
            description: 'Campaign updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Campaign' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequestError' },
          401: { $ref: '#/components/responses/UnauthorizedError' },
          403: { $ref: '#/components/responses/ForbiddenError' },
          404: { $ref: '#/components/responses/NotFoundError' },
          422: { $ref: '#/components/responses/ValidationError' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
      delete: {
        tags: ['Campaigns'],
        summary: 'Delete campaign',
        description: 'Delete a campaign',
        operationId: 'deleteCampaign',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'campaign_id',
            in: 'path',
            description: 'Campaign ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          204: {
            description: 'Campaign deleted successfully',
          },
          400: { $ref: '#/components/responses/BadRequestError' },
          401: { $ref: '#/components/responses/UnauthorizedError' },
          403: { $ref: '#/components/responses/ForbiddenError' },
          404: { $ref: '#/components/responses/NotFoundError' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
  },
  components: {},
}
