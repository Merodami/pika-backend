# Pika Backend - Migration & Development Roadmap

## Project Status Overview

This project is migrating from the old Pika codebase (pika-old) to a modern microservices architecture. We're following Clean Architecture patterns and implementing services one by one.

### ✅ COMPLETED SERVICES

#### User Service (Updated to New Patterns)

- **Status**: COMPLETE ✅
- **Updates Made**: Reorganized API schemas to service-first pattern, added sort field mappers
- **Architecture**: Already follows Clean Architecture (Controller → Service → Repository)
- **Schema Organization**: `/schemas/user/{public,admin,internal,common}/` structure
- **Sort Field Mappers**: `userSortFieldMapper` and `adminUserSortFieldMapper`
- **Controllers**: Public, Admin, and Internal controllers with Zod validation
- **SDK Integration**: UserMapper already exists in @pika/sdk

#### Business Service (Migrated from Provider)

- **Status**: COMPLETE ✅
- **Database Schema**: Business model using translation keys (`businessNameKey`, `businessDescriptionKey`)
- **Domain Types**: Complete interfaces for `Business`, `BusinessSearchParams`, `CreateBusinessData`, `UpdateBusinessData`
- **Architecture**: Controller → Service → Repository pattern with proper layer separation
- **Controllers**: Public, Admin, and Internal controllers with Zod validation
- **Integration Tests**: Comprehensive test suite adapted from pika-old provider tests
- **Translation Integration**: Using translation keys with mock translation service

#### Category Service (Reference Implementation)

- **Status**: COMPLETE ✅
- **Architecture**: Clean Architecture reference implementation
- **Translation Service**: Using translation keys pattern
- **API Tiers**: Public, Admin, and Internal endpoints

### 🔄 IN PROGRESS

#### PDF Service - TypeScript Error Fixes

- **Status**: Fixing remaining TypeScript compilation errors
- **Progress**: 70% complete - major interface fixes done, remaining detail fixes
- **Current Tasks**: Implementing missing repository methods, fixing enum mismatches
- **Next**: Complete getBusinessStats implementation, final typecheck pass

#### Deployment Security

- **TODO**: Ensure services are not accessible in the container in Vercel - only API gateway should be exposed
- **TODO**: Verify API gateway is the only publicly accessible service (port 5500 locally)
- **TODO**: Check deployment folder configuration for service isolation
- **TODO**: Ensure internal services communicate only within the container network

#### Technical Debt Items

- **TODO**: Calculate shipped quantity in BookDistributionRepository.getBusinessStats when we have that data
- **TODO**: Review and complete PDF service domain logic migration from pika-old
- **TODO**: Implement proper position mapping in VoucherBookService.getPositionOnPage() method
- **TODO**: Implement revokeAllTokens method in AuthService for revoking all user tokens when allDevices=true
- **TODO**: Fix global notification implementation in NotificationController to properly create notifications for all users without using Prisma in the service layer. Currently hardcoded to return count=2 for tests.
- **TODO**: Implement proper multi-language translation fetching in InternalVoucherService.getVouchersForBook(). Currently uses single-language fallback but VoucherForBook interface expects Record<string, string> for title/description/terms fields. Need to fetch all language versions of translation keys and format as multi-language objects.
- **TODO**: Add dedicated voucher pause/unpause endpoints for better UX. Currently, pause functionality exists via `VoucherState.SUSPENDED` using the generic `PUT /admin/vouchers/:id/state` endpoint, but dedicated `POST /admin/vouchers/:id/pause` and `POST /admin/vouchers/:id/unpause` endpoints would improve admin user experience. The BatchOperationType enum already includes `SUSPEND` and `ACTIVATE` values that could be leveraged.
- **TODO**: Implement proper voucher ownership validation in RedemptionAnalyticsController. Currently using basic businessId checks, but need to add a proper service method to validate business owners can only access their own voucher analytics. Consider adding VoucherService.checkVoucherOwnership(voucherId, businessId) method for proper ownership validation before allowing access to voucher redemption history.
- **TODO**: Fix business ownership validation in RedemptionAnalyticsController. The UserContext interface doesn't include businessId property, so current business ownership checks are failing. Need to either: 1) Add businessId to UserContext, or 2) Create a service method to validate business ownership by checking if userId owns the businessId, or 3) Use service-level filtering by userId instead of businessId validation.
- **TODO**: Add proper voucher ownership validation for business users in RedemptionAnalyticsController.getVoucherRedemptionHistory(). Business owners should only be able to access redemption history for vouchers they own. This requires implementing a service method to check if a voucher belongs to the current user's business before allowing access to the voucher's redemption history.
- **TODO**: Fix voucher existence validation in RedemptionAnalyticsService.getVoucherRedemptionHistory(). Currently returns 200 with empty results for non-existent vouchers instead of proper 404 error. Need to implement proper voucher existence check that doesn't cause 500 errors. The voucherExists() method in RedemptionAnalyticsRepository causes runtime errors when called.

## IMMEDIATE NEXT STEPS (Priority Order)

### ~~1. 🚀 **USER SERVICE MIGRATION**~~ ✅ COMPLETED

**Status**: User service already existed and has been updated to follow new patterns

**Completed Tasks**:

- ✅ Reorganized API schemas to follow service-first pattern (`/schemas/user/{public,admin,internal,common}/`)
- ✅ Created common schemas (enums.ts, sorting.ts) following Business/Category pattern
- ✅ Implemented userSortFieldMapper to replace custom implementation
- ✅ Updated all schema exports in public/admin/internal index files
- ✅ Updated UserController to use standardized sort field mapper
- ✅ Service already follows Clean Architecture (Controller → Service → Repository)
- ✅ UserMapper already exists in SDK
- ✅ Integration tests exist (minor file corruption needs fixing)

### 2. 🌐 **TRANSLATION SERVICE IMPLEMENTATION** (HIGH PRIORITY)

**Why**: Both Category and Business services use translation keys but currently mock the translation service

**Tasks**:

- [ ] Analyze translation requirements from Business/Category services
- [ ] Create Translation service schemas following established patterns
- [ ] Implement Translation service architecture (Controller → Service → Repository)
- [ ] Create translation key generation utilities
- [ ] Implement language resolution and fallbacks
- [ ] Replace mock translation clients with real service calls
- [ ] Add translation service to API Gateway routing
- [ ] Create integration tests
- [ ] Update Business/Category services to use real translation service

### 3. 🔗 **API GATEWAY INTEGRATION** (MEDIUM PRIORITY)

**Why**: Expose Business and Category services through the gateway

**Tasks**:

- [ ] Add Category service routes to API Gateway configuration
- [ ] Add Business service routes to API Gateway configuration
- [ ] Configure authentication and authorization for all tiers (public/admin/internal)
- [ ] Test all endpoints through the gateway
- [ ] Verify service-to-service communication works
- [ ] Set up health checks for new services

### 4. 🔄 **SERVICE COMMUNICATION SETUP** (MEDIUM PRIORITY)

**Why**: Enable proper inter-service communication

**Tasks**:

- [ ] Implement BusinessServiceClient in @pika/shared
- [ ] Implement CategoryServiceClient in @pika/shared
- [ ] Implement TranslationServiceClient in @pika/shared (replace mock)
- [ ] Set up internal API authentication (x-api-key)
- [ ] Test Business↔Category communication
- [ ] Test Category↔Translation communication
- [ ] Test Business↔Translation communication
- [ ] Add service discovery configuration

### 5. 🔧 **BUILD SYSTEM FIXES** (LOW PRIORITY)

**Why**: Fix API package build errors encountered during testing

**Tasks**:

- [ ] Resolve import path issues in API package
- [ ] Fix duplicate exports in schema files
- [ ] Resolve TypeScript compilation errors
- [ ] Fix tsc-alias path resolution
- [ ] Get full monorepo build working
- [ ] Update NX configuration for new services

## FUTURE MIGRATION TARGETS

### Next Services to Migrate (in order of priority):

1. **Payment Service** - Core business functionality
2. **Communication Service** - Already exists but may need updates
3. **Session Service** - Business logic layer (if needed)
4. **Subscription Service** - Business functionality
5. **Support Service** - Customer service functionality

### Additional Integration Tasks:

- [ ] **Database Seeding**: Update seed scripts for new services
- [ ] **Environment Configuration**: Add service-specific environment variables
- [ ] **Monitoring**: Add health checks and metrics for new services
- [ ] **Documentation**: Update API documentation generation
- [ ] **Testing**: End-to-end testing across services

## ARCHITECTURAL STANDARDS (MUST FOLLOW)

### Service Migration Pattern:

1. Analyze pika-old service structure
2. Create API schemas (public/admin/internal) following Category/Business pattern
3. Implement Clean Architecture: Controller → Service → Repository
4. Use translation keys instead of multilingual JSONB fields
5. Follow established domain/DTO/mapper patterns from SDK
6. Create comprehensive integration tests
7. Use Zod for validation (not TypeBox)
8. Follow established import patterns (@pika/ prefixes)

### Key Principles:

- **Never import API types in Service/Repository layers**
- **Use mappers for all data transformations**
- **Follow Request<Params, Body, Query> typing patterns**
- **Implement proper error handling with ErrorFactory**
- **Use caching patterns established in other services**
- **Create both unit and integration tests**

## NOTES

- **Build Issues**: Some API package builds currently fail due to import path issues - this is expected during migration
- **Translation Mock**: Using MockTranslationServiceClient until real translation service is implemented
- **Test Database**: Using testcontainers for isolated integration testing
- **Pattern Reference**: Use Category service as the reference implementation for all new services

## CURRENT MIGRATION STATUS

**Completed**: 3/8 core services (Category, Business, User)
**In Progress**: Selecting next migration target
**Next Target**: Translation Service implementation
**Overall Progress**: ~35% of core migration complete

---

_Last Updated: User service reorganization completed to follow new patterns_
