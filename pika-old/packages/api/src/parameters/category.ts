import { OpenAPIV3 } from 'openapi-types'

export const CategoryIdParam: OpenAPIV3.ParameterObject = {
  name: 'category_id',
  in: 'path',
  required: true,
  description: 'Unique identifier of the category',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
  example: '123e4567-e89b-12d3-a456-426614174000',
}

export const CategoryParentIdParam: OpenAPIV3.ParameterObject = {
  name: 'parent_id',
  in: 'query',
  required: false,
  description:
    'Filter by parent category ID. If null, returns only root categories.',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
}

export const CategoryLevelParam: OpenAPIV3.ParameterObject = {
  name: 'level',
  in: 'query',
  required: false,
  description:
    'Filter by category level (1 for root, 2 for subcategories, etc.)',
  schema: {
    type: 'integer',
    minimum: 1,
  },
}

export const CategoryActiveParam: OpenAPIV3.ParameterObject = {
  name: 'active',
  in: 'query',
  required: false,
  description: 'Filter by active status',
  schema: {
    type: 'boolean',
    default: true,
  },
}

// Language is now handled via Accept-Language header instead of query parameter

export const CategoryIncludeChildrenParam: OpenAPIV3.ParameterObject = {
  name: 'include_children',
  in: 'query',
  required: false,
  description: 'Include child categories in response',
  schema: {
    type: 'boolean',
    default: false,
  },
}
