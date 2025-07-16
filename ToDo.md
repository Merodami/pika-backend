# PIKA Microservices - Missing Implementations

## API Parameter Schema Improvements

### Route Parameter Standards

- **TODO**: Standardize route parameters to use descriptive names (`:sessionId`, `:userId`) instead of generic `:id`
- **Current Issue**: Mixed usage of `:id` vs descriptive parameters across services
- **Industry Standard**: REST APIs should use descriptive parameter names for clarity
- **Impact**: Improves API self-documentation and developer experience

## Current Sprint Tasks

### Subscription Service Implementation ✅ COMPLETED

#### Completed ✓

- [x] Create SubscriptionPlan database model
- [x] Add SubscriptionPlanDomain and DTOs to SDK
- [x] Create SubscriptionPlanMapper in SDK
- [x] Create subscription API schemas in @pika/api
- [x] Update Subscription Service with Payment integration
- [x] Remove duplicate Subscription model from payment.prisma
- [x] Remove subscription files from Payment Service
- [x] Fix API schemas to use TypeBox instead of Zod
- [x] Move subscription logic from Payment Service
- [x] Add credit processing endpoint (`POST /subscriptions/:id/process-credits`)
- [x] Complete integration tests (36 tests passing)

### Payment Service Stabilization ✅ COMPLETED

#### Completed ✓

- [x] Implement proper industry-standard webhook handling pattern
- [x] Fix webhook route registration order (raw body before JSON parsing)
- [x] Update webhook routes to use express.raw() middleware
- [x] Remove legacy webhook path compatibility
- [x] Fix payment service server middleware order
- [x] Fix webhook signature validation with stripe-mock
- [x] Fix credits transfer limit validation test - RequestContextStore properly populated
- [x] All integration tests passing (24 tests)

### Notes

- Following the Communication Service pattern for Subscription Service implementation
- Using direct database access via Prisma for credit processing (following Payment Service pattern)
- All subscription-related logic should be moved from Payment Service to Subscription Service

## Code TODOs from Implementation

### Subscription Service - Communication Integration

- [x] Add CommunicationServiceClient dependency to SubscriptionService
- [x] Send subscription creation confirmation email (SUBSCRIPTION_ACTIVATED)
- [x] Send subscription cancellation notification (SUBSCRIPTION_EXPIRED)
- [x] Send monthly credit allocation notification (PAYMENT_SUCCESS)
- [x] Create internal API schemas and endpoints for subscription service
- [x] Implement InternalSubscriptionController with webhook processing
- [ ] Send payment failure notification for invoice payment failed (webhook endpoint ready)
- [ ] Send renewal reminder (7 days before renewal)
- [ ] Send trial expiration warning (3 days before trial ends)

### Session Service

#### **IMPORTANT NOTICE**: Session Service has EXTENSIVE TODO list

**Location**: New `AdminSessionService.ts` created with proper separation of concerns
**Status**: Multiple TODO items need implementation across admin functionality
**Areas needing completion**:

- Email notification system integration
- Payment and refund processing
- Session capacity management
- Admin audit trail enhancements

See AdminSessionService.ts lines: 84, 85, 144, 145, 189, 194, 199, 204

#### Email Notifications

- [ ] Send email to admin for content session approval (`SessionService.ts:297`, `SessionService.ts:1082`)
- [ ] Send noise warning email for Field Street Gym (`SessionService.ts:303`, `SessionService.ts:1090`)
- [ ] Send cancellation emails to guests (`SessionService.ts:557`)
- [ ] Send invitation email to guest (`SessionInviteeService.ts:268`)
- [ ] Send notification when spot becomes available (`WaitingListService.ts:208`)
- [ ] Send approval email to user when admin approves content session (`AdminSessionService.ts:184`)
- [ ] Send rejection email to user with reason when admin declines content session (`AdminSessionService.ts:189`)
- [ ] Send notifications to users when admin cancels session (`AdminSessionService.ts:194, 199`)
- [ ] Send booking confirmation notification to user (`AdminSessionService.ts:84`)
- [ ] Implement guest notification (`SessionService.ts:1072`)
- [ ] Implement notification for next in queue when session cancelled (`SessionService.ts:549`)

#### Payment & Refunds

- [ ] Process refund if payment was made (`SessionService.ts:544`)
- [ ] Process payment with paymentInfo (`SessionService.ts:947`)
- [ ] Implement refund logic - credit back session price (`SessionService.ts:1061`)
- [ ] Handle payment logic for admin bookings if required (`AdminSessionService.ts:85`)
- [ ] Process refunds for all attendees when admin cancels with refund option (`AdminSessionService.ts:204`)

#### Admin Session Management ✅ COMPLETED

- [x] **Fix admin session creation blocked by business rule** ✅ COMPLETED
  - **Solution**: Implemented RequestContext-based bypass in SessionService
  - **Location**: `SessionService.ts:210-218` with context parameter
  - Admin sessions now bypass user restrictions when called from admin endpoints
  - All admin session creation tests passing

- [x] **Fix admin booking logic** ✅ COMPLETED
  - **Solution**: Created dedicated `AdminSessionService.ts` with proper separation of concerns
  - **Features**: Capacity validation, duplicate checking, audit trail, ownership bypass
  - **Location**: `AdminSessionService.ts:bookUserToSession()`
  - Implements industry standard admin service pattern

- [x] **Fix admin cancellation and status management** ✅ COMPLETED
  - **Solution**: AdminSessionService with enhanced cancellation options
  - **Features**: Double cancellation prevention, notification/refund flags, audit trail
  - **Location**: `AdminSessionService.ts:cancelSession()`, `updateSessionStatus()`

- [x] **Add missing admin session routes** ✅ COMPLETED
  - POST /admin/sessions (create session) ✅
  - POST /admin/sessions/book (book session) ✅
  - POST /admin/sessions/:id/cancel (cancel session) ✅
  - All routes with proper admin authentication and validation

- [x] **Admin session test suite** ✅ COMPLETED
  - **Status**: All 17 admin integration tests passing
  - **Location**: `admin.session.integration.test.ts`
  - Comprehensive coverage of admin operations, security, and edge cases

### Communication Service ✅ ENHANCED

#### Completed ✓

- [x] MailHog email provider for development testing
- [x] Email template system with Handlebars support
- [x] Security improvements using lodash-es for safe object access
- [x] Template registry with path validation and security hardening
- [x] Email HTML/text content handling for different providers
- [x] Real email sending with visual testing through MailHog interface

#### Pending

- [ ] Add SMS routes when SMS provider is fully implemented (`index.ts:87`)
- [ ] Fix template validation endpoint - TestTemplateRequest schema doesn't match controller implementation
  - Controller expects `templateId` but schema only has `variables` and `recipient`
  - Either update API schema or refactor controller to match the intended design
  - Tests currently skipped in `communication.integration.test.ts`

### Gym Service

- [ ] Check for conflicting sessions when session service is implemented (`GymService.ts:645`)

### Payment Service Integration

- [ ] Create endpoint for processing subscription credits from Subscription Service
- [ ] Remove subscription-related logic from Payment Service

### Infrastructure

- [ ] Replace mock service clients with real implementations in tests
- [ ] Add UUID validation middleware to return 400 before reaching Prisma

## Authentication Service ✅ COMPLETED

### Completed ✓

- [x] Email verification workflow with real token extraction
- [x] Password reset initiation
- [x] Password reset confirmation
- [x] Password update functionality
- [x] Account verification system with Redis token storage
- [x] Integration with Communication Service for email delivery
- [x] MailHog integration for development email testing
- [x] Production-ready email verification test with token extraction
- [x] Service-to-service authentication for email sending

### Features Implemented

- Complete email verification flow: Registration → Email → Token validation → Account activation
- Real-time email testing with MailHog integration for development
- Cryptographically secure verification tokens with Redis storage
- Single-use verification tokens with 7-day TTL
- User status management (UNCONFIRMED → ACTIVE)
- Resend verification email functionality
- Production-ready test scripts with actual email parsing
- Security best practices: generic error messages, token expiry, proper validation

## User Service (Priority: MEDIUM - 4 endpoints missing)

- User notifications retrieval system
- Account deletion request workflow
- Admin profile management endpoints
- User notification preferences

### Professional User Service Implementation (Priority: HIGH - MAJOR GAP)

**Critical Gap Identified**: Professional functionality is severely underdeveloped despite comprehensive API schemas.

#### Missing Professional Service Components:

- **Dedicated Professional Service**: No professional-specific business logic layer
- **Professional Repository**: No specialized data access for professional operations
- **Professional Controller**: No dedicated API endpoints for professional features
- **Certification Management**: Complete absence despite schema definitions
- **Professional Discovery**: No search/filtering for finding professionals
- **Booking System**: No appointment or session management for professionals
- **Rating/Review System**: No feedback mechanism for professional services
- **Professional Dashboard**: No management interface for professional users

#### Missing Business Logic:

- **Verification Process**: No professional verification workflow
- **Pricing Management**: No hourly rate or service pricing system
- **Availability Management**: No calendar or scheduling system
- **Client Communication**: No messaging or communication tools
- **Professional Analytics**: No performance metrics or insights

#### Current State vs. Required State:

- **Current**: Basic professional user creation with minimal functionality (description + specialties only)
- **Schema Defines**: Full professional platform with certifications, discovery, booking, client management
- **Gap**: API schemas suggest comprehensive professional platform but implementation is minimal

#### Immediate Actions Needed:

1. Create dedicated `ProfessionalService` with full business logic
2. Implement professional-specific API endpoints
3. Build certification upload, verification, and management system
4. Add professional discovery and filtering capabilities
5. Align database schema with comprehensive API schemas

#### Architecture Requirements:

- Separate Professional domain from User service
- Professional Repository for specialized data access
- Professional Mappers for proper data transformation
- Professional Validation for business rule enforcement

## Session Service (Priority: MEDIUM - 7 endpoints missing)

- Session check-in functionality
- Session check-out functionality
- Admin force check-in capabilities
- Admin emergency session cancellation
- Admin analytics dashboard
- Session waiting list retrieval
- Waiting list removal system

### Build Issues to Fix:

- Implement notification logic for next in queue when sessions are cancelled (SessionService.ts:526)
- Fix enum type mismatches throughout SessionService (use proper enum values instead of strings)
- Fix missing 'memberships' property on User domain model (SessionService.ts:952)
- FIXED: Session cancellation and update time calculations were using startTime incorrectly (fixed in SessionService.ts:492-498 and :343-351)

### Session Service Implementation Issues:

- Fix checkUserMembership() returning hardcoded false - implement proper membership checking (SessionService.ts:952)
- **Fix session cancellation time restriction test** - Test fails because 12-hour cancellation rule for non-members not properly enforced due to datetime parsing/timezone issues (test currently skipped in session.integration.test.ts:517)

## Gym Service ✅ COMPLETED ADMIN ENDPOINTS (Priority: LOW - 3 endpoints missing)

### Recently Completed ✓

- [x] Admin gym endpoints with full field visibility (`GET /admin/gyms`, `GET /admin/gyms/:id`, `GET /admin/gyms/:id/stats`)
- [x] Added `isActive` field to Gym database model
- [x] Implemented shared query utilities for sorting and includes (`@pikapi/common`)
- [x] Standardized include parameter pattern across public and admin APIs (`?include=stuff,hourlyPrices,specialPrices`)
- [x] Updated admin gym tests to use include parameter pattern

### Still Pending

- Advanced gym filtering by criteria
- Bulk induction scheduling operations
- Gym status management system

### Gym Service - Additional Missing Features:

- **Email Notifications for Inductions:** Send emails when inductions are created/updated
- **Dedicated Price Management Endpoints:**
  - GET /gyms/:id/prices/hourly - View hourly prices
  - PUT /gyms/:id/hourly-prices - Bulk update hourly prices
  - PUT /gyms/:id/special-prices - Manage special prices
- **Alternative Gym Suggestions:** Suggest nearby gyms when selected gym is full
- **Price History Tracking:** Audit trail for price changes
- **Bulk Gym Equipment Management:** PUT /gyms/:id/stuff endpoint for bulk updates

## Payment Service (Priority: LOW - 1 endpoint missing)

- Promo code validation endpoint

## Communication Service (Priority: HIGH - COMPLETED ✅)

### Completed

- [x] Set up communication service base structure following clean architecture pattern
- [x] Create database schema for CommunicationLog, Template, and Notification tables
- [x] Implement EmailController, EmailService, and EmailRepository
- [x] Implement NotificationController, NotificationService, and NotificationRepository
- [x] Implement TemplateController, TemplateService, and TemplateRepository
- [x] Create mapper classes for all communication entities (CommunicationLogMapper, NotificationMapper, TemplateMapper)
- [x] Set up multi-provider email support (AWS SES, Resend, Console)
- [x] Implement provider fallback mechanism
- [x] Add bulk email capabilities
- [x] Implement communication history tracking
- [x] Fix all TypeScript issues and ensure clean build
- [x] Update API schemas to match DTOs with camelCase naming
- [x] Add all required environment variables to .env files

### Features Implemented

- Multi-provider email support with automatic fallback
- Template management system with variables
- Bulk email sending with per-recipient variables
- Communication history tracking and retrieval
- In-app notifications with read/unread status
- Template preview functionality
- Admin-only endpoints for template management
- Comprehensive error handling and logging

### Pending - Future Enhancements

- [ ] Implement queue service for async email processing (BullMQ already added as dependency)
- [ ] Create integration tests for all communication endpoints
- [ ] SMS service implementation (AWS SNS provider already scaffolded)
- [ ] Push notification service (future)
- [ ] Email bounce and complaint handling with AWS SNS
- [ ] Rate limiting for email sending
- [ ] Email analytics and delivery metrics

### Implementation TODOs from Code

- [x] Implement bulk email functionality (completed)
- [x] Add notification routes (completed)
- [ ] Add SMS routes when SMS provider is fully implemented
- [x] Add template routes (completed)

### AWS SES Configuration TODOs

- [x] Update environment variables to support AWS SES
- [ ] Create email templates in database with Handlebars format
- [ ] Migrate existing EmailJS templates to new template system
- [ ] Set up AWS SES domain verification and DKIM
- [ ] Configure bounce and complaint handling with SNS

## Session Service Integration Test Temporary Mocks

### UserServiceClient Mock (TEMPORARY)

**Location**: `packages/services/session/src/test/integration/e2e/session.integration.test.ts`
**Reason**: Session service requires UserServiceClient dependency for user validation
**External Dependency**: User microservice for user data and context management
**Temporary Solution**: Mock that queries test database directly instead of HTTP calls
**TODO**: Replace with real UserServiceClient when service mesh/communication layer is implemented

### GymServiceClient Mock (TEMPORARY)

**Location**: `packages/services/session/src/test/integration/e2e/session.integration.test.ts`
**Reason**: Session service requires GymServiceClient dependency for gym validation and pricing
**External Dependency**: Gym microservice for gym data and pricing information
**Temporary Solution**: Mock that queries test database directly instead of HTTP calls
**TODO**: Replace with real GymServiceClient when service mesh/communication layer is implemented

## Cross-Service Integration Requirements

- Session service email notifications for booking confirmations
- Authentication service email verification workflows
- User service notification delivery system
- Payment service transaction receipt emails
- Gym service booking notification emails
- Admin notification system for content session approvals

## Database Schema Extensions Needed

- User notifications table
- Email templates table
- Notification preferences table
- Session check-in/check-out logs
- Email delivery status tracking

## API Gateway Updates Required

- [x] Communication service routing (port 5507)
- [x] Email service health monitoring (health endpoints implemented)
- [x] Updated OpenAPI documentation (schemas updated)
- [ ] Service discovery configuration updates

## API Documentation Refactor Required

- **Current Issue**: Swagger spec only shows auth, user, and system routes
- **Missing Routes**: Gym, session, support routes not displaying in API docs
- **Root Cause**: Schema registry expects individual schema exports (UserProfileSchema, etc.) but gym/session/support schemas export as objects (gymSchemas.gym, etc.)
- **Simple Fix**: Export individual schemas from gym/session/support schema files to match auth/user pattern
- **Example**: Change `gymSchemas.gym` pattern to `export const GymSchema = ...` in schema files
- **Then**: Register schemas in schemaRegistration.ts like `registry.register('Gym', schemas.GymSchema)`

## Email Template Requirements

- Account verification emails
- Password reset emails
- Session booking confirmations
- Session cancellation notifications
- Waiting list notifications
- Admin approval notifications
- Transaction receipt emails

## Schema Validation Migration

- **Current**: Legacy project uses TypeBox for schema validation
- **Target**: Migrate to Zod for consistent validation across the new architecture
- **Reason**: Zod provides better TypeScript integration, cleaner syntax, and better ecosystem support
- **Scope**: Replace TypeBox schemas with Zod equivalents in OpenAPI specifications and validation middleware

# TODO List for Pika Project

## High Priority Tasks

### Completed ✓

- [x] Create SubscriptionPlan database model
- [x] Add SubscriptionPlanDomain and DTOs to SDK
- [x] Create SubscriptionPlanMapper in SDK
- [x] Create subscription API schemas in @pikapi
- [x] Update Subscription Service with Payment integration
- [x] Move subscription logic from Payment Service
- [x] Update Payment Service to remove subscription logic
- [x] Support Service implementation with 42 tests
- [x] Social Service implementation
- [x] File Storage Service implementation

### In Progress 🔄

- [ ] Fix circular dependency between @pikahared and @p@pika packages

### Pending ⏳

- [ ] Add tests to Auth and Communication services (both have 0 tests)
  - Communication service has integration tests but they are currently skipped (describe.skip)
  - Tests need to be enabled and verified to pass with the new type-safe validation
  - Main test failures to fix:
    - Health check endpoint returns 500 instead of 200
    - Template not found/inactive template tests have response format issues
    - Bulk email admin role check returns 500 instead of 403
    - Email history tests fail due to missing test data
    - Need to fix test data seeding and response format expectations
- [ ] Complete cross-service integrations
- [ ] Fix health check endpoints in storage service tests

## Notes

- Following the Communication Service pattern for Subscription Service implementation
- Using direct database access via Prisma for credit processing (following Payment Service pattern)
- All subscription-related logic should be moved from Payment Service to Subscription Service

## Technical Debt

### Code Quality Improvements ✅ COMPLETED

#### Completed ✓

- [x] Security hardening: Replaced direct object access with lodash-es safe methods (`get`, `has`, `set`)
- [x] Type safety: Eliminated `any` types in favor of proper TypeScript types and type guards
- [x] Linting: Fixed all security warnings (object injection, non-literal operations)
- [x] Code cleanup: Removed unused variables and imports across the project
- [x] ESM compatibility: Used lodash-es for proper ES module support

### Circular Dependency Issue

- **Problem**: @pikahared imports from @p@pika, but @pik@pikamports from @pika/@pika
- **Current Workaround**: Temporary interface definitions duplicated in service clients
- **Proper Solution**: Move service contract types (DTOs and domain interfaces used by service clients) to a new @pikaontracts package or to @p@pikaes/contracts
- **Affected Files**:
  - `packages/shared/src/services/clients/CommunicationServiceClient.ts`
  - `packages/shared/src/services/clients/PaymentServiceClient.ts`
  - `packages/shared/src/services/clients/SubscriptionServiceClient.ts`
- **TODO**: Create proper type separation to avoid circular dependencies

### User Service Auth Data Refactoring

- **TODO**: Move `getRawUserByEmail` and `getRawUserById` methods from UserRepository to a separate AuthDataRepository
- **Reason**: Better separation of concerns between business operations and auth-specific data access
- **Location**: `packages/services/user/src/repositories/UserRepository.ts`

### Internal API Request Parameter Pattern Fixes

- **TODO**: Fix Subscription Service internal API schemas that expect IDs in request body instead of URL params
- **Affected Schemas**:
  - `GetSubscriptionByStripeIdRequest` - expects `stripeSubscriptionId` in body but route uses URL param
  - `GetUserSubscriptionsRequest` - expects `userId` in body but route uses URL param
- **Location**: `packages/api/src/internal/schemas/subscription/service.ts`
- **Pattern**: Follow User Service pattern - separate schemas for URL params and request body
- **Note**: Communication, Payment, Session, and Credit services have schemas but no internal API implementation yet

### API Route Standardization

- **TODO**: Audit all routes for REST API naming conventions
  - Use `:id` instead of `:user_id`, `:gym_id`, etc. (industry standard)
  - Ensure consistent plural/singular resource naming
  - Check hierarchical resources (e.g., `/users/:id/sessions` not `/sessions/user/:userId`)
  - Validate parameter names match schema definitions
  - **Example**: Change `/users/:user_id` to `/users/:id`
  - **Affected**: All service routes need review
  - **DONE**: Fixed Subscription Service internal routes:
    - Changed `/by-user/:userId` to `/users/:userId/subscriptions` (RESTful nested resource)
    - Changed `/by-stripe-id/:stripeSubscriptionId` to `/stripe/:stripeSubscriptionId`
  - **TODO**: Review all other services for similar non-standard routes:
    - Session Service: Check for `/by-*` patterns
    - Payment Service: Check for `/by-*` patterns
    - User Service: Check for `/by-*` patterns
    - Gym Service: Check for `/by-*` patterns
    - Social Service: Check for `/by-*` patterns

### Package Architecture Refactoring

#### High Priority - Fix Dependency Hierarchy Violations

1. **Create @pikaogger package**
   - Move logger from @pikahared to its own package
   - Update all packages currently importing logger from shared
   - Affected packages: redis (DONE temporarily with local logger), database, http, auth
   - See PACKAGE_ARCHITECTURE.md for details

2. **Create @pikarrors package**
   - Move ErrorFactory and error utilities from @pikahared
   - Update all packages using error utilities
   - Affected packages: all service packages

3. **Fix remaining dependency violations**
   - @pikaatabase should not depend on @p@pikared
   - @pikattp should not depend on @p@pikared
   - @pikauth should not depend on @p@pikared (except for service clients)

4. **Clean up @pikahared**
   - Should only contain high-level application utilities
   - Service clients (UserServiceClient, etc.)
   - Complex business helpers
   - Remove all infrastructure-level code

#### Medium Priority

1. **Review and document package hierarchy**
   - Update PACKAGE_ARCHITECTURE.md with final structure
   - Add linting rules to prevent future violations
   - Create dependency graph visualization

## User Service - Verification System

- [ ] SMS service integration to send verification codes (currently just logging the code)
- [ ] Add findByPhoneNumber method to UserRepository for phone number lookup
