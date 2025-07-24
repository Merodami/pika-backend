# Repository Pagination Pattern

## Executive Summary

This document defines the **mandatory pagination pattern** for all Pika microservices. The pattern establishes that **repository layers build pagination metadata**, while service layers pass through results without modification. This approach follows Clean Architecture principles and industry standards from Spring Data, Django, Entity Framework, and other enterprise frameworks.

## 🚨 CRITICAL: This Pattern is MANDATORY

**Every service MUST follow this exact pagination pattern without deviation.** This includes:

- Repository layer builds ALL pagination metadata
- Service layer passes through repository results unchanged
- Controller layer transforms data using mappers while preserving pagination structure
- Consistent pagination structure for bounded and unbounded operations

## Problem Statement

### Issues with Service-Layer Pagination

During the Category service implementation, we discovered services were building pagination metadata in the wrong layer:

```typescript
// ❌ WRONG - Building pagination in service layer
export class CategoryService {
  async getCategoriesByIds(ids: string[]): Promise<PaginatedResult<Category>> {
    const categories = await this.repository.findByIds(ids) // Returns Category[]
    
    // ❌ Service building pagination violates Clean Architecture
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

### Problems with This Approach:

1. **Violates Single Responsibility**: Service handles both business logic AND data formatting
2. **Code Duplication**: Pagination logic repeated across multiple services
3. **Inconsistent Implementation**: Different services build pagination differently
4. **Performance Issues**: Services can't optimize count/data queries together
5. **Type Safety Issues**: Interface mismatches between layers
6. **Maintenance Overhead**: Pagination changes require updates in multiple services

## Industry Standard Analysis

### Clean Architecture (Robert Martin)

> "The repository pattern encapsulates the logic needed to access data sources. It centralizes common data access functionality, providing better maintainability and decoupling."

**Pagination metadata IS data access logic**, not business logic.

### Spring Data Pattern

```java
// Repository layer builds pagination
@Repository
public interface UserRepository extends PagingAndSortingRepository<User, Long> {
    Page<User> findByStatus(String status, Pageable pageable);
}

// Service layer passes through
@Service
public class UserService {
    public Page<User> getActiveUsers(Pageable pageable) {
        return userRepository.findByStatus("ACTIVE", pageable); // Direct pass-through
    }
}
```

### Django Pattern

```python
# Repository/Manager layer
class UserManager(models.Manager):
    def get_paginated_users(self, page, size):
        paginator = Paginator(self.all(), size)
        return paginator.page(page)  # Contains count, has_next, etc.

# Service layer passes through
class UserService:
    def list_users(self, page, size):
        return User.objects.get_paginated_users(page, size)
```

### Entity Framework Pattern

```csharp
// Repository layer
public async Task<PagedResult<User>> GetUsersAsync(int page, int size)
{
    var total = await _context.Users.CountAsync();
    var users = await _context.Users.Skip((page - 1) * size).Take(size).ToListAsync();
    
    return new PagedResult<User> {
        Data = users,
        TotalCount = total,
        PageNumber = page,
        PageSize = size
    };
}

// Service layer passes through
public async Task<PagedResult<User>> GetUsersAsync(int page, int size)
{
    return await _userRepository.GetUsersAsync(page, size);
}
```

## ✅ Correct Implementation Pattern

### 1. Repository Layer - Builds Pagination

```typescript
export interface ICategoryRepository {
  findAll(params: CategorySearchParams): Promise<PaginatedResult<Category>>
  findByIds(ids: string[]): Promise<PaginatedResult<Category>>
}

export class CategoryRepository implements ICategoryRepository {
  async findAll(params: CategorySearchParams): Promise<PaginatedResult<Category>> {
    const { page = 1, limit = 20 } = params
    const skip = (page - 1) * limit

    // Repository optimizes count + data queries
    const [total, categories] = await Promise.all([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({ where, orderBy, skip, take: limit }),
    ])

    const totalPages = Math.ceil(total / limit)

    // Repository builds complete pagination metadata
    return {
      data: CategoryMapper.fromPrismaCategoryArray(categories),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  }

  async findByIds(ids: string[]): Promise<PaginatedResult<Category>> {
    const categories = await this.prisma.category.findMany({
      where: { id: { in: ids } },
      orderBy: { sortOrder: 'asc' },
    })

    // Repository builds pagination even for bounded operations
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
```

### 2. Service Layer - Pass Through

```typescript
export interface ICategoryService {
  getAllCategories(params: CategorySearchParams): Promise<PaginatedResult<Category>>
  getCategoriesByIds(ids: string[]): Promise<PaginatedResult<Category>>
}

export class CategoryService implements ICategoryService {
  constructor(private readonly repository: ICategoryRepository) {}

  async getAllCategories(params: CategorySearchParams): Promise<PaginatedResult<Category>> {
    // Apply business rules (filtering, validation, etc.)
    const serviceParams = {
      ...params,
      isActive: params.isActive ?? true, // Business rule: default to active
    }

    // Pass through repository result - NO pagination building
    return this.repository.findAll(serviceParams)
  }

  async getCategoriesByIds(ids: string[]): Promise<PaginatedResult<Category>> {
    // Apply business validation
    const invalidIds = ids.filter((id) => !isUuidV4(id))
    if (invalidIds.length > 0) {
      throw ErrorFactory.badRequest(`Invalid category ID format: ${invalidIds.join(', ')}`)
    }

    // Pass through repository result - NO pagination building
    return this.repository.findByIds(ids)
  }
}
```

### 3. Controller Layer - Transform Data, Preserve Pagination

```typescript
export class CategoryController {
  async getAllCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getValidatedQuery<CategoryQueryParams>(req)
      
      const params = {
        search: query.search,
        isActive: query.isActive,
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: query.sortBy || 'sortOrder',
        sortOrder: query.sortOrder || 'asc',
      }

      const result = await this.categoryService.getAllCategories(params)

      // Transform data using mappers, preserve pagination structure
      const response = {
        data: result.data.map(CategoryMapper.toDTO),
        pagination: result.pagination, // Pass through pagination unchanged
      }

      // Validate response against schema
      const validatedResponse = categoryPublic.CategoryListResponse.parse(response)
      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}

export class InternalCategoryController {
  async getCategoriesByIds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryIds } = req.body

      const result = await this.categoryService.getCategoriesByIds(categoryIds)

      // Transform data using mappers, preserve pagination structure  
      const response = {
        data: result.data.map(CategoryMapper.toInternalDTO),
        pagination: result.pagination, // Pass through pagination unchanged
      }

      // Validate response against schema
      const validatedResponse = categoryInternal.BulkCategoryResponse.parse(response)
      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
```

## Key Benefits of Repository Pagination

### 1. **Single Responsibility Principle**
- **Repository**: Handles ALL data access concerns including pagination
- **Service**: Focuses on business logic, validation, and orchestration
- **Controller**: Handles HTTP concerns and data transformation

### 2. **Performance Optimization**
```typescript
// Repository can optimize queries
const [total, entities] = await Promise.all([
  this.prisma.entity.count({ where }), // Optimized count query
  this.prisma.entity.findMany({ where, skip, take }) // Data query
])

// Repository can implement database-specific optimizations
// PostgreSQL: LIMIT/OFFSET
// MongoDB: skip/limit with proper indexing
// SQL Server: OFFSET/FETCH with ROW_NUMBER()
```

### 3. **Consistent API Structure**
```typescript
// ALL repository methods return same structure
findAll(): Promise<PaginatedResult<T>>
findByIds(): Promise<PaginatedResult<T>>
findByCategory(): Promise<PaginatedResult<T>>
findActive(): Promise<PaginatedResult<T>>

// Controllers always receive same structure
const result = await service.someMethod()
const response = {
  data: result.data.map(mapper),
  pagination: result.pagination,
}
```

### 4. **Type Safety**
```typescript
// Interface enforces pagination structure at data boundary
export interface IRepository {
  findAll(params: SearchParams): Promise<PaginatedResult<T>> // Enforced
}

// Service interfaces are consistent
export interface IService {
  getAll(params: SearchParams): Promise<PaginatedResult<T>> // Enforced
}
```

### 5. **Easier Testing**
```typescript
// Mock repository returns proper structure
const mockRepository = {
  findAll: jest.fn().mockResolvedValue({
    data: [mockEntity1, mockEntity2],
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    },
  }),
}

// Service test focuses on business logic
test('should apply business rules', async () => {
  const result = await service.getAll({ isActive: undefined })
  
  expect(mockRepository.findAll).toHaveBeenCalledWith({
    isActive: true, // Business rule applied
  })
  expect(result).toEqual(mockRepository.findAll.mock.results[0].value)
})
```

### 6. **Future-Proof Architecture**
```typescript
// Easy to change pagination strategy in one place
class Repository {
  async findAll(params): Promise<PaginatedResult<T>> {
    // Can switch from offset-based to cursor-based pagination
    if (params.cursor) {
      return this.findWithCursor(params)
    }
    return this.findWithOffset(params)
  }
}
```

## Implementation Rules

### 1. **Repository Layer**
- ✅ **MUST** return `PaginatedResult<T>` for ALL array operations
- ✅ **MUST** build pagination metadata in repository methods
- ✅ **MUST** optimize count and data queries when possible
- ✅ **MUST** handle both bounded and unbounded operations consistently

### 2. **Service Layer**
- ✅ **MUST** pass through repository results without modification
- ✅ **MUST** focus on business logic, validation, and orchestration
- ✅ **MUST NOT** build pagination metadata
- ✅ **MUST NOT** modify pagination structure

### 3. **Controller Layer**
- ✅ **MUST** transform data using mappers
- ✅ **MUST** preserve pagination structure from service
- ✅ **MUST** validate responses against schemas
- ✅ **MUST NOT** build pagination metadata

### 4. **Schema Layer**
- ✅ **MUST** use `paginatedResponse()` helper for list endpoints
- ✅ **MUST** maintain consistent pagination structure across tiers
- ✅ **MUST** validate pagination metadata in response schemas

## Migration Strategy

### For Existing Services:

1. **Update Repository Interface**
   ```typescript
   // Change from:
   findByIds(ids: string[]): Promise<Category[]>
   
   // To:
   findByIds(ids: string[]): Promise<PaginatedResult<Category>>
   ```

2. **Update Repository Implementation**
   ```typescript
   // Add pagination metadata building
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
   ```

3. **Update Service Layer**
   ```typescript
   // Remove pagination building, pass through repository result
   async getCategoriesByIds(ids: string[]): Promise<PaginatedResult<Category>> {
     return this.repository.findByIds(ids) // Direct pass-through
   }
   ```

4. **Update Controller Layer**
   ```typescript
   // Handle new structure
   const result = await this.service.getCategoriesByIds(categoryIds)
   const response = {
     data: result.data.map(CategoryMapper.toInternalDTO),
     pagination: result.pagination, // Preserve pagination
   }
   ```

5. **Update Response Schemas**
   ```typescript
   // Use paginatedResponse helper
   export const BulkCategoryResponse = paginatedResponse(InternalCategoryData)
   ```

## Common Mistakes to Avoid

### ❌ Building Pagination in Service Layer
```typescript
// DON'T DO THIS
export class Service {
  async getByIds(ids: string[]): Promise<PaginatedResult<T>> {
    const entities = await this.repository.findByIds(ids) // Returns T[]
    return {
      data: entities, // ❌ Building pagination in wrong layer
      pagination: { /* ... */ }
    }
  }
}
```

### ❌ Modifying Pagination in Controller
```typescript
// DON'T DO THIS
export class Controller {
  async getAll(req, res) {
    const result = await this.service.getAll(params)
    
    // ❌ Modifying pagination structure
    const response = {
      items: result.data, // ❌ Changing 'data' to 'items'
      meta: { // ❌ Changing 'pagination' to 'meta'
        currentPage: result.pagination.page,
        // ...
      }
    }
  }
}
```

### ❌ Inconsistent Bounded Operations
```typescript
// DON'T DO THIS
export class Repository {
  async findByIds(ids: string[]): Promise<Category[]> { // ❌ Returns array
    return this.prisma.category.findMany({ where: { id: { in: ids }} })
  }
  
  async findAll(params: SearchParams): Promise<PaginatedResult<Category>> { // ✅ Returns paginated
    // ...
  }
}
```

### ❌ Missing Response Validation
```typescript
// DON'T DO THIS
export class Controller {
  async getAll(req, res) {
    const result = await this.service.getAll(params)
    res.json(result) // ❌ No transformation, no validation
  }
}
```

## Testing the Pattern

### Repository Tests
```typescript
describe('CategoryRepository', () => {
  test('findByIds should return paginated result', async () => {
    const ids = ['id1', 'id2']
    const result = await repository.findByIds(ids)

    expect(result).toMatchObject({
      data: expect.any(Array),
      pagination: {
        page: 1,
        limit: 2,
        total: expect.any(Number),
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      }
    })
  })
})
```

### Service Tests
```typescript
describe('CategoryService', () => {
  test('getCategoriesByIds should pass through repository result', async () => {
    const mockResult = {
      data: [mockCategory1, mockCategory2],
      pagination: { page: 1, limit: 2, total: 2, totalPages: 1, hasNext: false, hasPrev: false }
    }
    
    mockRepository.findByIds.mockResolvedValue(mockResult)
    
    const result = await service.getCategoriesByIds(['id1', 'id2'])
    
    expect(result).toBe(mockResult) // Exact same object reference
    expect(mockRepository.findByIds).toHaveBeenCalledWith(['id1', 'id2'])
  })
})
```

### Integration Tests
```typescript
describe('Category API', () => {
  test('POST /internal/categories/bulk should return paginated response', async () => {
    const response = await request
      .post('/internal/categories/bulk')
      .set('x-api-key', apiKey)
      .send({ categoryIds: [category1.id, category2.id] })
      .expect(200)

    expect(response.body).toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({ id: category1.id }),
        expect.objectContaining({ id: category2.id }),
      ]),
      pagination: {
        page: 1,
        limit: 2,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      }
    })
  })
})
```

## Verification Checklist

When implementing this pattern, verify:

### Repository Layer:
- [ ] All array-returning methods return `PaginatedResult<T>`
- [ ] Pagination metadata is built in repository methods
- [ ] Count and data queries are optimized when possible
- [ ] Bounded operations use consistent pagination structure

### Service Layer:
- [ ] Services pass through repository results unchanged
- [ ] No pagination building logic in services
- [ ] Business rules applied before calling repository
- [ ] Service interfaces return `PaginatedResult<T>`

### Controller Layer:
- [ ] Data transformed using mappers
- [ ] Pagination structure preserved from service
- [ ] Responses validated against schemas
- [ ] No pagination building in controllers

### Schema Layer:
- [ ] List responses use `paginatedResponse()` helper
- [ ] Consistent pagination structure across tiers
- [ ] Response schemas validate pagination metadata

## Conclusion

The Repository Pagination Pattern is a fundamental architectural decision that:

1. **Follows Industry Standards**: Aligns with Spring Data, Django, Entity Framework patterns
2. **Maintains Clean Architecture**: Proper separation of concerns across layers
3. **Ensures Consistency**: Same pagination structure across all services and operations
4. **Optimizes Performance**: Repository layer can optimize queries and caching
5. **Provides Type Safety**: `PaginatedResult<T>` enforced at data boundaries
6. **Enables Maintainability**: Single place to modify pagination logic

**This pattern is mandatory for all Pika services and must be followed without deviation.**

---

## References

- **Clean Architecture** - Robert Martin
- **Domain-Driven Design** - Eric Evans  
- **Patterns of Enterprise Application Architecture** - Martin Fowler
- **Spring Data Pagination Documentation**
- **Django Pagination Best Practices**
- **Entity Framework Pagination Patterns**
- **Repository Pattern Implementation Guidelines**