# Service Replication Pattern

**Reference Implementation**: Business Service  
**Status**: ✅ Complete - All tests passing  
**Last Updated**: 2025-01-23

This document captures the proven patterns and practices from stabilizing the Business Service, providing a template for fixing and standardizing other services in the platform.

## 🎯 Overview

The Business Service serves as the **reference implementation** for the platform's microservices architecture. After comprehensive stabilization work, it demonstrates:

- Clean Architecture patterns (Controller → Service → Repository)
- Three-tier API design (Public/Admin/Internal)
- Standardized schema patterns and query parameters
- Comprehensive RBAC with role-based permissions
- Full integration test coverage with shared test data

**Test Results**: 60/60 tests passing (60 integration tests across all API tiers)

## 📋 Implementation Checklist

### ✅ Schema Standardization (Critical)

**Problem**: Inconsistent query parameters and include patterns across API tiers.

**Solution**: Standardize all schemas to use consistent patterns:

```typescript
// ✅ Standard Boolean Parameters
import { optionalBoolean } from '../../../common/utils/validators.js'

export const QueryParams = SearchParams.extend({
  verified: optionalBoolean().describe('Filter by verification status'),
  active: optionalBoolean().describe('Filter by active status'),
})

// ✅ Standard Include Parameters  
import { createIncludeParam } from '../../shared/query.js'
import { ENTITY_RELATIONS } from '../common/enums.js'

export const DetailQueryParams = createIncludeParam(ENTITY_RELATIONS)
```

**Key Files to Update**:
- `packages/api/src/schemas/[service]/public/[service].ts`
- `packages/api/src/schemas/[service]/admin/management.ts`
- `packages/api/src/schemas/[service]/internal/service.ts`

### ✅ Boolean Query Parameter Handling

**Problem**: `active=false` query parameters being converted to `true` by Zod coercion.

**Root Cause**: `z.coerce.boolean()` converts any truthy string to `true`.

**Solution**: Use native Zod preprocessing in reusable helper:

```typescript
// packages/api/src/common/utils/validators.ts
export const optionalBoolean = () => z.preprocess(
  (val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val; // Let Zod handle invalid values
  },
  z.boolean().optional()
);
```

**Usage in all schemas**:
```typescript
verified: optionalBoolean().describe('Filter by verification status'),
active: optionalBoolean().describe('Filter by active status'),
```

### ✅ Include Parameter Standardization

**Problem**: Multiple boolean flags (`includeUser`, `includeCategory`) instead of standard CSV pattern.

**Solution**: Use single CSV include parameter everywhere:

```typescript
// ❌ Wrong - Multiple boolean flags
includeUser: z.boolean().optional(),
includeCategory: z.boolean().optional(),

// ✅ Correct - Single CSV parameter
include: z.string().optional().describe('Comma-separated relations: user,category')
```

**Controller Implementation**:
```typescript
import { parseIncludeParam } from '@pika/shared'

const includes = parseIncludeParam(query.include, ['user', 'category'])
const result = await this.service.getAll({ ...params, parsedIncludes: includes })
```

### ✅ Internal API Schema Flexibility

**Problem**: Internal APIs with default filters prevent getting all records for service-to-service communication.

**Solution**: Remove defaults from internal schemas to allow flexible querying:

```typescript
// ❌ Wrong - Forces default filters
export const InternalQueryParams = z.object({
  onlyActive: optionalBoolean().default(true),    // ❌ Always filters
  onlyVerified: optionalBoolean().default(false), // ❌ Always filters
})

// ✅ Correct - Allow undefined for no filtering
export const InternalQueryParams = z.object({
  onlyActive: optionalBoolean(),    // ✅ Can be undefined
  onlyVerified: optionalBoolean(),  // ✅ Can be undefined
})
```

**Repository Logic**:
```typescript
// Only apply filters if explicitly provided
if (params.active !== undefined) {
  where.active = params.active
}
if (params.verified !== undefined) {
  where.verified = params.verified
}
```

### ✅ Internationalization and Sorting Pattern

**Problem**: Services with translation keys need proper sorting and internationalization support.

**Solution**: Use translation keys consistently with pragmatic sorting approach:

```typescript
// ✅ Store translation keys in database
export const EntityResponse = z.object({
  id: UUID,
  nameKey: z.string().describe('Translation key for entity name'),
  descriptionKey: z.string().optional().describe('Translation key for description'),
})

// ✅ Sorting by translation keys (pragmatic approach)
// Sort by nameKey directly - frontend handles localized sorting
export const EntitySortBy = z.enum([
  'nameKey',     // ✅ Sort by translation key 
  'createdAt',   // ✅ Sort by date fields
  'updatedAt',
  'verified',
  'active',
]).default('nameKey')
```

**Translation Service Test Setup**:
```typescript
// ✅ Mock translation service for tests
import { createMockTranslationClient } from '@pika/tests'

beforeAll(async () => {
  translationClient = createMockTranslationClient()
  // Mock returns the key as the translation for testing
  translationClient.addTranslation('en', 'business.name.test', 'Test Business')
})

beforeEach(async () => {
  translationClient.clear() // Clear between tests
})
```

### ✅ Translation Service Integration Pattern

**Problem**: Services need translation support but tests fail when TranslationClient is improperly initialized.

**Solution**: Use proper translation client setup in tests and services:

```typescript
// ✅ In test setup
import { createMockTranslationClient, MockTranslationClient } from '@pika/tests'

let translationClient: MockTranslationClient

beforeAll(async () => {
  translationClient = createMockTranslationClient()
  
  app = await createServiceServer({
    prisma: testDb.prisma,
    cacheService,
    translationClient, // ✅ Properly inject dependency
  })
})

beforeEach(async () => {
  // Clear translations between tests
  translationClient.clear()
})
```

**Service Integration**:
```typescript
// ✅ In service server setup
export async function createServiceServer(dependencies: {
  prisma: PrismaClient
  cacheService: ICacheService
  translationClient: TranslationClient
}) {
  // Services receive translation client as dependency
  const service = new ServiceImplementation(
    repository,
    cacheService,
    dependencies.translationClient
  )
}
```

### ✅ Controller Pattern Standardization

**Standard Express Controller Pattern**:

```typescript
export class ServiceController {
  constructor(private readonly service: IService) {
    // Bind all methods to preserve 'this' context
    this.getAll = this.getAll.bind(this)
    this.getById = this.getById.bind(this)
  }

  async getAll(
    request: Request<{}, {}, {}, QuerySchema>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<QuerySchema>(request)
      const includes = parseIncludeParam(query.include, ALLOWED_RELATIONS)
      
      const result = await this.service.getAll({
        ...query,
        parsedIncludes: includes,
      })

      // Transform to DTOs using mapper
      const dtoResult = {
        data: result.data.map(EntityMapper.toDTO),
        pagination: result.pagination,
      }

      response.json(dtoResult)
    } catch (error) {
      next(error)
    }
  }
}
```

### ✅ Integration Test Patterns

**Shared Test Data Strategy**:

```typescript
// Create shared test data once in beforeAll
let sharedTestData: SharedTestData

beforeAll(async () => {
  // Setup database and server
  testDb = await createTestDatabase({
    databaseName: 'test_service_db',
    useInitSql: true,
    startupTimeout: 120000,
  })
  
  // Create shared test data once for all tests
  sharedTestData = await createSharedTestData(testDb.prisma)
  logger.debug(`Created ${sharedTestData.allEntities.length} test entities`)
}, 120000)

beforeEach(async () => {
  // Clear cache and translations, preserve shared data
  await cacheService.clearAll()
  translationClient.clear()
  
  // Verify shared data persistence and recreate if needed
  const count = await testDb.prisma.entity.count()
  logger.debug(`Database has ${count} entities at start of test`)
  
  if (count === 0) {
    logger.debug('Shared test data was cleared - recreating...')
    sharedTestData = await createSharedTestData(testDb.prisma)
  }
})
```

**Test Data Structure Pattern**:

```typescript
// Create diverse test data covering all business scenarios
export async function createSharedTestData(
  prismaClient: PrismaClient,
): Promise<SharedTestData> {
  const activeCategory = await createTestCategory(prismaClient)
  const inactiveCategory = await createTestCategory(prismaClient, { isActive: false })
  
  // Create entities with different states for comprehensive testing
  const activeEntities: Entity[] = []
  const inactiveEntities: Entity[] = []
  const verifiedEntities: Entity[] = []
  const unverifiedEntities: Entity[] = []
  
  // Create 3 active verified entities
  for (let i = 0; i < 3; i++) {
    const { entity } = await createTestEntity(prismaClient, {
      categoryId: activeCategory.id,
      verified: true,
      active: true,
    })
    activeEntities.push(entity)
    verifiedEntities.push(entity)
  }
  
  // Create 2 inactive entities  
  for (let i = 0; i < 2; i++) {
    const { entity } = await createTestEntity(prismaClient, {
      categoryId: activeCategory.id,
      verified: true,
      active: false,
    })
    inactiveEntities.push(entity)
    verifiedEntities.push(entity)
  }
  
  // Create 2 unverified entities
  for (let i = 0; i < 2; i++) {
    const { entity } = await createTestEntity(prismaClient, {
      categoryId: activeCategory.id,
      verified: false,
      active: true,
    })
    activeEntities.push(entity)
    unverifiedEntities.push(entity)
  }
  
  const allEntities = [...activeEntities, ...inactiveEntities]
  const entityById = new Map(allEntities.map(e => [e.id, e]))
  
  return {
    activeCategory,
    inactiveCategory,
    activeEntities,
    inactiveEntities, 
    verifiedEntities,
    unverifiedEntities,
    allEntities,
    entityById,
  }
}
```

**Test Organization Pattern**:
```
/test/integration/
├── service.public.integration.test.ts   # Customer-facing endpoints
├── service.admin.integration.test.ts    # Admin management endpoints  
├── service.internal.integration.test.ts # Service-to-service endpoints
└── helpers/
    └── serviceTestHelpers.ts            # Shared test utilities
```

**Test Environment Setup Pattern**:

```typescript
// ✅ Proper test isolation and setup
describe('Service Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let cacheService: MemoryCacheService
  let translationClient: MockTranslationClient
  let authHelper: E2EAuthHelper
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient

  beforeAll(async () => {
    // Create isolated test database
    testDb = await createTestDatabase({
      databaseName: 'test_service_unique_name',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Setup dependencies
    cacheService = new MemoryCacheService()
    translationClient = createMockTranslationClient()
    
    // Create server with real dependencies
    app = await createServiceServer({
      prisma: testDb.prisma,
      cacheService,
      translationClient,
    })

    // Setup authentication helpers
    authHelper = createE2EAuthHelper(testDb.prisma)
    await authHelper.setup()
    
    adminClient = authHelper.createAdminClient(app)
    customerClient = authHelper.createCustomerClient(app)
    
    // Create shared test data once
    sharedTestData = await createSharedTestData(testDb.prisma)
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()
    await cacheService.clearAll() 
    translationClient.clear()
    
    // Verify test data integrity
    const count = await testDb.prisma.entity.count()
    if (count === 0) {
      sharedTestData = await createSharedTestData(testDb.prisma)
    }
  })

  afterAll(async () => {
    authHelper.cleanup()
    if (testDb) {
      await cleanupTestDatabase(testDb)
    }
  })
})
```

### ✅ RBAC Implementation

**Permission-Based Middleware**:

```typescript
import { requirePermissions } from '@pika/http'

// Public routes - require authentication only
router.get('/entities', requireAuth(), controller.getAll)

// Admin routes - require specific permissions
router.get('/admin/entities', requirePermissions(['ADMIN:READ']), controller.adminGetAll)
router.post('/admin/entities', requirePermissions(['ADMIN:WRITE']), controller.adminCreate)

// Internal routes - require API key
router.get('/internal/entities', requireApiKey(), controller.internalGetAll)
```

**RBAC Test Pattern**:
```typescript
describe('RBAC Permission Tests', () => {
  it('should enforce proper permissions for admin endpoints', async () => {
    // Test all role combinations systematically
    const endpoints = [
      { method: 'GET', path: '/admin/entities', permission: 'ADMIN:READ' },
      { method: 'POST', path: '/admin/entities', permission: 'ADMIN:WRITE' },
    ]

    for (const endpoint of endpoints) {
      // Test unauthorized access
      await request.get(endpoint.path).expect(401)
      
      // Test insufficient permissions
      await customerClient.get(endpoint.path).expect(403)
      
      // Test correct permissions
      await adminClient.get(endpoint.path).expect(200)
    }
  })
})
```

## 🔧 Technical Implementation Details

### JWT Token Service Simplification

**Problem**: Overly complex crypto methods for token management.

**Solution**: Simplified to essential JWT ID extraction:

```typescript
// ❌ Before - Complex crypto hashing
private hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// ✅ After - Simple JWT ID extraction  
private getTokenId(token: string): string {
  const decoded = this.decodeTokenUnsafe(token)
  if (!decoded?.jti) {
    throw new Error('Token missing JWT ID')
  }
  return decoded.jti
}
```

### Repository Filter Logic

**Proper filtering implementation**:

```typescript
private buildWhereClause(params: SearchParams): WhereInput {
  const where: WhereInput = {}

  // Always exclude deleted unless explicitly requested
  if (!params.includeDeleted) {
    where.deletedAt = null
  }

  // Only apply filters if explicitly provided (allows undefined = no filter)
  if (params.active !== undefined) {
    where.active = params.active
  }
  
  if (params.verified !== undefined) {
    where.verified = params.verified
  }

  return where
}
```

### Data Transformation with Mappers

**Required mapper pattern for all services**:

```typescript
export class EntityMapper {
  // Database → Domain
  static fromDocument(doc: EntityDocument): EntityDomain {
    return {
      id: doc.id,
      name: doc.nameKey, // Keep translation keys in domain
      // ... other fields
    }
  }

  // Domain → API DTO  
  static toDTO(domain: EntityDomain): EntityDTO {
    return {
      id: domain.id,
      nameKey: domain.name, // Expose translation keys to frontend
      // ... other fields
    }
  }
}
```

## 🧪 Testing Strategy

### Test Coverage Requirements

- **Public API**: Customer-facing endpoints with authentication
- **Admin API**: Management endpoints with RBAC permissions  
- **Internal API**: Service-to-service communication with API keys
- **Error Handling**: Validation errors, 404s, permission errors
- **Edge Cases**: Invalid UUIDs, missing data, boundary conditions

### Shared Test Data Pattern

Create comprehensive test data covering all business scenarios:

```typescript
export interface SharedTestData {
  // Different entity states
  activeEntities: Entity[]
  inactiveEntities: Entity[]
  verifiedEntities: Entity[]
  unverifiedEntities: Entity[]
  
  // Supporting data
  categories: Category[]
  users: User[]
  
  // Quick access
  allEntities: Entity[]
  entityById: Map<string, Entity>
}
```

### Test Assertions

**Standard test validation patterns**:

```typescript
// Pagination validation
expect(response.body).toHaveProperty('data')
expect(response.body).toHaveProperty('pagination')
expect(response.body.pagination.page).toBe(1)
expect(response.body.pagination.totalCount).toBeGreaterThan(0)

// Filtering validation  
if (response.body.data.length > 0) {
  response.body.data.forEach((item: any) => {
    expect(item.active).toBe(true) // Verify filter applied
  })
}

// Include validation
if (query.include) {
  expect(response.body.data[0]).toHaveProperty('user')
  expect(response.body.data[0]).toHaveProperty('category')
}
```

## 📁 File Structure Template

```
packages/services/[service-name]/
├── src/
│   ├── controllers/
│   │   ├── PublicController.ts
│   │   ├── AdminController.ts
│   │   └── InternalController.ts
│   ├── services/
│   │   └── ServiceName.ts
│   ├── repositories/
│   │   └── ServiceRepository.ts
│   ├── routes/
│   │   ├── PublicRoutes.ts
│   │   ├── AdminRoutes.ts
│   │   └── InternalRoutes.ts
│   ├── test/
│   │   ├── integration/
│   │   │   ├── service.public.integration.test.ts
│   │   │   ├── service.admin.integration.test.ts
│   │   │   └── service.internal.integration.test.ts
│   │   └── helpers/
│   │       └── serviceTestHelpers.ts
│   ├── app.ts
│   ├── server.ts
│   └── index.ts
└── package.json
```

## 🎯 Migration Priorities

### High Priority Services
1. **Voucher Service** - Core business functionality
2. **User Service** - Authentication dependencies  
3. **Category Service** - Already well-structured
4. **Communication Service** - Cross-service dependencies

### Medium Priority Services
1. **Auth Service** - Stable but needs test fixes
2. **Storage Service** - Infrastructure service
3. **Support Service** - Admin functionality

### Low Priority Services  
1. **PDF Service** - Specialized functionality (exclude from general migration)

## ⚠️ Common Pitfalls to Avoid

### Schema Design Issues
- ❌ Using `z.coerce.boolean()` for query parameters (converts `"false"` to `true`)
- ❌ Multiple boolean include flags instead of CSV (`includeUser`, `includeCategory`)
- ❌ Default values in internal API schemas that prevent flexible filtering
- ❌ Inconsistent naming between public/admin/internal schemas
- ❌ Not handling `undefined` vs `false` distinction in boolean filters

### Controller Implementation Issues
- ❌ Database queries in controllers (violates Clean Architecture)
- ❌ Not binding methods in constructor (causes `this` context issues)
- ❌ Using `res.send()` instead of `res.json()` for typed responses
- ❌ Missing proper error handling with `next(error)`

### Test Implementation Issues
- ❌ Recreating test data for every test (slow and flaky)
- ❌ Not testing all API tiers (public/admin/internal)  
- ❌ Missing RBAC permission matrix testing
- ❌ Not testing error conditions and edge cases
- ❌ Using `any` type instead of proper typing (`let translationClient: any`)
- ❌ Creating `new TranslationClient()` without dependencies in tests
- ❌ Not clearing translations/cache between tests
- ❌ Missing test data verification and recreation logic

### Repository Pattern Issues
- ❌ Not handling `undefined` filter parameters correctly
- ❌ Complex filtering logic instead of simple conditional building
- ❌ Not using proper include/select patterns for relations

## 🚀 Success Metrics

A successfully migrated service should achieve:

- ✅ **100% Test Pass Rate** - All integration tests passing
- ✅ **Schema Consistency** - All three API tiers following standard patterns
- ✅ **RBAC Coverage** - Proper permission enforcement on all endpoints
- ✅ **Clean Architecture** - Clear separation of concerns (Controller → Service → Repository)
- ✅ **Performance** - Sub-1000ms response times for typical operations
- ✅ **Error Handling** - Comprehensive error scenarios covered in tests

## 📚 Reference Files

### Primary Reference Implementation
- **Business Service**: `packages/services/business/` - Complete working example
- **Schema Patterns**: `packages/api/src/schemas/business/` - All three API tiers
- **Test Patterns**: `packages/services/business/src/test/integration/` - Comprehensive test suite

### Supporting Utilities
- **Boolean Helper**: `packages/api/src/common/utils/validators.ts`
- **Include Parser**: `packages/shared/src/utils/` (parseIncludeParam)
- **Test Utilities**: `packages/tests/src/utils/` - Shared test infrastructure

## 🔄 Continuous Improvement

This pattern should be updated as we:
1. Discover new edge cases during service migrations
2. Identify additional optimizations or simplifications
3. Add new architectural patterns or requirements
4. Update testing strategies or tools

---

**Next Steps**: Use this pattern to systematically migrate the Voucher Service, then apply learnings to update this document for subsequent service migrations.