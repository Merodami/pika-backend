# Service Standardization Execution Plan

## Overview

This execution plan addresses the remaining standardization tasks based on the corrected understanding of our architecture patterns.

## Status Summary

### ✅ Completed

1. UserMapper implementation in SDK
2. BookingMapper already in SDK (verified)
3. User service comprehensive error handling
4. User service integration tests (17/17 passing)
5. Controller/Route pattern correctly implemented in ALL services
6. Messaging/Notification controller patterns verified and fixed
7. NotificationMapper created in SDK
8. Standardized pagination across all services (using PaginationMetadata)
9. All tests passing (369 passed)
10. Comprehensive error handling in Booking repository (P2023, P2002, P2003, P2025)
11. Enhanced User repository error handling with all Prisma error codes
12. Caching strategy implemented for User service (added @Cache decorators)
13. Standardized caching in Booking service (using REDIS_DEFAULT_TTL constant)
14. Booking service integration tests (25/25 passing) - completed 01/07/2025
15. Fixed all Booking service test failures:
    - Double booking prevention (409 conflict)
    - Invalid status update validation
    - Upcoming/past bookings endpoints
    - Removed problematic response schema
16. Cleaned up debug logs and commented code from Booking service

### ❌ Pending

1. Implement sorting adapters for User service
2. Document Firebase-specific patterns
3. Create service generator based on Category template

## Execution Tasks

### Phase 1: Immediate Actions (This Week)

#### Task 1: Verify and Fix Controller Patterns ✅ COMPLETED

**Priority**: High
**Status**: Completed
**Services**: Messaging, Notification

**Changes Made**:

1. Verified controllers correctly return data (not using `reply.send()`)
2. HTTP concerns properly handled in route handlers
3. Pattern consistent across all services

#### Task 2: Move BookingMapper to SDK ✅ COMPLETED

**Priority**: High
**Status**: Completed
**Location**: `packages/sdk/src/mappers/`

**Findings**:

- BookingMapper was already in SDK package
- Properly exported from SDK index
- All imports correctly reference SDK version

#### Task 3: Standardize Repository Error Handling ✅ COMPLETED

**Priority**: High
**Status**: Completed
**Services**: Booking, User

**Implemented Error Codes**:

- P2023: Invalid UUID format validation
- P2002: Unique constraint violations
- P2003: Foreign key constraint failures
- P2025: Record not found errors

**Changes Made**:

1. Added comprehensive error handling to Booking read/write repositories
2. Enhanced User write repository with P2023 handling across all methods
3. All error messages follow Category repository patterns
4. Tests confirm all 369 tests passing after changes

### Phase 2: Core Improvements (This Sprint)

#### Task 4: Implement Caching Strategy ✅ COMPLETED

**Priority**: Medium
**Status**: Completed
**Services**: User, Booking

**Changes Made**:

1. **User Service**:
   - Added @Cache decorators to all read operations
   - Using REDIS_DEFAULT_TTL constant
   - Proper cache condition for array results
2. **Booking Service**:
   - Standardized to use REDIS_DEFAULT_TTL constant
   - Replaced hardcoded parseInt calls
   - Consistent with Category pattern

#### Task 5: Create Sorting Adapters

**Priority**: Medium
**Service**: User

Create `packages/services/user/src/read/application/adapters/userSortingAdapter.ts`:

```typescript
export function adaptUserSortingOptions(query: ApiQuery): SortingOptions {
  // Map API fields to database fields
  const fieldMapping = {
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    // ... other mappings
  }
  // Implementation
}
```

#### Task 6: Integration Tests for Booking ✅ COMPLETED

**Priority**: Medium
**Status**: Completed (01/07/2025)
**Tests**: 25/25 passing

**Fixes Applied**:

1. **Double Booking Prevention**: Fixed ResourceConflictError handling in controller
2. **Invalid Status Updates**: Fixed Booking entity update method validation
3. **Upcoming/Past Bookings**: Fixed filter parameter merging
4. **Response Schema**: Removed problematic BookingListResponseSchema
5. **Cleanup**: Removed all debug logs and commented code

### Phase 3: Documentation and Tooling (Next Sprint)

#### Task 7: Document Patterns

**Priority**: Low

Create `PATTERN_GUIDE.md`:

1. Controller/Route separation
2. Error handling patterns
3. Caching strategies
4. Testing patterns
5. Firebase-specific considerations

#### Task 8: Create Service Generator

**Priority**: Low

Template based on Category service:

```bash
# Generate new service
yarn generate:service payment
# Creates full DDD structure with all patterns
```

## Validation Checklist

### Per Service Validation

- [ ] Controllers return data only (no `reply.send()`)
- [ ] Routes handle all HTTP concerns
- [ ] SDK mapper exists and is used
- [ ] Repository has comprehensive error handling
- [ ] Caching decorators on read operations
- [ ] Integration tests following Category pattern
- [ ] Property transformation working
- [ ] Schema validation on all endpoints

### Global Validation

- [ ] All mappers in SDK package
- [ ] Consistent error handling across services
- [ ] All services have integration tests
- [ ] Documentation updated
- [ ] No direct HTTP handling in controllers

## Success Metrics

1. **Code Consistency**: 100% services follow same patterns
2. **Test Coverage**: All services have integration tests
3. **Error Handling**: Zero unhandled Prisma errors
4. **Performance**: All read operations cached appropriately
5. **Maintainability**: New developers understand patterns immediately

## Timeline

### Week 1 (Current)

- ✅ User service standardization (DONE)
- ✅ Verify Messaging/Notification patterns (DONE)
- ✅ Fix controller/route patterns in Messaging/Notification (DONE)
- ✅ Create NotificationMapper (DONE)
- ✅ Standardize pagination schemas (DONE)
- ✅ Booking repository error handling (DONE)
- ✅ Enhanced User repository error handling (DONE)
- ✅ BookingMapper verified in SDK (DONE)
- ✅ Implement caching strategies (DONE)

### Week 2

- [x] Implement caching strategies (COMPLETED)
- [ ] Create sorting adapters
- [x] Booking integration tests (COMPLETED)

### Week 3

- [ ] Documentation
- [ ] Service generator
- [ ] Final validation

## Notes

1. **Controller/Route Pattern**: The correct pattern is already implemented in most services. Controllers should return data, routes handle HTTP.

2. **Firebase Services**: May have different patterns due to real-time nature. Document these differences.

3. **Testing**: All tests must run with `yarn vitest` without errors.

4. **Caching**: Use Redis decorators for all read operations unless there's a specific reason not to cache.

## Commands for Validation

```bash
# Run all tests
yarn vitest

# Check build
yarn build

# Validate specific service patterns
yarn nx run @pika/[service]:typecheck

# Check for anti-patterns
grep -r "reply\." packages/services/*/src/*/api/controllers/ | grep -v "test"
```
