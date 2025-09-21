# Service Extension Pattern Guide

This document outlines the step-by-step process to extend an existing service with new functionality while maintaining consistency with established architecture patterns.

## 🚨 CRITICAL REQUIREMENT

**BEFORE making ANY changes to a file or directory, you MUST:**

1. **Read and analyze existing files** in the same location to understand:
   - Naming conventions used
   - Code structure and patterns
   - Import/export patterns
   - Documentation styles
   - Existing enums, interfaces, and types

2. **Understand the context** by examining:
   - Related files in the same directory
   - Index files that export from the location
   - How existing features are implemented
   - Dependencies and relationships

3. **Follow existing patterns exactly** - do not deviate from established conventions

**Failure to follow existing patterns will break the codebase architecture and cause integration issues.**

## Architecture Overview

The PyDev Service follows a layered clean architecture with clear separation of concerns:

1. **Types Layer** (`@pydev/types`) - Shared enums and constants
2. **Domain Layer** (`@pydev/sdk`) - Business objects and mappers
3. **Data Layer** (`packages/database`) - Prisma models and migrations
4. **API Layer** (`@pydev/api`) - Zod schemas with OpenAPI documentation
5. **Service Layer** (`packages/services/*`) - Business logic implementation

## Implementation Steps

### Step 1: Foundation Types (`@pydev/types`)

Create shared enums and constants that will be used across the system.

**Location**: `/packages/types/src/[feature].ts`

**Pattern**:

- Use TypeScript enums with explicit string values
- Group related constants together
- Export through main index file

### Step 2: Domain Models (`@pydev/sdk`)

Define domain interfaces and mappers for data transformation.

**Location**: `/packages/sdk/src/domains/[feature].ts` and `/packages/sdk/src/mappers/[feature].ts`

**Pattern**:

- Create domain interfaces representing business entities
- Implement mapper classes with static methods:
  - `fromDocument()` - Database → Domain
  - `toDTO()` - Domain → API
  - `fromDTO()` - API → Domain

### Step 3: Database Models

Create Prisma models following established patterns.

**Location**: `/packages/database/prisma/models/[feature].prisma`

**Key Requirements**:

- UUID primary keys with `@default(dbgenerated("gen_random_uuid()"))`
- Multi-tenant `businessId` fields with indexes
- Audit fields: `createdAt`, `updatedAt`, `createdBy`, `lastModifiedBy`
- Soft delete with `deletedAt` timestamp
- Performance indexes for common queries
- Proper schema organization with `@@schema` directive

**After Creation**: Run `yarn db:generate`

### Step 4: API Schemas

Add schemas to the appropriate service's API structure.

**Location**: `/packages/api/src/schemas/[service]/`

**🚨 CRITICAL SCHEMA PATTERNS**:

**1. Enum Integration** (MANDATORY):

**Step 1: Define enums in @pika/types package**

```typescript
// packages/types/src/enums/business.ts
export enum EmployeeServiceSortBy {
  SKILL_LEVEL = 'skillLevel',
  TOTAL_BOOKINGS = 'totalBookings',
  AVERAGE_RATING = 'averageRating',
  CREATED_AT = 'createdAt',
}

export enum ScheduleOverrideType {
  VACATION = 'vacation',
  SICK = 'sick',
  HOLIDAY = 'holiday',
  OTHER = 'other',
}
```

**Step 2: Import and wrap enums in common/enums.ts**

```typescript
// packages/api/src/schemas/business/common/enums.ts
import { EmployeeServiceSortBy as EmployeeServiceSortByEnum, ScheduleOverrideType as ScheduleOverrideTypeEnum } from '@pika/types'
import { createZodEnum } from '../../../common/utils/zodEnum.js'

// Create Zod enum with validation
export const EmployeeServiceSortBy = createZodEnum(EmployeeServiceSortByEnum)

// Create OpenAPI documented version
export const EmployeeServiceSortBySchema = EmployeeServiceSortBy.openapi({
  type: 'string',
  enum: Object.values(EmployeeServiceSortByEnum),
  description: 'Field to sort employee services by',
  example: EmployeeServiceSortByEnum.SKILL_LEVEL,
})

export type EmployeeServiceSortBy = z.infer<typeof EmployeeServiceSortBy>
```

**Step 3: Use enums in schemas**

```typescript
// ❌ WRONG - Inline enum definition
export const QueryParams = SearchParams.extend({
  sortBy: z.enum(['skillLevel', 'totalBookings', 'averageRating', 'createdAt']).default('createdAt'),
  type: z.enum(['vacation', 'sick', 'holiday', 'other']),
})

// ✅ CORRECT - Use properly defined enums
import { EmployeeServiceSortBy, ScheduleOverrideType } from '../common/enums.js'
import { EmployeeServiceSortBy as EmployeeServiceSortByEnum, ScheduleOverrideType as ScheduleOverrideTypeEnum } from '@pika/types'

export const QueryParams = SearchParams.extend({
  sortBy: EmployeeServiceSortBy.default(EmployeeServiceSortByEnum.CREATED_AT),
  type: ScheduleOverrideType.describe('Type of override'),
})
```

**Benefits**:

- **Type safety**: Enums are validated at compile time and runtime
- **Consistency**: Single source of truth for enum values
- **Documentation**: OpenAPI schemas automatically include enum values
- **Refactoring**: Change enum values in one place
- **IntelliSense**: Better IDE support with autocomplete

**2. Reusable Schema Components** (MANDATORY):

```typescript
// ❌ WRONG - Inline object definitions
AdminEmployeeResponse = z.object({
  employeeServices: z.array(
    z.object({
      id: UUID,
      serviceId: UUID,
      // ... inline definition
    }),
  ),
})

// ✅ CORRECT - Separate reusable schemas
export const EmployeeServiceResponse = z.object({
  id: UUID,
  serviceId: UUID,
  // ... proper schema
})

export const AdminEmployeeResponse = z.object({
  employeeServices: z.array(EmployeeServiceResponse).optional(),
})
```

**3. Object Reference Pattern** (MANDATORY):
Always create base schemas for entities and reference them instead of inline definitions:

```typescript
// ❌ WRONG - Inline object definition for relations
export const AdminEmployeeResponse = z.object({
  // ... employee fields
  business: z
    .object({
      id: UUID,
      businessName: z.string(),
    })
    .optional(),
})

// ✅ CORRECT - Create base schema and reference it
// In management.ts
export const Business = withTimestamps({
  id: UUID,
  businessId: UUID,
  businessName: z.string(),
  // ... all business fields
})

// In employee.ts
import { Business } from './management.js'

export const AdminEmployeeResponse = Employee.extend({
  business: Business.optional().describe('Full business information when ?include=business'),
})
```

Benefits:

- **Type consistency**: Single source of truth for object types
- **DRY principle**: No duplicate object definitions
- **Maintainability**: Update in one place, affects all references
- **Type safety**: TypeScript can properly infer and validate types

**4. Base Schema Pattern**:

- Create base schemas for common fields using `z.object()`
- Use `.omit()`, `.extend()`, `.partial()` for variants
- Example: `EmployeeBase` → `CreateEmployeeRequest.omit({...}).extend({...})`

**4. Schema Structure per File**:

- **Base schemas first**: Reusable components (e.g., `EmployeeServiceResponse`)
- **Main entity schema**: Full response with all relations
- **Request schemas**: Create/Update using base schema transformations
- **Query parameters**: Using `SearchParams.extend()`
- **List responses**: Using `paginatedResponse()` helper

**5. File Organization**:

- `admin/[feature].ts` - Complete management schemas with all fields
- `public/[feature].ts` - Customer-facing schemas (limited fields)
- `internal/[feature].ts` - Service-to-service communication schemas
- `common/enums.ts` - All enums with OpenAPI documentation

**6. OpenAPI Documentation Pattern with Transformations**:

```typescript
// Raw Zod schema with transformations for data sanitization
export const Schema = z.object({
  email: z.string().email().toLowerCase().trim(), // Sanitized at API boundary
  code: z.string().trim().toUpperCase(), // Normalized format
  name: z.string().trim().min(1).max(100), // Trimmed and validated
  phone: z.string().trim().optional(), // Optional fields also trimmed
})

// OpenAPI documented version
export const SchemaSchema = Schema.openapi('SchemaName', {
  description: 'Clear description of the schema',
})

// TypeScript type (reflects transformed data)
export type Schema = z.infer<typeof Schema>
```

**Important**: Add Zod transformations (.trim(), .toLowerCase(), .toUpperCase()) directly in schemas to ensure data is sanitized at the API boundary. Services receive clean data.

### Step 5: Repository Layer

Implement data access following repository pattern.

**Location**: `/packages/services/[service]/src/repositories/[Feature]Repository.ts`

**Pattern**:

- Create interface first (`I[Feature]Repository`)
- Implement with constructor injection for dependencies
- Standard methods: `findAll`, `findById`, `create`, `update`, `delete`
- Use domain objects, not database types
- Integrate caching where appropriate

**🚨 CRITICAL Repository Best Practices** (from analyzing existing repositories):

**0. Include Pattern (MANDATORY - Using Shared Utilities)**:

**ALWAYS use the shared utility functions for include handling**:

```typescript
// Import the utility function
import { toPrismaInclude } from '@pika/shared'
import type { ParsedIncludes } from '@pika/types'

// ✅ CORRECT - Search parameters with generic ParsedIncludes
export interface EmployeeScheduleSearchParams {
  page?: number
  limit?: number
  employeeId?: string
  businessId?: string
  // ... other search fields

  // Generic ParsedIncludes - validation happens at controller level
  parsedIncludes?: ParsedIncludes
}
```

**Repository buildInclude method (MANDATORY - Use Utility Function)**:

```typescript
/**
 * Build include based on parsedIncludes parameter using shared utility
 */
private buildInclude(
  parsedIncludes?: ParsedIncludes,
): Prisma.EmployeeScheduleInclude | undefined {
  return parsedIncludes && Object.keys(parsedIncludes).length > 0
    ? (toPrismaInclude(parsedIncludes) as Prisma.EmployeeScheduleInclude)
    : undefined
}
```

**Controller-level validation (WHERE TYPE SAFETY HAPPENS)**:

```typescript
// In controller - use parseIncludeParam with allowed relations
import { parseIncludeParam } from '@pika/shared'

const includeRelations = parseIncludeParam(query.include, [
  'employee', // Only these relations are allowed
  'businessService', // Runtime validation prevents invalid includes
])

const params = {
  // ... other params
  parsedIncludes: includeRelations, // Validated includes passed to repository
}
```

**Why This Pattern is OPTIMAL**:

- **Uses shared utilities**: Leverages existing `toPrismaInclude()` function
- **Much simpler**: 4-line method vs 20+ lines of manual checks
- **Runtime validation**: `parseIncludeParam()` validates allowed relations at API boundary
- **Type safety**: TypeScript casting ensures Prisma compatibility
- **Maintainable**: No need to update repository when relations change
- **Consistent**: Uses established shared utilities across all services
- **Centralized logic**: Include handling logic is in shared utilities, not duplicated

**Complete Flow**:

1. **API Schema**: Define allowed relations in controller validation
2. **Controller**: `parseIncludeParam(query.include, ALLOWED_RELATIONS)` validates
3. **Repository**: `toPrismaInclude(parsedIncludes)` converts to Prisma format
4. **Type Safety**: `as Prisma.EntityInclude` ensures TypeScript compatibility

**Usage in Repository Methods**:

```typescript
async findAll(params: EmployeeScheduleSearchParams): Promise<PaginatedResult<Domain>> {
  const include = this.buildInclude(params.parsedIncludes)
  // ... use include in Prisma query
}

async findById(id: string, parsedIncludes?: ParsedIncludes): Promise<Domain | null> {
  const include = this.buildInclude(parsedIncludes)
  // ... use include in Prisma query
}
```

**1. Private Helper Methods Pattern** (MANDATORY):

```typescript
export class EmployeeRepository implements IEmployeeRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  /**
   * Builds a Prisma WHERE clause from search parameters
   */
  private buildWhereClause(params: SearchParams): Prisma.EntityWhereInput {
    const where: Prisma.EntityWhereInput = {}

    // Soft delete handling
    if (!params.includeDeleted) {
      where.deletedAt = null
    }

    // Add filters with proper type casting
    if (params.status && params.status !== 'all') {
      where.status = params.status as any
    }

    // Search with case-insensitive mode
    if (params.search) {
      where.OR = [{ name: { contains: params.search, mode: 'insensitive' } }, { description: { contains: params.search, mode: 'insensitive' } }]
    }

    return where
  }

  /**
   * Builds the ORDER BY clause from query parameters
   */
  private buildOrderByClause(params: SearchParams): Prisma.EntityOrderByWithRelationInput {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = params

    switch (sortBy) {
      case 'name':
        return { name: sortOrder }
      case 'updatedAt':
        return { updatedAt: sortOrder }
      case 'createdAt':
      default:
        return { createdAt: sortOrder }
    }
  }

  /**
   * Builds include clause based on ParsedIncludes
   */
  private buildIncludeClause(includes?: SearchParams['parsedIncludes']): Prisma.EntityInclude {
    const include: Prisma.EntityInclude = {}

    if (includes?.business) {
      include.business = true
    }

    if (includes?.subEntities) {
      // Include with filters and limits for performance
      include.subEntities = {
        where: { isActive: true },
        include: {
          relatedEntity: true, // Include nested relations
        },
      }
    }

    if (includes?.schedules) {
      // Only get the most recent schedule
      include.schedules = {
        orderBy: { effectiveFrom: 'desc' },
        take: 1,
      }
    }

    return include
  }
}
```

**2. Repository Method Patterns**:

- **findAll**: Use `Promise.all([findMany(), count()])` for pagination
- **Soft deletes**: Check `deletedAt: null` unless `includeDeleted` is true
- **Error handling**: Wrap in try-catch with `ErrorFactory.databaseError()`
- **Logging**: Use logger for important operations (create, update, delete)
- **Cache invalidation**: Clear relevant caches after mutations
- **Mapper with options**: Pass options to mappers for context-aware transformations

  ```typescript
  // Pass parsedIncludes to mapper for conditional mapping
  const result = EmployeeMapper.fromDatabaseResultArray(items, { parsedIncludes })

  // Use specialized mappers for sub-entities
  return services.map(EmployeeServiceMapper.fromDocument)
  ```

- **Consistent include pattern**: ALL repository methods must use `buildIncludeClause` method

  ```typescript
  // ✅ CORRECT - All methods use the same centralized include logic
  async findAll(params: SearchParams) {
    const include = this.buildIncludeClause(params.parsedIncludes)
    // ... query with include
  }

  async findById(id: string, params?: SearchParams) {
    const include = this.buildIncludeClause(params?.parsedIncludes)
    // ... query with include
  }

  async findByBusinessId(businessId: string, params?: SearchParams) {
    const include = this.buildIncludeClause(params?.parsedIncludes)
    // ... query with include
  }

  // ❌ WRONG - Manual include building creates inconsistency
  async findByBusinessId(businessId: string, params?: SearchParams) {
    const include: any = {}
    if (params?.parsedIncludes?.someRelation) {
      include.someRelation = true  // Manual include logic
    }
  }
  ```

- **Type casting for enums**: Use `as any` for Prisma enum compatibility
  ```typescript
  where.status = params.status as any // Cast string to Prisma enum
  data: {
    type: data.type as any
  } // Cast for create/update operations
  ```
- **Prisma Decimal handling**: Use `any` in document interfaces, convert to `number` in mappers

  ```typescript
  // Document interface - accepts Prisma's actual return types
  export interface EntityDocument {
    price: any | null  // Prisma Decimal - will be converted to number
    totalRevenue: any  // Prisma Decimal - will be converted to number
  }

  // Mapper - standardizes all Decimal values to numbers
  static fromDocument(doc: EntityDocument): EntityDomain {
    return {
      price: doc.price !== null ? parseFloat(doc.price.toString()) : null,
      totalRevenue: parseFloat(doc.totalRevenue.toString()),
    }
  }
  ```

- **Upsert pattern for metrics**: Use upsert for create-or-update operations
  ```typescript
  async updateEmployeeMetrics(employeeId: string, metrics: Partial<MetricsDomain>) {
    const updatedMetrics = await this.prisma.employeeMetrics.upsert({
      where: { employeeId },
      create: {
        employeeId,
        businessId: metrics.businessId!,
        totalBookings: metrics.totalBookings ?? 0,
        // ... initialize with defaults
      },
      update: {
        ...(metrics.totalBookings !== undefined && { totalBookings: metrics.totalBookings }),
        // ... conditional updates
        lastCalculated: new Date(),
      },
    })
    return MetricsMapper.fromDocument(updatedMetrics)
  }
  ```

**3. Import Requirements**:

```typescript
import { Prisma, type PrismaClient } from '@prisma/client'
import { ErrorFactory, type ICacheService } from '@pika/shared'
import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import type { PaginatedResult } from '@pika/types'
// Import individual mappers for sub-entities
import { EntityMapper, EntityServiceMapper, EntityScheduleMapper, EntityCommissionMapper, EntityMetricsMapper } from '@pika/sdk'
import type { EntityDomain, EntityServiceDomain, EntityScheduleDomain, EntityCommissionDomain, EntityMetricsDomain } from '@pika/sdk'
```

**4. Standard Repository Interface**:

```typescript
export interface IEntityRepository {
  // Core CRUD
  findAll(params: SearchParams): Promise<PaginatedResult<EntityDomain>>
  findById(id: string, includes?: ParsedIncludes): Promise<EntityDomain | null>
  create(data: CreateEntityData): Promise<EntityDomain>
  update(id: string, data: UpdateEntityData): Promise<EntityDomain>
  delete(id: string, deletedBy?: string): Promise<void>

  // Business-specific queries
  findByBusinessId(businessId: string, params?: SearchParams): Promise<EntityDomain[]>
  countByBusinessId(businessId: string): Promise<number>

  // Specialized methods as needed
  restore?(id: string): Promise<EntityDomain>
  bulkDelete?(ids: string[]): Promise<void>

  // Metrics pattern - using upsert for create or update
  updateMetrics?(id: string, metrics: Partial<MetricsDomain>): Promise<MetricsDomain>
}
```

### Step 6: Service Layer

Implement business logic layer.

**Location**: `/packages/services/[service]/src/services/[Feature]Service.ts`

**Pattern**:

- Constructor injection of repository and dependencies
- Pure business logic - no HTTP concerns
- Domain objects as parameters and return types
- Error handling with proper context

**🚨 CRITICAL Service Layer Best Practices** (from analyzing existing services):

**1. Cache Keys Organization** (MANDATORY):
Cache keys must be defined in `/packages/services/[service]/src/constants/cache-keys.ts`:

```typescript
// constants/cache-keys.ts
export const CACHE_KEYS = {
  EMPLOYEE: {
    LIST: 'business:employees:list',
    SINGLE: 'business:employees:single',
    BUSINESS: 'business:employees:business',
    SERVICES: 'business:employees:services',
    SCHEDULE: 'business:employees:schedule',
    COMMISSION: 'business:employees:commission',
    METRICS: 'business:employees:metrics',
  },
} as const

// Import in service
import { CACHE_KEYS } from '../constants/cache-keys.js'
```

**2. Service Interface Pattern**:

```typescript
// Define request/response interfaces separate from repository data types
export interface CreateEmployeeRequest {
  businessId: string
  firstName: string
  lastName: string
  email: string
  createdBy: string
}

export interface IAdminEmployeeService {
  getAllEmployees(params: SearchParams, language?: LanguageCode): Promise<PaginatedResult<Domain>>
  getEmployeeById(id: string, includes?: ParsedIncludes, language?: LanguageCode): Promise<Domain>
  createEmployee(data: CreateEmployeeRequest, language?: LanguageCode): Promise<Domain>
  updateEmployee(id: string, data: UpdateEmployeeRequest): Promise<Domain>
  deleteEmployee(id: string, deletedBy: string): Promise<void>
}
```

**3. Cache Invalidation Helper**:

```typescript
export class AdminEmployeeService {
  /**
   * Helper method to invalidate all cache entries related to an entity
   */
  private async invalidateEmployeeCache(employeeId: string, businessId?: string): Promise<void> {
    if (!this.cacheService) return

    const keysToInvalidate = [`${CACHE_KEYS.EMPLOYEE.SINGLE}:${employeeId}`]

    if (businessId) {
      keysToInvalidate.push(`${CACHE_KEYS.EMPLOYEE.BUSINESS}:${businessId}`)
    }

    await Promise.all(keysToInvalidate.map((key) => this.cacheService!.del(key)))

    try {
      await this.cacheService.delPattern(`${CACHE_KEYS.EMPLOYEE.LIST}:*`)
    } catch (error) {
      logger.warn('Failed to invalidate cache pattern', { error })
    }
  }
}
```

**4. Caching Decorator Pattern**:

```typescript
// For list methods with complex parameters - use JSON.stringify
@Cache({
  ttl: REDIS_DEFAULT_TTL,
  prefix: CACHE_KEYS.EMPLOYEE.LIST,
  keyGenerator: (prefix: string, methodName: string, args: any[]) => {
    const [params, language] = args
    return `${prefix}:${JSON.stringify(params)}:${language || 'default'}`
  },
  condition: (result) => result && result.data && Array.isArray(result.data),
})
async getAllEmployees(params: SearchParams): Promise<PaginatedResult<Domain>> {
  // Method implementation
}

// Alternative pattern for list methods - prefix with 'list:'
@Cache({
  ttl: REDIS_DEFAULT_TTL,
  prefix: CACHE_KEYS.EMPLOYEE.SCHEDULE,
  keyGenerator: (prefix: string, methodName: string, args: any[]) => {
    const [params] = args
    return `${prefix}:list:${JSON.stringify(params)}`
  },
})
async getEmployeeSchedules(params: EmployeeScheduleSearchParams): Promise<PaginatedResult<Domain>> {
  // Method implementation
}
```

**Cache Key Best Practices**:

- Use `JSON.stringify(params)` for complex search parameters to ensure all params are captured
- Add `list:` prefix for methods that return paginated results to distinguish from single entity caches
- Include language parameter when content may vary by language
- Ensure params object is serializable (no functions, undefined values get omitted)

**5. Error Handling Pattern**:

```typescript
async createEmployee(data: CreateEmployeeRequest): Promise<EmployeeDomain> {
  try {
    // Check for duplicates
    const existing = await this.repository.findByEmail(data.businessId, data.email)
    if (existing) {
      throw ErrorFactory.validationError('Employee with this email already exists')
    }

    // Create entity
    const employee = await this.repository.create(data)

    // Invalidate caches
    await this.invalidateEmployeeCache(employee.id, data.businessId)

    // Log important operations
    logger.info('Employee created', {
      employeeId: employee.id,
      businessId: data.businessId,
      email: data.email,
    })

    return employee
  } catch (error) {
    if (error instanceof ErrorFactory) throw error
    throw ErrorFactory.serviceError('createEmployee', 'Failed to create employee', error)
  }
}
```

**6. Service Dependencies**:

```typescript
export class AdminEmployeeService {
  constructor(
    private readonly employeeRepository: IEmployeeRepository,
    private readonly translationService?: TranslationClient,
    private readonly cacheService?: ICacheService,
    private readonly translationResolver?: TranslationResolver,
    private readonly communicationService?: CommunicationServiceClient,
  ) {}
}
```

**7. Translation Resolution Pattern** (for multi-language support):

```typescript
private async resolveTranslations(
  items: Domain[],
  language: LanguageCode,
): Promise<Domain[]> {
  if (!this.translationResolver || items.length === 0) {
    return items
  }

  try {
    // Collect translation keys
    const translationKeys = new Set<string>()
    items.forEach((item) => {
      translationKeys.add(item.nameKey)
      if (item.descriptionKey) {
        translationKeys.add(item.descriptionKey)
      }
    })

    // Batch resolve translations
    const translations = await this.translationService.getBulk(
      Array.from(translationKeys),
      language,
    )

    // Map translations with fallbacks
    return items.map((item) => ({
      ...item,
      name: translations[item.nameKey] || item.nameKey,
      description: item.descriptionKey
        ? translations[item.descriptionKey] || item.descriptionKey
        : null,
    }))
  } catch (error) {
    logger.warn('Failed to resolve translations, using fallback keys', {
      error,
      language,
      source: 'ServiceName.resolveTranslations',
    })
    return items
  }
}
```

**8. Input Validation & Sanitization via Zod Schemas**:

```typescript
// Add transformations directly in Zod schemas (API layer)
export const CreateEmployeeRequest = z.object({
  email: z.string().email().toLowerCase().trim(),  // Auto-sanitized
  employeeCode: z.string().trim().toUpperCase(),   // Auto-normalized
  firstName: z.string().trim().min(1).max(50),
  // ... other fields with transformations
})

// Service layer trusts the validated data
async createEmployee(data: CreateEmployeeRequest) {
  // Data is already sanitized by Zod at API boundary
  // No need for additional normalization
  const employee = await this.repository.create(data)
}
```

**Note**: For this MVP, we trust Zod schema transformations at the API gateway level for all data sanitization. This follows the industry standard of validating and sanitizing at the API boundary.

**9. Business Rule Validation**:

```typescript
// Validate related entities before operations
const business = await this.businessRepository.findById(businessId)

if (!business) {
  throw ErrorFactory.resourceNotFound('Business', businessId)
}

if (!business.active) {
  throw ErrorFactory.badRequest('Business is not active', {
    code: 'BUSINESS_INACTIVE',
  })
}
```

**10. Logging Best Practices**:

```typescript
// Debug for detailed tracing
logger.debug('Fetching items with params:', params)

// Info for important operations
logger.info('Entity created', {
  entityId: entity.id,
  businessId: data.businessId,
  email: data.email,
})

// Warn for recoverable issues
logger.warn('Failed to invalidate cache pattern', {
  error,
  source: 'ServiceName.methodName',
})

// Error for failures
logger.error('Critical operation failed', {
  error,
  businessId,
  context: additionalContext,
})
```

**11. Complex Cache Key Patterns**:

```typescript
@Cache({
  ttl: REDIS_DEFAULT_TTL,
  prefix: CACHE_KEYS.AVAILABILITY.SLOTS,
  keyGenerator: (prefix: string, methodName: string, args: any[]) => {
    const [params] = args
    // Multi-parameter cache key
    return `${prefix}:${params.businessId}:${params.date}:${params.duration}`
  },
  // Validate cached result
  condition: (result) => result && Array.isArray(result) && result.length > 0,
})
```

**12. Metadata Interfaces** (for tracking additional context):

```typescript
export interface ContactMetadata {
  // Network information
  ipAddress?: string
  userAgent?: string

  // Navigation context
  referrer?: string
  origin?: string

  // Browser preferences
  acceptLanguage?: string

  // Processed information
  language?: string
  timestamp?: string
}
```

### Step 7: Controller Layer

Handle HTTP requests and responses.

**Location**: `/packages/services/[service]/src/controllers/[Tier][Feature]Controller.ts`

**Pattern**:

- Method binding in constructor (`this.method = this.method.bind(this)`)
- Extract params from request
- Call service methods
- Use mappers for data transformation
- Apply caching decorators where appropriate

**🚨 CRITICAL Controller Best Practices** (from analyzing existing controllers):

**1. Controller Constructor Pattern** (MANDATORY):

```typescript
export class AdminEmployeeController {
  constructor(private readonly adminEmployeeService: IAdminEmployeeService) {
    // Bind ALL methods to preserve 'this' context
    this.getAllEmployees = this.getAllEmployees.bind(this)
    this.getEmployeeById = this.getEmployeeById.bind(this)
    this.createEmployee = this.createEmployee.bind(this)
    this.updateEmployee = this.updateEmployee.bind(this)
    this.deleteEmployee = this.deleteEmployee.bind(this)
    // ... bind all other methods
  }
}
```

**2. Request/Response Type Safety Pattern**:

```typescript
// Use proper typed Request with generics
async updateEmployee(
  req: Request<
    businessEmployeesCommon.EmployeeIdParam,      // Path params
    {},                                            // Response body (unused)
    businessEmployeesAdmin.UpdateEmployeeRequest  // Request body
  >,
  res: Response<businessEmployeesAdmin.AdminEmployeeResponse>,
  next: NextFunction,
): Promise<void> {
  // Implementation
}
```

**3. Standard Method Implementation Pattern**:

```typescript
async getAllEmployees(
  req: Request,
  res: Response<businessEmployeesAdmin.AdminEmployeeListResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Extract and validate query parameters
    const query = getValidatedQuery<AdminEmployeeQueryParams>(req)
    const language = getRequestLanguage(req)

    // 2. Map API query to service params
    const params = {
      businessId: query.businessId,
      status: query.status,
      search: query.search,
      page: query.page || 1,
      limit: query.limit || PAGINATION_DEFAULT_LIMIT,
      sortBy: query.sortBy || 'firstName',
      sortOrder: mapSortOrder(query.sortOrder),
      parsedIncludes: parseIncludeParam(query.include, [
        'business',
        'employeeServices',
        'employeeSchedules',
      ]),
    }

    // 3. Call service method
    const result = await this.adminEmployeeService.getAllEmployees(
      params,
      language,
    )

    // 4. Transform using mapper and validate response
    const response = paginatedResponse(result, EmployeeMapper.toAdminDTO)
    const validatedResponse = validateResponse(
      businessEmployeesAdmin.AdminEmployeeListResponse,
      response,
      'AdminEmployeeController.getAllEmployees', // Method name for debugging
    )

    // 5. Send response
    res.json(validatedResponse)
  } catch (error) {
    next(error)
  }
}
```

**4. Create/Update Pattern with User Context**:

```typescript
async createEmployee(
  req: Request<shared.BusinessIdParam, {}, CreateEmployeeRequest>,
  res: Response<AdminEmployeeResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const { id: businessId } = req.params
    const body = getValidatedBody<CreateEmployeeRequest>(req)
    const language = getRequestLanguage(req)
    const context = RequestContext.getContext(req)

    // Always check authentication context
    if (!context.userId) {
      throw ErrorFactory.unauthorized('User not authenticated')
    }

    // Map request to service data
    const createData = {
      businessId,
      ...body,
      createdBy: context.userId, // Track who created it
    }

    const employee = await this.adminEmployeeService.createEmployee(
      createData,
      language,
    )

    // Transform and validate
    const response = EmployeeMapper.toAdminDTO(employee)
    const validatedResponse = validateResponse(
      AdminEmployeeResponse,
      response,
      'AdminEmployeeController.createEmployee',
    )

    // 201 for creation
    res.status(201).json(validatedResponse)
  } catch (error) {
    next(error)
  }
}
```

**5. Delete Pattern (204 No Content)**:

```typescript
async deleteEmployee(
  req: Request<EmployeeIdParam>,
  res: Response<void>,
  next: NextFunction,
): Promise<void> {
  try {
    const { employeeId } = req.params

    await this.adminEmployeeService.deleteEmployee(employeeId)

    // No content response - no validation needed
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}
```

**6. Include Parameter Parsing Pattern**:

```typescript
// Parse include parameter for related data
const includeRelations = parseIncludeParam(query.include, ['business', 'createdByUser', 'lastModifiedByUser', 'employeeServices', 'employeeSchedules', 'employeeCommissions', 'employeeMetrics'])

// Or use inline parsing for specific includes
const includeRelations = query.include?.split(',') || []
const service = await this.service.getById(
  id,
  {
    business: includeRelations.includes('business'),
    category: includeRelations.includes('category'),
    createdByUser: includeRelations.includes('createdByUser'),
  },
  language,
)
```

**7. Nested Resource Routes Pattern**:

```typescript
// For routes like /admin/employees/:employeeId/services
async getEmployeeServices(
  req: Request<EmployeeIdParam>,
  res: Response<EmployeeServiceResponse[]>,
  next: NextFunction,
): Promise<void> {
  try {
    const { employeeId } = req.params
    const language = getRequestLanguage(req)

    const services = await this.adminEmployeeService.getEmployeeServices(
      employeeId,
      language,
    )

    // Transform array of results
    const response = services.map(EmployeeMapper.toServiceAssignmentDTO)

    // Validate array response
    const validatedResponse = validateResponse(
      EmployeeServiceListResponse,
      response,
      'AdminEmployeeController.getEmployeeServices',
    )

    res.json(validatedResponse)
  } catch (error) {
    next(error)
  }
}
```

**8. Utility Imports Pattern**:

```typescript
import { getRequestLanguage, getValidatedBody, getValidatedQuery, paginatedResponse, RequestContext, validateResponse } from '@pika/http'
import { mapSortOrder } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { ErrorFactory, parseIncludeParam } from '@pika/shared'
```

**9. Logging in Controllers** (for admin operations):

```typescript
// Log important admin actions
logger.info({
  msg: 'Admin creating reservation',
  businessId: createData.businessId,
  customerId: createData.customerId,
  adminUserId,
  source: createData.source,
  timestamp: new Date().toISOString(),
})
```

**10. Validation Error Pattern**:

```typescript
// Custom validation beyond schema
if (!createData.customerId && !createData.guestEmail) {
  throw ErrorFactory.validationError({
    customer: ['Either customerId or guest email must be provided'],
  })
}
```

**11. Response Status Codes**:

- `200` - Successful GET, PUT, PATCH
- `201` - Successful POST (creation)
- `204` - Successful DELETE (no content)
- `400` - Bad request/validation errors
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `500` - Server error

**12. Controller Naming Convention**:

- `Admin[Feature]Controller` - Admin tier controllers
- `Public[Feature]Controller` - Public tier controllers
- `Internal[Feature]Controller` - Internal service-to-service controllers

### Step 8: Routing

Wire controllers to HTTP routes.

**Location**: `/packages/services/[service]/src/routes/[Tier][Feature]Routes.ts`

**Pattern**:

- Export function that returns configured Router
- Dependency injection pattern
- Register all endpoints
- Import and mount in main server file

### Step 9: Service Integration

Update main service configuration.

**Location**: `/packages/services/[service]/src/server.ts`

**Actions**:

- Import route creation functions
- Mount routes with appropriate paths
- Add to authentication exclusions if needed
- Update health checks if required

### Step 10: Inter-Service Communication

Create service client for cross-service calls.

**Location**: `/packages/shared/src/clients/[Feature]ServiceClient.ts`

**Pattern**:

- Extend `BaseServiceClient`
- Implement specific methods for service interactions
- Handle authentication and error transformation
- Export from shared package index

### Step 11: Environment Configuration

Add configuration constants.

**Location**: `/packages/environment/src/[service].ts`

**Pattern**:

- Service name, port, and URL constants
- Use environment variables with sensible defaults
- Export from environment package

### Step 12: Testing

Implement comprehensive test coverage.

**Structure**:

- Unit tests for each layer
- Integration tests with real dependencies
- Use test containers for infrastructure
- Consistent test data patterns

### Step 13: API Documentation

Register schemas and routes for documentation generation.

**Location**: `/packages/api/src/scripts/generators/[tier]-api.ts`

**Actions**:

- Register all schemas with registry
- Register all routes with OpenAPI specs
- Run `yarn generate:api` and `yarn generate:sdk`

## Key Architecture Principles

### Clean Architecture

- Controllers handle HTTP concerns only
- Services contain business logic
- Repositories manage data access
- Mappers transform between layers

### Type Safety

- Strict TypeScript throughout
- Domain objects for internal operations
- DTOs for API boundaries
- No `any` types in production code

### Error Handling

- Use `ErrorFactory` for standardized errors
- Include correlation IDs for tracing
- Proper error classification and context

### Caching Strategy

- Service-level caching via `ICacheService`
- Controller-level caching via decorators
- Consistent cache patterns and TTLs

### Import Conventions

- Use `.js` extensions for ESM compatibility
- Prefer package aliases (`@pydev/*`) for cross-package imports
- Use `type` keyword for type-only imports

### Schema Validation Patterns

- Use `FIELD_LENGTH` constants from `@pika/types` for string validation
- Apply proper regex patterns for time formats (`/^([01]\d|2[0-3]):([0-5]\d)$/`)
- Use `optionalBoolean` helper for optional boolean query parameters
- Apply `.min()`, `.max()` constraints consistently
- Use branded types (`UUID`, `UserId`) from shared module
- Apply `withTimestamps()` helper for audit fields
- Use `createIncludeParam()` with `.merge()` for relation inclusion parameters:

  ```typescript
  // ✅ CORRECT - Use .merge() to properly combine schemas
  export const AdminEmployeeQueryParams = SearchParams.extend({
    status: EmployeeStatusFilter.optional(),
    role: EmployeeRole.optional(),
    canAcceptBookings: optionalBoolean,
    sortBy: EmployeeSortBy.default(EmployeeSortByEnum.FIRST_NAME),
  }).merge(createIncludeParam(EMPLOYEE_RELATIONS))

  // ❌ WRONG - Don't include createIncludeParam as a field
  export const AdminEmployeeQueryParams = SearchParams.extend({
    // ...other fields
    include: createIncludeParam(EMPLOYEE_RELATIONS), // This creates nested object!
  })
  ```

- Use `paginatedResponse()` wrapper for list endpoints

## Common Patterns

### Database Relations

- Always include proper foreign key constraints
- Use composite indexes for multi-tenant queries
- Implement soft deletes consistently

### API Design

- RESTful endpoints with consistent naming
- Proper HTTP status codes
- Standardized error responses
- Pagination for list endpoints

### Dependency Injection

- Constructor injection throughout
- Interface-based dependencies
- Manual DI (no container framework)

## Quality Gates

Before considering implementation complete:

- [ ] All types exported from packages
- [ ] Database generates without errors
- [ ] All API schemas have OpenAPI documentation
- [ ] Repository follows interface pattern
- [ ] Service layer has no HTTP dependencies
- [ ] Controllers properly bound and cached
- [ ] Routes mounted in server configuration
- [ ] Service client available for other services
- [ ] Environment variables configured
- [ ] Tests cover all layers
- [ ] API documentation generated successfully

## Anti-Patterns to Avoid

### Schema Design Anti-Patterns

- **Don't** create inline object definitions in schemas - always create reusable components
- **Don't** duplicate schema logic - use base schemas with `.omit()`, `.extend()`, `.partial()`
- **Don't** skip OpenAPI documentation - every schema needs both raw Zod and documented version
- **Don't** forget to import enums correctly - use alias pattern from `@pika/types`

### Architecture Anti-Patterns

- **Don't** import API schemas into service/repository layers
- **Don't** put business logic in controllers
- **Don't** skip method binding in controllers
- **Don't** use database types in business logic
- **Don't** forget mapper transformations
- **Don't** skip error handling
- **Don't** ignore caching opportunities
- **Don't** forget to update documentation

### Maintenance Anti-Patterns

- **Don't** create unmaintainable inline definitions that can't be reused
- **Don't** ignore existing patterns - always analyze reference implementations first
- **Don't** create separate files when functionality can be extended in existing ones
- **Don't** forget to export new schemas through index file hierarchy

## Enum Standardization Pattern

### Database and TypeScript Enum Consistency (MANDATORY)

All enums across the codebase must follow the **lowercase standard** to ensure consistency between TypeScript and database schemas.

**Standard Pattern**:

- **Database Enums (Prisma)**: Use lowercase values
- **TypeScript Enums**: Use lowercase values
- **Default Values**: Use lowercase enum values in model definitions

**Example Implementation**:

```prisma
// ✅ CORRECT - Lowercase enum values
enum EmployeeStatus {
  active
  inactive
  on_leave
  terminated

  @@schema("business")
}

enum SkillLevel {
  beginner
  intermediate
  advanced
  expert

  @@schema("business")
}

// Model usage with lowercase defaults
model Employee {
  status     EmployeeStatus @default(active)
  skillLevel SkillLevel     @default(intermediate)
}
```

```typescript
// ✅ CORRECT - TypeScript enums match database
export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
}
```

**Benefits**:

- **Consistency**: No mismatches between database and application code
- **Type Safety**: Enums validate correctly at runtime and compile time
- **Maintainability**: Single standard reduces cognitive overhead
- **Integration**: Smooth data flow between all layers

**Migration Pattern**:
When updating existing enums from UPPERCASE to lowercase:

1. Update Prisma schema enum values
2. Update default values in model definitions
3. Update TypeScript enum string values
4. Run database migration
5. Verify all enum usage in code

---

_This guide will be extended with specific examples and lessons learned as new features are implemented._
