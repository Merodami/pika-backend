# Controller Response DTO Standardization Plan

## Executive Summary

This document defines the standardized approach for handling API responses across all microservices in the platform. It addresses the critical issue of controllers manually constructing responses instead of using properly defined DTOs from API schemas.

## Analysis Summary

### Current State Issues

After analyzing multiple service controllers, I found that controllers are incorrectly constructing responses manually instead of using the proper DTOs defined in the API schemas. This pattern violates several industry standards and creates significant technical debt.

### Problems Identified:

1. **Type Safety Violation**: Controllers bypass TypeScript's type system by manually constructing objects
2. **API Contract Violation**: Response types defined in OpenAPI schemas are ignored
3. **Maintenance Nightmare**: Changes to API schemas don't propagate to actual responses
4. **Inconsistent Data Transformation**: Manual construction leads to inconsistent field handling
5. **No Validation**: Responses aren't validated against the defined schemas
6. **Code Duplication**: Same response construction logic repeated across methods

## Industry Standard Pattern Analysis

### Pattern 1: Direct DTO Usage (Not Applicable)

The API schemas use Zod, which defines validation schemas, not TypeScript types directly. We cannot simply return these as responses.

### Pattern 2: Mapper Pattern (Current SDK Pattern)

The SDK provides mappers (e.g., `VoucherMapper.toDTO()`) that transform domain objects to DTOs. However, this pattern has limitations:

- Returns generic DTOs, not specific response types
- Doesn't handle response-specific fields (e.g., pagination, metadata)
- No validation against the actual API schema

### Pattern 3: Response Builder Pattern (Recommended)

Industry best practice for typed API responses with validation schemas.

## Recommended Solution: Response Builder Pattern

### Core Principles:

1. **Single Source of Truth**: API schemas define the contract
2. **Type Safety**: Full TypeScript support from schema to response
3. **Runtime Validation**: Responses validated against schemas
4. **Separation of Concerns**: Controllers handle HTTP, builders handle data transformation
5. **Schema Tier Alignment**: Response builders MUST use schemas from the correct API tier

### Implementation Pattern:

```typescript
// 1. Base Response Builder (in shared package)
export abstract class BaseResponseBuilder<TSchema, TDomain> {
  abstract build(domain: TDomain): TSchema

  buildList(domains: TDomain[], pagination?: Pagination): any {
    throw new Error('buildList must be implemented by subclass')
  }

  protected validate<T>(schema: ZodSchema<T>, data: unknown): T {
    return schema.parse(data)
  }
}

// 2. Service-Specific Builder Implementation
export class CategoryResponseBuilder extends BaseResponseBuilder<CategoryResponse, CategoryDomain> {
  build(domain: CategoryDomain): CategoryResponse {
    const response = {
      id: domain.id,
      nameKey: domain.nameKey,
      // ... map all fields according to CategoryResponse schema
    }

    return this.validate(CategoryResponse, response)
  }

  buildList(domains: CategoryDomain[], pagination: Pagination): CategoryListResponse {
    const response = {
      data: domains.map((domain) => this.build(domain)),
      pagination,
    }

    return this.validate(CategoryListResponse, response)
  }
}

// 3. Controller Usage
export class CategoryController {
  constructor(
    private readonly service: ICategoryService,
    private readonly responseBuilder: CategoryResponseBuilder,
  ) {}

  async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await this.service.getCategory(req.params.id)
      const response = this.responseBuilder.build(category)
      res.json(response) // Type-safe, validated response
    } catch (error) {
      next(error)
    }
  }
}
```

### Complete Example: Migrating a Controller Method

```typescript
// ❌ BEFORE - Manual Construction (WRONG)
async getAllItems(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await this.service.getAllItems(params)

    // Manual construction - NO TYPE SAFETY!
    res.json({
      data: result.data.map(item => ({
        id: item.id,
        name: item.name,
        // ... manually mapping fields
      })),
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}

// ✅ AFTER - Response Builder (CORRECT)
async getAllItems(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await this.service.getAllItems(params)

    // Type-safe, validated response
    const response = this.responseBuilder.buildList(
      result.data,
      result.pagination
    )
    res.json(response)
  } catch (error) {
    next(error)
  }
}
```

## Implementation Plan

### Phase 1: Create Response Builder Infrastructure

1. **Create Base Response Builder**
   - Location: `packages/shared/src/api/builders/ResponseBuilder.ts`
   - Generic interface for all response builders
   - Helper methods for common transformations

2. **Create Response Builder Factory**
   - Location: `packages/shared/src/api/builders/ResponseBuilderFactory.ts`
   - Factory pattern for creating service-specific builders
   - Dependency injection support

3. **Create Common Response Builders**
   - Location: `packages/shared/src/api/builders/common/`
   - `PaginatedResponseBuilder.ts` - For paginated responses
   - `BulkOperationResponseBuilder.ts` - For bulk operations
   - `ErrorResponseBuilder.ts` - For error responses

### Phase 2: Implement Service-Specific Builders

For each service, create response builders following this structure:

1. **Service Builder Structure**

   ```
   packages/services/[service-name]/src/builders/
   ├── [Service]ResponseBuilder.ts      # Public API responses
   ├── Admin[Service]ResponseBuilder.ts  # Admin API responses
   ├── Internal[Service]ResponseBuilder.ts # Internal API responses
   └── index.ts
   ```

2. **Naming Convention**
   - Public: `{Service}ResponseBuilder`
   - Admin: `Admin{Service}ResponseBuilder`
   - Internal: `Internal{Service}ResponseBuilder`

3. **CRITICAL: Import Schemas from Correct API Tier**

   ```typescript
   // ✅ CORRECT - Public builder uses public schemas
   import { voucherPublic } from '@pika/api'
   export class VoucherResponseBuilder extends BaseResponseBuilder<voucherPublic.VoucherResponse, VoucherDomain> {}

   // ✅ CORRECT - Admin builder uses admin schemas
   import { voucherAdmin } from '@pika/api'
   export class AdminVoucherResponseBuilder extends BaseResponseBuilder<voucherAdmin.AdminVoucherDetailResponse, VoucherDomain> {}

   // ✅ CORRECT - Internal builder uses internal schemas
   import { voucherInternal } from '@pika/api'
   export class InternalVoucherResponseBuilder extends BaseResponseBuilder<voucherInternal.GetVouchersByIdsResponse, VoucherDomain[]> {}

   // ❌ WRONG - Never mix schemas from different tiers!
   import { voucherPublic, voucherAdmin } from '@pika/api' // DON'T DO THIS!
   ```

4. **Schema Validation Example**
   ```typescript
   export class CategoryResponseBuilder extends BaseResponseBuilder<categoryPublic.CategoryResponse, CategoryDomain> {
     build(domain: CategoryDomain): categoryPublic.CategoryResponse {
       const response = {
         id: domain.id,
         // ... map fields according to CategoryResponse schema
       }
       // Validate against the PUBLIC schema
       return this.validate(categoryPublic.CategoryResponse, response)
     }
   }
   ```

### Phase 3: Update Controllers

1. **Inject Response Builders**

   ```typescript
   constructor(
     private readonly service: I{Service}Service,
     private readonly responseBuilder: {Service}ResponseBuilder
   ) {}
   ```

2. **Replace Manual Construction**

   ```typescript
   // Before
   res.json({
     data: result.data.map((item) => SomeMapper.toDTO(item)),
     pagination: result.pagination,
   })

   // After
   const response = this.responseBuilder.buildList(result.data, result.pagination)
   res.json(response)
   ```

3. **Controller Method Pattern**
   ```typescript
   async getItem(req: Request, res: Response, next: NextFunction): Promise<void> {
     try {
       const item = await this.service.getItem(req.params.id)
       const response = this.responseBuilder.build(item)
       res.json(response) // Fully typed and validated
     } catch (error) {
       next(error)
     }
   }
   ```

### Phase 4: Cleanup Legacy Code

1. **Remove Old Mapper Imports**

   ```typescript
   // ❌ Remove these imports from controllers
   import { SomeMapper } from '@pika/sdk'
   import { VoucherMapper } from '../mappers/VoucherMapper.js'
   ```

2. **Clean Up Unused DTOs**
   - Identify DTOs that are now handled by response builders
   - Remove `.toDTO()` methods that are no longer used
   - Keep mappers only if used for domain transformations (not API responses)

3. **Update Import Statements**

   ```typescript
   // Before
   import { VoucherMapper } from '@pika/sdk'
   import { someHelperFunction } from '../utils/helpers.js'

   // After - Only import what's still needed
   import { someHelperFunction } from '../utils/helpers.js'
   ```

### Phase 4: Validation & Testing

1. **Add Response Validation Middleware**
   - Validate all responses against their schemas
   - Log validation errors in development
   - Fail fast in tests

2. **Update Integration Tests**
   - Test response structure matches schemas
   - Test validation catches malformed responses

## Benefits

1. **Type Safety**: Full end-to-end type safety from database to API response
2. **Contract Compliance**: Responses always match OpenAPI schemas
3. **Maintainability**: Single place to update response transformations
4. **Developer Experience**: IntelliSense and compile-time errors
5. **Runtime Safety**: Validation catches issues before they reach clients
6. **Testability**: Easy to unit test response builders

## Migration Strategy

### Priority Order

1. **New Services First**: All new services MUST use response builders from day one
2. **High-Traffic Services**: Migrate services by traffic volume
3. **Complex Services**: Services with many endpoints should be migrated incrementally

### Service Migration Checklist

For each service migration:

- [ ] Create service-specific response builders
- [ ] Update controller constructor to inject builders
- [ ] Migrate public API endpoints
- [ ] Migrate admin API endpoints
- [ ] Migrate internal API endpoints
- [ ] Remove old mapper imports from controllers
- [ ] Delete unused `.toDTO()` methods
- [ ] Clean up redundant DTO types
- [ ] Update integration tests
- [ ] Verify no manual response construction remains
- [ ] Update service documentation

### Legacy Code Cleanup Checklist

When migrating a controller method:

1. **Before Starting**
   - [ ] Identify which mapper/DTO is currently being used
   - [ ] Note where it's imported from
   - [ ] Check if it's used elsewhere in the controller
   - [ ] Verify which API tier the endpoint belongs to (public/admin/internal)
   - [ ] Locate the corresponding response schema in `@pika/api`

2. **Schema Verification**
   - [ ] Confirm the response type matches the OpenAPI specification
   - [ ] Ensure using schema from correct tier:
     - Public endpoints → `import { servicePublic } from '@pika/api'`
     - Admin endpoints → `import { serviceAdmin } from '@pika/api'`
     - Internal endpoints → `import { serviceInternal } from '@pika/api'`
   - [ ] Check that all required fields are present in the schema
   - [ ] Verify optional fields are properly marked

3. **After Implementing Response Builder**
   - [ ] Remove the mapper import if no longer needed
   - [ ] Delete manual response construction code
   - [ ] Remove any inline DTO transformations
   - [ ] Clean up unused local variables
   - [ ] Ensure response builder validates against correct schema

4. **Final Verification**
   - [ ] Run TypeScript compiler to ensure no unused imports
   - [ ] Check that response structure hasn't changed
   - [ ] Verify response passes schema validation
   - [ ] Confirm API documentation is accurate
   - [ ] Verify all tests still pass

### Backward Compatibility

1. **Keep Existing Mappers**: Don't remove mappers until fully migrated
2. **Gradual Rollout**: Use feature flags if needed
3. **Monitor Metrics**: Track validation errors during migration

## Implementation Guidelines

### DO's:

- ✅ Always validate responses against schemas
- ✅ Use the base builder class for common functionality
- ✅ Create separate builders for each API tier (public/admin/internal)
- ✅ Include proper error handling in builders
- ✅ Write unit tests for each builder
- ✅ Import schemas from the correct API tier package

### DON'Ts:

- ❌ Don't manually construct response objects in controllers
- ❌ Don't bypass schema validation
- ❌ Don't mix response builders between API tiers
- ❌ Don't create "generic" builders that handle multiple response types
- ❌ Don't forget to handle nullable/optional fields
- ❌ Don't use admin schemas in public endpoints (security risk!)

### Common Mistakes to Avoid

```typescript
// ❌ WRONG - Public endpoint using admin schema
class VoucherController {
  // Public controller
  async getVoucher() {
    // This exposes admin-only fields to public users!
    return this.adminResponseBuilder.build(voucher)
  }
}

// ✅ CORRECT - Public endpoint using public schema
class VoucherController {
  // Public controller
  async getVoucher() {
    // Only exposes public fields
    return this.publicResponseBuilder.build(voucher)
  }
}

// ❌ WRONG - Mixing schemas in one builder
import { voucherPublic, voucherAdmin } from '@pika/api'
class MixedResponseBuilder {
  // DON'T DO THIS!
  buildPublic() {
    /* uses public schema */
  }
  buildAdmin() {
    /* uses admin schema */
  }
}

// ✅ CORRECT - Separate builders for each tier
// VoucherResponseBuilder.ts
import { voucherPublic } from '@pika/api'
export class VoucherResponseBuilder {
  /* only public schemas */
}

// AdminVoucherResponseBuilder.ts
import { voucherAdmin } from '@pika/api'
export class AdminVoucherResponseBuilder {
  /* only admin schemas */
}
```

## Success Metrics

- **Coverage**: 100% of endpoints using response builders
- **Type Safety**: 0 TypeScript errors related to responses
- **Validation**: <0.01% response validation errors in production
- **Developer Experience**: 50% reduction in response-related bugs
- **API Compliance**: 100% OpenAPI schema compliance

## Monitoring & Alerts

1. **Development**
   - Log validation errors with full details
   - Fail tests on validation errors

2. **Production**
   - Alert on validation error rate > 0.1%
   - Track response builder performance
   - Monitor response payload sizes

## Code Review Checklist

When reviewing controllers:

- [ ] Controller uses injected response builder
- [ ] No manual response object construction
- [ ] Response builder handles all response types for the endpoint
- [ ] Proper error handling in place
- [ ] Integration tests verify response structure
- [ ] Response builder is from correct API tier
- [ ] No data leakage between API tiers
- [ ] All responses are validated against schemas

## Troubleshooting Guide

### Common Issues and Solutions

1. **"Response validation failed" errors**
   - Check that all required fields are included in the response
   - Verify date formats are ISO 8601 strings
   - Ensure nullable fields are `undefined` not `null` if schema expects it

2. **TypeScript compilation errors**
   - Verify response builder generic types match schema types
   - Check that schema imports are from correct tier
   - Ensure all schema types are properly exported

3. **"Method not implemented" errors**
   - Override `buildList` method if handling paginated responses
   - Implement all abstract methods from base class

4. **Performance issues**
   - Use `transformArray` helper for large collections
   - Consider implementing response caching for expensive transformations
   - Monitor builder metrics in production

## Migration Examples

### Example 1: Simple GET endpoint

```typescript
// Before
async getItem(req: Request, res: Response) {
  const item = await this.service.getItem(req.params.id)
  res.json({
    id: item.id,
    name: item.name,
    // manual mapping...
  })
}

// After
async getItem(req: Request, res: Response) {
  const item = await this.service.getItem(req.params.id)
  const response = this.responseBuilder.build(item)
  res.json(response)
}
```

### Example 2: Paginated endpoint

```typescript
// Before
async getItems(req: Request, res: Response) {
  const result = await this.service.getItems(params)
  res.json({
    data: result.data.map(item => ({
      id: item.id,
      // manual mapping...
    })),
    pagination: result.pagination
  })
}

// After
async getItems(req: Request, res: Response) {
  const result = await this.service.getItems(params)
  const response = this.responseBuilder.buildList(result.data, result.pagination)
  res.json(response)
}
```

### Example 3: Complex nested response

```typescript
// Before
async getItemWithRelations(req: Request, res: Response) {
  const item = await this.service.getItemWithRelations(req.params.id)
  res.json({
    id: item.id,
    name: item.name,
    category: item.category ? {
      id: item.category.id,
      name: item.category.name
    } : null,
    tags: item.tags.map(tag => ({
      id: tag.id,
      name: tag.name
    }))
  })
}

// After
async getItemWithRelations(req: Request, res: Response) {
  const item = await this.service.getItemWithRelations(req.params.id)
  const response = this.responseBuilder.build(item) // Builder handles all nested transformations
  res.json(response)
}
```

## Error Response Handling

### Consistent Error Responses

Response builders should NOT handle error responses. Errors should be handled by the global error middleware to ensure consistency:

```typescript
// ❌ WRONG - Don't handle errors in response builder
class ItemResponseBuilder {
  buildError(error: Error) {
    return { error: error.message } // DON'T DO THIS
  }
}

// ✅ CORRECT - Let error middleware handle it
async getItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await this.service.getItem(req.params.id)
    const response = this.responseBuilder.build(item)
    res.json(response)
  } catch (error) {
    next(error) // Pass to error middleware
  }
}
```

### Response Builder Responsibilities

Response builders are ONLY responsible for successful responses:

- ✅ 2xx responses (200 OK, 201 Created, etc.)
- ❌ 4xx/5xx error responses (handled by error middleware)

## Testing Response Builders

### Unit Test Template

```typescript
describe('ItemResponseBuilder', () => {
  const builder = new ItemResponseBuilder()

  it('should build valid response', () => {
    const domain = createMockDomain()
    const response = builder.build(domain)

    // Verify structure
    expect(response).toMatchObject({
      id: domain.id,
      // ... other fields
    })

    // Verify schema validation passes
    const validated = itemPublic.ItemResponse.parse(response)
    expect(validated).toBeDefined()
  })

  it('should handle null/undefined correctly', () => {
    const domain = { ...createMockDomain(), optionalField: null }
    const response = builder.build(domain)

    expect(response.optionalField).toBeUndefined() // Not null!
  })
})
```

### Integration Test Verification

```typescript
it('should return properly formatted response', async () => {
  const response = await request(app).get('/items/123').expect(200)

  // Verify response matches schema
  const validated = itemPublic.ItemResponse.parse(response.body)
  expect(validated.id).toBe('123')
})
```

## Performance Considerations

### Optimization Tips

1. **Lazy Loading**: For expensive transformations, consider lazy evaluation
2. **Memoization**: Cache transformed results for repeated calls
3. **Batch Processing**: Use `transformArray` for efficient collection handling
4. **Selective Inclusion**: Only transform requested fields (when using `include` params)

```typescript
// Example: Optimized builder with selective transformation
build(domain: ItemDomain, options?: { include?: string[] }): ItemResponse {
  const response: any = {
    id: domain.id,
    name: domain.name,
    // Always included fields
  }

  // Only transform relations if requested
  if (options?.include?.includes('category')) {
    response.category = this.transformCategory(domain.category)
  }

  return this.validate(ItemResponse, response)
}
```

## Future Enhancements

Consider these patterns for future iterations:

1. **Response Builder Middleware**: Automatically inject builders based on route
2. **Schema-First Generation**: Generate builders from OpenAPI schemas
3. **Response Compression**: Built-in support for response compression
4. **Field-Level Security**: Automatic field filtering based on user permissions
5. **Response Caching**: Integrated caching at the builder level

## Conclusion

Manual response construction is a critical anti-pattern that undermines type safety, API contracts, and maintainability. The Response Builder pattern provides a scalable, type-safe solution that ensures consistency across all services. This standardization is mandatory for all services moving forward.

By following this guide, we ensure:

- 🔒 **Security**: No accidental data exposure
- 📋 **Consistency**: Uniform responses across all endpoints
- 🎯 **Type Safety**: Full compile-time and runtime validation
- 🚀 **Performance**: Optimized transformation logic
- 🧪 **Testability**: Easy to test and verify
- 📚 **Maintainability**: Single source of truth for responses
