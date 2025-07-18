# Schema Organization Pattern - The Perfect Template

This document defines the standard schema organization pattern that ALL services MUST follow. The Category service serves as the reference implementation.

## Directory Structure

```
packages/api/src/schemas/[service]/
├── public/              # Public API schemas (customer-facing)
│   ├── index.ts        # Re-exports all public schemas
│   └── [feature].ts    # Feature-specific schemas (e.g., category.ts)
├── admin/              # Admin API schemas (admin panel)
│   ├── index.ts        # Re-exports all admin schemas
│   └── management.ts   # Admin management operations
├── internal/           # Internal API schemas (service-to-service)
│   ├── index.ts        # Re-exports all internal schemas
│   └── service.ts      # Internal service operations
├── common/             # Service-specific shared schemas
│   ├── enums.ts        # Service-specific enums
│   └── types.ts        # Service-specific shared types
└── index.ts            # Main entry - exports all tiers
```

## File Naming Convention

- **Public schemas**: Named by feature/entity (e.g., `category.ts`, `profile.ts`)
- **Admin schemas**: Always `management.ts` for consistency
- **Internal schemas**: Always `service.ts` for consistency
- **Common schemas**: `enums.ts` for enums, `types.ts` for shared types

## Schema Content Pattern

### 1. Public Schema (`public/[feature].ts`)

```typescript
import { z } from 'zod'

// Import from shared schemas (NOT from service-specific common)
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams, paginatedResponse } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

// Import service-specific enums from common
import { CategorySortBy } from '../common/enums.js'

/**
 * Public [feature] schemas
 */

// ============= Response Schemas =============

export const CategoryResponse = openapi(
  withTimestamps({
    id: UUID,
    // ... fields
  }),
  {
    description: 'Category information',
  },
)

export type CategoryResponse = z.infer<typeof CategoryResponse>

// ============= Query Parameters =============

export const CategoryQueryParams = SearchParams.extend({
  // ... additional params
  sortBy: CategorySortBy.default('sortOrder'),
})

export type CategoryQueryParams = z.infer<typeof CategoryQueryParams>

// ============= Response Types =============

export const CategoryListResponse = paginatedResponse(CategoryResponse)

export type CategoryListResponse = z.infer<typeof CategoryListResponse>
```

### 2. Admin Schema (`admin/management.ts`)

```typescript
import { z } from 'zod'

// Import shared schemas
import { UserId } from '../../shared/branded.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

// Import public schemas for extension
import { CategoryResponse } from '../public/category.js'

/**
 * Admin [service] management schemas
 */

// ============= Admin Response =============

export const AdminCategoryResponse = CategoryResponse.extend({
  deletedAt: z.string().datetime().nullable(),
  createdBy: UserId,
  updatedBy: UserId.optional(),
})

export type AdminCategoryResponse = z.infer<typeof AdminCategoryResponse>

// ============= Create/Update Requests =============

export const CreateCategoryRequest = openapi(
  z.object({
    // ... fields
  }),
  {
    description: 'Create a new category',
  },
)

export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequest>

// ============= Admin Operations =============

export const BulkDeleteCategoriesRequest = openapi(
  z.object({
    categoryIds: z.array(UUID).min(1).max(100),
  }),
  {
    description: 'Delete multiple categories',
  },
)

export type BulkDeleteCategoriesRequest = z.infer<typeof BulkDeleteCategoriesRequest>
```

### 3. Internal Schema (`internal/service.ts`)

```typescript
import { z } from 'zod'

import { UUID } from '../../shared/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Internal [service] schemas for service-to-service communication
 */

// ============= Internal Data =============

export const InternalCategoryData = openapi(
  z.object({
    id: UUID,
    // Minimal fields for internal use
  }),
  {
    description: 'Internal category data for services',
  },
)

export type InternalCategoryData = z.infer<typeof InternalCategoryData>

// ============= Service Operations =============

export const ValidateCategoryRequest = openapi(
  z.object({
    categoryIds: z.array(UUID).min(1).max(100),
    checkActive: z.boolean().default(true),
  }),
  {
    description: 'Validate categories exist',
  },
)

export type ValidateCategoryRequest = z.infer<typeof ValidateCategoryRequest>
```

### 4. Common Enums (`common/enums.ts`)

```typescript
import { z } from 'zod'

/**
 * Category-specific enums
 */

export const CategorySortBy = z.enum(['name', 'sortOrder', 'createdAt', 'updatedAt'])

export type CategorySortBy = z.infer<typeof CategorySortBy>
```

### 5. Index Files

#### Service Index (`index.ts`)

```typescript
// Category service exports - all tiers
export * from './admin/index.js'
export * from './public/index.js'
export * from './internal/index.js'
```

#### Tier Index (`[tier]/index.ts`)

```typescript
/**
 * [Tier] category schemas
 */

export * from './[file].js'
```

## Import Rules

### 1. NEVER Import Cross-Tier

- Public schemas should NOT import from admin or internal
- Admin can import from public for extension
- Internal should be completely independent

### 2. Shared Resources Location

- **Path parameters** (e.g., `CategoryIdParam`): Import from `@pika/api/common`
- **Branded types** (e.g., `UserId`, `Email`): Import from `../../shared/branded.js`
- **Primitives** (e.g., `UUID`): Import from `../../shared/primitives.js`
- **Utilities**: Import from `../../../common/utils/[util].js`

### 3. Service-Specific Resources

- **Enums**: Define in `common/enums.ts`, import as `../common/enums.js`
- **Shared types**: Define in `common/types.ts`, import as `../common/types.js`

## Common Patterns

### 1. Response Schema Pattern

```typescript
// Basic response
export const EntityResponse = openapi(
  withTimestamps({
    id: UUID,
    // fields
  }),
  { description: 'Entity information' },
)

// Admin extends public
export const AdminEntityResponse = EntityResponse.extend({
  deletedAt: z.string().datetime().nullable(),
  createdBy: UserId,
})

// List response
export const EntityListResponse = paginatedResponse(EntityResponse)
```

### 2. Query Parameters Pattern

```typescript
// Extend SearchParams for standard pagination
export const EntityQueryParams = SearchParams.extend({
  // additional filters
  sortBy: EntitySortBy.default('createdAt'),
})
```

### 3. Request Schema Pattern

```typescript
export const CreateEntityRequest = openapi(
  z.object({
    // required fields
  }),
  { description: 'Create a new entity' },
)

export const UpdateEntityRequest = CreateEntityRequest.partial()
```

## Validation Rules

1. **All schemas** must be wrapped with `openapi()` helper
2. **All schemas** must have TypeScript type exports using `z.infer`
3. **All schemas** must have descriptive JSDoc comments
4. **All imports** must use `.js` extension for ESM
5. **All path parameters** must import from `@pika/api/common`

## Migration Checklist

When creating schemas for a new service:

- [ ] Create directory structure following the pattern
- [ ] Create `common/enums.ts` for service-specific enums
- [ ] Create `public/[feature].ts` with response and query schemas
- [ ] Create `admin/management.ts` with admin operations
- [ ] Create `internal/service.ts` with service-to-service schemas
- [ ] Create index files at each level
- [ ] Ensure CategoryIdParam imports from `@pika/api/common`
- [ ] Follow import rules strictly
- [ ] Add exports to tier-level index files in `src/[tier]/index.ts`

## Example: Category Service

The Category service at `/packages/api/src/schemas/category/` serves as the perfect reference implementation. When creating schemas for a new service, copy this structure and adapt the schemas to your service's needs.
