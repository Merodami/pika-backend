# Object Relation Patterns - Industry Standards Reference

## Overview

This document outlines the industry-standard approach for handling object relations in REST APIs, specifically addressing the pattern of returning complete objects versus just IDs and names when using include parameters.

## Current Anti-Pattern vs Industry Standard

### ❌ Current Anti-Pattern

```typescript
// Current implementation - returning partial object data
export const AdminStuff = {
  id: string,
  name: string,
  icon: string,
  type: StuffType,
  isActive: boolean,
  gymId: string, // Just the ID
  gymName: string, // Just the name
}
```

### ✅ Industry Standard Pattern

```typescript
// Industry standard - return complete object when included
export const AdminStuff = {
  id: string,
  name: string,
  icon: string,
  type: StuffType,
  isActive: boolean,
  gymId: string,        // Still keep the ID for direct reference
  gym?: Gym,           // Complete gym object when ?include=gym
}
```

## Industry Standards Analysis

### 1. JSON:API Specification

- **Spec**: [JSON:API Included Resources](https://jsonapi.org/format/#fetching-includes)
- **Pattern**: `?include=gym` returns complete gym object in response
- **Rationale**: Reduces round trips, provides complete data context

### 2. GraphQL Pattern

- **Pattern**: Field selection allows requesting nested objects
- **Example**: `{ stuff { id name gym { id name address } } }`
- **Rationale**: Client controls exactly what data is returned

### 3. REST API Best Practices

- **Principle**: Include parameters should return complete related objects
- **Benefits**:
  - Reduces N+1 query problems
  - Minimizes client round trips
  - Provides complete data context
  - Enables offline-first applications

### 4. Real-World Examples

#### Stripe API

```javascript
// ?expand=customer returns complete customer object
{
  id: "pi_123",
  amount: 2000,
  customer: {  // Complete customer object when expanded
    id: "cus_123",
    email: "user@example.com",
    name: "John Doe"
  }
}
```

#### GitHub API

```javascript
// ?include=owner returns complete owner object
{
  id: 123,
  name: "repo-name",
  owner: {  // Complete owner object when included
    id: 456,
    login: "username",
    avatar_url: "...",
    type: "User"
  }
}
```

## Implementation Strategy for Pika

### Phase 1: Update API Schemas

```typescript
// Add optional gym object to schemas that currently have gymId/gymName
export const AdminStuff = {
  // ... existing fields
  gymId: string,
  gym?: Gym,  // Complete gym object when ?include=gym
}
```

### Phase 2: Update Repository Layer

```typescript
// Update Prisma queries to conditionally include relations
const includeGym = parseIncludeParam(query.include, ['gym'])

const stuff = await prisma.stuff.findMany({
  include: {
    gym: includeGym.gym || false,
  },
})
```

### Phase 3: Update Mappers

```typescript
// Update mappers to handle complete gym objects
export class StuffMapper {
  static toDTO(domain: StuffDomain): StuffDTO {
    return {
      // ... existing fields
      gymId: domain.gymId,
      gym: domain.gym ? GymMapper.toDTO(domain.gym) : undefined,
    }
  }
}
```

## Benefits of This Pattern

### 1. Performance Benefits

- **Single Query**: Fetch related data in one request instead of multiple
- **Reduced Latency**: Eliminates additional round trips
- **Better Caching**: Complete objects can be cached more effectively

### 2. Developer Experience

- **Predictable API**: Follows industry standards developers expect
- **Flexible Data Loading**: Client controls what data is returned
- **Reduced Complexity**: No need for separate endpoints for related data

### 3. Frontend Benefits

- **Offline Support**: Complete objects enable better offline functionality
- **State Management**: Easier to manage complete objects in client state
- **Type Safety**: Better TypeScript support with complete object types

## Entities Affected in Pika

### Immediate Priority (Gym Service)

1. **Stuff/Equipment** - Currently has `gymId`/`gymName`, should include complete `gym` object
2. **Inductions** - Currently has `gymId`/`gymName`, should include complete `gym` object
3. **Hourly Prices** - Has `gymId`, should include complete `gym` object
4. **Special Prices** - Has `gymId`, should include complete `gym` object

### Secondary Priority (Other Services)

1. **Sessions** - Has `gymId`/`gymName`, should include complete `gym` object
2. **Social Activities** - May reference gyms, should include complete objects
3. **Payment Transactions** - May reference gyms for context

## Migration Strategy

### 1. Backwards Compatibility

- Keep existing `gymId`/`gymName` fields for backwards compatibility
- Add optional `gym` object field
- Gradually deprecate name fields in favor of complete objects

### 2. API Versioning

- Introduce in current API version as optional enhancement
- Make it the default behavior in next major version
- Provide clear migration path for clients

### 3. Performance Considerations

- Use database query optimization (proper indexing)
- Implement response caching for frequently accessed objects
- Consider pagination for large result sets with includes

## Implementation Checklist

### Database Layer

- [x] Verify proper foreign key relations exist (✓ Already implemented)
- [x] Ensure proper indexes for join queries (✓ Already implemented)

### API Schema Layer

- [ ] Update schemas to include optional complete objects
- [ ] Add include parameter support to query schemas
- [ ] Update response type definitions

### Repository Layer

- [ ] Update repository methods to support conditional includes
- [ ] Implement proper Prisma include logic
- [ ] Add performance monitoring for join queries

### Mapper Layer

- [ ] Update mappers to handle complete object transformations
- [ ] Ensure null/undefined handling for optional relations
- [ ] Add proper type safety for nested objects

### Controller Layer

- [ ] Update controllers to parse include parameters
- [ ] Ensure proper error handling for invalid includes
- [ ] Add response validation for complete objects

### Testing

- [ ] Add tests for include parameter functionality
- [ ] Test backwards compatibility with existing clients
- [ ] Performance tests for join queries

## Conclusion

**Yes, this is absolutely industry standard and should be applied.**

The pattern of returning complete objects when using include parameters is:

- ✅ **Industry Standard**: Used by major APIs (Stripe, GitHub, etc.)
- ✅ **Performance Beneficial**: Reduces round trips and improves efficiency
- ✅ **Developer Friendly**: Follows expected patterns and improves DX
- ✅ **Future Proof**: Enables better client-side state management and offline support

This should be implemented across all services where we currently have the `entityId`/`entityName` anti-pattern.
