# RBAC Implementation Plan - Unauthorized Data Access Prevention

_Extension of SECURITY_ANALYSIS_REPORT.md - Critical Issue #1_

## Executive Summary

This document provides a comprehensive plan to implement proper Role-Based Access Control (RBAC) with resource-level authorization to prevent unauthorized data access in the Pika application. The current implementation has authentication but lacks proper authorization controls.

## Current State Analysis

### What We Have ✅

1. **Authentication Infrastructure**
   - JWT-based authentication at API Gateway
   - Token validation middleware (`packages/http/src/infrastructure/fastify/middleware/auth.ts`)
   - User context propagation via headers
   - Redis integration for token management

2. **Basic Role System**
   - Three roles defined: ADMIN, CUSTOMER, SERVICE_PROVIDER
   - Roles stored in JWT tokens
   - Role-to-permission mapping exists but unused

3. **User Context Flow**
   ```
   Client → API Gateway (JWT validation) → Headers → Services
   Headers: x-user-id, x-user-email, x-user-role
   ```

### What's Missing ❌

1. **Permission Enforcement**
   - Permissions are mapped but never checked
   - No middleware to validate permissions
   - No route-level authorization

2. **Resource-Level Access Control**
   - No ownership validation
   - Missing "can user X access resource Y?" checks
   - No data filtering based on user context

3. **Authorization Patterns**
   - Inconsistent authorization across services
   - No standardized authorization decorators
   - Missing audit trail for access attempts

## Implementation Plan

### Phase 1: Foundation (Week 1)

#### 1.1 Create Authorization Middleware

**Location**: `packages/shared/src/auth/middleware/`

```typescript
// AuthorizationMiddleware.ts
export interface AuthorizationOptions {
  permissions?: string[]
  roles?: Role[]
  checkOwnership?: boolean
  resourceType?: 'booking' | 'service' | 'message' | 'notification'
}

export function authorize(options: AuthorizationOptions) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userContext = extractUserContext(request)

    // Check role-based permissions
    if (options.permissions?.length) {
      if (!hasPermissions(userContext, options.permissions)) {
        throw new ForbiddenError('Insufficient permissions')
      }
    }

    // Check resource ownership if needed
    if (options.checkOwnership) {
      const resourceId = extractResourceId(request)
      const hasAccess = await checkResourceAccess(userContext, resourceId, options.resourceType)
      if (!hasAccess) {
        throw new ForbiddenError('Access denied to resource')
      }
    }
  }
}
```

#### 1.2 Implement Resource Access Validators

**Location**: `packages/shared/src/auth/validators/`

```typescript
// ResourceAccessValidator.ts
export interface ResourceAccessValidator {
  canUserAccessResource(userId: string, resourceId: string, resourceType: string, action: 'read' | 'write' | 'delete'): Promise<boolean>
}

// Specific validators for each domain
export class BookingAccessValidator implements ResourceAccessValidator {
  async canUserAccessResource(userId: string, bookingId: string, action: string): Promise<boolean> {
    // Check if user is customer or provider of the booking
    const booking = await this.bookingRepo.findById(bookingId)
    if (!booking) return false

    return booking.customerId === userId || (await this.isServiceProvider(userId, booking.serviceId))
  }
}
```

#### 1.3 Update Repository Methods

**Pattern for all repositories**:

```typescript
// Before (vulnerable)
async getAllBookings(params: BookingSearchQuery): Promise<PaginatedResult<BookingDomain>> {
  // No user context validation
  const where = this.buildWhereClause(params)
  return this.prisma.booking.findMany({ where })
}

// After (secure)
async getAllBookings(
  params: BookingSearchQuery,
  userContext: UserContext
): Promise<PaginatedResult<BookingDomain>> {
  const where = this.buildWhereClause(params)

  // Add user-specific filtering
  if (userContext.role === 'CUSTOMER') {
    where.customerId = userContext.userId
  } else if (userContext.role === 'SERVICE_PROVIDER') {
    where.service = {
      providerId: await this.getProviderIdForUser(userContext.userId)
    }
  }
  // ADMIN sees all

  return this.prisma.booking.findMany({ where })
}
```

### Phase 2: Service Implementation (Week 2)

#### 2.1 Update Controllers

**Example: BookingController**

```typescript
export class BookingController {
  // Before
  async getBookings(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as BookingSearchQuery
    const result = await this.getBookingsHandler.execute(query)
    return reply.send(result)
  }

  // After
  @authorize({
    permissions: ['booking:read'],
    checkOwnership: true,
    resourceType: 'booking',
  })
  async getBookings(request: FastifyRequest, reply: FastifyReply) {
    const userContext = extractUserContext(request)
    const query = request.query as BookingSearchQuery
    const result = await this.getBookingsHandler.execute(query, userContext)
    return reply.send(result)
  }
}
```

#### 2.2 Update Use Cases

**Example: GetBookingsHandler**

```typescript
export class GetBookingsHandler {
  async execute(
    query: BookingSearchQuery,
    userContext: UserContext, // New parameter
  ): Promise<PaginatedResult<BookingDomain>> {
    // Validate user can perform this action
    if (!this.authService.canUserListBookings(userContext)) {
      throw new ForbiddenError('Cannot list bookings')
    }

    // Pass user context to repository
    return this.repository.getAllBookings(query, userContext)
  }
}
```

#### 2.3 Fix User-to-Provider Mapping

**Create dedicated service**: `packages/shared/src/auth/services/UserContextService.ts`

```typescript
export class UserContextService {
  private cache: ICacheService

  async getProviderIdForUser(userId: string): Promise<string | null> {
    // Check cache first
    const cached = await this.cache.get(`provider:${userId}`)
    if (cached) return cached

    // Query database
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId },
    })

    if (provider) {
      await this.cache.set(`provider:${userId}`, provider.id, 3600)
    }

    return provider?.id || null
  }

  async enrichUserContext(basicContext: BasicUserContext): Promise<UserContext> {
    const providerId = await this.getProviderIdForUser(basicContext.userId)
    return {
      ...basicContext,
      providerId,
      permissions: await this.loadUserPermissions(basicContext.userId),
    }
  }
}
```

### Phase 3: Advanced Features (Week 3)

#### 3.1 Database Schema for Permissions

```sql
-- Add permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(100),
  action VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add role_permissions junction table
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- Add user_permissions for direct assignment
CREATE TABLE user_permissions (
  user_id UUID REFERENCES users(id),
  permission_id UUID REFERENCES permissions(id),
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, permission_id)
);
```

#### 3.2 Audit Logging

```typescript
export class AuthorizationAuditLogger {
  async logAccessAttempt(userId: string, resource: string, resourceId: string, action: string, allowed: boolean, reason?: string): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        resource,
        resourceId,
        action,
        allowed,
        reason,
        timestamp: new Date(),
        ip: this.request.ip,
        userAgent: this.request.headers['user-agent'],
      },
    })
  }
}
```

#### 3.3 Policy-Based Access Control

```typescript
// Define policies in code or database
export const bookingPolicies: Policy[] = [
  {
    name: 'customer-own-bookings',
    effect: 'allow',
    actions: ['booking:read', 'booking:update'],
    resources: ['booking:*'],
    conditions: {
      StringEquals: {
        'booking:customerId': '${user.id}',
      },
    },
  },
  {
    name: 'provider-service-bookings',
    effect: 'allow',
    actions: ['booking:read', 'booking:update'],
    resources: ['booking:*'],
    conditions: {
      StringEquals: {
        'booking:service.providerId': '${user.providerId}',
      },
    },
  },
]
```

## Implementation Priority

### Critical (Immediate)

1. **Authorization Middleware** - Prevents unauthorized access
2. **Resource Access Validators** - Ensures ownership validation
3. **Repository Filtering** - Adds user context to queries
4. **User Context Service** - Fixes user-to-provider mapping

### High Priority (Week 1)

5. **Controller Updates** - Add authorization decorators
6. **Use Case Updates** - Pass user context through layers
7. **Integration Tests** - Verify authorization works

### Medium Priority (Week 2)

8. **Database Schema** - Move permissions to database
9. **Audit Logging** - Track access attempts
10. **Performance Optimization** - Cache permission checks

## Testing Strategy

### Unit Tests

```typescript
describe('AuthorizationMiddleware', () => {
  it('should deny access without required permissions', async () => {
    const request = createMockRequest({ role: 'CUSTOMER' })
    const middleware = authorize({ permissions: ['admin:write'] })

    await expect(middleware(request, reply)).rejects.toThrow('Insufficient permissions')
  })

  it('should allow access with correct permissions', async () => {
    const request = createMockRequest({
      role: 'ADMIN',
      permissions: ['admin:write'],
    })
    const middleware = authorize({ permissions: ['admin:write'] })

    await expect(middleware(request, reply)).resolves.not.toThrow()
  })
})
```

### Integration Tests

```typescript
describe('Booking Authorization', () => {
  it('customer should only see own bookings', async () => {
    const customer = await createTestCustomer()
    const otherCustomer = await createTestCustomer()

    await createBooking({ customerId: customer.id })
    await createBooking({ customerId: otherCustomer.id })

    const response = await api.get('/bookings').set('Authorization', `Bearer ${customer.token}`)

    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0].customerId).toBe(customer.id)
  })
})
```

## Migration Path

### Step 1: Add Authorization Without Breaking Changes

- Deploy authorization middleware in "warn" mode
- Log authorization failures without blocking
- Monitor for issues

### Step 2: Enable Enforcement Gradually

- Start with read operations
- Enable for non-critical endpoints first
- Monitor error rates

### Step 3: Full Enforcement

- Enable for all endpoints
- Remove "warn" mode
- Implement strict authorization

## Performance Considerations

1. **Caching Strategy**
   - Cache user permissions (5-minute TTL)
   - Cache provider ID mappings (1-hour TTL)
   - Cache resource ownership checks (1-minute TTL)

2. **Database Optimization**
   - Index on user_id in all resource tables
   - Composite indexes for common queries
   - Materialized views for complex permission checks

3. **Monitoring**
   - Track authorization check latency
   - Monitor cache hit rates
   - Alert on authorization failures

## Security Best Practices

1. **Principle of Least Privilege**
   - Default deny all access
   - Explicitly grant required permissions
   - Regular permission audits

2. **Defense in Depth**
   - Multiple authorization layers
   - Validate at API Gateway and service level
   - Database-level row security

3. **Audit Trail**
   - Log all authorization decisions
   - Track permission changes
   - Regular security reviews

## Success Criteria

1. **Zero unauthorized data access**
   - No cross-user data leakage
   - Proper resource isolation
   - Failed authorization attempts logged

2. **Performance maintained**
   - < 50ms authorization overhead
   - > 90% cache hit rate
   - No significant latency increase

3. **Developer experience**
   - Clear authorization patterns
   - Easy to add new permissions
   - Comprehensive documentation

## Timeline

- **Week 1**: Foundation implementation
- **Week 2**: Service updates and testing
- **Week 3**: Advanced features and optimization
- **Week 4**: Full deployment and monitoring

## Next Steps

1. Review and approve this plan
2. Create implementation tickets
3. Begin with authorization middleware
4. Update critical services first
5. Roll out incrementally with monitoring

---

_This plan addresses Critical Issue #1 from SECURITY_ANALYSIS_REPORT.md_
