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
│   │   └── responses.ts        # Shared category responses  if is used on admin only
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
│   │   └── responses.ts        # Shared category responses if is used on public only
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
│   │   └── responses.ts        # Shared category responses
│   ├── common/
│   │   ├── parameters.ts    # CategoryIdParam, shared params
│   │   ├── enums.ts        # Category-specific enums (REQUIRED)
│   │   └── types.ts        # Shared category types
│   │   └── headers.ts        # Shared category headers
│   │   └── queries.ts        # Shared category queries
│   │   └── sorting.ts        # Shared category sorting
│   │   └── relations.ts        # Shared category relations
│   │   └── responses.ts        # Shared category responses
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

8. **Pagination Strategy (Standardized Across All Tiers)**:

   **Core Components**:
   - `SearchParams` from `shared/pagination.js` - Provides page, limit, sortBy, sortOrder, search
   - `paginatedResponse()` from `shared/responses.js` - Wraps data with pagination metadata

   **Universal Pattern - ALL Tiers (Public/Admin/Internal)**:

   All list endpoints MUST use pagination for consistency and future-proofing:

   ```typescript
   // Query params ALWAYS extend SearchParams
   export const ResourceQueryParams = SearchParams.extend({
     status: ResourceStatus.optional(),
     // ... other filters
     sortBy: ResourceSortBy.default('createdAt'), // Override with service-specific enum
   })

   // Response ALWAYS uses paginatedResponse
   export const ResourceListResponse = paginatedResponse(ResourceSchema)
   ```

   **This applies to**:
   - Public endpoints (user-facing lists)
   - Admin endpoints (management lists)
   - Internal endpoints (service-to-service lists)

   **Benefits of Standardization**:
   - Single pattern to learn and implement
   - Consistent client code across all service calls
   - Future-proof (no breaking changes when data grows)
   - Reusable pagination utilities and types
   - Predictable API behavior

   **Limited Exceptions** (direct arrays only when):
   1. **Bounded validation operations**:

   ```typescript
   // Input explicitly limits output
   export const ValidateResourcesRequest = z.object({
     resourceIds: z.array(UUID).min(1).max(100), // Max 100 enforced
   })

   export const ValidateResourcesResponse = z.object({
     results: z.array(ValidationResult), // Always ≤ 100 items
   })
   ```

   2. **Single-entity relationships**:

   ```typescript
   // One-to-one relationship, not a list
   export const GetUserBusinessResponse = z.object({
     business: BusinessData.optional(), // User has 0 or 1 business
   })
   ```

   **Implementation Guidelines**:
   - Default to pagination for ANY endpoint returning arrays
   - Question every exception - will this really never grow?
   - Internal APIs are APIs too - treat them with same rigor
   - Consider: "What happens when this service has 1M+ records?"

   **Migration Note**: Existing internal endpoints without pagination should be migrated in next major version to maintain consistency.

## Service/Repository Pagination Pattern (CRITICAL)

### Core Rule: Repository Builds Pagination

**The repository layer is responsible for building pagination metadata, not the service layer.** This ensures consistency and prevents duplication.

#### ✅ Correct Pattern:

```typescript
// Repository builds complete pagination structure
export class CategoryRepository {
  async findByIds(ids: string[]): Promise<PaginatedResult<Category>> {
    const categories = await this.prisma.category.findMany({
      where: { id: { in: ids } },
    })

    // Repository builds pagination metadata for bounded operation
    return {
      data: CategoryMapper.fromPrismaCategoryArray(categories),
      pagination: {
        page: 1,
        limit: ids.length,
        total: categories.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    }
  }
}

// Service passes through repository result
export class CategoryService {
  async getCategoriesByIds(ids: string[]): Promise<PaginatedResult<Category>> {
    const result = await this.repository.findByIds(ids)
    return result // No modification needed
  }
}

// Controller uses service result directly
export class InternalCategoryController {
  async getCategoriesByIds(req: Request, res: Response): Promise<void> {
    const result = await this.categoryService.getCategoriesByIds(categoryIds)

    const response = {
      data: result.data.map(CategoryMapper.toInternalDTO),
      pagination: result.pagination, // Pass through pagination
    }

    const validatedResponse = BulkCategoryResponse.parse(response)
    res.json(validatedResponse)
  }
}
```

#### ❌ Wrong Pattern:

```typescript
// DON'T build pagination in service layer
export class CategoryService {
  async getCategoriesByIds(ids: string[]): Promise<PaginatedResult<Category>> {
    const categories = await this.repository.findByIds(ids) // Returns Category[]

    // ❌ Building pagination in service violates separation
    return {
      data: categories,
      pagination: {
        page: 1,
        limit: ids.length,
        total: categories.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    }
  }
}
```

### Key Benefits of Repository Pagination:

1. **Single Responsibility**: Repository handles all data access concerns including pagination
2. **Consistency**: Same pagination logic for bounded and unbounded operations
3. **Clean Service Layer**: Services focus on business logic, not data formatting
4. **Type Safety**: PaginatedResult type enforced at data access boundary
5. **Future-Proof**: Easy to modify pagination logic in one place

### Implementation Rules:

1. **Repository Returns PaginatedResult**: ALL repository methods returning arrays should return `PaginatedResult<T>`
2. **Service Passes Through**: Services return repository results without modification
3. **Controller Transforms**: Controllers transform data using mappers, preserve pagination structure
4. **Bounded Operations**: Even operations with known limits use pagination structure for consistency

## Mapper Architecture (In Transition)

### Current State (2025-01-24)

The platform is transitioning from shared mappers to service-owned mappers following DOMAIN_TYPES_REFACTORING.md:

#### ✅ **SDK Mappers** (Current Standard - Most Services)

```typescript
// Business, User, Support, Voucher, Communication, Subscription, Storage
import { BusinessMapper } from '@pika/sdk'
```

#### 🔄 **Local Mappers** (Future Standard - Transition Services)

```typescript
// Category, Auth, PDF (following DOMAIN_TYPES_REFACTORING.md)
import { CategoryMapper } from '../mappers/CategoryMapper.js'
```

### Migration Path

**Phase 1**: SDK Mappers (Current) → **Phase 2**: Local Mappers (Target)

- **Current**: Most services use `@pika/sdk` mappers for consistency
- **Target**: Each service owns its mappers for independence (see DOMAIN_TYPES_REFACTORING.md)
- **Transition**: Category and Auth services are pilot implementations of local mapper pattern

### Guidelines

1. **New Services**: Use local mappers (`../mappers/`) following Category service pattern
2. **Existing Services**: Continue using SDK mappers until migration
3. **Updates**: When fixing services, maintain current mapper pattern unless specifically migrating
4. **Consistency**: Don't mix patterns within a single service

### Migration Strategy:

When updating existing services:

1. Update repository interface to return `PaginatedResult<T>`
2. Update repository implementation to build pagination metadata
3. Update service to pass through results (remove any pagination building)
4. Update controller to handle new structure
5. Update response schemas to use `paginatedResponse()`

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

## Response Validation Pattern (Industry Standard)

### Overview

Response validation using Zod's `.parse()` method is an industry standard practice that ensures API responses match their documented schemas at runtime. This pattern complements request validation and provides end-to-end type safety.

### Why Response Validation?

1. **Runtime Contract Enforcement**: Guarantees responses match OpenAPI/Zod schemas
2. **Early Error Detection**: Catches mapper/transformation errors immediately
3. **Type Safety**: TypeScript compile-time checks + Zod runtime validation
4. **Schema Evolution Safety**: Breaking changes are caught during development
5. **Developer Confidence**: What you send === what you documented

### Implementation Pattern

```typescript
// Controllers should validate responses before sending
export class ServiceController {
  async getResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Execute business logic
      const result = await this.service.getResource(req.params.id)

      // 2. Transform to DTO
      const response = ResourceMapper.toDTO(result)

      // 3. Validate against Zod schema
      const validatedResponse = resourcePublic.ResourceResponse.parse(response)

      // 4. Send validated response
      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  async listResources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.service.listResources(params)

      // ✅ RECOMMENDED: Use paginatedResponse utility + validation
      const response = paginatedResponse(result, ResourceMapper.toDTO)
      const validatedResponse = resourcePublic.ResourceListResponse.parse(response)
      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
```

### Pagination Response Patterns

#### ✅ Recommended Pattern: paginatedResponse Utility + Validation

```typescript
// BEST: Clean, reusable, and validated
const response = paginatedResponse(result, ResourceMapper.toDTO)
const validatedResponse = resourcePublic.ResourceListResponse.parse(response)
res.json(validatedResponse)
```

#### ❌ Discouraged Pattern: Manual Construction

```typescript
// AVOID: Verbose and repetitive
const response = {
  data: result.data.map(ResourceMapper.toDTO),
  pagination: result.pagination,
}
const validatedResponse = resourcePublic.ResourceListResponse.parse(response)
res.json(validatedResponse)
```

#### ❌ Wrong Pattern: No Validation

```typescript
// NEVER: Missing critical validation step
res.json(paginatedResponse(result, ResourceMapper.toDTO))
```

The `paginatedResponse` utility from `@pika/http` provides clean, consistent pagination transformation while maintaining the required validation step.

### Key Benefits

1. **Mapper Validation**: Ensures mappers produce correct data structure
2. **Type Narrowing**: After `.parse()`, TypeScript knows exact response type
3. **Detailed Errors**: Zod provides clear error messages for debugging
4. **Consistency**: Same validation approach as request validation
5. **DRY Principle**: Utility eliminates repetitive pagination construction

### Common Validation Issues Caught

- Missing required fields
- Incorrect date formats (Date vs ISO string)
- Wrong number types (string vs number for decimals)
- Null/undefined handling
- Branded type mismatches (e.g., UserId vs string)
- Enum value mismatches

### Best Practices

1. **Validate at Controller Level**: Keep validation in controllers, not services
2. **Use Try-Catch**: Zod throws on validation failure - handle appropriately
3. **Log Validation Errors**: In development, log what failed validation
4. **Test Response Schemas**: Integration tests should verify response structure
5. **Keep DTOs Aligned**: Ensure mapper DTOs match Zod schema expectations

### Example with All Response Types

```typescript
// Single entity response
const validatedResponse = businessPublic.BusinessResponse.parse(BusinessMapper.toDTO(business))

// Paginated response
const validatedResponse = businessPublic.BusinessListResponse.parse({
  data: businesses.map(BusinessMapper.toDTO),
  pagination: result.pagination,
})

// Admin response with extra fields
const validatedResponse = businessAdmin.AdminBusinessResponse.parse(BusinessMapper.toAdminDTO(business))

// Internal service response
const validatedResponse = businessInternal.InternalBusinessData.parse(BusinessMapper.toInternalDTO(business))

// Bulk/batch responses
const validatedResponse = businessInternal.BulkBusinessResponse.parse({
  businesses: validBusinesses.map(BusinessMapper.toInternalDTO),
  notFound: missingIds,
})
```

### Migration Strategy

When adding response validation to existing controllers:

1. Start with new endpoints first
2. Add validation to existing endpoints gradually
3. Fix mapper issues as they're discovered
4. Update integration tests to expect validated responses
5. Monitor for validation errors in staging/production

### Performance Considerations

- Zod parsing is fast but not free (~microseconds per object)
- For high-throughput endpoints, consider:
  - Validation sampling in production
  - Development-only validation
  - Caching validated responses
- Most APIs benefit more from correctness than micro-optimizations

### Error Handling

```typescript
try {
  const validatedResponse = schema.parse(response)
  res.json(validatedResponse)
} catch (error) {
  if (error instanceof z.ZodError) {
    // Log the validation error for debugging
    logger.error('Response validation failed', {
      errors: error.errors,
      response: response,
    })
    // Still send response in production to avoid breaking clients
    // But log/alert for immediate fixing
    res.json(response)
  } else {
    next(error)
  }
}
```

This pattern ensures API reliability and maintains the contract between backend and frontend/clients.

## Response Validation Summary

### ✅ REQUIRED Pattern for All Controllers

```typescript
// Single entity responses
const responseData = EntityMapper.toDTO(entity)
const validatedResponse = entityPublic.EntityResponse.parse(responseData)
res.json(validatedResponse)

// Paginated list responses
const responseData = paginatedResponse(result, EntityMapper.toDTO)
const validatedResponse = entityPublic.EntityListResponse.parse(responseData)
res.json(validatedResponse)
```

### Key Requirements

1. **Always use `.parse()`**: Every response must be validated against its Zod schema
2. **Use paginatedResponse utility**: For list endpoints, use the utility for clean code
3. **Import from @pika/http**: `import { paginatedResponse } from '@pika/http'`
4. **Type safety**: Validation provides both runtime and compile-time safety

### Benefits of This Pattern

- **Clean Code**: `paginatedResponse` utility eliminates repetitive code
- **Runtime Safety**: `.parse()` catches transformation errors immediately
- **Contract Enforcement**: Responses always match documented schemas
- **Developer Experience**: Clear errors when mappers produce incorrect data

## OpenAPI Schema Pattern (CRITICAL)

### Dual Schema Pattern for OpenAPI Compatibility

**ALL schemas must provide both raw Zod schemas and OpenAPI-wrapped versions** to ensure proper API documentation generation and SDK compatibility.

### ✅ REQUIRED Pattern

Every schema file must follow this pattern:

```typescript
import { z } from 'zod'
import { openapi } from '../../../../common/utils/openapi.js'

/**
 * Entity request (raw Zod) - for runtime validation
 */
export const EntityRequest = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

/**
 * Entity request (OpenAPI documented) - for API documentation
 */
export const EntityRequestSchema = openapi(EntityRequest, {
  description: 'Request to create or update entity',
})

export type EntityRequest = z.infer<typeof EntityRequest>
```

### Implementation Rules

1. **Raw Zod Schema**: Named as `EntityName` (e.g., `InitializeDraftRequest`)
2. **OpenAPI Schema**: Named as `EntityNameSchema` (e.g., `InitializeDraftRequestSchema`)
3. **Type Export**: Uses the raw schema name (e.g., `type InitializeDraftRequest`)
4. **Comment Pattern**: Raw schemas labeled "(raw Zod)", OpenAPI schemas labeled "(OpenAPI documented)"

### Usage in Routes

```typescript
// Use raw Zod schema for validation middleware
router.post(
  '/entity',
  validateBody(entityPublic.EntityRequest), // Raw Zod schema
  controller.createEntity,
)

// OpenAPI schemas are used in API documentation generation
registry.registerSchema('EntityRequest', EntityRequestSchema) // OpenAPI schema
```

### Real Examples from Voucher Wizard Implementation

```typescript
// draft.ts
export const InitializeDraftRequest = z.object({ ... }) // Raw Zod
export const InitializeDraftRequestSchema = openapi(InitializeDraftRequest, { ... }) // OpenAPI

// steps.ts
export const Step1Request = z.object({ ... }) // Raw Zod
export const Step1RequestSchema = openapi(Step1Request, { ... }) // OpenAPI

// validation.ts
export const ValidateStepRequest = z.object({ ... }) // Raw Zod
export const ValidateStepRequestSchema = openapi(ValidateStepRequest, { ... }) // OpenAPI
```

### Benefits of This Pattern

- **Runtime Validation**: Raw Zod schemas used by middleware for request/response validation
- **API Documentation**: OpenAPI schemas generate accurate API specs and SDKs
- **Type Safety**: Single source of truth for types via `z.infer`
- **Backwards Compatible**: Existing code using raw schemas continues to work
- **Clear Separation**: Obvious which schema is for which purpose
