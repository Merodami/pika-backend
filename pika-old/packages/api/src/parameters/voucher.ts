import { OpenAPIV3 } from 'openapi-types'

export const VoucherIdParam: OpenAPIV3.ParameterObject = {
  name: 'voucher_id',
  in: 'path',
  required: true,
  description: 'Unique identifier of the voucher',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
  example: '123e4567-e89b-12d3-a456-426614174000',
}

export const VoucherProviderIdParam: OpenAPIV3.ParameterObject = {
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

export const VoucherCategoryIdParam: OpenAPIV3.ParameterObject = {
  name: 'category_id',
  in: 'query',
  required: false,
  description: 'Filter by category ID',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
}

export const VoucherStateParam: OpenAPIV3.ParameterObject = {
  name: 'state',
  in: 'query',
  required: false,
  description: 'Filter by voucher state',
  schema: {
    type: 'string',
    enum: ['NEW', 'PUBLISHED', 'CLAIMED', 'REDEEMED', 'EXPIRED'],
    example: 'PUBLISHED',
  },
}

export const VoucherDiscountTypeParam: OpenAPIV3.ParameterObject = {
  name: 'discount_type',
  in: 'query',
  required: false,
  description: 'Filter by discount type',
  schema: {
    type: 'string',
    enum: ['PERCENTAGE', 'FIXED'],
    example: 'PERCENTAGE',
  },
}

export const VoucherLatitudeParam: OpenAPIV3.ParameterObject = {
  name: 'latitude',
  in: 'query',
  required: false,
  description: 'Latitude for geospatial search',
  schema: {
    type: 'number',
    minimum: -90,
    maximum: 90,
    example: -25.2867,
  },
}

export const VoucherLongitudeParam: OpenAPIV3.ParameterObject = {
  name: 'longitude',
  in: 'query',
  required: false,
  description: 'Longitude for geospatial search',
  schema: {
    type: 'number',
    minimum: -180,
    maximum: 180,
    example: -57.6309,
  },
}

export const VoucherRadiusParam: OpenAPIV3.ParameterObject = {
  name: 'radius',
  in: 'query',
  required: false,
  description: 'Search radius in meters (default: 10000)',
  schema: {
    type: 'number',
    minimum: 0,
    default: 10000,
    example: 5000,
  },
}
