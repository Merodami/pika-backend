import { OpenAPIV3 } from 'openapi-types'

export const ProviderIdParam: OpenAPIV3.ParameterObject = {
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

export const ProviderVerifiedParam: OpenAPIV3.ParameterObject = {
  name: 'verified',
  in: 'query',
  required: false,
  description: 'Filter by verification status',
  schema: {
    type: 'boolean',
  },
}

export const ProviderActiveParam: OpenAPIV3.ParameterObject = {
  name: 'active',
  in: 'query',
  required: false,
  description: 'Filter by active status',
  schema: {
    type: 'boolean',
    default: true,
  },
}

export const ProviderBusinessNameParam: OpenAPIV3.ParameterObject = {
  name: 'business_name',
  in: 'query',
  required: false,
  description: 'Search by business name (searches in all languages)',
  schema: {
    type: 'string',
    maxLength: 100,
    example: 'Burger King',
  },
}

export const ProviderMinRatingParam: OpenAPIV3.ParameterObject = {
  name: 'min_rating',
  in: 'query',
  required: false,
  description: 'Minimum average rating (0-5)',
  schema: {
    type: 'number',
    minimum: 0,
    maximum: 5,
    example: 4.0,
  },
}

export const ProviderMaxRatingParam: OpenAPIV3.ParameterObject = {
  name: 'max_rating',
  in: 'query',
  required: false,
  description: 'Maximum average rating (0-5)',
  schema: {
    type: 'number',
    minimum: 0,
    maximum: 5,
    example: 5.0,
  },
}
