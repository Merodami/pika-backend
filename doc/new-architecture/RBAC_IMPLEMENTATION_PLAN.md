# RBAC Implementation Plan - Industry Standard Architecture

## 🏆 **Status: IMPLEMENTED - Industry Best Practices**

**This RBAC system now follows the same patterns used by Google Cloud IAM, AWS IAM, and Microsoft Azure**, implementing a **Zero Trust Security Model** with **Defense in Depth**.

📖 **Complete Architecture Documentation**: `docs/new-architecture/AUTHENTICATION_ARCHITECTURE.md`

## Overview

Our comprehensive Role-Based Access Control (RBAC) system implements industry standards with fine-grained permissions, following the **OAuth 2.0 + RBAC hybrid model** used by major cloud providers.

## ✅ **Current Implementation Status**

### **Successfully Implemented:**

1. **Industry-Standard Authentication Architecture** ✅
   - Zero Trust Security Model with Defense in Depth
   - JWT-based authentication for all user routes
   - API key-based authentication for service-to-service communication
   - Proper separation of authentication vs authorization

2. **Permission-Based Access Control** ✅
   - `requirePermissions('resource:action:scope')` middleware
   - Fine-grained permission system with resource:action:scope format
   - Role-to-permission mapping in `@pika/types`

3. **Context-Aware Authorization** ✅
   - `RequestContext.getContext()` provides authenticated user context
   - Ownership enforcement through user context injection
   - Business logic validation in controller layer

4. **Response Validation** ✅ 
   - All controllers validate responses using Zod schemas
   - Industry standard practice for contract enforcement
   - Runtime safety with proper error handling

### **Reference Implementation: Business Service**

The Business service demonstrates the complete industry-standard pattern:

```typescript
// Layered security architecture
router.get('/me',
  requireAuth(),                                // Layer 1: JWT validation
  requirePermissions('businesses:read:own'),    // Layer 2: Permission check
  validateQuery(BusinessDetailQueryParams),     // Layer 3: Schema validation
  controller.getMyBusiness,                     // Layer 4: Business logic
)

// Controller with ownership enforcement
const context = RequestContext.getContext(req)
if (context.role !== UserRole.BUSINESS) {
  throw ErrorFactory.forbidden('Only business owners can access this endpoint')
}

// Response validation
const response = BusinessMapper.toDTO(business)
const validatedResponse = businessPublic.BusinessResponse.parse(response)
res.json(validatedResponse)
```

## Historical Context Analysis

### Pika-old had:

1. **Fine-grained permission mapping** - Each role mapped to specific permissions (e.g., `users:read`, `vouchers:write:own`)
2. **Permission-based middleware** - `requirePermissions('categories:write')`
3. **Role-based middleware** - `requireAdmin()`, `requireProvider()`, `requireCustomer()`
4. **Auth testing pattern** - Test both functionality AND authorization in the same test

### New architecture has:

1. **Basic role-based middleware** - `requireAdmin()`, `requireUser()`, `requireRole()`
2. **Missing permission mapping** - No fine-grained permissions yet
3. **E2EAuthHelper** - Good for testing different roles

## Implementation Steps

### 1. Enhance Permission Mapping in @pika/types

Update `/packages/types/src/utils.ts` with comprehensive permissions:

```typescript
export function mapRoleToPermissions(role: UserRole): string[] {
  switch (role) {
    case UserRole.ADMIN:
      return [
        // User management
        'users:read',
        'users:write',
        'users:delete',
        // Business management
        'businesses:read',
        'businesses:write',
        'businesses:delete',
        'businesses:verify',
        // Category management
        'categories:read',
        'categories:write',
        'categories:delete',
        // Voucher management
        'vouchers:read',
        'vouchers:write',
        'vouchers:delete',
        'vouchers:publish',
        'vouchers:archive',
        // Notification management
        'notifications:read',
        'notifications:write',
        'notifications:publish',
        'notifications:delete',
        // Payment management
        'payments:read',
        'payments:write',
        'payments:refund',
        // Reports and analytics
        'reports:read',
        'analytics:read',
        // Admin specific
        'admin:dashboard',
        'admin:settings',
        'admin:users',
        'admin:system',
        // Redemption management
        'redemptions:read',
        'redemptions:write',
        'redemptions:delete',
      ]
    case UserRole.BUSINESS:
      return [
        // Own business management
        'businesses:read:own',
        'businesses:write:own',
        // Vouchers for their business
        'vouchers:read:own',
        'vouchers:write:own',
        'vouchers:publish:own',
        'vouchers:update:status',
        // Category access (read-only)
        'categories:read',
        // User profile (own)
        'users:read:own',
        'users:write:own',
        // Notifications (own)
        'notifications:read:own',
        'notifications:write:own',
        // Payments (own)
        'payments:read:own',
        'payments:write:own',
        // Basic analytics for their business
        'analytics:read:own',
        'reports:read:own',
        // Redemption management (own)
        'redemptions:read:own',
        'redemptions:write:own',
      ]
    case UserRole.CUSTOMER:
      return [
        // Browse services and categories
        'businesses:read',
        'categories:read',
        'vouchers:read',
        // Voucher redemption
        'vouchers:redeem',
        // User profile (own)
        'users:read:own',
        'users:write:own',
        // Notifications (own)
        'notifications:read:own',
        'notifications:write:own',
        // Payments (own)
        'payments:read:own',
        'payments:write:own',
        // Redemptions (own)
        'redemptions:read:own',
      ]
    default:
      return []
  }
}
```

### 2. Add requirePermissions Middleware

Update `/packages/http/src/infrastructure/express/middleware/auth.ts`:

```typescript
/**
 * Require specific permissions with support for wildcards and ownership
 */
export function requirePermissions(...permissions: string[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new NotAuthenticatedError('Authentication required'))
    }

    const userPermissions = req.user.permissions || []

    const hasAllPermissions = permissions.every((permission) => {
      // Check exact permission
      if (userPermissions.includes(permission)) {
        return true
      }

      // Check wildcard permissions (e.g., 'admin:*' matches 'admin:dashboard')
      const permissionParts = permission.split(':')
      const wildcardPermission = permissionParts[0] + ':*'

      if (userPermissions.includes(wildcardPermission)) {
        return true
      }

      // For ':own' permissions, we'll need to check ownership in the controller
      // This middleware just checks if user has the permission type
      if (permission.endsWith(':own')) {
        const basePermission = permission.replace(':own', '')
        return userPermissions.includes(permission) || userPermissions.includes(basePermission) || userPermissions.includes(wildcardPermission)
      }

      return false
    })

    if (!hasAllPermissions) {
      return next(new NotAuthorizedError(`Missing required permissions: ${permissions.join(', ')}`))
    }

    next()
  }
}
```

### 3. Create RBAC Test Helper

Create `/packages/tests/src/utils/rbacTestHelper.ts`:

```typescript
import { UserRole } from '@pika/types'
import type { E2EAuthHelper } from './e2eAuth.js'
import type supertest from 'supertest'

interface RBACTestCase {
  role: UserRole | null
  method: string
  endpoint: string
  expectedStatus: number
  data?: any
  description?: string
}

export class RBACTestHelper {
  constructor(
    private authHelper: E2EAuthHelper,
    private request: supertest.SuperTest<supertest.Test>,
  ) {}

  async testPermissionMatrix(testCases: RBACTestCase[]) {
    for (const testCase of testCases) {
      const { role, method, endpoint, expectedStatus, data, description } = testCase

      it(description || `should ${expectedStatus === 200 ? 'allow' : 'deny'} ${role || 'anonymous'} ${method} ${endpoint}`, async () => {
        let client: any

        if (role === null) {
          client = this.request
        } else if (role === UserRole.ADMIN) {
          client = await this.authHelper.getAdminClient()
        } else if (role === UserRole.BUSINESS) {
          client = await this.authHelper.getBusinessClient()
        } else if (role === UserRole.CUSTOMER) {
          client = await this.authHelper.getUserClient()
        }

        let req = client[method.toLowerCase()](endpoint)

        if (data) {
          req = req.send(data)
        }

        const response = await req.set('Accept', 'application/json')
        expect(response.status).toBe(expectedStatus)
      })
    }
  }

  // Helper for testing ownership-based permissions
  async testOwnershipPermissions(endpoint: string, ownerId: string, otherUserId: string) {
    describe('Ownership permissions', () => {
      it('should allow owner to access their resource', async () => {
        const ownerClient = await this.authHelper.getClientForUser(ownerId)
        const response = await ownerClient.get(endpoint)
        expect(response.status).toBe(200)
      })

      it('should deny other users from accessing the resource', async () => {
        const otherClient = await this.authHelper.getClientForUser(otherUserId)
        const response = await otherClient.get(endpoint)
        expect(response.status).toBe(403)
      })

      it('should allow admin to access any resource', async () => {
        const adminClient = await this.authHelper.getAdminClient()
        const response = await adminClient.get(endpoint)
        expect(response.status).toBe(200)
      })
    })
  }
}
```

### 4. Update Route Protection

Example for business routes:

```typescript
// Public routes
router.get('/businesses', requirePermissions('businesses:read'), businessController.getAll)

// Business-only routes
router.get('/businesses/me', requirePermissions('businesses:read:own'), businessController.getMyBusiness)

router.put('/businesses/me', requirePermissions('businesses:write:own'), businessController.updateMyBusiness)

// Admin routes
router.post('/admin/businesses/:id/verify', requirePermissions('businesses:verify'), adminBusinessController.verifyBusiness)

router.delete('/admin/businesses/:id', requirePermissions('businesses:delete'), adminBusinessController.deleteBusiness)
```

### 5. Implement Permission Matrix Testing

Example test implementation:

```typescript
describe('Business API RBAC Tests', () => {
  let authHelper: E2EAuthHelper
  let rbacHelper: RBACTestHelper
  let app: Express
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    // Setup test environment
    const testDb = await createTestDatabase()
    authHelper = new E2EAuthHelper(testDb.prisma)
    app = await createBusinessServer({
      prisma: testDb.prisma,
      cacheService: new MemoryCacheService(),
    })
    request = supertest(app.server)
    rbacHelper = new RBACTestHelper(authHelper, request)
  })

  describe('Permission Matrix', () => {
    const permissionMatrix: RBACTestCase[] = [
      // Public endpoints
      { role: null, method: 'GET', endpoint: '/businesses', expectedStatus: 401 },
      { role: UserRole.CUSTOMER, method: 'GET', endpoint: '/businesses', expectedStatus: 200 },
      { role: UserRole.BUSINESS, method: 'GET', endpoint: '/businesses', expectedStatus: 200 },
      { role: UserRole.ADMIN, method: 'GET', endpoint: '/businesses', expectedStatus: 200 },

      // Business-only endpoints
      { role: null, method: 'GET', endpoint: '/businesses/me', expectedStatus: 401 },
      { role: UserRole.CUSTOMER, method: 'GET', endpoint: '/businesses/me', expectedStatus: 403 },
      { role: UserRole.BUSINESS, method: 'GET', endpoint: '/businesses/me', expectedStatus: 200 },
      { role: UserRole.ADMIN, method: 'GET', endpoint: '/businesses/me', expectedStatus: 403 },

      // Admin-only endpoints
      { role: null, method: 'POST', endpoint: '/admin/businesses/123/verify', expectedStatus: 401 },
      { role: UserRole.CUSTOMER, method: 'POST', endpoint: '/admin/businesses/123/verify', expectedStatus: 403 },
      { role: UserRole.BUSINESS, method: 'POST', endpoint: '/admin/businesses/123/verify', expectedStatus: 403 },
      { role: UserRole.ADMIN, method: 'POST', endpoint: '/admin/businesses/123/verify', expectedStatus: 200 },
    ]

    rbacHelper.testPermissionMatrix(permissionMatrix)
  })

  describe('Functional Tests with Auth', () => {
    describe('POST /businesses/me', () => {
      const businessData = {
        name: 'Test Business',
        categoryId: 'test-category-id',
        description: 'Test Description',
      }

      it('should create business for BUSINESS role user', async () => {
        const businessClient = await authHelper.getBusinessClient()
        const response = await businessClient.post('/businesses/me').send(businessData).expect(201)

        expect(response.body).toMatchObject({
          name: businessData.name,
          categoryId: businessData.categoryId,
          userId: expect.any(String),
        })
      })

      it('should reject CUSTOMER role', async () => {
        const customerClient = await authHelper.getUserClient()
        await customerClient.post('/businesses/me').send(businessData).expect(403)
      })

      it('should reject unauthenticated requests', async () => {
        await request.post('/businesses/me').send(businessData).expect(401)
      })
    })
  })
})
```

## Benefits

1. **Fine-grained Control**: Permission-based system allows precise access control
2. **Scalability**: Easy to add new permissions without role explosion
3. **Testability**: Permission matrix ensures comprehensive coverage
4. **Industry Standard**: Follows patterns used by AWS IAM, Google Cloud IAM
5. **Security**: Every endpoint is tested for proper authorization
6. **Maintainability**: Clear permission structure makes it easy to audit access

## Security Patterns

### Permission Naming Convention

- `resource:action` - Basic permission (e.g., `users:read`)
- `resource:action:own` - Ownership-based permission (e.g., `users:read:own`)
- `resource:*` - Wildcard permission for all actions on a resource

### Ownership Checks

For `:own` permissions, controllers must verify ownership:

```typescript
// In controller
if (permission.endsWith(':own') && resource.userId !== req.user.id) {
  throw new NotAuthorizedError('You can only access your own resources')
}
```

### Audit Logging

All permission checks should be logged:

```typescript
logger.info('Permission check', {
  userId: req.user.id,
  requiredPermissions: permissions,
  userPermissions: req.user.permissions,
  result: hasAllPermissions ? 'allowed' : 'denied',
  correlationId: req.correlationId,
})
```

## Testing Strategy

1. **Permission Matrix**: Test all role/endpoint combinations
2. **Functional + Auth**: Test functionality and authorization together
3. **Ownership Tests**: Verify `:own` permissions work correctly
4. **Service-to-Service**: Test internal service authentication
5. **Edge Cases**: Test expired tokens, malformed tokens, etc.

This approach ensures that security is not an afterthought but an integral part of the development process.
