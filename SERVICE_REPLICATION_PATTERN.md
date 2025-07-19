# Service Replication Pattern

This document defines the **mandatory** pattern that ALL new services in the Pika platform MUST follow. This pattern ensures consistency, maintainability, and adherence to Clean Architecture principles across the entire codebase.

## 🚨 CRITICAL: This Pattern is MANDATORY

**Every new service MUST follow this exact pattern without deviation.** This includes:

- Complete separation of Public, Admin, and Internal flows
- Proper RBAC implementation for each endpoint type
- Strict adherence to Clean Architecture layers
- Consistent naming conventions
- Proper authentication and authorization patterns

## Pattern Overview

Each service implements **three complete flows**:

1. **Public Flow**: Customer-facing endpoints (JWT authentication)
2. **Admin Flow**: Management endpoints (JWT authentication with admin roles)
3. **Internal Flow**: Service-to-service communication (API key authentication)

Each flow has its own controller, schemas, routes, and tests, ensuring complete separation of concerns.

## 1. Directory Structure (MANDATORY)

```
packages/services/{service-name}/
├── src/
│   ├── controllers/
│   │   ├── {ServiceName}Controller.ts          # Public endpoints
│   │   ├── Admin{ServiceName}Controller.ts     # Admin endpoints
│   │   └── Internal{ServiceName}Controller.ts  # Internal endpoints
│   ├── services/
│   │   └── {ServiceName}Service.ts             # Business logic
│   │   └── Admin{ServiceName}Service.ts             # Business logic
│   │   └── Internal{ServiceName}Service.ts             # Business logic
│   ├── repositories/
│   │   └── {ServiceName}Repository.ts          # Data access
│   │   └── Admin{ServiceName}Repository.ts          # Data access
│   │   └── Internal{ServiceName}Repository.ts          # Data access
│   ├── routes/
│   │   ├── {ServiceName}Routes.ts              # Public routes
│   │   ├── Admin{ServiceName}Routes.ts         # Admin routes
│   │   └── Internal{ServiceName}Routes.ts      # Internal routes
│   ├── mappers/
│   │   └── {ServiceName}Mapper.ts              # Data transformation
│   │   └── Admin{ServiceName}Mapper.ts              # Data transformation
│   │   └── Internal{ServiceName}Mapper.ts              # Data transformation
│   ├── types/
│   │   ├── index.ts                            # Export barrel file
│   │   ├── domain.ts                           # Domain interfaces
│   │   ├── search.ts                           # Search parameters
│   │   └── repository.ts                       # Repository data types
│   ├── utils/                                  # Service-specific utilities
│   ├── app.ts                                  # Service initialization
│   ├── server.ts                               # Server configuration
│   └── index.ts                                # Entry point
├── test/
│   ├── integration/
│   │   ├── {serviceName}.integration.test.ts   # Public endpoints
│   │   ├── admin.{serviceName}.integration.test.ts # Admin endpoints
│   │   └── internal.{serviceName}.integration.test.ts # Internal endpoints
│   └── fixtures/                               # Test data
├── package.json
├── project.json
├── tsconfig.json
└── vitest.config.ts
```

## 2. Schema Organization (MANDATORY)

### Reference Documentation

**📖 Complete Schema Organization Guide**:

- `SCHEMA_ORGANIZATION.md` - Full migration strategy and examples
- `docs/new-architecture/SCHEMA_ORGANIZATION_PATTERN.md` - Perfect template implementation

### Service-First Organization Pattern

**Location**: `/packages/api/src/schemas/{service-name}/`

```
/packages/api/src/schemas/{service-name}/
├── public/{feature}.ts         # Customer-facing schemas
├── admin/management.ts         # Admin panel operations
├── internal/service.ts         # Service-to-service communication
├── common/
│   ├── enums.ts               # Service-specific enums (REQUIRED)
│   ├── parameters.ts          # Shared params like {ServiceName}IdParam
│   └── types.ts               # Complex shared types (optional)
└── index.ts                   # Export all tiers
```

### Schema Rules:

- **Follow Category Template**: Use `packages/api/src/schemas/category/` as perfect template
- **Centralized Enums**: ALL enums in `common/enums.ts` (no inline z.enum())
- **No Cross-Tier Imports**: Public ≠ Admin ≠ Internal schemas
- **Use openapi()**: All schemas wrapped with `openapi()` helper
- **Consistent Naming**: `public/{feature}.ts`, `admin/management.ts`, `internal/service.ts`
- **Pagination Pattern**: Use `SearchParams.extend()` with service-specific `SortBy` enum
- **Response Schemas**: EVERY endpoint must have its request and response schemas defined in the appropriate tier

### Public Schema Example:

```typescript
// /packages/api/src/schemas/{service-name}/public/{feature}.ts
import { z } from 'zod'
import { createSearchSchema, createByIdQuerySchema } from '../../common/schemas/index.js'

export const {ServiceName}Response = z.object({
  id: z.string().uuid(),
  // ... other fields
})

export const Search{ServiceName}Request = createSearchSchema({
  sortFields: ['{FIELD}_SORT_FIELDS'],
  includeRelations: ['{SERVICE}_RELATIONS'],
  defaultSortField: 'createdAt',
  additionalParams: {
    // Service-specific search params
  },
})

export const Get{ServiceName}ByIdQuery = createByIdQuerySchema(['{SERVICE}_RELATIONS'])
```

### Admin Schema Example:

```typescript
// /packages/api/src/schemas/{service-name}/admin/management.ts
import { z } from 'zod'

export const Create{ServiceName}Request = z.object({
  // ... fields for creation
})

export const Update{ServiceName}Request = Create{ServiceName}Request.partial()

export const Admin{ServiceName}Response = {ServiceName}Response.extend({
  deletedAt: z.string().datetime().nullable(),
  // ... admin-specific fields
})
```

### Internal Schema Example:

```typescript
// /packages/api/src/schemas/{service-name}/internal/service.ts
import { z } from 'zod'

export const Get{ServiceName}ByIdsRequest = z.object({
  {service}Ids: z.array(z.string().uuid()).min(1).max(100),
})

export const Validate{ServiceName}Request = z.object({
  {service}Id: z.string().uuid(),
  checkActive: z.boolean().default(true),
})
```

## 3. Controller Pattern (MANDATORY)

### Public Controller:

```typescript
// src/controllers/{ServiceName}Controller.ts
import type { Request, Response, NextFunction } from 'express'
import type { I{ServiceName}Service } from '../services/{ServiceName}Service.js'
import type { Search{ServiceName}Request, Get{ServiceName}ByIdQuery, {ServiceName}IdParam } from '@pika/api/public'

export class {ServiceName}Controller {
  constructor(private readonly {service}Service: I{ServiceName}Service) {
    this.getAll = this.getAll.bind(this)
    this.getById = this.getById.bind(this)
  }

  async getAll(
    request: Request, // We don't use the Query params on the Request, is the only exclusion
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<Search{ServiceName}Request>(request)
      const parsedIncludes = query.include ? parseIncludeParam(query.include, {SERVICE}_RELATIONS) : {}

      // Map API query parameters inline - avoid separate mapper utilities
      const params = {
        businessId: query.businessId,
        categoryId: query.categoryId,
        state: query.state || 'published',
        type: query.type,
        minValue: query.minValue,
        maxValue: query.maxValue,
        search: query.search,
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc',
        parsedIncludes,
        // ... other params as needed
      }

      const result = await this.{service}Service.getAll(params)
      const dtoResult = {
        data: result.data.map({ServiceName}Mapper.toResponse),
        pagination: result.pagination,
      }

      response.json(dtoResult)
    } catch (error) {
      next(error)
    }
  }

  async getById(
    request: Request<{ServiceName}IdParam, {}, {}>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const query = getValidatedQuery<Get{ServiceName}ByIdQuery>(request)
      const parsedIncludes = query.include ? parseIncludeParam(query.include, {SERVICE}_RELATIONS) : {}

      const entity = await this.{service}Service.getById(id, parsedIncludes)
      if (!entity) {
        return next(ErrorFactory.notFound('{ServiceName}', id))
      }

      response.json({ServiceName}Mapper.toResponse(entity))
    } catch (error) {
      next(error)
    }
  }
}
```

### Admin Controller:

```typescript
// src/controllers/Admin{ServiceName}Controller.ts
export class Admin{ServiceName}Controller {
  constructor(private readonly {service}Service: I{ServiceName}Service) {
    this.getAll = this.getAll.bind(this)
    this.getById = this.getById.bind(this)
    this.create = this.create.bind(this)
    this.update = this.update.bind(this)
    this.delete = this.delete.bind(this)
  }

  // Implement all CRUD operations with admin-specific logic
  async create(
    request: Request<{}, {}, Create{ServiceName}Request>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const entityData = {ServiceName}Mapper.fromCreateRequest(request.body)
      const entity = await this.{service}Service.create(entityData)
      response.status(201).json({ServiceName}Mapper.toResponse(entity))
    } catch (error) {
      next(error)
    }
  }

  async update(
    request: Request<{ServiceName}IdParam, {}, Update{ServiceName}Request>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const updates = {ServiceName}Mapper.fromUpdateRequest(request.body)
      const entity = await this.{service}Service.update(id, updates)
      response.json({ServiceName}Mapper.toResponse(entity))
    } catch (error) {
      next(error)
    }
  }

  async delete(
    request: Request<{ServiceName}IdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      await this.{service}Service.delete(id)
      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
```

### Internal Controller:

```typescript
// src/controllers/Internal{ServiceName}Controller.ts
export class Internal{ServiceName}Controller {
  constructor(private readonly {service}Service: I{ServiceName}Service) {
    this.getByIds = this.getByIds.bind(this)
    this.validate = this.validate.bind(this)
  }

  async getByIds(
    request: Request<{}, {}, Get{ServiceName}ByIdsRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { {service}Ids } = request.body
      const entities = await this.{service}Service.getByIds({service}Ids)
      response.json({
        {service}s: {ServiceName}Mapper.toResponseArray(entities),
      })
    } catch (error) {
      next(error)
    }
  }

  async validate(
    request: Request<{}, {}, Validate{ServiceName}Request>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { {service}Id, checkActive } = request.body
      const validation = await this.{service}Service.validate({service}Id, checkActive)
      response.json({
        valid: validation.valid,
        {service}: validation.{service} ? {ServiceName}Mapper.toResponse(validation.{service}) : undefined,
        reason: validation.reason,
      })
    } catch (error) {
      next(error)
    }
  }
}
```

### Parameter Mapping Best Practices

**Map API query parameters to service parameters inline within controllers.** Avoid creating separate parameter mapper utilities or functions.

#### Why Inline Mapping?

1. **Simplicity**: Keeps mapping logic close to where it's used
2. **No Extra Dependencies**: Avoids utils depending on API schemas  
3. **Clear Data Flow**: Easy to see how API params transform to service params
4. **Easier Maintenance**: Changes to API contracts are localized to controllers

#### Example: Public Controller Parameter Mapping

```typescript
// ✅ CORRECT - Map parameters inline
async getAll(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const query = getValidatedQuery<VoucherQueryParams>(request)
    
    // Map inline - clear and simple
    const params = {
      businessId: query.businessId,
      categoryId: query.categoryId,
      state: 'published', // Apply business rules
      type: query.type,
      minValue: query.minValue,
      maxValue: query.maxValue,
      search: query.search,
      page: query.page || 1,
      limit: query.limit || PAGINATION_DEFAULT_LIMIT,
      sortBy: sortFieldMapper.mapSortField(query.sortBy, 'createdAt'),
      sortOrder: query.sortOrder || 'desc',
      parsedIncludes,
    }
    
    const result = await this.service.getAll(params)
    // ...
  } catch (error) {
    next(error)
  }
}

// ❌ WRONG - Don't create separate mapper utilities
// utils/parameterMappers.ts
export function mapPublicQueryToSearchParams(query: VoucherQueryParams): SearchParams {
  // This creates unnecessary abstraction and dependencies
}
```

#### Example: Admin Controller Parameter Mapping

```typescript
// Admin controllers may have more complex mappings - still do it inline
const params = {
  ...mapBasicParams(query), // OK if internal to controller
  // Admin-specific mappings
  includeDeleted: query.isDeleted,
  createdFromStart: query.createdFromStart,
  createdFromEnd: query.createdFromEnd,
  minRedemptions: query.minRedemptions,
  maxRedemptions: query.maxRedemptions,
  // Apply any admin-specific business rules
  state: query.state, // Admins can see all states
}
```

## 4. Authentication & Authorization (MANDATORY)

### Route Authentication Patterns:

```typescript
// Public Routes (Optional JWT - user context when available)
export function create{ServiceName}Routes(controller: {ServiceName}Controller): Router {
  const router = Router()

  // No authentication middleware - publicly accessible
  router.get('/', validateQuery(Search{ServiceName}Request), controller.getAll)
  router.get('/:id', validateParams({ServiceName}IdParam), controller.getById)

  return router
}

// Admin Routes (Required JWT + Admin role)
export function createAdmin{ServiceName}Routes(controller: Admin{ServiceName}Controller): Router {
  const router = Router()

  // All admin routes require authentication (applied at app level)
  router.get('/', validateQuery(AdminSearch{ServiceName}Request), controller.getAll)
  router.post('/', validateBody(Create{ServiceName}Request), controller.create)
  router.put('/:id', validateParams({ServiceName}IdParam), validateBody(Update{ServiceName}Request), controller.update)
  router.delete('/:id', validateParams({ServiceName}IdParam), controller.delete)

  return router
}

// Internal Routes (Required API Key)
export function createInternal{ServiceName}Routes(controller: Internal{ServiceName}Controller): Router {
  const router = Router()

  // All internal routes require API key (applied at app level)
  router.post('/by-ids', validateBody(Get{ServiceName}ByIdsRequest), controller.getByIds)
  router.post('/validate', validateBody(Validate{ServiceName}Request), controller.validate)

  return router
}
```

### Server Authentication Configuration:

```typescript
// server.ts
export async function create{ServiceName}Server(config: ServerConfig) {
  const app = await createExpressServer({
    serviceName: '{service-name}-service',
    authOptions: {
      excludePaths: [
        '/{service}s',          // Public listing doesn't require auth
        '/{service}s/*',        // Public details don't require auth
        '/internal/*',          // Internal routes use API key authentication
      ],
    },
    // ... other config
  })

  // Mount routes with proper authentication
  app.use('/{service}s', create{ServiceName}Routes(controller))                    // Public (no auth required)
  app.use('/admin/{service}s', createAdmin{ServiceName}Routes(adminController))    // Admin (JWT required)
  app.use('/internal/{service}s', createInternal{ServiceName}Routes(internalController)) // Internal (API key required)

  return app
}
```

## 5. Type Organization Pattern (MANDATORY)

### Overview

Each service MUST organize its types in a dedicated `/types` folder following Domain-Driven Design principles. This ensures:

- **Type Safety**: All parameters and data structures are properly typed
- **Reusability**: Types can be shared across layers within the service
- **Maintainability**: Clear organization makes types easy to find and update
- **Consistency**: All services follow the same type organization pattern

### Type Structure:

```
packages/services/{service-name}/src/types/
├── index.ts         # Export barrel file
├── domain.ts        # Business logic types
├── search.ts        # Search and filter parameters
└── repository.ts    # Data layer types
```

### Type Files:

#### 1. domain.ts - Business Logic Types

```typescript
// src/types/domain.ts
import type { {ServiceName}Domain } from '@pika/sdk'
import type { PaginatedResult } from '@pika/types'

// Service operation types
export interface {ServiceName}ClaimData {
  notificationPreferences?: {
    enableReminders: boolean
    reminderDaysBefore?: number
  }
}

export interface {ServiceName}ValidateOptions {
  checkActive?: boolean
  checkExpiry?: boolean
  includeRelations?: boolean
}

export interface {ServiceName}ValidationResult {
  isValid: boolean
  reason?: string
  {service}?: {ServiceName}Domain
}

// Analytics types
export interface {ServiceName}Analytics {
  total{ServiceName}s: number
  active{ServiceName}s: number
  average{Property}: number
  {service}sByCategory: Record<string, number>
}

// Batch operation types
export interface Batch{ServiceName}Operation {
  {service}Ids: string[]
  operation: 'activate' | 'deactivate' | 'validate'
  context?: Record<string, any>
}

export interface Batch{ServiceName}Result {
  processedCount: number
  successCount: number
  failedCount: number
  results: Array<{
    {service}Id: string
    success: boolean
    error?: string
  }>
}
```

#### 2. search.ts - Search Parameter Types

```typescript
// src/types/search.ts
import type { ParsedIncludes } from '@pika/shared'
import type { SearchParams } from '@pika/types'

/**
 * Public search parameters
 */
export interface {ServiceName}SearchParams extends SearchParams {
  // Filters
  categoryId?: string
  isActive?: boolean
  minPrice?: number
  maxPrice?: number
  search?: string
  
  // Date ranges
  createdFromStart?: Date
  createdFromEnd?: Date
  
  // Relations
  parsedIncludes?: ParsedIncludes
}

/**
 * Admin search parameters with extended filters
 */
export interface Admin{ServiceName}SearchParams extends {ServiceName}SearchParams {
  createdBy?: string
  updatedBy?: string
  includeDeleted?: boolean
  includeInactive?: boolean
}

/**
 * Internal search parameters for service-to-service
 */
export interface Internal{ServiceName}SearchParams extends SearchParams {
  {service}Ids?: string[]
  categoryIds?: string[]
  includeAll?: boolean
}
```

#### 3. repository.ts - Data Layer Types

```typescript
// src/types/repository.ts
import type { {ServiceName}Domain } from '@pika/sdk'

/**
 * Data types for repository operations
 */

export interface Create{ServiceName}Data {
  // Required fields
  name: string
  categoryId: string
  price: number
  
  // Optional fields
  description?: string
  imageUrl?: string
  metadata?: Record<string, any>
  
  // System fields
  createdBy: string
}

export interface Update{ServiceName}Data {
  // All fields optional for partial updates
  name?: string
  description?: string
  price?: number
  isActive?: boolean
  metadata?: Record<string, any>
  
  // System fields
  updatedBy?: string
}

export interface BulkUpdate{ServiceName}Data {
  isActive?: boolean
  categoryId?: string
  metadata?: Record<string, any>
}
```

#### 4. index.ts - Export Barrel

```typescript
// src/types/index.ts
/**
 * {ServiceName} service types
 * 
 * Organization follows DDD principles:
 * - Domain types: Business logic and domain concepts
 * - Repository types: Data layer contracts
 * - Search types: Query and filter parameters
 */

// Re-export all types
export * from './domain.js'
export * from './repository.js'
export * from './search.js'
```

### Usage Guidelines:

#### 1. Import Pattern

```typescript
// ✅ CORRECT - Import from types index
import type {
  {ServiceName}SearchParams,
  Create{ServiceName}Data,
  {ServiceName}ValidationResult,
} from '../types/index.js'

// ❌ WRONG - Don't import from individual files
import type { {ServiceName}SearchParams } from '../types/search.js'
```

#### 2. Layer-Specific Usage

**Repository Layer:**
```typescript
import type {
  Create{ServiceName}Data,
  Update{ServiceName}Data,
  {ServiceName}SearchParams,
} from '../types/index.js'

export class {ServiceName}Repository {
  async create(data: Create{ServiceName}Data): Promise<{ServiceName}Domain> {
    // Implementation
  }
}
```

**Service Layer:**
```typescript
import type {
  {ServiceName}ValidationOptions,
  {ServiceName}ValidationResult,
  Batch{ServiceName}Operation,
} from '../types/index.js'

export class {ServiceName}Service {
  async validate(
    id: string, 
    options: {ServiceName}ValidationOptions
  ): Promise<{ServiceName}ValidationResult> {
    // Implementation
  }
}
```

**Controller Layer:**
```typescript
// Controllers use API schemas, not internal types
import type { {service}Public } from '@pika/api'

// Transform API types to domain types at boundaries
const searchParams: {ServiceName}SearchParams = {
  page: query.page,
  limit: query.limit,
  // ... map from API schema
}
```

### Type Definition Rules:

1. **No Inline Types**: Define all types in the types folder
2. **Extend Base Types**: Use `extends SearchParams` for consistency
3. **Optional vs Required**: Be explicit about optional fields
4. **Use Type Imports**: Always use `import type` for type-only imports
5. **Avoid `any`**: Use `unknown` or specific types instead
6. **Document Complex Types**: Add JSDoc comments for clarity

### Common Mistakes to Avoid:

- ❌ Defining types directly in service/repository files
- ❌ Using inline object types in function parameters
- ❌ Importing types from other services directly
- ❌ Using `any` for complex objects
- ❌ Missing parsedIncludes in search parameters
- ❌ Not extending base types from @pika/types

## 6. Service Layer Pattern (MANDATORY)

```typescript
// src/services/{ServiceName}Service.ts
import type {
  {ServiceName}SearchParams,
  Create{ServiceName}Data,
  {ServiceName}ValidationOptions,
  {ServiceName}ValidationResult,
} from '../types/index.js'

export interface I{ServiceName}Service {
  getAll(params: {ServiceName}SearchParams): Promise<PaginatedResult<{ServiceName}Domain>>
  getById(id: string, parsedIncludes?: ParsedIncludes): Promise<{ServiceName}Domain | null>
  getByIds(ids: string[]): Promise<{ServiceName}Domain[]>
  create(data: Create{ServiceName}Data): Promise<{ServiceName}Domain>
  update(id: string, data: Update{ServiceName}Data): Promise<{ServiceName}Domain>
  delete(id: string): Promise<void>
  validate(id: string, options: {ServiceName}ValidationOptions): Promise<{ServiceName}ValidationResult>
}

export class {ServiceName}Service implements I{ServiceName}Service {
  constructor(
    private readonly repository: I{ServiceName}Repository,
    private readonly cacheService: ICacheService,
  ) {}

  async getAll(params: {ServiceName}SearchParams): Promise<PaginatedResult<{ServiceName}Domain>> {
    // Apply business rules (e.g., only active items for public access)
    const serviceParams = {
      ...params,
      isActive: params.isActive ?? true,
      includeDeleted: params.includeDeleted ?? false,
    }

    return this.repository.findAll(serviceParams)
  }

  async create(data: Create{ServiceName}Data): Promise<{ServiceName}Domain> {
    // Business validation
    this.validateCreateData(data)

    // Check dependencies if needed
    await this.validateDependencies(data)

    return this.repository.create(data)
  }

  async update(id: string, data: Partial<{ServiceName}Domain>): Promise<{ServiceName}Domain> {
    // Check existence
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw ErrorFactory.notFound('{ServiceName}', id)
    }

    // Business validation
    this.validateUpdateData(data)

    return this.repository.update(id, data)
  }

  async delete(id: string): Promise<void> {
    // Check existence
    const existing = await this.repository.findById(id)
    if (!existing) {
      throw ErrorFactory.notFound('{ServiceName}', id)
    }

    // Check dependencies
    await this.validateDeletion(id)

    return this.repository.delete(id)
  }

  private validateCreateData(data: Create{ServiceName}Data): void {
    // Implement business validation rules
  }

  private validateUpdateData(data: Partial<{ServiceName}Domain>): void {
    // Implement business validation rules
  }

  private async validateDependencies(data: Create{ServiceName}Data): Promise<void> {
    // Check foreign key relationships using service clients
  }

  private async validateDeletion(id: string): Promise<void> {
    // Check if entity is referenced by other services
  }
}
```

## 7. Repository Pattern (MANDATORY)

```typescript
// src/repositories/{ServiceName}Repository.ts
import type {
  {ServiceName}SearchParams,
  Create{ServiceName}Data,
  Update{ServiceName}Data,
} from '../types/index.js'

export interface I{ServiceName}Repository {
  findAll(params: {ServiceName}SearchParams): Promise<PaginatedResult<{ServiceName}Domain>>
  findById(id: string, parsedIncludes?: ParsedIncludes): Promise<{ServiceName}Domain | null>
  findByIds(ids: string[]): Promise<{ServiceName}Domain[]>
  create(data: Create{ServiceName}Data): Promise<{ServiceName}Domain>
  update(id: string, data: Update{ServiceName}Data): Promise<{ServiceName}Domain>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
}

export class {ServiceName}Repository implements I{ServiceName}Repository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async findAll(params: {ServiceName}SearchParams): Promise<PaginatedResult<{ServiceName}Domain>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', parsedIncludes, ...filters } = params

    const where = this.buildWhereClause(filters)
    const orderBy = this.buildOrderBy(sortBy, sortOrder)
    const include = this.buildInclude(parsedIncludes)

    const total = await this.prisma.{service}.count({ where })
    const entities = await this.prisma.{service}.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include,
    })

    return {
      data: {ServiceName}Mapper.toDomainArray(entities),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async create(data: Create{ServiceName}Data): Promise<{ServiceName}Domain> {
    try {
      const entity = await this.prisma.{service}.create({
        data: {ServiceName}Mapper.toCreateInput(data),
      })

      // Clear cache
      if (this.cache) {
        await this.cache.del('{service}s:*')
      }

      return {ServiceName}Mapper.toDomain(entity)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors
        if (error.code === 'P2002') {
          throw ErrorFactory.conflict('Duplicate {service}', 'A {service} with this identifier already exists')
        }
      }
      throw ErrorFactory.databaseError('create', '{service}', error)
    }
  }

  // ... implement other methods
}
```

## 8. Testing Pattern (MANDATORY)

### Test Structure:

Create **three separate test files** for each service:

1. `{serviceName}.integration.test.ts` - Public endpoints
2. `admin.{serviceName}.integration.test.ts` - Admin endpoints
3. `internal.{serviceName}.integration.test.ts` - Internal endpoints

### Public Endpoint Tests:

```typescript
// test/integration/{serviceName}.integration.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { create{ServiceName}Server } from '../src/server.js'
import { createTestDatabase, cleanupDatabase } from '@pika/tests'

describe('{ServiceName} Public API', () => {
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let testDb: any

  beforeAll(async () => {
    testDb = await createTestDatabase()
    app = await create{ServiceName}Server({
      port: 0,
      prisma: testDb.prisma,
      cacheService: testDb.cache,
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await cleanupDatabase(testDb)
  })

  describe('GET /{service}s', () => {
    test('should return paginated {service}s without authentication', async () => {
      const response = await request
        .get('/{service}s')
        .expect(200)

      expect(response.body).toMatchObject({
        data: expect.any(Array),
        pagination: {
          page: 1,
          limit: 20,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        },
      })
    })

    test('should filter by query parameters', async () => {
      const response = await request
        .get('/{service}s?isActive=true&limit=5')
        .expect(200)

      expect(response.body.data).toHaveLength(5)
      expect(response.body.data.every(item => item.isActive)).toBe(true)
    })
  })

  describe('GET /{service}s/:id', () => {
    test('should return {service} by id without authentication', async () => {
      const {service} = await testDb.create{ServiceName}()

      const response = await request
        .get(`/{service}s/${{{service}.id}}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: {service}.id,
        // ... other expected fields
      })
    })

    test('should return 404 for non-existent {service}', async () => {
      const response = await request
        .get('/{service}s/non-existent-id')
        .expect(404)

      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })
})
```

### Admin Endpoint Tests:

```typescript
// test/integration/admin.{serviceName}.integration.test.ts
describe('{ServiceName} Admin API', () => {
  let adminToken: string

  beforeAll(async () => {
    // ... setup
    adminToken = await testDb.createAdminToken()
  })

  describe('POST /admin/{service}s', () => {
    test('should create {service} with admin authentication', async () => {
      const {service}Data = {
        // ... valid {service} data
      }

      const response = await request
        .post('/admin/{service}s')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({service}Data)
        .expect(201)

      expect(response.body).toMatchObject({
        id: expect.any(String),
        ...{service}Data,
      })
    })

    test('should reject creation without admin token', async () => {
      const response = await request
        .post('/admin/{service}s')
        .send({ /* data */ })
        .expect(401)
    })

    test('should validate required fields', async () => {
      const response = await request
        .post('/admin/{service}s')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({}) // Empty data
        .expect(400)

      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('PUT /admin/{service}s/:id', () => {
    test('should update {service} with admin authentication', async () => {
      const {service} = await testDb.create{ServiceName}()
      const updateData = { /* update fields */ }

      const response = await request
        .put(`/admin/{service}s/${{{service}.id}}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject({
        id: {service}.id,
        ...updateData,
      })
    })
  })

  describe('DELETE /admin/{service}s/:id', () => {
    test('should delete {service} with admin authentication', async () => {
      const {service} = await testDb.create{ServiceName}()

      await request
        .delete(`/admin/{service}s/${{{service}.id}}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204)

      // Verify deletion
      await request
        .get(`/{service}s/${{{service}.id}}`)
        .expect(404)
    })
  })
})
```

### Internal Endpoint Tests:

```typescript
// test/integration/internal.{serviceName}.integration.test.ts
describe('{ServiceName} Internal API', () => {
  let apiKey: string

  beforeAll(async () => {
    // ... setup
    apiKey = process.env.INTERNAL_API_KEY || 'test-api-key'
  })

  describe('POST /internal/{service}s/by-ids', () => {
    test('should return {service}s by ids with API key', async () => {
      const {service}1 = await testDb.create{ServiceName}()
      const {service}2 = await testDb.create{ServiceName}()

      const response = await request
        .post('/internal/{service}s/by-ids')
        .set('x-api-key', apiKey)
        .send({ {service}Ids: [{service}1.id, {service}2.id] })
        .expect(200)

      expect(response.body).toMatchObject({
        {service}s: expect.arrayContaining([
          expect.objectContaining({ id: {service}1.id }),
          expect.objectContaining({ id: {service}2.id }),
        ]),
      })
    })

    test('should reject request without API key', async () => {
      await request
        .post('/internal/{service}s/by-ids')
        .send({ {service}Ids: ['id1', 'id2'] })
        .expect(401)
    })
  })

  describe('POST /internal/{service}s/validate', () => {
    test('should validate {service} existence', async () => {
      const {service} = await testDb.create{ServiceName}()

      const response = await request
        .post('/internal/{service}s/validate')
        .set('x-api-key', apiKey)
        .send({ {service}Id: {service}.id, checkActive: true })
        .expect(200)

      expect(response.body).toMatchObject({
        valid: true,
        {service}: expect.objectContaining({ id: {service}.id }),
      })
    })

    test('should return invalid for non-existent {service}', async () => {
      const response = await request
        .post('/internal/{service}s/validate')
        .set('x-api-key', apiKey)
        .send({ {service}Id: 'non-existent-id' })
        .expect(200)

      expect(response.body).toMatchObject({
        valid: false,
        reason: '{ServiceName} not found',
      })
    })
  })
})
```

## 9. DTO and Mapper Pattern (MANDATORY)

### Conceptual Overview

The platform uses a **three-layer data transformation pattern** to maintain clean separation between database, business logic, and API concerns:

1. **Database Layer**: Prisma entities (camelCase fields from database)
2. **Domain Layer**: Internal business entities (Date objects, business logic types)
3. **API Layer**: DTO responses (ISO strings, API-formatted data)

### Reference Implementation

**Study the existing Business service implementation:**

- **DTOs**: `packages/sdk/src/dto/business.dto.ts`
- **Domain Types**: `packages/sdk/src/domain/business.ts`
- **Mapper**: `packages/sdk/src/mappers/BusinessMapper.ts`
- **Controller Usage**: `packages/services/business/src/controllers/BusinessController.ts`

### Key Principles

1. **DTO Location**: All DTOs live in `@pika/sdk/dto` (shared across services)
2. **Domain Location**: All domain types live in `@pika/sdk/domain` (shared across services)
3. **Mapper Location**: All mappers live in `@pika/sdk/mappers` (shared across services)
4. **Layer Separation**:
   - Controllers: Use mappers to transform between API and domain
   - Services: Work only with domain types
   - Repositories: Transform between database and domain

### Data Flow

```
API Request (Zod Schema)
  ↓ [Controller]
DTO (CreateBusinessDTO)
  ↓ [Mapper.fromCreateDTO]
Domain (CreateBusinessData)
  ↓ [Service → Repository]
Database (Prisma Entity)
  ↓ [Mapper.fromDocument]
Domain (BusinessDomain)
  ↓ [Mapper.toDTO]
DTO (BusinessDTO)
  ↓ [Controller]
API Response (JSON)
```

### Implementation Rules

1. **Controllers**: Import mappers from `@pika/sdk`, transform at boundaries
2. **Services**: Only work with domain types, never DTOs or Prisma types
3. **Repositories**: Transform Prisma entities to domain using mappers
4. **Mappers**: Handle all type conversions (Date ↔ string, null handling, relations)

### File Structure per Service

- `packages/sdk/src/dto/{service}.dto.ts` - API response shapes
- `packages/sdk/src/domain/{service}.ts` - Business entity types
- `packages/sdk/src/mappers/{ServiceName}Mapper.ts` - All transformations
- Services import and use these shared definitions

## 10. Environment Configuration (MANDATORY)

Add service-specific environment variables:

```typescript
// packages/environment/src/constants/service.ts
export const {SERVICE_NAME}_SERVICE_PORT = parseInt(process.env.{SERVICE_NAME}_SERVICE_PORT || '50XX', 10)
export const {SERVICE_NAME}_SERVICE_URL = process.env.{SERVICE_NAME}_SERVICE_URL || `http://localhost:${{{SERVICE_NAME}_SERVICE_PORT}}`
```

## 11. API Documentation Integration (MANDATORY)

### Schema Registration:

```typescript
// packages/api/src/scripts/generators/admin-api.ts
import * as {service}Schemas from '../../admin/schemas/{service}/index.js'

// Register schemas
registry.registerSchema('Create{ServiceName}Request', {service}Schemas.Create{ServiceName}Request)
registry.registerSchema('{ServiceName}Response', {service}Schemas.{ServiceName}Response)
// ... register all schemas

// Register routes
registry.registerRoute({
  method: 'post',
  path: '/admin/{service}s',
  summary: 'Create {service}',
  tags: ['{ServiceName} Management'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: {service}Schemas.Create{ServiceName}Request } } } },
  responses: { 201: { description: '{ServiceName} created', content: { 'application/json': { schema: {service}Schemas.{ServiceName}Response } } } },
})
```

## 12. Package Configuration (MANDATORY)

### package.json:

```json
{
  "name": "@pika/{service-name}-service",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "local": "tsx src/index.ts"
  },
  "dependencies": {
    "@pika/shared": "workspace:^",
    "@pika/database": "workspace:^",
    "@pika/http": "workspace:^",
    "@pika/redis": "workspace:^",
    "@pika/auth": "workspace:^",
    "@pika/types": "workspace:^",
    "@pika/environment": "workspace:^",
    "@pika/api": "workspace:^",
    "@pika/sdk": "workspace:^",
    "@prisma/client": "^6.1.0",
    "express": "^4.21.2",
    "zod": "^4.0.5"
  }
}
```

### project.json:

```json
{
  "name": "@pika/{service-name}-service",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/services/{service-name}/src",
  "projectType": "application",
  "implicitDependencies": ["@pika/database"],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "outputs": ["{projectRoot}/dist"],
      "options": {
        "command": "tsc -p packages/services/{service-name}/tsconfig.json && tsc-alias -p packages/services/{service-name}/tsconfig.json"
      }
    },
    "local": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsx packages/services/{service-name}/src/index.ts"
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "options": {
        "config": "packages/services/{service-name}/vitest.config.ts"
      }
    }
  }
}
```

## 13. Clean Architecture Rules (CRITICAL)

### Layer Import Rules:

- **Controllers CAN import**:
  - `@pika/api` schemas
  - Service interfaces
  - Mappers
  - `@pika/shared` utilities

- **Services CAN import**:
  - Repository interfaces
  - Domain types
  - `@pika/shared` (for service clients)
  - Cache interfaces

- **Repositories CAN import**:
  - `@prisma/client`
  - `@pika/database`
  - Domain types
  - Cache interfaces

### NEVER Import:

- ❌ API types in Services or Repositories
- ❌ Prisma types in Controllers
- ❌ Cross-service direct imports (use service clients)
- ❌ Database queries in Controllers

## 14. Validation Rules (MANDATORY)

### Request Validation:

```typescript
// Use proper validation middleware
router.post('/',
  validateBody(Create{ServiceName}Request),
  controller.create
)

router.get('/',
  validateQuery(Search{ServiceName}Request),
  controller.getAll
)

router.get('/:id',
  validateParams({ServiceName}IdParam),
  validateQuery(Get{ServiceName}ByIdQuery),
  controller.getById
)
```

### Type Safety:

```typescript
// Use proper Request generics - NEVER use type assertions
async create(
  request: Request<{}, {}, Create{ServiceName}Request>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  // request.body is properly typed as Create{ServiceName}Request
}
```

### Response Type Safety (CRITICAL):

**ALWAYS use schema types for responses!** Never use DTOs or custom types in Response generics.

```typescript
// ✅ CORRECT - Use schema response types
async getAll(
  request: Request<{}, {}, {}, Search{ServiceName}Request>,
  response: Response<{ServiceName}ListResponse>, // Use schema response type
  next: NextFunction,
): Promise<void> {
  // response.json() expects the exact schema shape
}

// ❌ WRONG - Don't use DTOs in Response
async getAll(
  request: Request<{}, {}, {}, Search{ServiceName}Request>,
  response: Response<{ServiceName}ListDTO>, // ❌ DTOs are for internal use
  next: NextFunction,
): Promise<void> {
  // This breaks the API contract
}

// ✅ CORRECT - Full example
async getById(
  request: Request<{ServiceName}IdParam, {}, {}, Get{ServiceName}ByIdQuery>,
  response: Response<{ServiceName}Response>, // Schema response type
  next: NextFunction,
): Promise<void> {
  const entity = await this.service.getById(request.params.id)
  const dto = {ServiceName}Mapper.toDTO(entity) // Convert to DTO internally
  response.json(dto) // Express handles the validation
}
```

**Key Rules:**

1. Request types: Use schema types in Request<Params, ResBody, ReqBody, Query>
2. Response types: Use schema response types in Response<SchemaType>
3. Internal mapping: Convert between Domain ↔ DTO inside controllers
4. Let Express/Zod handle validation based on schema types

### Schema Organization by Tier (MANDATORY):

**EVERY route must have its request and response schemas defined in the correct tier!**

```typescript
// ✅ CORRECT - Public schemas in public/{feature}.ts
// packages/api/src/schemas/{service}/public/{feature}.ts
export const {ServiceName}Response = z.object({ /* ... */ })
export const {ServiceName}ListResponse = paginatedResponse({ServiceName}Response)
export const Create{ServiceName}Request = z.object({ /* ... */ })
export const {ServiceName}QueryParams = SearchParams.extend({ /* ... */ })

// ✅ CORRECT - Admin schemas in admin/management.ts
// packages/api/src/schemas/{service}/admin/management.ts
export const Admin{ServiceName}Response = {ServiceName}Response.extend({ /* admin fields */ })
export const Admin{ServiceName}ListResponse = paginatedResponse(Admin{ServiceName}Response)
export const AdminCreate{ServiceName}Request = z.object({ /* ... */ })
export const Admin{ServiceName}QueryParams = SearchParams.extend({ /* ... */ })

// ✅ CORRECT - Internal schemas in internal/service.ts
// packages/api/src/schemas/{service}/internal/service.ts
export const Get{ServiceName}sByIdsRequest = z.object({ /* ... */ })
export const Get{ServiceName}sByIdsResponse = z.object({ /* ... */ })
export const Validate{ServiceName}Request = z.object({ /* ... */ })
export const Validate{ServiceName}Response = z.object({ /* ... */ })
```

**Controller Usage Example:**

```typescript
// Public Controller - uses public schemas
async getAll(
  req: Request<{}, {}, {}, {service}Public.{ServiceName}QueryParams>,
  res: Response<{service}Public.{ServiceName}ListResponse>,
  next: NextFunction
): Promise<void> { /* ... */ }

// Admin Controller - uses admin schemas
async getAll(
  req: Request<{}, {}, {}, {service}Admin.Admin{ServiceName}QueryParams>,
  res: Response<{service}Admin.Admin{ServiceName}ListResponse>,
  next: NextFunction
): Promise<void> { /* ... */ }

// Internal Controller - uses internal schemas
async getByIds(
  req: Request<{}, {}, {service}Internal.Get{ServiceName}sByIdsRequest>,
  res: Response<{service}Internal.Get{ServiceName}sByIdsResponse>,
  next: NextFunction
): Promise<void> { /* ... */ }
```

**Common Mistakes to Avoid:**

- ❌ Using public schemas in admin controllers
- ❌ Missing response schemas for endpoints
- ❌ Creating schemas outside of tier folders
- ❌ Using DTOs instead of schema types in Response<>
- ❌ Not using paginatedResponse() for list endpoints

## 15. Checklist for New Services

When creating a new service, verify ALL of these items:

### Schema & API:

- [ ] Created schemas in `/packages/api/src/schemas/{service-name}/`
- [ ] Implemented public, admin, and internal schemas separately
- [ ] Used `createSearchSchema` and `createByIdQuerySchema` utilities
- [ ] Registered schemas in API documentation generators
- [ ] Generated and tested API documentation

### Service Structure:

- [ ] Created proper directory structure
- [ ] Created `/types` folder with domain.ts, search.ts, repository.ts, index.ts
- [ ] Implemented all type definitions properly (no inline types)
- [ ] Created comprehensive mapper class in @pika/sdk
- [ ] Implemented repository with proper type imports
- [ ] Implemented service with proper type imports
- [ ] Created all three controllers (Public, Admin, Internal)

### Routes & Authentication:

- [ ] Created separate route files for each tier
- [ ] Implemented proper authentication patterns
- [ ] Configured server with correct auth exclusions
- [ ] Tested authentication for all endpoint types

### Testing:

- [ ] Created three separate integration test files
- [ ] Tested public endpoints without authentication
- [ ] Tested admin endpoints with JWT authentication
- [ ] Tested internal endpoints with API key authentication
- [ ] Verified error handling and validation

### Configuration:

- [ ] Added service to NX configuration
- [ ] Added environment variables
- [ ] Created proper package.json and project.json
- [ ] Verified build and development scripts work

### Verification:

- [ ] All tests pass
- [ ] Service starts without errors
- [ ] API Gateway can route to service
- [ ] Generated SDK includes new types
- [ ] Clean Architecture rules followed
- [ ] No type assertions used
- [ ] Proper error handling implemented

## Summary

This pattern ensures that every service in the Pika platform:

1. **Maintains Consistency**: All services follow identical structure and patterns
2. **Enforces Security**: Proper authentication and authorization for each endpoint type
3. **Enables Scalability**: Clean separation allows independent scaling and maintenance
4. **Provides Type Safety**: Strong typing throughout all layers
5. **Supports Testing**: Comprehensive test coverage for all endpoint types
6. **Follows Best Practices**: Clean Architecture, SOLID principles, and industry standards

**Remember: This pattern is MANDATORY. Do not deviate from it without architectural review and approval.**
