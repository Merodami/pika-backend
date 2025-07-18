# API Schema and Documentation Standardization Guide

## Overview

This document establishes the naming conventions and standards for all API schemas across the Solo60 platform. Consistent naming helps developers quickly understand the purpose and scope of each schema.

## Schema Naming Convention

### 1. Prefix Requirements (When Needed)

Prefixes should be used sparingly and only when schemas need to be disambiguated:

- **No prefix** - Default for public API schemas
- **`Admin`** - For administrative API endpoints (when different from public)
- **`Internal`** - For service-to-service communication only

**Industry Best Practice**: Most APIs don't prefix every schema. Instead, they use:

- Clear folder structure (`/public`, `/admin`, `/internal`)
- Namespace imports (`publicSchemas.CreateUserRequest`)
- Only prefix when there's actual naming conflict

### 2. Suffix Requirements

All schemas MUST end with one of the following suffixes to indicate their purpose:

#### Request/Response Suffixes

- **`Request`** - For request body schemas
- **`Response`** - For response body schemas

#### Parameter Suffixes

- **`Query`** - For query string parameters
- **`Params`** - For URL path parameters
- **`Headers`** - For header parameters (rare)

#### Data Model Suffixes (for nested schemas only)

- **`Data`** - For data transfer objects
- **`Domain`** - For domain models (SDK only)
- **`DTO`** - For complex nested objects

### 3. Naming Pattern

The complete pattern follows REST/industry conventions:

```
[Entity][Action][Suffix]
```

With optional prefix only when needed:

```
[Prefix][Entity][Action][Suffix]
```

**Industry Examples**:

- Stripe: `CreateCustomerRequest`, `CustomerResponse`
- AWS: `CreateBucketRequest`, `ListBucketsResponse`
- Google: `GetUserRequest`, `User` (for response)
- GitHub: `CreateRepositoryRequest`, `Repository`

## Examples

### ✅ Industry-Standard Schema Names

#### Public API (Default - No Prefix)

```typescript
// Requests
MarkNotificationsReadRequest
CreateSessionRequest
UpdateProfileRequest
PurchaseCreditPackRequest

// Responses
NotificationListResponse
SessionResponse // Single entity
SessionListResponse // Multiple entities
UserProfileResponse
BookingConfirmationResponse

// Query Parameters
SessionSearchParams // Industry prefers 'Params' over 'Query'
NotificationFilterParams
PaginationParams

// Path Parameters
SessionIdParam // Singular for single param
UserIdParam
NotificationIdParam

// DTOs (Data Transfer Objects)
SessionDTO // When different from domain model
UserDTO
NotificationDTO
```

#### Admin API (Prefix only when different from public)

```typescript
// Requests - Only prefix if behavior differs from public
BanUserRequest // If public can't ban
AdminRefundTransactionRequest // If refund logic differs
CreateGymRequest // Same as public? No prefix
UpdateSystemConfigRequest

// Responses
UserListResponse // Reuse if same structure
AdminDashboardStatsResponse // Admin-specific
TransactionDetailResponse
SystemHealthResponse

// Parameters
UserSearchParams // Reuse if same
TransactionFilterParams
DateRangeParams // Generic, reusable
```

#### Internal API

```typescript
// Requests
InternalValidateTokenRequest
InternalProcessSubscriptionRequest
InternalSendEmailRequest
InternalCheckUserPermissionRequest

// Responses
InternalTokenValidationResponse
InternalUserDetailsResponse
InternalSubscriptionStatusResponse
InternalEmailSentResponse

// Query Parameters
InternalServiceFilterQuery
InternalHealthCheckQuery

// Path Parameters
InternalServiceIdParams
InternalRequestIdParams
```

### ❌ Poor Naming Practices

```typescript
// Overly verbose
PublicMarkNotificationsReadRequest // Just: MarkNotificationsReadRequest
PublicUserProfileResponse // Just: UserProfileResponse

// Wrong suffix
UserProfileData // Should be: UserProfileResponse
UserSearchQuery // Should be: UserSearchParams

// Inconsistent naming
UserProfile // Should be: UserProfileResponse or User
GetUsers // Should be: UserListResponse
UsersResponse // Should be: UserListResponse

// Poor action names
UserFetchRequest // Should be: GetUserRequest
UserRetrieveRequest // Should be: GetUserRequest
```

## Industry Best Practices

### 1. Common Patterns

```typescript
// Entity-based responses (like GitHub, Stripe)
export const User = z.object({...})           // The entity
export const UserResponse = User              // Same as entity
export const UserListResponse = z.object({    // List wrapper
  data: z.array(User),
  pagination: Pagination
})

// Action-based requests (like Google APIs)
export const CreateUserRequest = z.object({...})
export const UpdateUserRequest = z.object({...})
export const GetUserRequest = z.object({ id: z.string() })

// Shared schemas (no prefix needed)
export const ErrorResponse = z.object({...})  // Used everywhere
export const PaginationParams = z.object({...})
export const DateRangeParams = z.object({...})
```

### 2. When to Use Prefixes

```typescript
// ✅ Good: Only prefix when schemas actually differ
export const CreateUserRequest = z.object({  // Public
  email: z.string(),
  password: z.string()
})

export const AdminCreateUserRequest = z.object({  // Admin has more fields
  email: z.string(),
  password: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  verified: z.boolean()
})

// ❌ Bad: Unnecessary prefixing
export const PublicErrorResponse = z.object({...})
export const AdminErrorResponse = z.object({...})  // Same structure!
```

### 2. Nested Objects

For complex nested objects within request/response schemas:

```typescript
// Nested object for public API
const PublicSessionInviteeData = z.object({
  userId: z.string(),
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED']),
})

// Used within a response
export const PublicSessionDetailResponse = z.object({
  id: z.string(),
  invitees: z.array(PublicSessionInviteeData), // Nested object
})
```

### 3. Modern API Patterns

```typescript
// RESTful resource naming
GET /users          → UserListResponse
GET /users/:id      → UserResponse (or just User)
POST /users         → CreateUserRequest → UserResponse
PUT /users/:id      → UpdateUserRequest → UserResponse
DELETE /users/:id   → (no body) → DeleteUserResponse

// Enums (no prefix needed)
export const SessionStatus = z.enum(['PENDING', 'ACTIVE', 'COMPLETED'])
export const NotificationType = z.enum(['EMAIL', 'SMS', 'PUSH'])

// Nested resources
GET /users/:id/sessions → UserSessionListResponse
POST /sessions/:id/invite → InviteToSessionRequest
```

## File Organization

### Directory Structure

```
packages/api/src/
├── common/
│   └── schemas/
│       ├── primitives.ts      // UUID, DateTime, etc. (no branding)
│       ├── branded.ts         // UserId, GymId, Email, Money (domain-specific)
│       ├── responses.ts       // ErrorResponse, MessageResponse
│       └── metadata.ts        // withTimestamps, pagination helpers
├── public/
│   └── schemas/
│       ├── auth/
│       │   ├── login.ts        // LoginRequest, LoginResponse
│       │   ├── register.ts     // RegisterRequest, RegisterResponse
│       │   └── password.ts     // ResetPasswordRequest, etc.
│       └── session/
│           ├── booking.ts      // BookSessionRequest, etc.
│           └── session.ts      // SessionDetailResponse, etc.
├── admin/
│   └── schemas/
│       ├── user/
│       │   ├── management.ts  // AdminUserListResponse, BanUserRequest
│       │   └── parameters.ts  // UserIdParam, EmailParam (shared params)
│       └── dashboard.ts       // DashboardStatsResponse
└── internal/
    └── schemas/
        ├── auth/
        │   └── service.ts      // InternalValidateTokenRequest, etc.
        └── user/
            └── service.ts      // InternalUserDetailsResponse, etc.
```

## Schema Architecture Patterns

### 1. Proper Type Hierarchy

```typescript
// ❌ WRONG: Creating primitive types in every file
export const UUID = z.string().uuid()
export const UserId = z.string().uuid()

// ✅ CORRECT: Use centralized type system
import { UUID, UserId } from '../../common/schemas/primitives.js' // Generic UUID
import { UserId } from '../../common/schemas/branded.js' // Domain-specific UserId
```

### 2. Avoid Duplicate Schemas

```typescript
// ❌ WRONG: Creating the same schema in multiple files
// File: admin/schemas/user/management.ts
export const UserIdParam = z.object({ id: UserId })

// File: admin/schemas/user/parameters.ts
export const UserIdParam = z.object({ id: UserId }) // DUPLICATE!

// ✅ CORRECT: Create once, import everywhere
// File: admin/schemas/user/parameters.ts (SINGLE SOURCE)
export const UserIdParam = openapi(z.object({ id: UserId }), { description: 'User ID path parameter' })

// File: admin/schemas/user/management.ts (IMPORT)
import { UserIdParam } from './parameters.js'
```

### 3. Proper Use of Branded vs Primitive Types

```typescript
// ✅ CORRECT: Use branded types for domain objects
import { UserId, GymId, Email, Money } from '../../common/schemas/branded.js'

export const CreateUserRequest = z.object({
  email: Email, // Branded - validates + normalizes + type safety
  gymId: GymId, // Branded - prevents mixing different ID types
  credits: Money, // Branded - enforces cents, non-negative
})

// ✅ CORRECT: Use primitives for generic/internal data
import { UUID, DateTime } from '../../common/schemas/primitives.js'

export const SystemLogEntry = z.object({
  id: UUID, // Generic UUID, no domain meaning
  timestamp: DateTime, // Standard datetime handling
  data: z.record(z.any()),
})
```

### 4. Parameter Schema Organization

```typescript
// ✅ CORRECT: Dedicated parameter files for reusable params
// File: admin/schemas/user/parameters.ts
export const UserIdParam = openapi(z.object({ id: UserId }), {...})
export const EmailParam = openapi(z.object({ email: Email }), {...})
export const DateRangeQuery = openapi(z.object({
  fromDate: DateTime.optional(),
  toDate: DateTime.optional(),
}), {...})

// File: admin/schemas/gym/parameters.ts
export const GymIdParam = openapi(z.object({ id: GymId }), {...})

// File: any schema file that needs these
import { UserIdParam, DateRangeQuery } from '../user/parameters.js'
import { GymIdParam } from '../gym/parameters.js'
```

### 5. Schema Naming Consistency

```typescript
// ✅ CORRECT: Follow exact naming convention
export const UserListResponse = paginatedResponse(UserDetailResponse)
export const CreateUserRequest = z.object({...})
export const UpdateUserRequest = z.object({...})
export const UserSearchParams = z.object({...})  // Query parameters
export const UserIdParam = z.object({...})       // Path parameters

// ❌ WRONG: Inconsistent naming
export const AdminUserDetailResponse = UserDetail  // Don't alias
export const AdminUserQueryParams = UserSearchParams  // Don't rename
export const BulkUserActionRequest = BulkUserUpdateRequest  // Don't alias
```

### 6. Proper Schema Composition

```typescript
// ✅ CORRECT: Compose from base schemas
const BaseUser = z.object({
  email: Email,
  firstName: z.string(),
  lastName: z.string(),
})

export const CreateUserRequest = BaseUser.extend({
  password: Password,
})

export const UserResponse = BaseUser.extend({
  id: UserId,
  createdAt: DateTime,
  // ... other response fields
})

// ❌ WRONG: Duplicate field definitions
export const CreateUserRequest = z.object({
  email: Email, // Repeated
  firstName: z.string(), // Repeated
  lastName: z.string(), // Repeated
  password: Password,
})

export const UserResponse = z.object({
  email: Email, // Repeated again
  firstName: z.string(), // Repeated again
  lastName: z.string(), // Repeated again
  id: UserId,
  createdAt: DateTime,
})
```

### 7. Validation Rules and Business Logic

```typescript
// ✅ CORRECT: Business rules in branded types
// File: common/schemas/branded.ts
export const UserId = z.string().uuid().brand('UserId')
export const Email = z
  .string()
  .email()
  .transform((email) => email.toLowerCase().trim())
  .brand('Email')
export const Money = z.number().int().nonnegative().brand('Money')

// ✅ CORRECT: Use branded types in schemas
export const CreateUserRequest = z.object({
  email: Email, // Automatically gets validation + transformation
  credits: Money, // Automatically enforces business rules
})

// ❌ WRONG: Duplicate validation logic
export const CreateUserRequest = z.object({
  email: z
    .string()
    .email()
    .transform((e) => e.toLowerCase()), // Duplicated logic
  credits: z.number().int().nonnegative(), // Duplicated logic
})
```

## Critical Rules

### ❌ NEVER CREATE ALIASES

```typescript
// ❌ WRONG: Don't create aliases to fix generator mismatches
export const StripeWebhookRequest = StripeWebhookEvent  // ALIAS!
export const CreditBalanceResponse = UserCreditsResponse  // ALIAS!

// ✅ CORRECT: Either rename the original schema or update the generator
export const StripeWebhookRequest = openapi(z.object({...}), {...})  // Proper schema
// OR update generator to use: StripeWebhookEvent (the existing correct name)
```

**Why aliases are bad:**

- Creates confusion about which schema is the "real" one
- Violates single source of truth principle
- Makes code harder to maintain and debug
- Hides the real problem (naming inconsistency)

**Instead of aliases:**

1. **Rename existing schema** to match generator expectations (if appropriate)
2. **Update generator** to use existing correct schema names
3. **Create new proper schema** if genuinely needed (not an alias)

## Implementation Checklist

### Before Creating New Schemas

1. **Check for existing schemas**: Search codebase for similar functionality
2. **Use branded types**: Import from `common/schemas/branded.ts` for domain objects
3. **Use primitives**: Import from `common/schemas/primitives.ts` for generic data
4. **Check parameters**: Look in `*/parameters.ts` files for reusable params
5. **Follow naming**: Use exact conventions (Request/Response/Params suffixes)
6. **NO ALIASES**: Never create aliases - fix the source of truth instead

### Schema Creation Rules

1. **Single Responsibility**: One schema file per logical domain area
2. **No Duplication**: If it exists elsewhere, import it
3. **Proper Imports**: Use the right type hierarchy (branded vs primitive)
4. **Consistent Naming**: Follow the exact naming patterns
5. **Parameter Reuse**: Put reusable params in dedicated parameter files

### Type System Rules

1. **Branded Types**: For domain objects that need type safety (UserId, Email, Money)
2. **Primitive Types**: For generic data without domain meaning (UUID, DateTime)
3. **Validation Logic**: Put business rules in branded types, not in every schema
4. **Composition**: Extend and compose schemas rather than duplicating fields
