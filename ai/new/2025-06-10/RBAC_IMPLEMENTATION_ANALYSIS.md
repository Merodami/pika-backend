# RBAC Implementation Analysis for Pika

## Executive Summary

The current RBAC implementation in Pika is basic and lacks several critical features for a production-ready authorization system. While authentication is properly implemented using JWT tokens with centralized validation at the API Gateway level, the authorization layer is minimal with hardcoded role-to-permission mappings and no fine-grained access control mechanisms.

## Current Implementation Details

### 1. API Gateway Authentication Setup

**Location**: `packages/api-gateway/src/api/server.ts`

- **JWT Authentication**: Centralized at API Gateway using `fastifyAuth` middleware
- **JWT Secret**: Validated from environment variables (minimum 32 characters)
- **Redis Integration**: Optional for token blacklisting and session management
- **Excluded Paths**: Public endpoints configured (health, docs, auth routes)

```typescript
await app.register(fastifyAuth, {
  secret: jwtSecret,
  cacheService: redisService,
  excludePaths: ['/health', '/docs', '/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/forgot-password', '/api/v1/auth/reset-password', '/api/v1/auth/exchange-token'],
})
```

### 2. Current Role System

**Location**: `packages/types/src/enum.ts`

Three hardcoded roles exist:

- `ADMIN`
- `CUSTOMER`
- `SERVICE_PROVIDER`

**Database Schema**: Roles are stored as enums in PostgreSQL (`auth.user_role`)

### 3. JWT Token Structure

**Location**: `packages/auth/src/services/JwtTokenService.ts`

Token payload includes:

```typescript
interface TokenPayload {
  userId: string
  email: string
  role: UserRole
  status: UserStatus
  type: 'access' | 'refresh'
  iat?: number
  exp?: number
  iss?: string
  aud?: string
  jti?: string
}
```

### 4. Permission Mapping

**Location**: `packages/http/src/infrastructure/fastify/middleware/auth.ts`

Hardcoded role-to-permission mapping:

```typescript
function mapRoleToPermissions(role: UserRole): string[] {
  switch (role) {
    case UserRole.ADMIN:
      return ['users:read', 'users:write', 'users:delete', 'services:read', 'services:write', 'services:delete', 'categories:read', 'categories:write', 'categories:delete', 'bookings:read', 'bookings:write', 'bookings:delete', 'admin:dashboard', 'admin:settings']
    case UserRole.SERVICE_PROVIDER:
      return ['services:read', 'services:write', 'services:delete:own', 'bookings:read:own', 'bookings:write:own', 'categories:read', 'users:read:own', 'users:write:own']
    case UserRole.CUSTOMER:
      return ['services:read', 'categories:read', 'bookings:read:own', 'bookings:write', 'users:read:own', 'users:write:own']
  }
}
```

### 5. User Context Propagation

**Location**: `packages/api-gateway/src/api/routes/setupProxyRoutes.ts`

User context is propagated via headers:

- `x-user-id`
- `x-user-email`
- `x-user-role`
- `x-correlation-id`

Services extract user context from headers:

```typescript
const userId = request.user?.id || (request.headers['x-user-id'] as string)
```

### 6. Authorization Checks

**Current State**: No systematic authorization checks at service level

- Controllers check for user presence but not permissions
- No middleware for permission validation
- No resource-level access control (e.g., checking if user owns a resource)
- No role/permission decorators or guards

## Gaps in Current Implementation

### 1. Missing Core RBAC Features

- **No Permission Checking**: While permissions are mapped from roles, they are never actually checked
- **No Authorization Middleware**: No preHandler hooks or decorators to enforce permissions
- **No Resource-Based Access Control**: Cannot check if user owns or has access to specific resources
- **No Dynamic Permissions**: Permissions are hardcoded, cannot be managed at runtime
- **No Permission Hierarchy**: No support for inherited or nested permissions

### 2. Architecture Gaps

- **No Authorization Service**: Authorization logic is scattered across middleware
- **No Permission Storage**: Permissions exist only in code, not in database
- **No Audit Trail**: No logging of authorization decisions
- **No Policy Engine**: No support for complex authorization rules
- **No Delegation**: Cannot grant temporary permissions or delegate access

### 3. Security Gaps

- **Insufficient Validation**: User context from headers is trusted without verification
- **No Scope Limitation**: Tokens have full access, no scope restrictions
- **Missing Rate Limiting**: No permission-based rate limiting
- **No IP/Device Restrictions**: Cannot limit access by IP or device

### 4. Developer Experience Gaps

- **No Authorization Decorators**: Developers must manually check permissions
- **No Testing Utilities**: No helpers for testing authorization scenarios
- **Inconsistent Patterns**: Each service handles authorization differently
- **Poor Documentation**: No clear guidelines on implementing authorization

## What Needs to Be Improved

### 1. Immediate Improvements (Priority 1)

1. **Create Authorization Middleware**
   - Implement permission checking middleware
   - Add decorators for route-level authorization
   - Create resource ownership validators

2. **Implement Permission Checks**
   - Add preHandler hooks to validate permissions
   - Check permissions before executing use cases
   - Validate resource ownership

3. **Standardize Authorization Patterns**
   - Create consistent authorization interfaces
   - Document authorization best practices
   - Provide code examples

### 2. Short-term Improvements (Priority 2)

1. **Dynamic Permission System**
   - Store permissions in database
   - Create permission management APIs
   - Support custom roles

2. **Resource-Based Access Control**
   - Implement ownership checks
   - Add resource-level permissions
   - Support sharing and delegation

3. **Audit and Monitoring**
   - Log authorization decisions
   - Track permission usage
   - Alert on authorization failures

### 3. Long-term Improvements (Priority 3)

1. **Policy-Based Access Control**
   - Implement policy engine (e.g., OPA, Casbin)
   - Support complex authorization rules
   - Enable dynamic policy updates

2. **Advanced Features**
   - Hierarchical permissions
   - Time-based access
   - Contextual permissions (location, device)
   - API key management

3. **Integration Improvements**
   - SSO integration
   - External authorization services
   - Multi-tenant support

## Recommended Implementation Plan

### Phase 1: Foundation (Week 1-2)

1. Create authorization middleware package
2. Implement permission checking decorators
3. Add resource ownership validation
4. Update all controllers to use authorization

### Phase 2: Enhancement (Week 3-4)

1. Move permissions to database
2. Create permission management APIs
3. Implement audit logging
4. Add authorization tests

### Phase 3: Advanced Features (Week 5-6)

1. Implement policy engine
2. Add dynamic role creation
3. Support delegation and sharing
4. Complete documentation

## Example Implementation

### Authorization Middleware

```typescript
// packages/auth/src/middleware/authorize.ts
export function requirePermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user
    if (!user || !user.permissions.includes(permission)) {
      throw ErrorFactory.forbidden(`Permission required: ${permission}`)
    }
  }
}

export function requireOwnership(resourceType: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user
    const resourceId = request.params.id
    const isOwner = await checkOwnership(user.id, resourceType, resourceId)
    if (!isOwner) {
      throw ErrorFactory.forbidden('Access denied to this resource')
    }
  }
}
```

### Usage in Routes

```typescript
fastify.delete(
  '/services/:id',
  {
    preHandler: [requirePermission('services:delete'), requireOwnership('service')],
  },
  controller.deleteService,
)
```

## Conclusion

The current RBAC implementation provides basic authentication but lacks proper authorization. The system needs significant improvements to support fine-grained access control, dynamic permissions, and resource-based authorization. Following the recommended implementation plan will create a robust, scalable authorization system suitable for a production marketplace application.
