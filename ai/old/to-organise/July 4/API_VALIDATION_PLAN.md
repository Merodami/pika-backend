# API Validation Plan

## Overview

This document outlines the systematic validation process for all services in the Solo60 platform. Each service will be validated for:

1. Route definitions and HTTP methods
2. Request/Response schema validation
3. API documentation coverage
4. Schema consistency between routes and API package

## Validation Checklist for Each Service

### For each service, validate:

- [ ] All routes defined in `src/routes/*Routes.ts`
- [ ] All schemas imported from `@solo60/api/public`
- [ ] Request validation (body, params, query)
- [ ] Response types and status codes
- [ ] API documentation exists for all endpoints
- [ ] Schema definitions match between service and API package
- [ ] Authentication/Authorization requirements

## Services to Validate

### 1. AUTH Service

**Status**: ⏳ Pending

- **Routes File**: `/packages/services/auth/src/routes/AuthRoutes.ts`
- **Endpoints to check**:
  - POST /auth/login
  - POST /auth/register
  - POST /auth/refresh
  - POST /auth/logout
  - POST /auth/forgot-password
  - POST /auth/reset-password
  - GET /auth/verify-email/:token
  - POST /auth/resend-verification
  - POST /auth/change-password

### 2. COMMUNICATION Service

**Status**: ⏳ Pending

- **Routes Files**:
  - `/packages/services/communication/src/routes/EmailRoutes.ts`
  - `/packages/services/communication/src/routes/NotificationRoutes.ts`
  - `/packages/services/communication/src/routes/TemplateRoutes.ts`
- **Endpoints to check**:
  - Email endpoints
  - Notification endpoints
  - Template management endpoints

### 3. GYM Service

**Status**: ⏳ Pending

- **Routes Files**:
  - `/packages/services/gym/src/routes/GymRoutes.ts`
  - `/packages/services/gym/src/routes/FavoriteRoutes.ts`
  - `/packages/services/gym/src/routes/InductionRoutes.ts`
  - `/packages/services/gym/src/routes/StuffRoutes.ts`
- **Endpoints to check**:
  - GET /gyms
  - GET /gyms/search
  - GET /gyms/nearby
  - GET /gyms/nearest
  - GET /gyms/:id
  - POST /gyms
  - PUT /gyms/:id
  - DELETE /gyms/:id
  - POST /gyms/:id/pictures
  - Favorite endpoints
  - Induction endpoints
  - Stuff endpoints

### 4. PAYMENT Service

**Status**: ⏳ Pending

- **Routes Files**:
  - `/packages/services/payment/src/routes/CreditPackRoutes.ts`
  - `/packages/services/payment/src/routes/CreditsRoutes.ts`
  - `/packages/services/payment/src/routes/MembershipRoutes.ts`
  - `/packages/services/payment/src/routes/ProductRoutes.ts`
  - `/packages/services/payment/src/routes/PromoCodeRoutes.ts`
  - `/packages/services/payment/src/routes/WebhookRoutes.ts`
- **Endpoints to check**:
  - Credit pack endpoints
  - Credits management endpoints
  - Membership endpoints
  - Product endpoints
  - Promo code endpoints
  - Webhook endpoints

### 5. SESSION Service

**Status**: ⏳ Pending

- **Routes Files**:
  - `/packages/services/session/src/routes/SessionRoutes.ts`
  - `/packages/services/session/src/routes/SessionReviewRoutes.ts`
  - `/packages/services/session/src/routes/WaitingListRoutes.ts`
- **Endpoints to check**:
  - Session CRUD endpoints
  - Session review endpoints
  - Waiting list endpoints

### 6. SOCIAL Service

**Status**: ⏳ Pending

- **Routes Files**:
  - `/packages/services/social/src/routes/ActivityRoutes.ts`
  - `/packages/services/social/src/routes/DiscoveryRoutes.ts`
  - `/packages/services/social/src/routes/FollowRoutes.ts`
  - `/packages/services/social/src/routes/FriendRoutes.ts`
  - `/packages/services/social/src/routes/InteractionRoutes.ts`
  - `/packages/services/social/src/routes/SessionSocialRoutes.ts`
- **Endpoints to check**:
  - Activity feed endpoints
  - User discovery endpoints
  - Follow/Unfollow endpoints
  - Friend management endpoints
  - Social interaction endpoints
  - Session social features

### 7. STORAGE Service

**Status**: ⏳ Pending

- **Routes File**: `/packages/services/storage/src/routes/FileRoutes.ts`
- **Endpoints to check**:
  - POST /files/upload
  - POST /files/upload-batch
  - DELETE /files/:fileId
  - GET /files/:fileId/url
  - GET /files/history
  - GET /files/history/:id

### 8. SUBSCRIPTION Service

**Status**: ⏳ Pending

- **Routes Files**:
  - `/packages/services/subscription/src/routes/PlanRoutes.ts`
  - `/packages/services/subscription/src/routes/SubscriptionRoutes.ts`
  - `/packages/services/subscription/src/routes/InternalSubscriptionRoutes.ts`
- **Endpoints to check**:
  - Plan management endpoints
  - Subscription CRUD endpoints
  - Internal API endpoints

### 9. SUPPORT Service

**Status**: ⏳ Pending

- **Routes Files**:
  - `/packages/services/support/src/routes/ProblemRoutes.ts`
  - `/packages/services/support/src/routes/SupportCommentRoutes.ts`
- **Endpoints to check**:
  - Problem/ticket endpoints
  - Support comment endpoints

### 10. USER Service

**Status**: ⏳ Pending

- **Routes Files**:
  - `/packages/services/user/src/routes/UserRoutes.ts`
  - `/packages/services/user/src/routes/InternalUserRoutes.ts`
- **Endpoints to check**:
  - GET /users
  - GET /users/me
  - GET /users/:id
  - GET /users/email/:email
  - POST /users
  - PUT /users/me
  - PATCH /users/:id
  - DELETE /users/:id
  - POST /users/:id/avatar
  - Internal API endpoints

## Validation Process

### Step 1: Route Analysis

For each service:

1. Open the routes file(s)
2. List all defined endpoints
3. Note HTTP methods and paths
4. Identify required authentication/authorization

### Step 2: Schema Validation

For each endpoint:

1. Check imported schemas from `@solo60/api/public`
2. Verify request validation (validateBody, validateParams, validateQuery)
3. Note request schema names
4. Check if schemas exist in API package

### Step 3: API Documentation Check

1. Look for OpenAPI/Swagger definitions
2. Check if all endpoints are documented
3. Verify request/response examples
4. Ensure documentation matches implementation

### Step 4: Schema Consistency

1. Compare route schemas with API package schemas
2. Check for type mismatches
3. Verify required/optional fields
4. Ensure proper validation rules

## Progress Tracking

| Service       | Routes Checked | Schemas Validated | API Docs Verified | Status          |
| ------------- | -------------- | ----------------- | ----------------- | --------------- |
| Auth          | ✅             | ⚠️                | ❌                | ⚠️ Issues Found |
| Communication | ❌             | ❌                | ❌                | ⏳ Pending      |
| Gym           | ❌             | ❌                | ❌                | ⏳ Pending      |
| Payment       | ❌             | ❌                | ❌                | ⏳ Pending      |
| Session       | ❌             | ❌                | ❌                | ⏳ Pending      |
| Social        | ❌             | ❌                | ❌                | ⏳ Pending      |
| Storage       | ❌             | ❌                | ❌                | ⏳ Pending      |
| Subscription  | ❌             | ❌                | ❌                | ⏳ Pending      |
| Support       | ❌             | ❌                | ❌                | ⏳ Pending      |
| User          | ❌             | ❌                | ❌                | ⏳ Pending      |

## Notes

- Start date: 2025-07-03
- Each service validation should be done thoroughly
- Document any discrepancies found
- Create issues/tasks for any missing documentation or schema mismatches
