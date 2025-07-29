# Dashboard TODO Items

This file tracks TODO items that were added during code fixes and need to be addressed in future development.

## Voucher Management

### State Updates Implementation

**File**: `app/(dashboard)/business/vouchers/page.tsx`
**Lines**: 94-100

```typescript
// TODO: Implement bulk update for state changes
```

**Description**: The voucher state update functionality (publish/suspend) is currently disabled because the regular update endpoint doesn't support state changes. Need to implement this using the bulk update API.

**Required Changes**:

- Create a hook for bulk voucher updates (`useBulkUpdateVouchers`)
- Use `VoucherManagementService.patchVouchersBulkUpdate` with `BulkVoucherUpdateRequest`
- Update the `handleStatusUpdate` function to use the bulk API
- Handle single voucher state changes through the bulk endpoint

**Priority**: Medium
**Estimated Effort**: 2-3 hours

---

### Missing Hook Implementation

**File**: `app/(dashboard)/business/vouchers/page.tsx`
**Line**: 72

```typescript
// const updateVoucher = useUpdateVoucher() // TODO: Implement state updates with bulk API
```

**Description**: The `useUpdateVoucher` hook is commented out pending the bulk update implementation.

**Required Changes**:

- Uncomment and integrate with bulk update functionality
- Or create separate hooks for different types of updates (content vs state)

**Priority**: Medium
**Estimated Effort**: 1 hour

---

## API Error Handling

### Error Boundaries Integration

**File**: `components/providers/ApiErrorBoundary.tsx`
**Line**: 45

```typescript
// TODO: Send to error tracking service (e.g., Sentry)
```

**Description**: Error boundary catches errors but doesn't send them to an error tracking service.

**Required Changes**:

- Integrate with Sentry or similar error tracking service
- Add proper error context and user information
- Configure error filtering and sampling

**Priority**: Low
**Estimated Effort**: 2-4 hours

---

## API Client Configuration

### Token Refresh Implementation

**File**: `lib/api/client.ts` (referenced in API_ARCHITECTURE_ANALYSIS.md)
**Line**: 119

```typescript
// TODO: Check token expiry and refresh if needed
```

**Description**: The OpenAPI client configuration needs proper token refresh logic.

**Required Changes**:

- Implement token expiry checking
- Add automatic token refresh functionality
- Handle refresh failures gracefully

**Priority**: High
**Estimated Effort**: 4-6 hours

---

## Type System Issues

### SDK Type Consistency

**File**: `hooks/api/vouchers/useVouchers.ts`
**Lines**: 21-30

```typescript
// Type adapter to handle SDK inconsistencies
// The SDK returns actual objects with string literal state values
// but the AdminVoucherDetailResponse type uses enum namespaces
```

**Description**: This is a temporary fix for inconsistent OpenAPI code generation. The long-term solution requires fixing the code generation process.

**Required Changes**:

- Fix OpenAPI code generation to use consistent enum handling
- Remove type adapter workarounds
- Regenerate SDK with corrected types

**Priority**: Medium (Technical Debt)
**Estimated Effort**: 6-8 hours

---

## Summary

- **High Priority**: 1 item (Token refresh)
- **Medium Priority**: 3 items (Voucher state updates, type consistency)
- **Low Priority**: 1 item (Error tracking)

**Total Estimated Effort**: 15-24 hours

---

---

## TypeScript Quick Fixes (Temporary)

### AdminVoucherQueryParams Type Cast

**File**: `app/(dashboard)/business/vouchers/page.tsx`
**Line**: 64

```typescript
state: statusFilter as any, // TODO: Fix when AdminVoucherQueryParams properly uses string literals
```

**Description**: Type cast added because AdminVoucherQueryParams expects enum namespace but we have string literals after --useUnionTypes.

**Required Changes**:

- Update backend schemas to properly export string literal types
- Ensure SDK generation maintains consistency
- Remove type cast

**Priority**: Medium
**Estimated Effort**: 1 hour

---

### Unused useBusiness Hook

**File**: `hooks/api/businesses/useBusinesses.ts`
**Lines**: 47-50

```typescript
// TODO: Implement when single business endpoint is available in backend
// export function useBusiness(id: string, options?: { enabled?: boolean }) {
//   throw new Error('Single business endpoint not yet implemented')
// }
```

**Description**: Hook commented out because backend doesn't have a single business GET endpoint.

**Required Changes**:

- Backend team to implement GET /businesses/{id} endpoint
- Uncomment and implement the hook
- Add to businessAdapter

**Priority**: Low
**Estimated Effort**: 2 hours

---

### Unused queryClient Variable

**File**: `hooks/api/businesses/useBusinesses.ts`
**Line**: 75

```typescript
// TODO: Remove queryClient when not needed
// const queryClient = useQueryClient()
```

**Description**: queryClient declared but not used after refactoring.

**Required Changes**:

- Clean up after confirming invalidateQueries works without it

**Priority**: Low
**Estimated Effort**: 15 minutes

---

### InvalidateQueries Type Issue

**File**: `hooks/api/businesses/useBusinesses.ts`
**Line**: 84

```typescript
invalidateQueries: [queryKeys.businesses.lists()] as any, // TODO: Fix invalidateQueries type
```

**Description**: Type mismatch between readonly array and mutable array expected by mutation options.

**Required Changes**:

- Update useApiMutation type definitions to accept readonly arrays
- Or create proper mutable array type

**Priority**: Medium
**Estimated Effort**: 1 hour

---

### SuccessMessage Callback Type Mismatch

**File**: `hooks/api/businesses/useBusinesses.ts`
**Lines**: 98-101

```typescript
// TODO: Fix successMessage callback type - expects single parameter
successMessage: (_: any, variables: any) =>
  variables.verified
    ? 'Business verified successfully'
    : 'Business unverified' as any,
```

**Description**: successMessage callback expects single parameter but we're using two for conditional messages.

**Required Changes**:

- Update useApiMutation to properly type successMessage with variables parameter
- Or refactor to use single parameter pattern

**Priority**: Medium
**Estimated Effort**: 2 hours

---

## Summary Update

- **High Priority**: 1 item (Token refresh)
- **Medium Priority**: 7 items (Voucher state updates, type consistency, TypeScript fixes)
- **Low Priority**: 3 items (Error tracking, useBusiness hook, queryClient cleanup)

**Total Estimated Effort**: 21-31 hours

---

_Last Updated: 2025-07-29_
_Generated during TypeScript error fixes and architecture improvements_
