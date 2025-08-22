# Task: Ensure Cache Decorators are on Service Layer Only

## Problem Statement

The codebase currently has `@Cache` decorators incorrectly placed on controller methods throughout multiple services. This violates Clean Architecture principles and causes critical bugs where HTTP responses are never sent when cache hits occur.

### Current Issue

When `@Cache` is applied to controller methods that call `res.json()`:

1. On cache hit, the decorator returns the cached value
2. The controller method body never executes
3. `res.json()` is never called
4. The HTTP response is never sent
5. The request hangs indefinitely (60+ second timeouts in tests)

## Root Cause Analysis

### Why This Happens

The `@Cache` decorator (in `packages/redis/src/application/decorators/cache.ts`) is designed to:

1. Intercept method calls
2. Check cache for existing data
3. Return cached data if found (bypassing method execution)
4. Execute method and cache result if not found

This pattern works perfectly for methods that **return values** (service methods) but fails catastrophically for methods that **produce side effects** (controller methods calling `res.json()`).

### Affected Services

After investigation, the following services have misplaced `@Cache` decorators:

#### Services with Cache on Controllers (INCORRECT):

- **business-service**: `BusinessRegistrationController` - causes hanging
- **category-service**: `CategoryController`, `AdminCategoryController`, `InternalCategoryController`
- **storage-service**: `FileController`
- **communication-service**: `EmailController`, `NotificationController`
- **subscription-service**: `PublicSubscriptionController`

#### Services that Don't Set Global Cache Service:

- **storage-service**: Missing `setCacheService()` call (cache accidentally disabled)
- **category-service**: Needs verification
- Others: Need audit

## Industry Best Practices

### Clean Architecture Principles

According to Clean Architecture and SOLID principles:

1. **Controllers (Interface Adapters Layer)**
   - Handle HTTP concerns only
   - Transform HTTP requests to service calls
   - Transform service responses to HTTP responses
   - Should NOT contain business logic or caching

2. **Services (Use Case/Application Layer)**
   - Contain business logic
   - Handle caching of business operations
   - Return domain objects/DTOs
   - Are reusable across different interfaces (REST, GraphQL, CLI)

3. **Single Responsibility Principle**
   - Controllers: Responsible for HTTP protocol
   - Services: Responsible for business operations (including caching)

### Real-World Examples

**Spring Boot (Java)**

```java
@Service
public class UserService {
  @Cacheable("users")  // Cache at service layer
  public User findById(Long id) {
    return userRepository.findById(id);
  }
}

@RestController
public class UserController {
  // No caching here, just HTTP handling
  @GetMapping("/users/{id}")
  public ResponseEntity<User> getUser(@PathVariable Long id) {
    return ResponseEntity.ok(userService.findById(id));
  }
}
```

**NestJS (TypeScript)**

```typescript
@Injectable()
export class UserService {
  @Cacheable({ ttl: 3600 }) // Cache at service layer
  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne(id)
  }
}

@Controller('users')
export class UserController {
  @Get(':id') // No caching decorator here
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id)
  }
}
```

## Implementation Plan

### Phase 1: Audit Current State

For each service, identify:

1. Controllers with `@Cache` decorators
2. Services with `@Cache` decorators
3. Whether `setCacheService()` is called in server setup
4. Test coverage for cached operations

### Phase 2: Remove Cache from Controllers

For each affected controller:

1. Remove `@Cache` decorator
2. Remove cache-related imports if no longer needed
3. Document the change

Example:

```typescript
// BEFORE (incorrect)
@Cache({ ttl: REDIS_DEFAULT_TTL, prefix: 'categories' })
async getAllCategories(req: Request, res: Response): Promise<void> {
  const result = await this.service.getAllCategories(params)
  res.json(result)
}

// AFTER (correct)
async getAllCategories(req: Request, res: Response): Promise<void> {
  const result = await this.service.getAllCategories(params)  // Service handles caching
  res.json(result)
}
```

### Phase 3: Add Cache to Services

For each service method that needs caching:

1. Create a `constants/cache-keys.ts` file with cache key constants
2. Add `@Cache` decorator with appropriate configuration
3. Use the cache key constants for prefixes
4. Use proper key generation strategy
5. Set appropriate TTL values

#### Cache Keys Pattern (RECOMMENDED)

Create a centralized cache keys file:

```typescript
// constants/cache-keys.ts
/**
 * Cache key constants for [service-name] service
 * Pattern: service:entity[-modifier]:identifier
 */
export const CACHE_KEYS = {
  ENTITY: {
    LIST: 'service:entities',
    SINGLE: 'service:entity',
    BY_USER: 'service:entity:user',
  },
  ADMIN: {
    LIST: 'service:admin:entities',
    SINGLE: 'service:admin:entity',
  },
} as const

export const generateCacheKey = {
  entityById: (id: string) => `${CACHE_KEYS.ENTITY.SINGLE}:${id}`,
  entitiesByUser: (userId: string) => `${CACHE_KEYS.ENTITY.BY_USER}:${userId}`,
}
```

Usage in service:

```typescript
import { CACHE_KEYS } from '../constants/cache-keys.js'

// Service method with caching
@Cache({
  ttl: REDIS_DEFAULT_TTL,
  prefix: CACHE_KEYS.ENTITY.LIST,
  keyGenerator: (prefix: string, methodName: string, args: any[]) => {
    const params = args[0]
    return `${prefix}:${JSON.stringify(params)}`
  }
})
async getAllEntities(params: SearchParams): Promise<PaginatedResult<Entity>> {
  return this.repository.findAll(params)
}
```

### Phase 4: Ensure Global Cache Service Setup

For each service's `server.ts`:

1. Import `setCacheService` from `@pika/redis`
2. Call `setCacheService(cacheService)` during server initialization

Example:

```typescript
import { setCacheService } from '@pika/redis'

export async function createServer(options: ServerOptions) {
  // Set up global cache service for decorators
  setCacheService(options.cacheService)

  // ... rest of server setup
}
```

### Phase 5: Update Tests

1. Remove tests that expect controller-level caching
2. Add tests for service-level caching
3. Ensure integration tests work with proper cache configuration

## Implementation Status Checklist

### ✅ COMPLETED Services

#### 1. **category-service** ✅

- [x] Created cache-keys.ts file
- [x] Removed @Cache from CategoryController
- [x] Removed @Cache from AdminCategoryController
- [x] Removed @Cache from InternalCategoryController
- [x] Updated CategoryService to use CACHE_KEYS constants
- [x] Added proper cache key generators
- [x] Added setCacheService to server.ts
- [x] Validated no hardcoded cache strings
- [x] Build successful
- [x] Added cache performance tests

#### 2. **subscription-service** ✅

- [x] Created cache-keys.ts file
- [x] Removed @Cache from PlanController.getPlans() (FIXED)
- [x] Removed @Cache from PublicSubscriptionController.getUserSubscription() (FIXED)
- [x] ✅ VERIFIED: PlanService.getAllPlans() HAS @Cache with CACHE_KEYS.PLAN.LIST
- [x] ✅ VERIFIED: SubscriptionService.getUserActiveSubscription() HAS @Cache with CACHE_KEYS.SUBSCRIPTION.USER
- [x] Updated all services to use CACHE_KEYS constants
- [x] Added setCacheService to server.ts
- [x] Validated no hardcoded cache strings
- [x] Build successful

### ✅ COMPLETED Services (ALL DONE!)

#### 5. **payment-service** ✅ (No changes needed)

- [x] ✅ VERIFIED: No @Cache decorators found in controllers or services
- [x] Service already follows Clean Architecture principles
- [x] No cache architecture violations detected
- [x] Uses cache service only for infrastructure (health checks, webhooks)
- [x] Build successful

#### 6. **user-service** ✅

- [x] Created cache-keys.ts file
- [x] ✅ VERIFIED: UserService.getUserById() HAS @Cache with CACHE_KEYS.USER.SINGLE
- [x] ✅ VERIFIED: AdminUserService methods HAS @Cache with CACHE_KEYS.ADMIN constants
- [x] No controllers had @Cache decorators (already clean)
- [x] Updated all services to use CACHE_KEYS constants
- [x] Added setCacheService to server.ts
- [x] Validated no hardcoded cache strings
- [x] Build successful

#### 7. **support-service** ✅

- [x] Created cache-keys.ts file
- [x] ✅ VERIFIED: ProblemService.getProblemById() HAS @Cache with CACHE_KEYS.PROBLEM.SINGLE
- [x] ✅ VERIFIED: SupportCommentService.getCommentsByProblemId() HAS @Cache with CACHE_KEYS.COMMENT.BY_PROBLEM
- [x] ✅ VERIFIED: AdminSupportCommentService.getAllComments() and getCommentsByProblemId() HAS @Cache
- [x] Removed @Cache from ProblemController.getUserProblems()
- [x] Removed @Cache from AdminProblemController.getAllProblems() and getProblemById()
- [x] Removed @Cache from SupportCommentController.getCommentsByProblemId()
- [x] Removed @Cache from AdminCommentController.getAllComments() and getCommentsByProblemId()
- [x] Updated all services to use CACHE_KEYS constants
- [x] Added setCacheService to server.ts
- [x] Validated no hardcoded cache strings
- [x] Build successful

#### 8. **pdf-service** ✅

- [x] Created cache-keys.ts file
- [x] ✅ VERIFIED: VoucherBookService.getVoucherBookById() and getAllVoucherBooks() HAS @Cache with CACHE_KEYS
- [x] ✅ VERIFIED: BookDistributionService methods HAS @Cache with CACHE_KEYS
- [x] ✅ VERIFIED: AdPlacementService methods HAS @Cache with CACHE_KEYS
- [x] Removed @Cache from VoucherBookController.getAllVoucherBooks() and getVoucherBookById()
- [x] Removed @Cache from AdminVoucherBookController.getAllVoucherBooks(), getVoucherBookById(), and getVoucherBookStatistics()
- [x] Updated all services to use CACHE_KEYS constants
- [x] Added setCacheService to server.ts
- [x] Validated no hardcoded cache strings
- [x] Build successful

#### 9. **auth-service** ✅

- [x] Created cache-keys.ts file
- [x] ✅ VERIFIED: AuthService.getUserInfo() HAS @Cache with CACHE_KEYS.USER_INFO.BY_ID (5 min TTL)
- [x] Removed @Cache from AuthController.userinfo()
- [x] Updated service to use CACHE_KEYS constants
- [x] Added setCacheService to server.ts
- [x] Validated no hardcoded cache strings
- [x] Build successful

#### 10. **storage-service** ✅

- [x] Created cache-keys.ts file (already existed)
- [x] ✅ VERIFIED: StorageService methods HAS @Cache with CACHE_KEYS.FILE constants
- [x] Removed @Cache from FileController (already done)
- [x] Enhanced StorageService with caching
- [x] Added setCacheService to server.ts
- [x] Updated to use CACHE_KEYS pattern
- [x] Build successful

#### 11. **communication-service** ✅

- [x] Created cache-keys.ts file (already existed)
- [x] ✅ VERIFIED: EmailService methods HAS @Cache with CACHE_KEYS.EMAIL constants
- [x] ✅ VERIFIED: NotificationService methods HAS @Cache with CACHE_KEYS.NOTIFICATION constants
- [x] Removed @Cache from EmailController (already done)
- [x] Removed @Cache from NotificationController (already done)
- [x] Enhanced services with caching
- [x] Added setCacheService to server.ts
- [x] Updated to use CACHE_KEYS pattern
- [x] Build successful

### Validation Checklist for Each Service

For each service, validate ALL of the following:

#### Public API Layer

- [ ] Check all public controllers for @Cache decorators (should be NONE)
- [ ] Verify public services have appropriate @Cache decorators
- [ ] Ensure cache keys follow the pattern

#### Admin API Layer

- [ ] Check all admin controllers for @Cache decorators (should be NONE)
- [ ] Verify admin services have appropriate @Cache decorators
- [ ] Ensure cache keys follow the pattern

#### Internal API Layer

- [ ] Check all internal controllers for @Cache decorators (should be NONE)
- [ ] Verify internal services have appropriate @Cache decorators
- [ ] Ensure cache keys follow the pattern

#### Repository Layer

- [ ] Verify NO @Cache decorators in repositories
- [ ] Check repositories don't have hardcoded cache logic

#### Cache Configuration

- [ ] Verify setCacheService is called in server.ts
- [ ] Check cache-keys.ts exists and follows pattern
- [ ] Validate no hardcoded cache strings anywhere
- [ ] Ensure cache invalidation on CREATE/UPDATE/DELETE

#### Service Layer Completeness Verification

- [ ] **CRITICAL: Verify service methods have @Cache decorators**
  - Don't just remove @Cache from controllers without ensuring services are cached
  - Check that ALL methods called by controllers have appropriate @Cache
  - Verify cache keys, TTL, and key generators are properly configured
- [ ] **Verify cache invalidation is implemented**
  - Check CREATE/UPDATE/DELETE operations clear relevant caches
  - Ensure cache invalidation uses the same CACHE_KEYS constants

#### Testing

- [ ] Run build command successfully
- [ ] Run service-specific tests
- [ ] Verify no hanging requests
- [ ] Check cache performance tests exist (if applicable)
- [ ] **Test that caching actually works end-to-end**

## Success Criteria

1. **No `@Cache` decorators on any controller methods**
2. **All caching logic moved to service layer**
3. **All services call `setCacheService()` in their setup**
4. **All integration tests pass**
5. **No hanging requests in tests**
6. **Cache actually works (verified by tests)**

## Testing Strategy

### Unit Tests

- Mock cache service in service tests
- Verify cache key generation
- Test cache hit/miss scenarios

### Integration Tests

- Use `MemoryCacheService` for testing
- Verify actual caching behavior
- Test that multiple requests return cached data
- Ensure no request hanging

### Example Test

```typescript
it('should cache service responses', async () => {
  // First call - should hit database
  const start1 = Date.now()
  const result1 = await service.getAllCategories({ page: 1 })
  const time1 = Date.now() - start1

  // Second call - should hit cache
  const start2 = Date.now()
  const result2 = await service.getAllCategories({ page: 1 })
  const time2 = Date.now() - start2

  expect(result2).toEqual(result1) // Same data
  expect(time2).toBeLessThan(time1 / 2) // Much faster
})
```

## ⚠️ CRITICAL VERIFICATION STEP: Don't Just Remove - VERIFY SERVICE CACHING

### The Biggest Pitfall: Removing Controller Caching Without Verifying Service Caching

**WARNING**: Simply removing `@Cache` decorators from controllers is NOT enough! You must verify that the service layer actually implements the caching.

#### What to Check When "Fixing" a Service:

1. **Identify what was cached in controllers**

   ```bash
   # Find what controller methods had @Cache
   grep -n "@Cache" packages/services/[service]/src/controllers/*Controller.ts
   ```

2. **Map controller methods to service methods**

   ```typescript
   // Controller method (had @Cache - now removed)
   async getUserSubscription(req, res) {
     const result = await this.subscriptionService.getUserActiveSubscription(userId)
     res.json(result)
   }

   // CHECK: Does SubscriptionService.getUserActiveSubscription() have @Cache?
   ```

3. **Verify service method has equivalent caching**
   ```typescript
   // Service method MUST have @Cache decorator
   @Cache({
     ttl: REDIS_DEFAULT_TTL,
     prefix: CACHE_KEYS.SUBSCRIPTION.USER,
     keyGenerator: (prefix, method, args) => `${prefix}:${args[0]}`
   })
   async getUserActiveSubscription(userId: string) {
     // Implementation
   }
   ```

#### Examples of Proper Verification:

**✅ GOOD Example - Category Service:**

- Removed `@Cache` from `CategoryController.getAllCategories()`
- ✅ Verified `CategoryService.getAllCategories()` HAS `@Cache` with `CACHE_KEYS.CATEGORY.LIST`
- ✅ Verified proper cache invalidation in create/update/delete methods

**✅ GOOD Example - Subscription Service:**

- Removed `@Cache` from `PublicSubscriptionController.getUserSubscription()`
- ✅ Verified `SubscriptionService.getUserActiveSubscription()` HAS `@Cache` with `CACHE_KEYS.SUBSCRIPTION.USER`

**❌ BAD Example - What NOT to do:**

- Remove `@Cache` from `VoucherController.getVouchers()`
- ❌ Assume `VoucherService.getAllVouchers()` has caching
- ❌ Don't check if the service method actually has `@Cache`
- Result: No caching at all - performance regression!

### Service Layer Completeness Checklist:

For each service being "fixed":

1. **Map all controller methods that had @Cache**
2. **Find the corresponding service methods they call**
3. **Verify EACH service method has appropriate @Cache decorator**
4. **Check cache keys use CACHE_KEYS constants (not hardcoded strings)**
5. **Verify cache invalidation exists for write operations**
6. **Test that caching actually works end-to-end**

### How to Test Service Layer Caching:

```typescript
// Integration test to verify caching works
it('should cache service responses', async () => {
  // First call - hits database
  const start1 = Date.now()
  const result1 = await service.getAllEntities({ page: 1 })
  const time1 = Date.now() - start1

  // Second call - should hit cache (much faster)
  const start2 = Date.now()
  const result2 = await service.getAllEntities({ page: 1 })
  const time2 = Date.now() - start2

  expect(result2).toEqual(result1) // Same data
  expect(time2).toBeLessThan(time1 / 2) // Much faster (cache hit)
})
```

## Common Pitfalls to Avoid

1. **Don't just remove controller @Cache without verifying service has it** - ⚠️ CRITICAL
2. **Don't cache methods with side effects** - Only cache pure data retrieval
3. **Don't cache user-specific data without user ID in key** - Security risk
4. **Don't cache sensitive data** - Consider security implications
5. **Don't cache frequently changing data** - Wastes cache space
6. **Don't forget cache invalidation** - Update cache when data changes

## Cache Invalidation Strategy

When implementing service-level caching, ensure:

1. Cache is invalidated on CREATE operations
2. Cache is invalidated on UPDATE operations
3. Cache is invalidated on DELETE operations
4. Use cache tags/patterns for bulk invalidation

Example:

```typescript
async createCategory(data: CreateCategoryDTO): Promise<Category> {
  const category = await this.repository.create(data)
  // Invalidate list caches
  await this.cacheService.invalidatePattern('service:categories:*')
  return category
}
```

## References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Spring Boot Caching](https://spring.io/guides/gs/caching/)
- [NestJS Caching](https://docs.nestjs.com/techniques/caching)
- [Martin Fowler on Service Layer](https://martinfowler.com/eaaCatalog/serviceLayer.html)

## Notes

- This issue was discovered when business registration tests were hanging with 60-second timeouts
- The root cause was `@Cache` on controller methods that call `res.json()`
- Storage service tests passed only because caching was accidentally disabled
- This is a systemic architectural issue affecting multiple services
- Fixing this will improve code quality, maintainability, and reliability
