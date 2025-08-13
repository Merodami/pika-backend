# Complete List of Schema Files to Fix

## Status Legend
- ✅ Completed
- 🔧 In Progress  
- ⏳ Pending
- ➖ Skip (export file, enum, or utility)

## Summary Progress
- **Total Files**: ~180 files
- **Completed**: 19 files
- **Remaining to Fix**: ~40-50 files (excluding exports/enums)

## Already Completed ✅

### Shared Schemas
- ✅ `shared/errors.ts` - 8 schemas
- ✅ `shared/geo.ts` - 6 schemas  
- ✅ `shared/health.ts` - 3 schemas
- ✅ `shared/operations.ts` - 1 schema
- ✅ `shared/primitives.ts` - 5 schemas
- ✅ `shared/responses.ts` - 10 schemas

### Auth Service
- ✅ `auth/public/login.ts` - 7 schemas
- ✅ `auth/public/register.ts` - 6 schemas
- ✅ `auth/public/password.ts` - 6 schemas
- ✅ `auth/public/oauth.ts` - 8 schemas

### User Service  
- ✅ `user/public/address.ts` - 10 schemas
- ✅ `user/public/paymentMethod.ts` - 10 schemas
- ✅ `user/public/verification.ts` - 3 schemas

### Business Service
- ✅ `business/public/business.ts` - 10 schemas

### Category Service
- ✅ `category/public/category.ts` - 9 schemas

### Communication Service
- ✅ `communication/public/email.ts` - 13 schemas
- ✅ `communication/public/notification.ts` - 15 schemas

### Storage Service
- ✅ `storage/public/file.ts` - 11 schemas

### Support Service
- ✅ `support/public/problem.ts` - 6 schemas
- ✅ `support/public/comment.ts` - 6 schemas

### Voucher Service
- ✅ `voucher/public/voucher.ts` - 13 schemas

---

## Remaining Files to Fix

### 1. Support Service (`/schemas/support/`) - PARTIALLY COMPLETE
- ⏳ `admin/tickets.ts` - Admin ticket management schemas
- ⏳ `admin/comments.ts` - Admin comment management schemas
- ⏳ `internal/service.ts` - Internal service communication schemas

### 2. Voucher Service (`/schemas/voucher/`) - PARTIALLY COMPLETE
- ⏳ `public/queries.ts` - Query schemas
- ⏳ `public/parameters.ts` - Parameter schemas
- ⏳ `admin/management.ts` - Admin voucher management
- ⏳ `admin/queries.ts` - Admin query schemas
- ⏳ `admin/parameters.ts` - Admin parameter schemas
- ⏳ `internal/service.ts` - Internal service communication
- ⏳ `common/types.ts` - Common type definitions
- ⏳ `common/queries.ts` - Common query schemas
- ⏳ `common/sorting.ts` - Sorting schemas
- ⏳ `common/relations.ts` - Relation schemas

### 3. System Service (`/schemas/system/`) - PARTIALLY COMPLETE
- ✅ `public/health.ts` - Health check schemas
- ✅ `public/error.ts` - Error schemas (re-export file)
- ⏳ `admin/management.ts` - System management schemas
- ⏳ `internal/service.ts` - Internal service schemas
- ⏳ `common/parameters.ts` - Common parameters

### 4. Subscription Service (`/schemas/subscription/`) - PARTIALLY COMPLETE
- ✅ `public/subscription.ts` - Subscription schemas - 12 schemas fixed
- ✅ `public/subscriptionPlan.ts` - Subscription plan schemas - 8 schemas fixed  
- ✅ `public/parameters.ts` - Public parameters (re-export file)
- ⏳ `admin/management.ts` - Admin management schemas
- ⏳ `internal/service.ts` - Internal service schemas
- ⏳ `common/parameters.ts` - Common parameters
- ⏳ `common/types.ts` - Common types

### 5. PDF Service (`/schemas/pdf/`) - PARTIALLY COMPLETE
- ✅ `public/voucher-book.ts` - Public voucher book schemas - 8 schemas fixed
- ⏳ `admin/voucher-book.ts` - Admin voucher book schemas
- ⏳ `admin/page-management.ts` - Page management schemas
- ⏳ `internal/voucher-book.ts` - Internal voucher book schemas
- ⏳ `common/parameters.ts` - Common parameters

### 6. Discovery Service (`/schemas/discovery/`)
- ⏳ `internal/service.ts` - Internal service schemas

### 7. Business Service (`/schemas/business/`) - PARTIALLY COMPLETE
- ✅ `admin/management.ts` - Admin management schemas - 16 schemas fixed
- ⏳ `internal/service.ts` - Internal service schemas
- ⏳ `common/parameters.ts` - Common parameters
- ⏳ `common/sorting.ts` - Sorting parameters

### 8. Category Service (`/schemas/category/`) - PARTIALLY COMPLETE
- ✅ `admin/management.ts` - Admin management schemas - 11 schemas fixed
- ⏳ `internal/service.ts` - Internal service schemas
- ⏳ `common/parameters.ts` - Common parameters

### 9. User Service (`/schemas/user/`) - PARTIALLY COMPLETE
- ⏳ `admin/analytics.ts` - Analytics schemas
- ⏳ `admin/management.ts` - User management schemas
- ⏳ `admin/requests.ts` - Admin request schemas
- ⏳ `admin/search.ts` - User search schemas
- ⏳ `internal/service.ts` - Internal service schemas

### 10. Auth Service (`/schemas/auth/`) - PARTIALLY COMPLETE
- ⏳ `internal/service.ts` - Internal service schemas
- ⏳ `frontend/forms.ts` - Frontend form schemas (may have special needs)

### 11. Communication Service (`/schemas/communication/`) - PARTIALLY COMPLETE
- ⏳ `public/communicationLog.ts` - Communication log schemas
- ⏳ `internal/service.ts` - Internal service schemas
- ⏳ `internal/queries.ts` - Internal query schemas
- ⏳ `internal/types.ts` - Internal type schemas
- ⏳ `common/parameters.ts` - Common parameters

### 12. Storage Service (`/schemas/storage/`) - PARTIALLY COMPLETE
- ⏳ `admin/management.ts` - Admin management schemas
- ⏳ `internal/service.ts` - Internal service schemas
- ⏳ `common/parameters.ts` - Common parameters

### 13. Shared Schemas (`/schemas/shared/`) - PARTIALLY COMPLETE
Still need to check:
- ⏳ `shared/search.ts` - Search schemas
- ⏳ `shared/sort.ts` - Sort schemas
- ⏳ `shared/time.ts` - Time-related schemas
- ⏳ `shared/upload.ts` - Upload schemas
- ⏳ `shared/validation.ts` - Validation schemas
- ⏳ `shared/device.ts` - Device schemas (if it has schemas)

## Files to Skip (No Changes Needed)
- All `index.ts` files - Export files only
- All `enums.ts` files - Enum definitions use special pattern
- `shared/branded.ts` - Branded types (special case)
- `shared/metadata.ts` - Utility functions
- `shared/query.ts` - Utility functions
- `shared/pagination.ts` - May be utility functions

## Next Actions Priority Order

1. **System Service** - All public schemas
2. **Subscription Service** - All public schemas  
3. **PDF Service** - All public schemas
4. **Complete Admin Schemas** - For all services
5. **Complete Internal Schemas** - For all services
6. **Shared Utilities** - Remaining shared schemas

## Verification After Each Service
After fixing each service, run:
```bash
yarn nx run api:build
```

## Total Estimated Remaining Work
- ~40-50 files to fix
- ~200-300 schemas to standardize
- Estimated time: 2-3 hours