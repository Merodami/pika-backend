# Schema Organization Strategy

## Current Issues with Schema Structure

The current schema organization (`src/{tier}/schemas/{service}/`) has several problems:

1. **Duplication**: Same parameters (e.g., CategoryIdParam) repeated across admin/public/internal
2. **Scattered domain logic**: All category schemas spread across 3 directories
3. **Hard to maintain**: Changes to category domain require touching 3+ places
4. **Inconsistent sharing**: Some services have parameters.ts, others don't
5. **Poor cohesion**: Related schemas are physically separated

## Proposed New Structure

### Service-First Organization: `src/schemas/{service}/{tier}/`

```
src/schemas/
├── category/
│   ├── admin/
│   │   ├── management.ts
│   │   └── index.ts
│   │   ├── parameters.ts    # CategoryIdParam, shared params if is used on admin only
│   │   ├── enums.ts        # Category-specific enums (REQUIRED) if is used on admin only
│   │   └── types.ts        # Shared category types if is used on admin only
│   │   └── headers.ts        # Shared category headers if is used on admin only
│   │   └── queries.ts        # Shared category queries if is used on admin only
│   │   └── sorting.ts        # Shared category sorting if is used on admin only
│   │   └── relations.ts        # Shared category relations if is used on admin only
│   ├── public/
│   │   ├── category.ts
│   │   └── index.ts
│   │   ├── parameters.ts    # CategoryIdParam, shared params if is used on public only
│   │   ├── enums.ts        # Category-specific enums (REQUIRED) if is used on public only
│   │   └── types.ts        # Shared category types if is used on public only
│   │   └── headers.ts        # Shared category headers if is used on public only
│   │   └── queries.ts        # Shared category queries if is used on public only
│   │   └── sorting.ts        # Shared category sorting if is used on public only
│   │   └── relations.ts        # Shared category relations if is used on public only
│   ├── internal/
│   │   ├── service.ts
│   │   └── index.ts
│   │   ├── parameters.ts    # CategoryIdParam, shared params if is used on internal only
│   │   ├── enums.ts        # Category-specific enums (REQUIRED) if is used on internal only
│   │   └── types.ts        # Shared category types if is used on internal only
│   │   └── headers.ts        # Shared category headers if is used on internal only
│   │   └── queries.ts        # Shared category queries if is used on internal only
│   │   └── sorting.ts        # Shared category sorting if is used on internal only
│   │   └── relations.ts        # Shared category relations if is used on internal only
│   ├── common/
│   │   ├── parameters.ts    # CategoryIdParam, shared params
│   │   ├── enums.ts        # Category-specific enums (REQUIRED)
│   │   └── types.ts        # Shared category types
│   │   └── headers.ts        # Shared category headers
│   │   └── queries.ts        # Shared category queries
│   │   └── sorting.ts        # Shared category sorting
│   │   └── relations.ts        # Shared category relations
│   └── index.ts            # Re-exports all tiers
├── user/
│   ├── admin/
│   ├── public/
│   ├── internal/
│   ├── common/
│   └── index.ts
├── payment/
│   ├── admin/
│   ├── public/
│   ├── internal/
│   ├── common/
│   └── index.ts
├── shared/                 # Cross-service shared schemas
│   ├── parameters.ts       # Generic UUIDParam, etc.
│   ├── enums.ts           # Cross-service enums
│   ├── primitives.ts
│   ├── pagination.ts
│   └── responses.ts
└── index.ts               # Main exports by tier
```

### Benefits

1. **Single source of truth** for all service-related schemas
2. **No duplication** - CategoryIdParam lives in category/common/parameters.ts
3. **Easier maintenance** - all category changes in one place
4. **Better cohesion** - related schemas grouped together
5. **Extensible** - easy to add new tiers or schema types per service
6. **Cleaner imports** - `import { CategoryIdParam } from '@pika/api/schemas/category/common'`

### Import Patterns (Using Path Mappings)

**NEW: TypeScript Path Mapping Configuration**

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@api/*": ["src/*"],
      "@api": ["src/index.ts"]
    }
  }
}
```

**Improved Import Patterns**

```typescript
// Service-specific imports (NEW: using @api path mapping)
import { CategoryIdParam } from '@api/schemas/category/common'
import { CreateCategoryRequest } from '@api/schemas/category/admin'
import { CategoryResponse } from '@api/schemas/category/public'

// Cross-service imports
import { UUIDParam, UserIdParam } from '@api/schemas/shared/parameters'
import { SortOrder } from '@api/schemas/shared/enums'

// Utility imports (NEW: improved utilities)
import { createSortFieldMapper, mapSortOrder } from '@api/common/utils/sorting'
import { safeParse, formatZodError } from '@api/common/utils/validators'
import { openapi } from '@api/common/utils/openapi'

// Tier-specific imports (for backward compatibility)
import * as AdminSchemas from '@api/schemas/admin'
import * as PublicSchemas from '@api/schemas/public'
```

### Migration Strategy

1. **Phase 1**: Keep current structure, finish category service
2. **Phase 2**: Create new structure alongside current one
3. **Phase 3**: Migrate service by service (start with category)
4. **Phase 4**: Update all imports across codebase
5. **Phase 5**: Remove old structure

### Backward Compatibility

During migration, maintain tier-based exports:

```typescript
// src/schemas/admin/index.ts
export * from '../category/admin/index.js'
export * from '../user/admin/index.js'
export * from '../payment/admin/index.js'
```

This allows existing imports to continue working while new code uses the service-first organization.

## Implementation Priority

- **Priority**: After category service completion
- **Effort**: 2-3 weeks (systematic migration)
- **Risk**: Medium (many import changes)
- **Benefit**: High (long-term maintainability)

## Decision

✅ **IMPLEMENTED** - Service-first organization successfully deployed as of 2025-01-17.

## Current Implementation Status

### Completed Services (Following New Pattern)

1. **Category Service** ✅ - PERFECT TEMPLATE
   - Centralized enums in `common/enums.ts`
   - Uses `SearchParams` from shared pagination
   - Clean separation of admin/public/internal
   - No domain-specific features

2. **User Service** ✅
   - Deep cleaned - removed all gym/professional features
   - Centralized enums (UserRole, UserStatus, etc.)
   - Removed: address.ts, paymentMethod.ts, parq.ts, professional.ts
   - Follows Category template pattern

3. **Auth Service** ✅
   - Centralized enums (TokenType, OAuthProvider)
   - Removed gym-specific roles
   - Clean structure following template

4. **Payment Service** ✅
   - Removed all credit/gym features
   - Centralized all enums (30+ enums moved to common/enums.ts)
   - Uses standardized `SearchParams` and `DateRangeParams`
   - Replaced gym references with business references
   - All enum values in camelCase

5. **Communication Service** ✅
   - Centralized 25+ enums (EmailStatus, NotificationType, TemplateCategory, etc.)
   - Created `common/parameters.ts` with service-specific params
   - All search params use `SearchParams.extend()` pattern
   - Service-specific SortBy enums override generic sortBy
   - No gym features found (was already clean)
   - All enum values in camelCase

### Pattern Requirements

1. **Mandatory Structure**:

   ```
   service/
   ├── admin/
   ├── public/
   ├── internal/
   └── common/
       ├── enums.ts      # REQUIRED - All service enums
       ├── parameters.ts # REQUIRED - Shared params (IDs, etc.)
       ├── types.ts      # Optional - Complex shared types
       └── relations.ts  # Optional - Service-specific relation types
   ```

2. **Enum Standardization**:
   - ALL enums must be in `common/enums.ts`
   - No inline `z.enum()` definitions
   - Use camelCase for enum values
   - Export both schema and type

3. **Pagination & Search**:
   - Use `SearchParams` from `shared/pagination.js`
   - Extend with service-specific filters
   - Use `paginatedResponse` from `shared/responses.js`
   - Override `sortBy` with service-specific SortBy enum
   - SortOrder is already included in SearchParams

4. **SortBy Pattern**:

   ```typescript
   // In common/enums.ts
   export const ServiceSortBy = z.enum(['createdAt', 'name', 'updatedAt'])

   // In search params
   export const ServiceSearchParams = SearchParams.extend({
     // ... other filters
     sortBy: ServiceSortBy.default('createdAt'),
   })
   ```

5. **Include Relations Pattern (Industry Standard)**:
   - Use single `include` parameter with comma-separated values
   - Follow JSON:API specification pattern
   - Return complete objects when included, not just IDs/names
   - Maintain both ID fields and optional complete objects

   ```typescript
   // CORRECT: Industry standard pattern
   export const ResourceResponse = z.object({
     id: UUID,
     name: z.string(),
     categoryId: UUID, // Keep ID for direct reference
     category: CategoryResponse.optional(), // Complete object when ?include=category
   })

   // Query parameter
   export const ResourceSearchParams = SearchParams.extend({
     // ... filters
     include: z.string().optional().describe('Comma-separated relations: category,provider,tags'),
   })
   ```

6. **Relation Implementation**:
   - Define allowed relations as constants
   - Use `parseIncludeParam` utility for validation
   - Repository layer handles conditional Prisma includes
   - Mappers transform complete objects when present

   ```typescript
   // In common/relations.ts
   export const RESOURCE_ALLOWED_RELATIONS = ['category', 'provider', 'tags'] as const

   // In controller
   const parsedIncludes = query.include ? parseIncludeParam(query.include, RESOURCE_ALLOWED_RELATIONS) : {}
   ```

7. **Domain Cleanup**:
   - Remove ALL gym/fitness specific features
   - Remove credit/points systems
   - Keep only core business logic

## Recent Implementation (2025-01-17)

### ✅ Service-First Organization Completed

The complete migration to service-first organization has been successfully implemented:

1. **Full Schema Restructure**: All schemas moved from `{tier}/schemas/{service}/` to `schemas/{service}/{tier}/`
2. **Index Files**: Proper index.ts files created throughout the structure for clean exports
3. **Path Mappings**: Updated to use `@api/*` path mapping for cleaner imports
4. **Generator Updates**: All OpenAPI generators updated to work with new structure
5. **SDK Generation**: Now generates into `frontend/dashboard/lib/api/generated/`

### ✅ Zod v4 Compatibility & Recursive Schemas

Successfully upgraded to Zod v4 with full compatibility:

1. **Recursive Schema Pattern**: Implemented manual `$ref` pattern for recursive schemas

   ```typescript
   // Example: CategoryResponse with recursive children
   export const CategoryResponse = BaseCategoryResponse.extend({
     children: z
       .array(BaseCategoryResponse)
       .optional()
       .describe('Child categories for hierarchical display')
       .openapi({
         type: 'array',
         items: {
           $ref: '#/components/schemas/CategoryResponse',
         },
       }),
   }).openapi('CategoryResponse', {
     description: 'Category information with hierarchical structure',
   })
   ```

2. **z.partialRecord Fix**: Implemented programmatic z.object() workaround

   ```typescript
   // Fixed z.partialRecord bug using programmatic approach
   revenueByType: z.object(Object.fromEntries(TransactionType.options.map((key) => [key, Money.optional()]))).openapi({
     description: 'Revenue by transaction type (all keys optional)',
   })
   ```

3. **Zod v4 Breaking Changes Fixed**:
   - Updated enum handling and errorMap usage
   - Fixed z.record() parameter requirements
   - Removed deprecated zod-validation-error dependency
   - Updated openapi() method signatures

### ✅ Build & Generation Pipeline

Complete end-to-end pipeline working:

1. **API Package**: Builds and typechecks without errors
2. **OpenAPI Generation**: All specs generate correctly (public, admin, internal)
3. **SDK Generation**: TypeScript SDK generated with 200+ interfaces and service classes
4. **Frontend Integration**: SDK generated directly into frontend/dashboard following industry standards

### Removed Services

Successfully removed unused services from all generators:

- gym, session, equipment, stuff, induction, special hours, promo code, dashboard, credit

### Technical Achievements

1. **Type Safety**: Complete type safety maintained throughout API/SDK generation flow
2. **Clean Architecture**: Service-first organization improves maintainability
3. **Industry Standards**: SDK generation follows frontend development best practices
4. **Zod v4 Ready**: Full compatibility with latest Zod features
5. **Recursive Support**: Proper handling of hierarchical data structures
