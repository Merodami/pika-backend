# Fix All Paths - Import Conversion Guide

This document provides a comprehensive analysis of all relative imports in the codebase that need to be converted to proper aliased paths using TypeScript path mappings.

## Path Mappings - Standardized Approach

**IMPORTANT:** Use ONLY the shorter aliases. The `@pika/` prefix should be removed from tsconfig.json for consistency.

### Core Packages (Use these aliases)
- `@shared/*` → `packages/shared/src/*`
- `@api/*` → `packages/api/src/*`
- `@types/*` → `packages/types/src/*`
- `@sdk/*` → `packages/sdk/src/*`
- `@api-gateway/*` → `packages/api-gateway/src/*`
- `@database/*` → `packages/database/src/*`
- `@redis/*` → `packages/redis/src/*`
- `@http/*` → `packages/http/src/*`
- `@auth/*` → `packages/auth/src/*`
- `@tests/*` → `packages/tests/src/*`
- `@environment/*` → `packages/environment/src/*`

### Service Packages (Need shorter aliases)
Current (to be updated):
- `@pika/user` → Should be: `@user/*`
- `@pika/auth-service` → Should be: `@auth-service/*`
- `@pika/subscription` → Should be: `@subscription/*`
- `@pika/payment` → Should be: `@payment/*`
- `@pika/communication` → Should be: `@communication/*`
- `@pika/support` → Should be: `@support/*`
- `@pika/storage` → Should be: `@storage/*`

### Missing Service Mappings (Need to be added to tsconfig.json)
```json
"@user/*": ["packages/services/user/src/*"],
"@auth-service/*": ["packages/services/auth/src/*"],
"@subscription/*": ["packages/services/subscription/src/*"],
"@payment/*": ["packages/services/payment/src/*"],
"@communication/*": ["packages/services/communication/src/*"],
"@support/*": ["packages/services/support/src/*"],
"@storage/*": ["packages/services/storage/src/*"],
"@business/*": ["packages/services/business/src/*"],
"@category/*": ["packages/services/category/src/*"],
"@pdf/*": ["packages/services/pdf/src/*"],
"@voucher/*": ["packages/services/voucher/src/*"]
```

### Aliases to Remove from tsconfig.json
All `@pika/` prefixed aliases should be removed:
- `@pika/shared`, `@pika/api`, `@pika/types`, `@pika/sdk`, etc.
- `@pika/user`, `@pika/auth-service`, `@pika/subscription`, etc.

## Files with Relative Imports

Total files found with relative imports: **324 files**

## Import Patterns by Package Type

### 1. Service Internal Imports (Need Conversion)

These are imports within a service that reference other files in the same service. They should be converted to use service aliases.

#### Pattern: `../repositories/`, `../services/`, `../controllers/`, etc.

**Example Files:**
- `packages/services/business/src/services/BusinessService.ts`
  - Current: `import { ... } from '../repositories/BusinessRepository.js'`
  - Should be: `import { ... } from '@business/repositories/BusinessRepository.js'` (after adding alias)

- `packages/services/communication/src/services/EmailService.ts`
  - Current: `import { ... } from '../repositories/CommunicationLogRepository.js'`
  - Should be: `import { ... } from '@pika/communication/repositories/CommunicationLogRepository.js'`

**Recommendation:** ⚠️ CONVERT TO ALIASES - Use service-specific aliases for all imports.

### 2. Test File Imports

Test files importing from their service's source files should also use aliases.

#### Pattern: `../../server.js`, `../helpers/`

**Example Files:**
- `packages/services/business/src/test/integration/business.internal.integration.test.ts`
  - Current: `import { createBusinessServer } from '../../server.js'`
  - Should be: `import { createBusinessServer } from '@business/server.js'` (after adding alias)

**Recommendation:** ⚠️ CONVERT TO ALIASES - Use service aliases for test imports.

### 3. Cross-Package Imports (Already Being Fixed)

These are imports that go across package boundaries using the shorter aliases.

#### Files Already Using Correct Shorter Aliases
- Files using `@shared/*`, `@api/*`, `@http/*`, `@tests/*` - These are correct!

### 4. API Schema Imports

API schema files importing from other schema directories should use `@api/` prefix.

#### Pattern: `../shared/`, `../common/`, etc.

**Example Files:**
- `packages/api/src/schemas/user/internal/service.ts`
  - Current: `import { ... } from '../common/parameters.js'`
  - Should be: `import { ... } from '@api/schemas/user/common/parameters.js'`

**Recommendation:** ⚠️ CONVERT TO ALIASES - Use `@api/` prefix for all API imports.

## Priority Files to Fix

### High Priority (Files Using Incorrect Aliases)

These files are using aliases but need to be updated to use the correct pattern:

#### 1. Shared Package Files (Already using `@shared` - Correct!)
- `packages/shared/src/infrastructure/storage/providers/BaseFileStorage.ts` ✅
- `packages/shared/src/infrastructure/storage/providers/S3FileStorage.ts` ✅
- `packages/shared/src/infrastructure/storage/providers/LocalFileStorage.ts` ✅
- `packages/shared/src/infrastructure/health/systemCheck.ts` ✅
- `packages/shared/src/infrastructure/health/HealthCheck.ts` ✅

#### 2. HTTP Package Files (Already using `@http` - Correct!)
- `packages/http/src/application/api/server.ts` ✅

#### 3. API Package Files (Already using `@api` - Correct!)
- `packages/api/src/scripts/generators/internal-api.ts` ✅

#### 4. Test Package Files (Already using `@tests` - Correct!)
- `packages/services/storage/src/test/integration/e2e/storage-s3.integration.test.ts` ✅
- `packages/services/support/src/test/integration/e2e/support.integration.test.ts` ✅
- `packages/tests/src/integration/auth-e2e.test.ts` ✅

### Files That Need Conversion from Relative to Aliases

1. **All service files using relative imports within their package:**
   - Business service: ~20 files
   - Communication service: ~25 files
   - Category service: ~15 files
   - PDF service: ~20 files
   - Voucher service: ~25 files
   - And all other services...

2. **Auth package files:**
   - `packages/auth/src/adapters/UserServiceAdapter.ts`
   - `packages/auth/src/adapters/UserMapper.ts`
   - Other auth package files using relative imports

## Conversion Rules

### Rule 1: Use Shorter Aliases When Available
- For core packages, use `@shared`, `@api`, `@auth`, etc.
- For services without short aliases yet, use `@pika/service-name`

### Rule 2: All Imports Should Use Aliases
- No more relative imports (`../`, `./`)
- Even imports within the same package should use the package alias

### Rule 3: Consistent Pattern
- Always include the `.js` extension (ESM requirement)
- Use the full path from the package root

## Conversion Examples

### Example 1: Service Internal Import
```typescript
// ❌ BEFORE (relative import)
import { BusinessRepository } from '../repositories/BusinessRepository.js'
import type { BusinessSearchParams } from '../types/search.js'

// ✅ AFTER (with new alias)
import { BusinessRepository } from '@business/repositories/BusinessRepository.js'
import type { BusinessSearchParams } from '@business/types/search.js'
```

### Example 2: Cross-Package Import
```typescript
// ❌ BEFORE (relative or long alias)
import { ErrorFactory } from '@pika/shared'

// ✅ AFTER (shorter alias)
import { ErrorFactory } from '@shared'
```

### Example 3: Auth Package Import
```typescript
// ❌ BEFORE (relative)
import { UserService } from '../strategies/LocalAuthStrategy.js'

// ✅ AFTER (alias)
import { UserService } from '@auth/strategies/LocalAuthStrategy.js'
```

### Example 4: API Schema Import
```typescript
// ❌ BEFORE (relative)
import { CategoryIdParam } from '../common/parameters.js'

// ✅ AFTER (alias)
import { CategoryIdParam } from '@api/schemas/category/common/parameters.js'
```

## Next Steps

1. **Add missing service aliases** to `tsconfig.json` (business, category, pdf, voucher)
2. **Convert all relative imports** to use aliases:
   - Start with services that already have aliases
   - Then update newly aliased services
3. **Use shorter aliases** where available (@shared, @api, etc.)
4. **Run type checking** after conversions to ensure imports resolve correctly

## Summary

- **Total files to update:** ~300+ files
- **Pattern to follow:** Use aliases for ALL imports, no relative paths
- **Standard:** Use short aliases only (@shared, @api, @user, etc.)
- **No @pika/ prefix:** Remove all @pika/ prefixed aliases

## Migration Checklist (Package by Package)

### Phase 1: Update tsconfig.json
- [ ] Add all missing service aliases (@user, @business, @category, etc.)
- [ ] Remove all @pika/ prefixed aliases
- [ ] Verify tsconfig.json compiles without errors

### Phase 2: Core Packages (Already using correct aliases)
These packages are already using the correct short aliases - just verify:

- [ ] **@shared** - Verify all files use @shared (not @pika/shared)
- [ ] **@api** - Verify all files use @api (not @pika/api)
- [ ] **@types** - Verify imports from other packages use @types
- [ ] **@sdk** - Update any @pika/sdk imports to @sdk
- [ ] **@http** - Verify all files use @http
- [ ] **@auth** - Update internal relative imports to use @auth
- [ ] **@database** - Verify cross-package imports
- [ ] **@redis** - Verify cross-package imports
- [ ] **@environment** - Verify cross-package imports
- [ ] **@tests** - Verify all test files use @tests

### Phase 3: Service Packages (Need full conversion)

#### Business Service
- [ ] Update tsconfig to add @business alias
- [ ] Convert ~20 files from relative imports to @business
- [ ] Update imports in other packages from @pika/business to @business
- [ ] Run `yarn typecheck` to verify

#### Category Service
- [ ] Update tsconfig to add @category alias
- [ ] Convert ~15 files from relative imports to @category
- [ ] Update imports in other packages from @pika/category to @category
- [ ] Run `yarn typecheck` to verify

#### Communication Service
- [ ] Update imports from @pika/communication to @communication
- [ ] Convert ~25 files from relative imports to @communication
- [ ] Run `yarn typecheck` to verify

#### User Service
- [ ] Update imports from @pika/user to @user
- [ ] Convert all files from relative imports to @user
- [ ] Run `yarn typecheck` to verify

#### Payment Service
- [ ] Update imports from @pika/payment to @payment
- [ ] Convert all files from relative imports to @payment
- [ ] Run `yarn typecheck` to verify

#### Storage Service
- [ ] Update imports from @pika/storage to @storage
- [ ] Convert all files from relative imports to @storage
- [ ] Run `yarn typecheck` to verify

#### Subscription Service
- [ ] Update imports from @pika/subscription to @subscription
- [ ] Convert all files from relative imports to @subscription
- [ ] Run `yarn typecheck` to verify

#### Support Service
- [ ] Update imports from @pika/support to @support
- [ ] Convert all files from relative imports to @support
- [ ] Run `yarn typecheck` to verify

#### PDF Service
- [ ] Update tsconfig to add @pdf alias
- [ ] Convert ~20 files from relative imports to @pdf
- [ ] Run `yarn typecheck` to verify

#### Voucher Service
- [ ] Update tsconfig to add @voucher alias
- [ ] Convert ~25 files from relative imports to @voucher
- [ ] Run `yarn typecheck` to verify

#### Auth Service (different from @auth package)
- [ ] Update imports from @pika/auth-service to @auth-service
- [ ] Convert all files from relative imports to @auth-service
- [ ] Run `yarn typecheck` to verify

### Phase 4: Cross-Package Import Updates
After each service is migrated, update imports in other packages:

- [ ] API Gateway - Update service imports
- [ ] Shared package - Update service client imports
- [ ] Test files - Update any cross-service test imports

### Phase 5: Final Verification
- [ ] Run `yarn typecheck` on entire project
- [ ] Run `yarn lint` to ensure no issues
- [ ] Run `yarn test` to ensure nothing broke
- [ ] Build the project with `yarn build`

## Migration Order Recommendation

1. **Start with**: tsconfig.json updates
2. **Then**: Services with fewer dependencies (category, business)
3. **Then**: Core services (user, auth-service)
4. **Then**: Services with many dependencies (communication, payment)
5. **Finally**: Complex services (voucher, pdf)

This approach ensures we can test each package independently without breaking the entire system.