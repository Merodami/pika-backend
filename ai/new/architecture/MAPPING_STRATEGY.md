# Mapping Strategy: SDK as the Central Authority

## Deep Analysis of Category Ecosystem

### Database Schema (Prisma)

The Category model in the database uses:

- JSON fields for multilingual text (`name` and `description`)
- Self-referential relationships for parent-child hierarchy
- Snake_case field naming convention (e.g., `icon_url`)

```prisma
model Category {
  id              String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            Json              // JSONB for multilingual names
  description     Json              // JSONB for multilingual descriptions
  iconUrl         String?           @map("icon_url")
  // ... other fields
}
```

### API Schema Definition

The API package defines category schemas using TypeBox:

- Uses `Type.Any()` for multilingual fields to avoid validation issues
- Maintains snake_case naming convention for API compatibility
- Includes specialized schemas for different operations (create, update, search)

```typescript
export const CategorySchema = Type.Object({
  id: UUIDSchema,
  name: createMultilingualField(100), // Uses Type.Any() for flexibility
  description: createMultilingualField(1000),
  // ... other fields
})
```

### Content Negotiation in API

The API package supports language selection via:

- Accept-Language header (primary method)
- `lang` query parameter (secondary method)
- Language options in OpenAPI definition

```typescript
export const CategoryLanguage: OpenAPIV3.ParameterObject = {
  name: 'lang',
  in: 'query',
  required: false,
  description: 'Language code for category names/descriptions',
  schema: {
    type: 'string',
    enum: ['es', 'en', 'gn'],
    default: 'es',
  },
}
```

### Current Mapping Flow in Category/Read Service

After deep analysis of all components, I've identified the following mapping flow:

```
Database Record (Prisma)
  → mapCategoryToDTO (CategoryDocToCodec.ts)
    → CategoryDTO
      → CategoryMapper.toDTO (application/mappers/categoryMapper.ts)
        → API Response
```

Key observations:

1. **Redundant Mapping Layers**:
   - Database to DTO mapping occurs in `CategoryDocToCodec.ts`
   - DTO to API response mapping occurs in the controller and application mapper
   - Similar logic exists in SDK's CategoryMapper

2. **Type Discrepancies**:
   - Service domain defines `MultilingualText` without index signature
   - SDK defines `MultilingualText` with index signature
   - This creates type incompatibilities when using SDK mappers

3. **Repository Tight Coupling**:
   - Repository directly depends on the domain mapper
   - This means we can't easily swap out mappers without changing repository code

4. **Data Flow Complexity**:
   - Traverses multiple layers needlessly (DB → Document → DTO → Entity → DTO → API)
   - Introduces many opportunities for inconsistencies and bugs

5. **Multilingual Text Handling**:
   - Handled inconsistently across layers
   - Response language preferences managed in controllers

## Mapping Touchpoints

The following components touch or depend on mapping functionality:

1. **Repository Layer**:

   ```typescript
   // Uses mapping in data retrieval
   const data = categories.map((category: any) => mapCategoryToDTO(category))
   ```

2. **Controller Layer**:

   ```typescript
   // Maps domain entity to API DTO
   return CategoryMapper.toDTO(category)
   ```

3. **Application Use Cases**:
   - Pass through DTOs without transformation
   - Rely on the repository to provide properly formatted DTOs

4. **Domain Definitions**:
   - Define the interfaces used in mapping (CategoryDTO, MultilingualText)
   - Define Entity methods for getting localized text

## Proposed Solution: SDK-Centric Mapping

Based on this analysis, I propose a comprehensive mapping strategy that centralizes all mapping in the SDK package:

### 1. Universal Type System

Define a single, comprehensive type system in the SDK:

```typescript
// @pika/sdk/src/types/index.ts
export interface MultilingualText {
  es: string
  en?: string
  gn?: string
  [key: string]: string | undefined
}

// Layer-specific data models
export interface DatabaseCategory {
  /* snake_case db fields */
}
export interface DomainCategory {
  /* domain entity fields */
}
export interface ApiCategory {
  /* API response fields */
}
```

### 2. Unidirectional Data Flow

Establish a clear, unidirectional flow of data between layers:

```
Database → Domain Entity → API Response
```

Each transformation is handled by a single function in the SDK mapper:

```typescript
// @pika/sdk/src/mappers/CategoryMapper.ts
export class CategoryMapper {
  // Primary mapping functions
  static fromDatabase(dbRecord: any): DomainCategory { ... }
  static toApi(domain: DomainCategory, language?: string): ApiCategory { ... }

  // Utility functions
  static localize(entity: DomainCategory, language: string): DomainCategory { ... }
}
```

### 3. Importing vs. Adapting

Services have two options to use the SDK mappers:

**Option A: Direct Import (Preferred)**

```typescript
// Repository
import { CategoryMapper } from '@pika/sdk'
const entity = CategoryMapper.fromDatabase(dbRecord)
```

**Option B: Local Adapter (Legacy Support)**

```typescript
// Local adapter that uses the SDK mapper
export function mapCategoryToDTO(doc: CategoryDocument): CategoryDTO {
  const sdkEntity = CategoryMapper.fromDatabase(doc)
  return {
    // Map SDK entity to local DTO format
    id: sdkEntity.id,
    // ...other fields
  }
}
```

### 4. Repository Changes

Update the repository to use the SDK mapper directly:

```typescript
// PrismaCategoryReadRepository.ts
import { CategoryMapper } from '@pika/sdk'

// In getAllCategories method
const data = categories.map((category: any) => CategoryMapper.fromDatabase(category))

// In getCategoryById method
return CategoryMapper.fromDatabase(category)
```

### 5. Controller Changes

Update controllers to use the SDK mapper for API responses:

```typescript
// CategoryController.ts
import { CategoryMapper } from '@pika/sdk'

// In response handling
const apiResponse = CategoryMapper.toApi(entity, request.language)
return apiResponse
```

### 6. Specific Code Changes

1. **CategoryDocToCodec.ts**:
   - Replace with direct SDK CategoryMapper usage in repository
   - Alternatively, thin adapter to SDK mapper if needed

2. **application/mappers/categoryMapper.ts**:
   - Remove entirely and use SDK mapper directly
   - Alternatively, thin adapter to SDK mapper if needed

3. **CategoryDTO.ts and Entity**:
   - Update to use or extend SDK types
   - Or add type compatibility for SDK types

## Detailed Implementation Plan

### Phase 1: Align Type System

1. **Update SDK MultilingualText**:
   - Ensure it's compatible with all uses
   - Re-export from a central location

2. **Update Domain Types**:
   - Make domain entity types compatible with SDK types

### Phase 2: Implement Primary SDK Mapper

1. **Complete CategoryMapper in SDK**:
   - Handle all mapping cases in one class
   - Include thorough documentation

2. **Test SDK Mapper Functions**:
   - Ensure they work with all layer-specific formats
   - Validate language handling

### Phase 3: Integration with Service

1. **Update Repository Implementation**:
   - Use SDK mapper for database to domain transformation

2. **Update Controllers**:
   - Use SDK mapper for domain to API transformation

3. **Remove Redundant Mappers**:
   - Delete or simplify service-level mappers

### Phase 4: Testing and Validation

1. **Unit Testing**:
   - Test all mapper functions independently

2. **Integration Testing**:
   - Verify complete flow from DB to API

3. **Language Handling Validation**:
   - Test multilingual content with different language settings

## Benefits

1. **Single Source of Truth**: All mapping logic in one place
2. **Type Safety**: Consistent type system across all layers
3. **Reduced Code**: Elimination of redundant mapping code
4. **Better Maintainability**: Changes to mapping logic happen in one place
5. **Simplified Service Code**: Services focus on business logic, not mapping
6. **Improved Developer Experience**: Clear understanding of mapping logic

## Challenges and Mitigations

1. **Challenge**: Type compatibility across layers
   **Mitigation**: Use type intersections/unions for compatibility

2. **Challenge**: Migration complexity for existing code
   **Mitigation**: Phased approach with adapter functions

3. **Challenge**: Testing mapping functions thoroughly
   **Mitigation**: Comprehensive test suite with varied inputs

## Additional Considerations

### Database Seeding

The category seeding process demonstrates how multilingual content is structured when inserted into the database:

```typescript
// From category-seed.ts
await prisma.category.create({
  data: {
    name: {
      en: categoryName,
      es: `${categoryName} (ES)`,
      gn: `${categoryName} (GN)`,
    },
    description: {
      en: faker.commerce.productDescription(),
      es: faker.lorem.paragraph(),
      gn: `${faker.lorem.words(3)} guarani ${faker.lorem.paragraph(1)}`,
    },
    // ... other fields
  },
})
```

This confirms the expected multilingual structure for all created categories.

### API Validation Flexibility

The API package intentionally uses a flexible approach for multilingual fields:

```typescript
// Simple non-validating multilingual field schema
const createMultilingualField = (maxLength: number, _unused = true) => {
  // Use a "mixed" type that can be either an object or a string
  return Type.Any()
}
```

This flexibility means our mapper needs to handle both formats:

1. String values (for localized content)
2. Object values (for full multilingual content)

## Summary

By centralizing all mapping logic in the SDK, we create a more maintainable, consistent, and efficient codebase. This approach aligns with DDD principles by keeping domain logic separate from infrastructure concerns, while also providing a clean API for services to consume.

The strategy can be implemented incrementally, starting with type alignment and gradually replacing service-specific mappers with SDK mappers. This ensures minimal disruption to existing functionality while moving toward a more sustainable architecture.

To fully support the project's design:

1. The unified mapper must handle both multilingual objects and localized strings
2. Support the API's flexible validation approach
3. Align with the database schema's JSON structure
4. Provide clear methods for language negotiation
