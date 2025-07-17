import { OpenAPIV3 } from 'openapi-types'

export const PaginationPageParam: OpenAPIV3.ParameterObject = {
  name: 'page',
  in: 'query',
  required: false,
  description: 'Page number for pagination',
  schema: {
    type: 'integer',
    minimum: 1,
    default: 1,
  },
}

export const PaginationLimitParam: OpenAPIV3.ParameterObject = {
  name: 'limit',
  in: 'query',
  required: false,
  description: 'Number of items per page',
  schema: {
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 20,
  },
}

/**
 * Sort by parameter for explicit field specification
 * Alternative to the combined sort parameter
 */
export const SortByParam: OpenAPIV3.ParameterObject = {
  name: 'sort_by',
  in: 'query',
  required: false,
  description: 'Field to sort by (use with sort_order)',
  schema: {
    type: 'string',
    example: 'created_at',
  },
}

/**
 * Sort order parameter for explicit direction specification
 * Alternative to the combined sort parameter
 */
export const SortOrderParam: OpenAPIV3.ParameterObject = {
  name: 'sort_order',
  in: 'query',
  required: false,
  description: 'Sort direction to use with sort_by (asc or desc)',
  schema: {
    type: 'string',
    enum: ['asc', 'desc'],
    default: 'asc',
  },
}

/**
 * Standard sort parameter for combined field:direction format
 * This is the preferred way to specify sorting in API requests
 */
export const SortParam: OpenAPIV3.ParameterObject = {
  name: 'sort',
  in: 'query',
  required: false,
  description:
    'Sort field and direction in format field:direction (e.g., created_at:desc)',
  schema: {
    type: 'string',
    example: 'created_at:desc',
  },
  examples: {
    newest_first: {
      summary: 'Sort by creation date (newest first)',
      value: 'created_at:desc',
    },
    oldest_first: {
      summary: 'Sort by creation date (oldest first)',
      value: 'created_at:asc',
    },
    name_az: {
      summary: 'Sort by name (A-Z)',
      value: 'name:asc',
    },
    name_za: {
      summary: 'Sort by name (Z-A)',
      value: 'name:desc',
    },
    price_low_high: {
      summary: 'Sort by price (low to high)',
      value: 'price:asc',
    },
    price_high_low: {
      summary: 'Sort by price (high to low)',
      value: 'price:desc',
    },
    rating_high_low: {
      summary: 'Sort by rating (high to low)',
      value: 'rating:desc',
    },
  },
}
