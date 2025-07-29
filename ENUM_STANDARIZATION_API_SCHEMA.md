# Enum Standardization API Schema Process

## Objective

**Create a single source of truth for all enums in `@pika/types` that is used consistently across:**

1. Backend services (via direct imports)
2. API schemas (via Zod wrappers)
3. Frontend applications (via generated SDK with union types)

**No enum duplication anywhere in the codebase.**

## Problem Statement

### Current Issues:

1. **Enum Duplication**: Same enums defined in multiple places (`@pika/types`, API schemas, generated SDK)
2. **Type Mismatch**: Generated SDK creates namespace enums while API returns string literals
3. **Frontend Confusion**: Frontend doesn't know whether to use `@pika/types` or generated enums
4. **Maintenance Overhead**: Changing an enum requires updates in multiple places

### Root Cause:

The `openapi-typescript-codegen` tool generates namespace enums by default, creating duplicates of our `@pika/types` enums:

```typescript
// @pika/types (source of truth)
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  UNCONFIRMED = 'unconfirmed',
}

// Generated SDK (duplicate) - WRONG!
export namespace AdminBusinessResponse {
  export enum status {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    BANNED = 'banned',
    UNCONFIRMED = 'unconfirmed',
  }
}

// API actually returns string literals
{
  status: 'active'
} // Not AdminBusinessResponse.status.ACTIVE
```

## Solution Strategy

### 1. Enum Wrapping Pattern

Since `z.nativeEnum()` is deprecated in newer Zod versions, we use a custom utility:

```typescript
// packages/api/src/common/utils/zodEnum.ts
export function createZodEnum<T extends Record<string, string>>(enumObject: T): z.ZodEnum<[T[keyof T], ...T[keyof T][]]> {
  const values = extractEnumValues(enumObject)
  return z.enum(values)
}
```

**Service-specific enum files pattern**:

```typescript
// packages/api/src/schemas/[service]/common/enums.ts
import { VoucherBookStatus, VoucherBookType } from '@pika/types'
import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { openapi } from '../../../common/utils/openapi.js'

// Create Zod schemas with Schema suffix
export const VoucherBookStatusSchema = openapi(createZodEnum(VoucherBookStatus), {
  description: 'Voucher book status',
  example: VoucherBookStatus.DRAFT, // Use enum value, not string literal
})

export const VoucherBookTypeSchema = openapi(createZodEnum(VoucherBookType), {
  description: 'Voucher book type',
  example: VoucherBookType.MONTHLY, // Use enum value, not string literal
})
```

### 2. Use Union Types in SDK Generation

Update the SDK generation command to use `--useUnionTypes`:

```json
"generate:sdk": "cd frontend/dashboard && npx openapi-typescript-codegen --input ../../packages/api/generated/openapi/all-apis.json --output lib/api/generated --client axios --useOptions --exportSchemas true --useUnionTypes"
```

This generates:

```typescript
// Generated SDK with union types - CORRECT!
export type AdminBusinessResponse = {
  status: 'active' | 'suspended' | 'banned' | 'unconfirmed'
  // ...
}
```

### 2. Frontend Usage Pattern

```typescript
// Frontend imports enums from @pika/types
import { UserStatus } from '@pika/types'
import type { AdminBusinessResponse } from '@pika/sdk'

// Option A: Use enum constants (recommended)
const user: AdminBusinessResponse = {
  status: UserStatus.ACTIVE, // UserStatus.ACTIVE === 'active'
}

// Option B: Use string literals (also valid)
const user: AdminBusinessResponse = {
  status: 'active', // Direct string literal
}
```

### 3. API Schema Pattern

**Import Pattern**:

```typescript
// In schema files, import TypeScript enums directly from @pika/types
import { VoucherBookStatus, VoucherBookType } from '@pika/types'
import { openapi } from '../../../common/utils/openapi.js'

// In the same file or service-specific enum file, create Schema versions
export const VoucherBookStatusSchema = openapi(createZodEnum(VoucherBookStatus), {
  description: 'Voucher book status',
  example: VoucherBookStatus.DRAFT, // Use enum value
})
```

**Usage Pattern (UPDATED - STANDARDIZED)**:

```typescript
// STANDARDIZED APPROACH: Always use Schema versions for enum fields

// ✅ CORRECT - Import Schema versions from service enum file
import { VoucherBookStatusSchema, VoucherBookTypeSchema } from '../common/enums.js'

export const AdminVoucherBookResponse = openapi(
  withTimestamps({
    status: VoucherBookStatusSchema, // Already has description from schema
    bookType: VoucherBookTypeSchema, // Already has description from schema
  }),
  {
    description: 'Admin voucher book response',
  },
)

// ✅ CORRECT - Optional fields use the same Schema version
export const VoucherBookQueryParams = z.object({
  status: VoucherBookStatusSchema.optional().describe('Filter by status'),
})

// ❌ WRONG - Don't use raw TypeScript enums in schemas
export const BadExample = z.object({
  status: VoucherBookStatus, // Missing ability to add descriptions
  type: VoucherBookType.describe('Type'), // ERROR: Property 'describe' does not exist
})
```

**Simple Rule**: Always use Schema versions (with `Schema` suffix) for enum fields in API schemas

**About Descriptions**:

- Schema versions already include descriptions from the enum file
- Only add `.describe()` when you need context-specific clarification
- Most of the time, the description from the Schema is sufficient

```typescript
// ✅ PREFERRED - Use Schema as-is (already has description)
export const AdminResponse = z.object({
  status: VoucherBookStatusSchema, // Has "Voucher book status" description
  bookType: VoucherBookTypeSchema, // Has "Voucher book type" description
})

// ✅ Add .describe() only for context-specific needs
export const FilterParams = z.object({
  status: VoucherBookStatusSchema.optional().describe('Filter by book status (excludes archived)'),
  bookType: VoucherBookTypeSchema.optional(), // Generic description is fine
})
```

### 4. Handling Field Descriptions

Since TypeScript enums don't support `.describe()`, we have several options for documenting fields.

**Important**: The Schema versions in common/enums.ts have generic descriptions, but you often need context-specific descriptions in your schemas.

**Option 1: OpenAPI Metadata (Recommended for complex schemas)**

```typescript
export const AdminVoucherBookResponse = openapi(
  z.object({
    id: UUID,
    status: VoucherBookStatus, // No .describe() here
    bookType: VoucherBookType, // No .describe() here
  }),
  {
    description: 'Admin voucher book response',
    properties: {
      status: { description: 'Current status of the book' },
      bookType: { description: 'Type of voucher book' },
    },
  },
)
```

**Option 2: Inline Comments (Simple, but won't appear in OpenAPI)**

```typescript
export const AdminVoucherBookResponse = z.object({
  id: UUID,
  status: VoucherBookStatus, // Current status of the book
  bookType: VoucherBookType, // Type of voucher book
})
```

**Option 3: Use Schema version when description is critical (RECOMMENDED)**

```typescript
import { VoucherBookStatusSchema, VoucherBookTypeSchema } from '../common/enums.js'

export const DetailedResponse = z.object({
  // Use Schema versions to get .describe() capability
  status: VoucherBookStatusSchema.describe('Current status with full description'),
  bookType: VoucherBookTypeSchema.describe('Book type with detailed explanation'),
})
```

**Best Practice Summary (STANDARDIZED APPROACH)**:

Since we want to maintain descriptions but avoid using `.describe()` on TypeScript enums, here's the standardized pattern:

1. **For ALL enum fields**: Use the Schema version (with `Schema` suffix)
2. **Rationale**:
   - Maintains consistency across the codebase
   - Preserves ability to add descriptions
   - Supports all Zod methods (`.optional()`, `.describe()`, `.default()`)
   - Simplifies the mental model - one rule for all cases

```typescript
import { PageLayoutTypeSchema, ContentTypeSchema } from '../common/enums.js'

export const AdminPageResponse = z.object({
  // Always use Schema version for enums
  layoutType: PageLayoutTypeSchema.describe('Layout type for the page'),
  contentType: ContentTypeSchema.describe('Type of content'),

  // Optional fields also use Schema version
  defaultLayout: PageLayoutTypeSchema.optional(),
})
```

**Simple Rule**: Always import and use the Schema version for enum fields in API schemas.

## Completed Work

### ✅ Fixed Components

1. **Updated `@pika/types` enums**:
   - Added missing business-related enums (BusinessSortBy, BusinessStatusFilter, etc.)
   - Added missing user-related enums (UserSortBy, AdminUserSortBy, etc.)
   - Added missing category enums (CategorySortBy)

2. **Standardized Voucher Enums**:
   - File: `/packages/api/src/schemas/voucher/common/enums.ts`
   - Uses `createZodEnum()` utility with imports from `@pika/types`
   - Includes proper OpenAPI metadata with `VoucherStateSchema`, `VoucherDiscountTypeSchema`

3. **Standardized Business Enums**:
   - File: `/packages/api/src/schemas/business/common/enums.ts`
   - Uses `createZodEnum()` utility with imports from `@pika/types`
   - Includes `BusinessSortBySchema`, `BusinessStatusFilterSchema`, `AdminBusinessSortBySchema`

4. **Standardized User Enums**:
   - File: `/packages/api/src/schemas/user/common/enums.ts`
   - Uses `createZodEnum()` utility with imports from `@pika/types`
   - Includes `UserStatusSchema`, `UserRoleSchema`, `UserSortBySchema`, etc.

5. **Updated Shared Enums**:
   - File: `/packages/api/src/schemas/shared/enums.ts`
   - Changed from duplicate `z.enum()` definitions to `createZodEnum()` imports from `@pika/types`
   - Fixed UserStatus to include 'banned' value that was missing

6. **Fixed Schema Default Values**:
   - Updated business admin management to use `BusinessSortByEnum.BUSINESS_NAME` instead of `'businessName'`
   - Updated user admin management to use `AdminUserSortByEnum.CREATED_AT` instead of `'createdAt'`

7. **Registered Enum Schemas**:
   - File: `/packages/api/src/scripts/generators/admin-api.ts`
   - Added enum schema registrations: UserStatus, UserRole, BusinessSortBy, VoucherState, etc.
   - File: `/packages/api/src/scripts/generators/public-api.ts`
   - Added enum schema registrations for public API endpoints

8. **Fixed User Admin Management**:
   - File: `/packages/api/src/schemas/user/admin/management.ts`
   - Changed from Schema versions back to raw enums to prevent inlining: `UserRole` and `UserStatus`
   - Fixed default values to use enum constants: `UserRoleEnum.CUSTOMER`, `UserStatusEnum.UNCONFIRMED`
   - This prevents the enum from being inlined when used in `.optional()` schemas

## Current Status

### ✅ Working

- API generation succeeds (OpenAPI documents generated)
- Enum schemas properly registered in OpenAPI generators
- Build completes successfully
- OpenAPI JSON correctly generates enum arrays

### 🚧 Issue Identified

- `openapi-typescript-codegen` generates namespace enums instead of union types
- This creates type mismatches between API responses (string literals) and SDK types (namespace enums)
- Solution: Add `--useUnionTypes` flag to SDK generation

## Remaining Work

### 1. Update SDK Generation Command

Add `--useUnionTypes` flag to package.json:

```json
"generate:sdk": "cd frontend/dashboard && npx openapi-typescript-codegen --input ../../packages/api/generated/openapi/all-apis.json --output lib/api/generated --client axios --useOptions --exportSchemas true --useUnionTypes"
```

### 2. Fix Enum Property Access Patterns

**Files with Errors**:

- `/packages/api/src/schemas/auth/frontend/forms.ts:260` - `UserRole.business` → `UserRoleEnum.BUSINESS`
- `/packages/api/src/schemas/auth/frontend/forms.ts:261` - `UserStatus.unconfirmed` → `UserStatusEnum.UNCONFIRMED`
- `/packages/api/src/schemas/auth/public/oauth.ts:88,142,216` - `UserRole.enum.customer` → `UserRoleEnum.CUSTOMER`

**Pattern to Fix**:

```typescript
// OLD - Wrong pattern
role: UserRole.enum.customer
status: UserStatus.unconfirmed

// NEW - Correct pattern
role: UserRoleEnum.CUSTOMER
status: UserStatusEnum.UNCONFIRMED
```

**Required Changes**:

1. Import enum constants from `@pika/types`
2. Replace property access with enum constants
3. Update default values to use enum constants

### 2. Systematic File Updates

**Files importing from `shared/enums` that may need updates**:

- `/packages/api/src/schemas/category/admin/management.ts`
- `/packages/api/src/schemas/category/public/category.ts`
- `/packages/api/src/schemas/auth/frontend/forms.ts` ⚠️
- `/packages/api/src/schemas/auth/common/patterns.ts`
- `/packages/api/src/schemas/auth/public/oauth.ts` ⚠️
- `/packages/api/src/schemas/auth/public/login.ts`
- `/packages/api/src/schemas/pdf/admin/voucher-book.ts`
- `/packages/api/src/schemas/pdf/admin/page-management.ts`
- `/packages/api/src/schemas/pdf/internal/voucher-book.ts`
- `/packages/api/src/schemas/pdf/public/voucher-book.ts`
- `/packages/api/src/schemas/user/internal/service.ts`
- `/packages/api/src/schemas/user/public/profile.ts`
- `/packages/api/src/schemas/storage/admin/management.ts`
- `/packages/api/src/schemas/support/admin/tickets.ts`
- `/packages/api/src/schemas/support/public/comment.ts`

**Process for Each File**:

1. Check what enums are being used
2. Import enum constants from `@pika/types` if needed
3. Replace inline enum definitions with standardized Schema versions
4. Update property access patterns to use enum constants
5. Test compilation

### 3. Verification Steps

After fixing all files:

1. **Compile API Package**:

   ```bash
   yarn generate:api
   ```

2. **Generate SDK**:

   ```bash
   yarn generate:sdk
   ```

3. **Verify Enum Consistency**:
   - Check generated models use union types (not namespace enums)
   - Verify types match API responses (string literals)
   - Confirm frontend can use `@pika/types` enums with generated types

4. **Test Generated Types**:

   ```typescript
   // Frontend usage with @pika/types
   import { UserStatus, UserRole } from '@pika/types'
   import type { AdminBusinessResponse } from '@pika/sdk'

   const user: AdminBusinessResponse = {
     status: UserStatus.ACTIVE, // Works: 'active'
     role: UserRole.CUSTOMER, // Works: 'customer'
   }
   ```

### 4. Additional Cleanup (Lower Priority)

1. **Remove Duplicate Enum Definitions**:
   - Clean up any remaining duplicate enums in `/packages/api/src/schemas/shared/enums.ts`
   - Ensure all voucher-related enums use the voucher/common/enums versions
   - Consolidate category enums

2. **Update Service Response Schemas**:
   - Ensure service response schemas reference registered enum schemas via `$ref`
   - Verify no inline enum definitions remain in response schemas

3. **Documentation Updates**:
   - Update API documentation to reflect standardized enum usage
   - Add examples showing proper enum usage patterns

## Key Principles Established

1. **Single Source of Truth**: `@pika/types` package contains all enum definitions
2. **Consistent Wrapping**: Use `createZodEnum()` utility instead of deprecated `z.nativeEnum()`
3. **Naming Convention**:
   - TypeScript enums from `@pika/types`: Keep original names (e.g., `VoucherBookStatus`)
   - Zod schemas: Add `Schema` suffix (e.g., `VoucherBookStatusSchema`)
4. **Service-Specific Organization**: Each service has its own enum file in API schemas (e.g., `/schemas/pdf/common/enums.ts`)
5. **OpenAPI Metadata**: Create Schema versions with `.openapi()` for registration
6. **Nested Schema Pattern**: Use raw enums (not Schema versions) in nested schemas to prevent inlining
7. **Enum Constants**: Always use enum constants for defaults, never string literals
8. **Union Types**: Generate SDK with `--useUnionTypes` to match API responses
9. **Frontend Usage**: Import enums from `@pika/types`, types from `@pika/sdk`

## Success Criteria

✅ API generation succeeds without TypeScript errors
✅ SDK generation produces union types (not namespace enums)
✅ Generated types match API responses (string literals)
✅ Frontend can use `@pika/types` enums with generated SDK types
✅ No enum duplication in the codebase
✅ Single source of truth for all enums

## Next Immediate Steps

1. Update `package.json` to add `--useUnionTypes` flag to SDK generation
2. Regenerate SDK with union types
3. Verify generated types are string literal unions (not namespace enums)
4. Test that frontend can use `@pika/types` enums with generated types
5. Update frontend code to import enums from `@pika/types`

## Long-term Benefits

1. **No Duplication**: Enums defined once in `@pika/types`
2. **Type Safety**: Frontend gets compile-time checking with actual enum values
3. **Maintainability**: Change enum in one place, affects entire system
4. **Performance**: Union types have zero runtime cost (vs namespace enums)
5. **Developer Experience**: Clear where enums come from, better autocomplete

## Enum Organization Strategy

### New Structure in `@pika/types`

To maintain clarity and prevent a single massive enum file, enums are organized by service/domain:

```
packages/types/src/
├── enum.ts                    # Original file (backward compatibility)
├── enums/
│   ├── index.ts              # Central export point
│   ├── common.ts             # Shared enums (SortOrder, TimestampSortBy)
│   ├── voucher.ts            # All voucher-related enums
│   ├── pdf.ts                # PDF service enums
│   ├── user.ts               # User service enums
│   ├── business.ts           # Business service enums
│   ├── category.ts           # Category service enums
│   ├── payment.ts            # Payment service enums
│   ├── storage.ts            # Storage service enums
│   ├── support.ts            # Support/ticket service enums
│   └── communication.ts      # Communication service enums
```

### Migration Strategy

1. **Create Service-Specific Enum Files**:
   - Each service gets its own enum file in `packages/types/src/enums/`
   - Move related enums from the main `enum.ts` file
   - Keep backward compatibility by re-exporting from `enums/index.ts`

2. **Check Service Type Folders**:
   - Review each service's `types` folder (e.g., `packages/services/[service]/src/types/`)
   - Identify shared domain types that should move to `@pika/types`
   - Keep service-specific internal types in the service folder
   - Move only types that are used across services or by frontend

3. **Examples of Types to Move**:

   ```typescript
   // FROM: packages/services/user/src/types/domain.ts
   // TO: packages/types/src/user.ts (if shared across services)
   export interface UserProfile {
     id: string
     email: string
     // ... used by multiple services
   }

   // STAYS: packages/services/user/src/types/internal.ts
   interface UserRepositoryCache {
     // ... internal implementation detail
   }
   ```

### Service Enum Files to Create

1. **user.ts** - Move from enum.ts:
   - UserRole, UserStatus, UserSortBy, AdminUserSortBy
   - VerificationType, VerificationStatus, VerificationLevel
   - AdminNoteCategory, UserActivityCategory
   - ProfileVisibility, CreditOperation, AccountFlag

2. **business.ts** - Move from enum.ts:
   - BusinessSortBy, AdminBusinessSortBy, BusinessStatusFilter

3. **category.ts** - Move from enum.ts:
   - CategorySortBy

4. **payment.ts** - Create new file for:
   - PaymentStatus, PaymentType (currently in shared/enums.ts)

5. **storage.ts** - Move from enum.ts:
   - FileType, FileStatus, StorageProvider

6. **support.ts** - Move from enum.ts:
   - ProblemStatus, ProblemPriority, ProblemType

7. **communication.ts** - Move from enum.ts:
   - CommunicationChannel

### Guidelines for Type Migration

**Move to `@pika/types` when**:

- Type is used by multiple services
- Type is needed by frontend applications
- Type represents a domain concept (not implementation detail)
- Type is part of API contracts

**Keep in service when**:

- Type is internal implementation detail
- Type is only used within that service
- Type contains service-specific business logic
- Type is for internal caching or optimization

### Complete Implementation Example

Here's a full example of implementing the pattern for a service:

**Step 1: Define enums in @pika/types**

```typescript
// packages/types/src/enums/pdf.ts
export enum VoucherBookStatus {
  DRAFT = 'draft',
  READY_FOR_PRINT = 'ready_for_print',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum VoucherBookType {
  MONTHLY = 'monthly',
  SPECIAL_EDITION = 'special_edition',
  REGIONAL = 'regional',
}
```

**Step 2: Create Schema wrappers in service enum file**

```typescript
// packages/api/src/schemas/pdf/common/enums.ts
import { VoucherBookStatus, VoucherBookType } from '@pika/types'
import { openapi } from '../../../common/utils/openapi.js'
import { createZodEnum } from '../../../common/utils/zodEnum.js'

export const VoucherBookStatusSchema = openapi(createZodEnum(VoucherBookStatus), {
  description: 'Voucher book status',
  example: VoucherBookStatus.DRAFT,
})

export const VoucherBookTypeSchema = openapi(createZodEnum(VoucherBookType), {
  description: 'Voucher book type',
  example: VoucherBookType.MONTHLY,
})
```

**Step 3: Use in schema files**

```typescript
// packages/api/src/schemas/pdf/admin/voucher-book.ts
import { VoucherBookStatusSchema, VoucherBookTypeSchema } from '../common/enums.js'

export const AdminVoucherBookResponse = openapi(
  withTimestamps({
    id: UUID,
    title: z.string().max(255),
    status: VoucherBookStatusSchema, // Use Schema version
    bookType: VoucherBookTypeSchema, // Use Schema version
  }),
  {
    description: 'Admin voucher book response',
  },
)

export const VoucherBookQueryParams = z.object({
  status: VoucherBookStatusSchema.optional(),
  bookType: VoucherBookTypeSchema.optional(),
})
```

### Implementation Checklist

- [ ] Create enum files for each service in `packages/types/src/enums/`
- [ ] Move enums from main `enum.ts` to appropriate service files
- [ ] Create Schema wrappers using `createZodEnum()` in service enum files
- [ ] Replace all TypeScript enum usage in schemas with Schema versions
- [ ] Use enum values (not string literals) for examples
- [ ] Remove unnecessary `.describe()` calls where Schema already has description
- [ ] Update imports across the codebase
- [ ] Ensure backward compatibility via re-exports
- [ ] Document any breaking changes
