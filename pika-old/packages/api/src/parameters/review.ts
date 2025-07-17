import { OpenAPIV3 } from 'openapi-types'

export const ReviewIdParam: OpenAPIV3.ParameterObject = {
  name: 'review_id',
  in: 'path',
  required: true,
  description: 'Unique identifier of the review',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
  example: '123e4567-e89b-12d3-a456-426614174000',
}

export const ReviewProviderIdParam: OpenAPIV3.ParameterObject = {
  name: 'provider_id',
  in: 'query',
  required: false,
  description: 'Filter by provider ID',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
}

export const ReviewCustomerIdParam: OpenAPIV3.ParameterObject = {
  name: 'customer_id',
  in: 'query',
  required: false,
  description: 'Filter by customer ID',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
}

export const ReviewRatingParam: OpenAPIV3.ParameterObject = {
  name: 'rating',
  in: 'query',
  required: false,
  description: 'Filter by minimum rating',
  schema: {
    type: 'integer',
    minimum: 1,
    maximum: 5,
  },
}
