# Standardized Sorting in Pika

This document outlines the standardized approach to sorting across the Pika application. Following these guidelines ensures consistency across API endpoints, repositories, and future GraphQL implementation.

## Overview

Sorting in Pika supports two parameter formats:

1. **Combined format**: `sort=field:direction` (e.g., `sort=created_at:desc`)
2. **Separate parameters**: `sort_by=field&sort_order=direction` (e.g., `sort_by=created_at&sort_order=desc`)

The API and backend are designed to handle both formats consistently, with the separate parameters taking precedence when both are provided.

## API Schema Standards

### Query Parameters

For API endpoints with sorting capabilities:

```typescript
// Use these standard parameters
sort: string // Combined format "field:direction"
sort_by: string // Field to sort by
sort_order: string // Direction "asc" or "desc"
```

### Default Values

- Default sort direction: `asc` for API endpoints (explicit in schemas)
- Default sort direction: `desc` for Elasticsearch queries (explicit in implementation)
- Default sort fields are entity-specific (e.g., `sort_order` for categories, `created_at` for timestamped entities)

## Implementation Guidelines

### Defining API Schemas

Use the helper functions from `@pika/api`:

```typescript
import { Type } from '@sinclair/typebox'
import { createSortSchema } from '@api/schemas/utils/helper.js'

// Define allowed sort fields
const EntitySortFields = Type.Union([Type.Literal('name'), Type.Literal('created_at'), Type.Literal('updated_at')], { default: 'created_at' })

// Create sort schema with defaults
const sortSchema = createSortSchema(
  EntitySortFields, // Allowed fields
  'created_at', // Default field
  'desc', // Default direction
)
```

### Controller Implementation

Use the shared sorting utilities to normalize parameters:

```typescript
import { normalizeApiSortParams } from '@pika/shared'

// In controller method
const { sortBy, sortOrder } = normalizeApiSortParams({
  sort: query.sort,
  sort_by: query.sort_by,
  sort_order: query.sort_order,
})

// Pass to service/repository
const result = await this.entityService.findAll({
  // other params
  sortBy,
  sortOrder,
})
```

### Repository Implementation

Repositories use `sortBy` and `sortOrder` in camelCase format:

```typescript
// Use toPrismaSort for Prisma repositories
import { toPrismaSort } from '@pika/shared'

const orderBy = toPrismaSort(
  { sortBy, sortOrder },
  'createdAt', // Default field
  'desc', // Default direction
)

// SQL repositories
import { toSqlOrderByClause } from '@pika/shared'

const orderClause = toSqlOrderByClause(
  { sortBy, sortOrder },
  'created_at', // Default field
  'desc', // Default direction
)
```

### Elasticsearch Implementation

For Elasticsearch queries, use the `sortByParams` or `sortByApiParams` methods:

```typescript
// Using normalized params
const queryBuilder = new SearchQueryBuilder().sortByParams(
  { sortBy, sortOrder },
  'createdAt', // Default field
  'desc', // Default direction (ES default)
)

// Directly from API params
const queryBuilder = new SearchQueryBuilder().sortByApiParams(
  {
    sort: query.sort,
    sort_by: query.sort_by,
    sort_order: query.sort_order,
  },
  'created_at',
  'desc',
)
```

## Field Names Convention

- **API/Database**: Use `snake_case` for field names in API parameters and database column names
- **Internal Code**: Use `camelCase` for internal variables, properties, and method parameters
- **Conversion**: Automatic conversion happens at the boundaries (API → Controller → Service → Repository)

## Preparing for GraphQL

The standardized sorting approach allows for easy expansion to GraphQL in the future:

```graphql
# Future GraphQL type definition
input SortInput {
  field: SortField!
  direction: SortDirection!
}

enum SortDirection {
  ASC
  DESC
}

enum SortField {
  CREATED_AT
  NAME
  PRICE
  # Other sortable fields
}
```

The internal utilities can be extended to handle GraphQL sort inputs with minimal changes.

## Utility Functions Reference

| Function                 | Purpose                                                 |
| ------------------------ | ------------------------------------------------------- |
| `normalizeApiSortParams` | Converts API parameters to standardized sort parameters |
| `parseSortString`        | Extracts field and direction from combined sort string  |
| `toPrismaSort`           | Creates a Prisma-compatible sort object                 |
| `toSqlOrderByClause`     | Creates a SQL ORDER BY clause                           |
| `toElasticsearchSort`    | Creates Elasticsearch sort parameters                   |
| `isValidSortField`       | Validates if a sort field is allowed                    |
| `createSortValidator`    | Creates a function to validate sort parameters          |

All utility functions are available in `@pika/shared` and fully documented with JSDoc.
