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
  @Cacheable({ ttl: 3600 })  // Cache at service layer
  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne(id);
  }
}

@Controller('users')
export class UserController {
  @Get(':id')  // No caching decorator here
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
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

## Services to Fix

### Priority 1 (Currently Broken)
- [ ] **business-service**
  - Remove `@Cache` from `BusinessRegistrationController`
  - Add `@Cache` to `BusinessRegistrationService.checkRegistrationStatus()`
  - Fix integration tests

### Priority 2 (Potentially Broken)
- [ ] **category-service**
  - Remove `@Cache` from all controllers
  - Verify service methods have appropriate caching
  - Ensure `setCacheService()` is called
  
- [ ] **storage-service**
  - Remove `@Cache` from `FileController`
  - Add `@Cache` to `StorageService` methods
  - Add `setCacheService()` call to server setup

- [ ] **communication-service**
  - Remove `@Cache` from controllers
  - Add to service layer
  - Verify setup

- [ ] **subscription-service**
  - Remove `@Cache` from `PublicSubscriptionController`
  - Add to service layer
  - Verify setup

### Priority 3 (Audit Needed)
- [ ] **voucher-service**
- [ ] **payment-service**
- [ ] **user-service**
- [ ] **support-service**
- [ ] **pdf-service**

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
  
  expect(result2).toEqual(result1)  // Same data
  expect(time2).toBeLessThan(time1 / 2)  // Much faster
})
```

## Common Pitfalls to Avoid

1. **Don't cache methods with side effects** - Only cache pure data retrieval
2. **Don't cache user-specific data without user ID in key** - Security risk
3. **Don't cache sensitive data** - Consider security implications
4. **Don't cache frequently changing data** - Wastes cache space
5. **Don't forget cache invalidation** - Update cache when data changes

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