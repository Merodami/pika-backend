# Quick Task: Standardize Schema Sorting Patterns

## Summary

The API schemas currently use inconsistent patterns for sorting parameters. This document outlines the standardization needed.

## Standard Pattern (TARGET)

- **Field Names**: `sortBy` + `sortOrder` (NOT `sort` + `order`)
- **Enum Values**: `ASC`/`DESC` (NOT `asc`/`desc`)
- **Common Enum**: Use `SortOrder` from `../common/schemas/enums.js`
- **Service-Specific**: Create service-specific enums for `sortBy` fields (e.g., `AdminTicketSortBy`, `ProblemSortBy`)

## Current Issues Found

### 1. Files using `sort` + `order` instead of `sortBy` + `sortOrder`:

- `/admin/schemas/payment/transactions.ts` (3 occurrences)
- `/public/schemas/payment/credit.ts` (2 occurrences)
- `/public/schemas/payment/promoCode.ts`
- `/public/schemas/stuff/stuff.ts`
- `/public/schemas/social/parameters.ts`
- `/public/schemas/social/friend.ts`
- `/public/schemas/social/interaction.ts`
- `/public/schemas/communication/template.ts`
- `/public/schemas/communication/email.ts`
- `/public/schemas/communication/communicationLog.ts`
- `/public/schemas/communication/notification.ts`
- `/public/schemas/session/session.ts` (3 occurrences)
- `/public/schemas/session/booking.ts` (2 occurrences)

### 2. Files using lowercase `asc`/`desc` instead of uppercase `ASC`/`DESC`:

- `/admin/schemas/subscription/management.ts`
- `/admin/schemas/gym/stuff.ts`
- `/admin/schemas/session/management.ts`
- `/common/schemas/pagination.ts`
- `/public/schemas/storage/file.ts`
- `/public/schemas/gym/induction.ts`
- `/public/schemas/gym/gym.ts`
- `/public/schemas/session/waitingList.ts`
- `/public/schemas/communication/communicationLog.ts`
- `/public/schemas/session/session.ts`
- `/public/schemas/session/booking.ts`
- `/public/schemas/stuff/stuff.ts`
- `/public/schemas/social/parameters.ts`
- `/public/schemas/payment/credit.ts`

## Action Plan

1. **Update all schemas** to use `sortBy` + `sortOrder` field names
2. **Replace all enum values** with uppercase `ASC`/`DESC`
3. **Import SortOrder** from `../common/schemas/enums.js` instead of defining inline
4. **Create service-specific** `SortBy` enums in appropriate enum files
5. **Update the common query utility** to use the shared SortOrder enum (already done)

## Example Fix

### Before:

```typescript
sort: z.enum(['CREATED_AT', 'UPDATED_AT']).default('CREATED_AT'),
order: z.enum(['asc', 'desc']).default('desc'),
```

### After:

```typescript
import { SortOrder } from '../../../common/schemas/enums.js'
import { PaymentSortBy } from './enums.js' // service-specific enum

sortBy: PaymentSortBy.default('CREATED_AT'),
sortOrder: SortOrder.default('DESC'),
```

## Common SortOrder Enum Location

The shared `SortOrder` enum is now available at:

- Path: `/packages/api/src/common/schemas/enums.ts`
- Usage: `import { SortOrder } from '../../../common/schemas/enums.js'`
- Definition: `z.enum(['ASC', 'DESC'])`
