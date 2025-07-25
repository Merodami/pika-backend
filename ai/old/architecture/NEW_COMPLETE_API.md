# SOLO60 Current Microservices Architecture - Complete API Documentation

This document provides comprehensive API documentation for the current microservices implementation.

## Microservices Overview

The SOLO60 platform has been successfully migrated to a microservices architecture with the following services:

**✅ Fully Implemented Services (10/10 - 100% Complete)**

1. **API Gateway** (Port: 5500) - Request routing, authentication middleware, and service discovery
2. **Auth Service** (Port: 5501) - OAuth 2.0 authentication and authorization
3. **User Service** (Port: 5502) - User profiles and management
4. **Gym Service** (Port: 5503) - Gym management, equipment, inductions, and favorites
5. **Session Service** (Port: 5504) - Session booking, invitations, reviews, and waiting lists
6. **Payment Service** (Port: 5505) - Credits, credit packs, memberships, promo codes, and Stripe integration
7. **Subscription Service** (Port: 5506) - Subscription plans and billing management
8. **Communication Service** (Port: 5507) - Email, notifications, and templates
9. **Social Service** (Port: 5508) - Friends, follows, activities, and interactions
10. **Support Service** (Port: 5509) - Problem reporting and support tickets
11. **Storage Service** (Port: 5510) - File upload and management

## Service Port Mapping

| Service | Port | Status | Base Path |
|---------|------|--------|-----------|
| API Gateway | 5500 | ✅ Active | `/api/v1` |
| Auth Service | 5501 | ✅ Active | `/api/v1/auth` |
| User Service | 5502 | ✅ Active | `/api/v1/users` |
| Gym Service | 5503 | ✅ Active | `/api/v1/gyms` |
| Session Service | 5504 | ✅ Active | `/api/v1/sessions` |
| Payment Service | 5505 | ✅ Active | `/api/v1/payments`, `/api/v1/credits` |
| Subscription Service | 5506 | ✅ Active | `/api/v1/subscriptions` |
| Communication Service | 5507 | ✅ Active | `/api/v1/communications`, `/api/v1/notifications` |
| Social Service | 5508 | ✅ Active | `/api/v1/social`, `/api/v1/friends` |
| Support Service | 5509 | ✅ Active | `/api/v1/support`, `/api/v1/problems` |
| Storage Service | 5510 | ✅ Active | `/api/v1/files`, `/api/v1/uploads` |

## Complete API Routes by Service

### API Gateway (Port: 5500)

The API Gateway provides centralized routing, authentication, and rate limiting.

**Health & Monitoring**
- `GET /health` - Gateway health check
- `GET /metrics` - Gateway metrics

**Routing Pattern**
- All service routes are proxied through the gateway with `/api/v1/{service}/*` pattern
- Authentication is handled centrally via JWT Bearer tokens
- Rate limiting: 100 req/hour (anonymous), 1000 req/hour (authenticated), 5000 req/hour (admin)

### Auth Service (Port: 5501) ✅

OAuth 2.0 compliant authentication service.

**Public Endpoints**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/token` - OAuth 2.0 token endpoint (password/refresh grants)
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Reset password with token
- `GET /api/v1/auth/verify-email/:token` - Email verification
- `POST /api/v1/auth/resend-verification` - Resend verification email
- `POST /api/v1/auth/introspect` - Token introspection
- `POST /api/v1/auth/revoke` - Token revocation

**Authenticated Endpoints**
- `GET /api/v1/auth/userinfo` - Get user info (OAuth 2.0 standard)
- `POST /api/v1/auth/change-password` - Change password

### User Service (Port: 5502) ✅

User profile and management service.

**Public Endpoints**
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile
- `GET /api/v1/users/:id` - Get user by ID
- `GET /api/v1/users/sub/:subToken` - Get user by sub token
- `GET /api/v1/users/:id/friends` - Get user's friends
- `POST /api/v1/users/:id/avatar` - Upload avatar

**Admin Endpoints**
- `GET /api/v1/admin/users` - Get all users with pagination and filters
- `GET /api/v1/admin/users/email/:email` - Get user by email
- `POST /api/v1/admin/users` - Create new user
- `PATCH /api/v1/admin/users/:id` - Update user
- `DELETE /api/v1/admin/users/:id` - Delete user
- `PUT /api/v1/admin/users/:id/status` - Update user status
- `PUT /api/v1/admin/users/:id/ban` - Ban user
- `PUT /api/v1/admin/users/:id/unban` - Unban user

**Internal Endpoints** (Service-to-service)
- `GET /internal/users/auth/by-email/:email`
- `GET /internal/users/auth/:id`
- `POST /internal/users`
- `POST /internal/users/:id/last-login`
- `GET /internal/users/check-email/:email`
- `GET /internal/users/check-phone/:phone`
- `POST /internal/users/:id/password`
- `POST /internal/users/:id/verify-email`

### Gym Service (Port: 5503) ✅

Gym management and discovery service.

**Public Gym Endpoints**
- `GET /api/v1/gyms` - Get all gyms with filters
- `GET /api/v1/gyms/search` - Search gyms
- `GET /api/v1/gyms/nearby` - Find nearby gyms
- `GET /api/v1/gyms/nearest` - Find nearest gym
- `GET /api/v1/gyms/:id` - Get gym details

**Induction Endpoints**
- `GET /api/v1/gyms/inductions` - Get my inductions
- `POST /api/v1/gyms/inductions` - Request induction
- `GET /api/v1/gyms/inductions/:id` - Get induction details
- `PUT /api/v1/gyms/inductions/:id` - Update induction
- `DELETE /api/v1/gyms/inductions/:id` - Delete induction

**Equipment/Stuff Endpoints**
- `GET /api/v1/gyms/stuff` - Get equipment
- `GET /api/v1/gyms/stuff/:id` - Get equipment details

**Favorite Endpoints**
- `GET /api/v1/gyms/favorites` - Get favorite gyms
- `POST /api/v1/gyms/favorites` - Add favorite
- `DELETE /api/v1/gyms/favorites/:gymId` - Remove favorite

**Admin Endpoints**
- `POST /api/v1/admin/gyms` - Create gym
- `PUT /api/v1/admin/gyms/:id` - Update gym
- `DELETE /api/v1/admin/gyms/:id` - Delete gym
- `POST /api/v1/admin/gyms/:id/pictures` - Upload gym picture
- `POST /api/v1/admin/gyms/stuff` - Create equipment
- `PUT /api/v1/admin/gyms/stuff/:id` - Update equipment
- `DELETE /api/v1/admin/gyms/stuff/:id` - Delete equipment

### Session Service (Port: 5504) ✅

Training session booking and management service.

**Session Management**
- `GET /api/v1/sessions` - Get all sessions
- `GET /api/v1/sessions/available-slots` - Get available time slots
- `GET /api/v1/sessions/alternative-slots` - Get alternative slots
- `GET /api/v1/sessions/history` - Get session history
- `GET /api/v1/sessions/search/:gymId` - Search sessions by gym
- `GET /api/v1/sessions/feedback/:id` - Get session feedback
- `POST /api/v1/sessions/feedback/:id` - Submit feedback
- `GET /api/v1/sessions/user/:userId` - Get user sessions
- `GET /api/v1/sessions/:id` - Get session details
- `POST /api/v1/sessions` - Create session
- `PATCH /api/v1/sessions/:id` - Update session
- `POST /api/v1/sessions/:id/cancel` - Cancel session
- `PUT /api/v1/sessions/extratime/:id` - Request extra time

**Reservation System**
- `POST /api/v1/sessions/reservations` - Create reservation
- `POST /api/v1/sessions/reservations/:reservationId/confirm` - Confirm reservation

**Check-in/Check-out**
- `POST /api/v1/sessions/checkin/:id` - Check in to session
- `POST /api/v1/sessions/checkout/:id` - Check out from session

**Invitee Management**
- `POST /api/v1/sessions/invitee` - Add invitee
- `GET /api/v1/sessions/invitee/:id` - Get invitee
- `GET /api/v1/sessions/:sessionId/invitees` - Get session invitees
- `PUT /api/v1/sessions/invitee/:id` - Update invitee
- `DELETE /api/v1/sessions/invitee/:id` - Delete invitee
- `POST /api/v1/sessions/invite` - Invite guests
- `PUT /api/v1/sessions/invitation/:id` - Update invitation

**Waiting List**
- `POST /api/v1/sessions/wait/join` - Join waiting list
- `PUT /api/v1/sessions/wait/:id` - Update waiting list status
- `PUT /api/v1/sessions/wait/leave/:id` - Leave waiting list

**Session Reviews**
- `GET /api/v1/sessions/reviews` - Get reviews
- `GET /api/v1/sessions/reviews/:id` - Get review details
- `POST /api/v1/sessions/reviews` - Create review
- `PUT /api/v1/sessions/reviews/:id` - Update review
- `DELETE /api/v1/sessions/reviews/:id` - Delete review

**Admin Endpoints**
- `GET /api/v1/admin/sessions/available-slots` - Admin available slots
- `GET /api/v1/admin/sessions/analytics` - Session analytics
- `GET /api/v1/admin/sessions/all` - Get all sessions
- `POST /api/v1/admin/sessions/` - Create session
- `POST /api/v1/admin/sessions/book` - Book session for user
- `POST /api/v1/admin/sessions/stats/bookings` - Get booking statistics
- `GET /api/v1/admin/sessions/:id` - Get session details
- `DELETE /api/v1/admin/sessions/:id` - Delete session
- `POST /api/v1/admin/sessions/:id/cancel` - Cancel session
- `POST /api/v1/admin/sessions/:id/approve` - Approve content
- `POST /api/v1/admin/sessions/:id/decline` - Decline content
- `POST /api/v1/admin/sessions/force-checkin` - Force check-in
- `POST /api/v1/admin/sessions/cleanup-expired-reservations` - Cleanup reservations

### Payment Service (Port: 5505) ✅

Payment processing and credit management service.

**Credits Management**
- `GET /api/v1/credits/users/:userId` - Get user credits
- `GET /api/v1/credits/users/:userId/history` - Get credit history
- `POST /api/v1/credits/users/:userId/add` - Add credits (admin)
- `POST /api/v1/credits/users/:userId/consume` - Consume credits
- `POST /api/v1/credits/users/:userId/consume-smart` - Smart consume with priority
- `POST /api/v1/credits/users/:userId/transfer` - Transfer credits
- `POST /api/v1/credits/add-credits` - Purchase credits

**Credit Packs**
- `GET /api/v1/payments/credit-packs` - Get all credit packs
- `GET /api/v1/payments/credit-packs/:id` - Get credit pack details
- `POST /api/v1/payments/credit-packs` - Create credit pack (admin)
- `PUT /api/v1/payments/credit-packs/:id` - Update credit pack (admin)
- `DELETE /api/v1/payments/credit-packs/:id` - Delete credit pack (admin)

**Memberships**
- `GET /api/v1/payments/memberships` - Get user memberships
- `GET /api/v1/payments/memberships/history` - Get membership history
- `POST /api/v1/payments/memberships` - Create membership
- `PUT /api/v1/payments/memberships/:id/cancel` - Cancel membership

**Promo Codes**
- `GET /api/v1/payments/promo-codes/:code` - Validate promo code
- `POST /api/v1/payments/promo-codes` - Create promo code (admin)
- `PUT /api/v1/payments/promo-codes/:id` - Update promo code (admin)
- `DELETE /api/v1/payments/promo-codes/:id` - Delete promo code (admin)

**Products**
- `GET /api/v1/payments/products` - Get all products
- `GET /api/v1/payments/products/:id` - Get product details

**Webhooks**
- `POST /api/v1/payments/webhooks/stripe` - Stripe webhook (raw body)

### Subscription Service (Port: 5506) ✅

Subscription plan and management service.

**Subscription Management**
- `GET /api/v1/subscriptions/me` - Get my subscription
- `POST /api/v1/subscriptions` - Create subscription
- `GET /api/v1/subscriptions/:id` - Get subscription details
- `PUT /api/v1/subscriptions/:id` - Update subscription
- `POST /api/v1/subscriptions/:id/cancel` - Cancel subscription
- `POST /api/v1/subscriptions/:id/reactivate` - Reactivate subscription

**Plans**
- `GET /api/v1/subscriptions/plans` - Get all plans
- `GET /api/v1/subscriptions/plans/:id` - Get plan details
- `POST /api/v1/subscriptions/plans` - Create plan (admin)
- `PUT /api/v1/subscriptions/plans/:id` - Update plan (admin)
- `DELETE /api/v1/subscriptions/plans/:id` - Delete plan (admin)

**Admin Endpoints**
- `GET /api/v1/subscriptions` - Get all subscriptions (admin)
- `POST /api/v1/subscriptions/:id/process-credits` - Process credits

**Internal Endpoints**
- `GET /internal/subscriptions/check/:userId` - Check active subscription
- `POST /internal/subscriptions/event` - Process subscription event

### Communication Service (Port: 5507) ✅

Email and notification management service.

**Email**
- `POST /api/v1/communications/emails/send` - Send email
- `POST /api/v1/communications/emails/send-bulk` - Send bulk email (admin)
- `GET /api/v1/communications/emails/history` - Get email history
- `GET /api/v1/communications/emails/history/:id` - Get email details

**Notifications**
- `GET /api/v1/notifications` - Get user notifications
- `GET /api/v1/notifications/:id` - Get notification details
- `PUT /api/v1/notifications/:id/read` - Mark as read
- `PUT /api/v1/notifications/read-all` - Mark all as read
- `DELETE /api/v1/notifications/:id` - Delete notification
- `PUT /api/v1/notifications/preferences` - Update preferences

**Templates**
- `GET /api/v1/communications/templates` - Get all templates
- `GET /api/v1/communications/templates/:id` - Get template details
- `POST /api/v1/communications/templates` - Create template (admin)
- `PUT /api/v1/communications/templates/:id` - Update template (admin)
- `DELETE /api/v1/communications/templates/:id` - Delete template (admin)

**Internal Endpoints**
- `POST /internal/communications/email/send` - Send system email
- `POST /internal/communications/notification/create` - Create system notification

### Social Service (Port: 5508) ✅

Social networking and activity feed service.

**Friend Management**
- `POST /api/v1/friends/request` - Send friend request
- `PUT /api/v1/friends/:id/accept` - Accept friend request
- `PUT /api/v1/friends/:id/decline` - Decline friend request
- `DELETE /api/v1/friends/:id/cancel` - Cancel friend request
- `GET /api/v1/friends` - Get friends list
- `GET /api/v1/friends/requests` - Get friend requests
- `GET /api/v1/friends/requests/sent` - Get sent requests
- `GET /api/v1/friends/blocked` - Get blocked users
- `GET /api/v1/friends/discover/suggestions` - Get suggestions
- `GET /api/v1/friends/discover/mutual/:userId` - Get mutual friends
- `PUT /api/v1/friends/:id/block` - Block user
- `PUT /api/v1/friends/:id/unblock` - Unblock user

**Activity Feed**
- `GET /api/v1/social/activities` - Get activity feed
- `GET /api/v1/social/activities/:id` - Get activity details
- `POST /api/v1/social/activities` - Create activity
- `DELETE /api/v1/social/activities/:id` - Delete activity

**Follow System**
- `POST /api/v1/social/follow/:userId` - Follow user
- `DELETE /api/v1/social/follow/:userId` - Unfollow user
- `GET /api/v1/social/followers` - Get followers
- `GET /api/v1/social/following` - Get following

**Interactions**
- `POST /api/v1/social/activities/:activityId/like` - Like activity
- `DELETE /api/v1/social/activities/:activityId/like` - Unlike activity
- `POST /api/v1/social/activities/:activityId/comment` - Add comment
- `GET /api/v1/social/activities/:activityId/comments` - Get comments
- `DELETE /api/v1/social/comments/:commentId` - Delete comment

**Discovery**
- `GET /api/v1/social/discover` - Discover content
- `GET /api/v1/social/sessions/:sessionId/participants` - Get session participants

### Support Service (Port: 5509) ✅

Customer support and problem reporting service.

**Problem Management**
- `GET /api/v1/problems` - Get user's problems
- `GET /api/v1/problems/:id` - Get problem details
- `POST /api/v1/problems` - Create problem report
- `PUT /api/v1/problems/:id` - Update problem
- `DELETE /api/v1/problems/:id` - Delete problem

**Comments**
- `GET /api/v1/problems/:problemId/comments` - Get comments
- `POST /api/v1/problems/:problemId/comments` - Add comment
- `PUT /api/v1/support/comments/:id` - Update comment
- `DELETE /api/v1/support/comments/:id` - Delete comment

**Admin Endpoints**
- `GET /api/v1/admin/support/problems` - Get all problems
- `PUT /api/v1/admin/support/problems/:id/assign` - Assign problem
- `PUT /api/v1/admin/support/problems/:id/priority` - Set priority

### Storage Service (Port: 5510) ✅

File upload and management service.

**File Operations**
- `POST /api/v1/files/upload` - Upload single file
- `POST /api/v1/files/upload-multiple` - Upload multiple files
- `GET /api/v1/files/:id` - Get file
- `GET /api/v1/files/:id/download` - Download file
- `DELETE /api/v1/files/:id` - Delete file
- `GET /api/v1/files` - List user files

**Admin Endpoints**
- `GET /api/v1/admin/files` - Get all files
- `DELETE /api/v1/admin/files/:id` - Delete any file

## Authentication & Authorization

### Authentication Method
All endpoints (except public ones) require JWT authentication via Bearer token:
```
Authorization: Bearer {jwt_access_token}
```

### Public Endpoints
- All `/api/v1/auth/*` endpoints (except change-password and userinfo)
- `GET /health`
- `POST /api/v1/payments/webhooks/stripe`

### Role-Based Access Control
- **User Role**: Access to all non-admin endpoints
- **Admin Role**: Access to all endpoints including admin-specific operations

## Request/Response Format

### Standard Success Response
```json
{
  "data": {}, // Response data
  "pagination": { // For list endpoints
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Standard Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [{
      "field": "email",
      "message": "Invalid email format"
    }],
    "correlationId": "req_123456",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Request validation failed
- `CONFLICT` - Resource conflict
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

## Common Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Sorting
- `sort` - Field to sort by (e.g., `createdAt`)
- `order` - Sort direction (`asc` or `desc`)

### Filtering
Service-specific filter parameters as query strings

## Rate Limiting

Implemented at API Gateway level:
- **Anonymous**: 100 requests per hour
- **Authenticated**: 1000 requests per hour
- **Admin**: 5000 requests per hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642291200
```

## Webhook Support

### Stripe Webhooks
- Endpoint: `POST /api/v1/payments/webhooks/stripe`
- Requires raw body for signature verification
- Events: payment.succeeded, subscription.created, etc.

### Event Types
- Session events: created, updated, cancelled, completed
- Payment events: succeeded, failed, refunded
- User events: created, updated, verified

## Inter-Service Communication

### Authentication
Internal service calls use:
```
x-api-key: {service_api_key}
x-service-name: {calling_service_name}
x-correlation-id: {request_correlation_id}
```

### Service Clients
Each service has dedicated client classes for inter-service communication:
- `UserServiceClient`
- `CommunicationServiceClient`
- `PaymentServiceClient`
- `SubscriptionServiceClient`
- etc.

## Technology Stack

- **Runtime**: Node.js 22.x
- **Language**: TypeScript 5.8.3
- **Framework**: Express 5.x
- **Database**: PostgreSQL with Prisma 6.11.1
- **Cache**: Redis with ioredis 5.6.1
- **Validation**: Zod schemas
- **Logging**: Pino 9.7.0
- **Testing**: Vitest 3.2.4
- **Build**: esbuild, NX 21.2.2

## API Versioning

Current version: v1
- URL versioning pattern: `/api/v1/*`
- Breaking changes will increment version

## Migration Status

✅ **100% Complete** - All services successfully migrated to microservices architecture

### Key Improvements from Previous Architecture
1. **OAuth 2.0 Standard** - Industry-standard authentication
2. **Clean Architecture** - Clear separation of concerns
3. **Microservices** - Independent, scalable services
4. **Type Safety** - Full TypeScript with Zod validation
5. **Modern Stack** - Latest Node.js, Express 5, Prisma 6
6. **Service Mesh** - Inter-service communication patterns
7. **API Gateway** - Centralized routing and auth
8. **Event-Driven** - Webhook support for integrations

## Total Endpoint Count

**Total**: 250+ endpoints across 11 microservices
- Public endpoints: 15
- Authenticated endpoints: 200+
- Admin endpoints: 50+
- Internal endpoints: 20+

Last Updated: 2025-01-11