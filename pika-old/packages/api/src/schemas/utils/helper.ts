import { TSchema, Type } from '@sinclair/typebox'

/**
 * Creates a plain pagination schema.
 */
export function createPaginationSchema(
  maxLimit = parseInt(process.env.PAGINATION_MAX_LIMIT ?? '100', 10),
  defaultLimit = parseInt(process.env.PAGINATION_DEFAULT_LIMIT ?? '10', 10),
) {
  return {
    page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
    limit: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: maxLimit,
        default: defaultLimit,
      }),
    ),
  }
}

/**
 * Creates a standardized sort schema for API definitions
 *
 * @param allowedFields - Schema defining allowed fields for sorting
 * @param defaultField - Default field to sort by
 * @param defaultDirection - Default sort direction
 * @returns Schema object with sort parameters
 */
export function createSortSchema(
  allowedFields: TSchema,
  defaultField?: string,
  defaultDirection: 'asc' | 'desc' = 'asc',
) {
  return {
    // Combined field:direction format (e.g. "created_at:desc")
    sort: Type.Optional(
      Type.String({
        description: 'Sort field and direction in format field:direction',
      }),
    ),

    // Separate field and direction parameters
    sort_by: Type.Optional(allowedFields),
    sort_order: Type.Optional(
      Type.Union([Type.Literal('asc'), Type.Literal('desc')], {
        default: defaultDirection,
        description:
          'Sort direction, either "asc" (ascending) or "desc" (descending)',
      }),
    ),
  }
}

/**
 * Creates common query parameters for API endpoints including pagination and sorting
 *
 * @param sortOptions - Options for sort schema
 * @returns Schema object with common query parameters
 */
export function createCommonQueryParams(sortOptions?: {
  allowedFields?: TSchema
  defaultField?: string
  defaultDirection?: 'asc' | 'desc'
}) {
  return {
    ...createPaginationSchema(),
    ...(sortOptions?.allowedFields
      ? createSortSchema(
          sortOptions.allowedFields,
          sortOptions.defaultField,
          sortOptions.defaultDirection || 'asc',
        )
      : {}),
  }
}

// Helper to create multilingual fields schema
export function createMultilingualSchema(
  maxLength: number,
  required: boolean = true,
) {
  const esSchema = required
    ? Type.String({ minLength: 1, maxLength })
    : Type.Optional(Type.String({ maxLength }))

  return Type.Object({
    es: esSchema,
    en: Type.Optional(Type.String({ maxLength })),
    gn: Type.Optional(Type.String({ maxLength })),
  })
}
