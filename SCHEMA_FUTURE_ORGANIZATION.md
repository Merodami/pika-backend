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
│   ├── public/
│   │   ├── category.ts
│   │   └── index.ts
│   ├── internal/
│   │   ├── service.ts
│   │   └── index.ts
│   ├── common/
│   │   ├── parameters.ts    # CategoryIdParam, shared params
│   │   ├── enums.ts        # Category-specific enums (REQUIRED)
│   │   └── types.ts        # Shared category types
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

### Import Patterns

```typescript
// Service-specific imports
import { CategoryIdParam } from '@pika/api/schemas/category/common'
import { CreateCategoryRequest } from '@pika/api/schemas/category/admin'
import { CategoryResponse } from '@pika/api/schemas/category/public'

// Cross-service imports
import { UUIDParam, UserIdParam } from '@pika/api/schemas/shared/parameters'
import { SortOrder } from '@pika/api/schemas/shared/enums'

// Tier-specific imports (for backward compatibility)
import * as AdminSchemas from '@pika/api/schemas/admin'
import * as PublicSchemas from '@pika/api/schemas/public'
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

Approved for future implementation. Continue with current structure for category service, then migrate to service-first organization.

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
       └── types.ts      # Optional - Complex shared types
   ```

2. **Enum Standardization**:
   - ALL enums must be in `common/enums.ts`
   - No inline `z.enum()` definitions
   - Use camelCase for enum values
   - Export both schema and type

3. **Pagination**:
   - Use `SearchParams` from `shared/pagination.js`
   - Extend with service-specific filters
   - Use `paginatedResponse` from `shared/responses.js`

4. **Domain Cleanup**:
   - Remove ALL gym/fitness specific features
   - Remove credit/points systems
   - Keep only core business logic