# Industry-Standard Authentication Architecture

## Executive Summary

This document defines the **mandatory authentication and authorization architecture** for all Pika microservices. The pattern implements a **Zero Trust Security Model** with **Defense in Depth**, following industry standards from Google Cloud IAM, AWS IAM, Microsoft Azure, and Stripe API.

## 🏆 **Industry Standard Confirmation**

This architecture represents the **OAuth 2.0 + RBAC hybrid model** used by:

- **Google Cloud IAM**: Authentication + fine-grained permissions
- **AWS IAM**: Identity-based + resource-based policies  
- **Microsoft Azure**: OAuth 2.0 + RBAC + conditional access
- **Stripe API**: API keys + scoped permissions
- **GitHub API**: OAuth + granular repository permissions

## Core Principles

### **Authentication vs Authorization Distinction**

- **Authentication**: "Who are you?" (JWT token validation)
- **Authorization**: "What can you do?" (Role + Permission-based access control)

### **Zero Trust Security Model**

> "Never trust, always verify" - Every request must be authenticated and authorized

### **Defense in Depth**

Multiple security layers provide redundant protection:

1. **Network Security**: HTTPS, CORS, Rate limiting
2. **Server-Level Authentication**: JWT validation middleware
3. **Route-Level Authorization**: Permission-based access control
4. **Controller-Level Business Logic**: Role validation + ownership checks
5. **Data-Level Security**: Row-level security, encryption at rest

## Access Level Definitions

### **1. Public Routes** 
- **Authentication**: JWT token **required**
- **Authorization**: Available to **all authenticated users** (USER, BUSINESS, ADMIN)
- **Use Case**: Business listings, category browsing, public content
- **Security**: Authenticated users can access, but business logic may filter data

### **2. Owner Routes**
- **Authentication**: JWT token **required**
- **Authorization**: Specific role + ownership validation **required**
- **Use Case**: User profile, business management, personal data
- **Security**: Role check + user context injection for ownership

### **3. Admin Routes**
- **Authentication**: JWT token **required** 
- **Authorization**: ADMIN role + specific permissions **required**
- **Use Case**: User management, business verification, system administration
- **Security**: Administrative privileges with audit logging

### **4. Internal Routes**
- **Authentication**: API key-based service authentication
- **Authorization**: Service-to-service communication only
- **Use Case**: Microservice communication, internal data exchange
- **Security**: Service identity verification with correlation IDs

## ✅ **Correct Implementation Architecture**

### **Server Configuration**
```typescript
// server.ts - Defines which paths bypass JWT validation
export async function createServiceServer({ prisma, cacheService }) {
  const app = await createExpressServer({
    serviceName: 'service-name',
    authOptions: {
      excludePaths: [
        '/health',        // Health checks (monitoring)
        '/metrics',       // Metrics (observability)  
        '/internal/*',    // Service-to-service (API key auth)
        // ❌ DO NOT exclude public routes - they need JWT auth
        // '/businesses',     // These need authentication
        // '/businesses/*',   // All authenticated users can access
      ],
    },
  })

  // Route mounting with proper authentication
  app.use('/resources', createPublicRoutes(...))        // JWT required, all roles
  app.use('/admin/resources', createAdminRoutes(...))   // JWT + ADMIN role
  app.use('/internal/resources', createInternalRoutes(...)) // API key auth

  return app
}
```

### **Route Configuration with Layered Security**
```typescript
// PublicRoutes.ts - Available to all authenticated users
export function createPublicRoutes(...): Router {
  const router = Router()

  // PUBLIC: All authenticated users can list resources
  router.get('/',
    requireAuth(),                              // Layer 1: JWT validation
    validateQuery(ResourceQueryParams),         // Layer 2: Schema validation
    controller.getAllResources,                 // Layer 3: Business logic
  )

  // PUBLIC: All authenticated users can view resource details
  router.get('/:id',
    requireAuth(),                              // Layer 1: JWT validation
    validateParams(ResourceIdParam),            // Layer 2: Schema validation
    validateQuery(ResourceDetailQueryParams),   // Layer 2: Schema validation
    controller.getResourceById,                 // Layer 3: Business logic
  )

  // OWNER: Only resource owners can access their resources
  router.get('/me',
    requireAuth(),                              // Layer 1: JWT validation
    requirePermissions('resources:read:own'),   // Layer 2: Permission check
    validateQuery(ResourceDetailQueryParams),   // Layer 3: Schema validation
    controller.getMyResource,                   // Layer 4: Business logic + ownership
  )

  // OWNER: Only resource owners can create/update their resources
  router.post('/me',
    requireAuth(),                              // Layer 1: JWT validation
    requirePermissions('resources:write:own'),  // Layer 2: Permission check
    validateBody(CreateResourceRequest),        // Layer 3: Schema validation
    controller.createMyResource,                // Layer 4: Business logic + ownership
  )

  return router
}

// AdminRoutes.ts - Admin-only management
export function createAdminRoutes(...): Router {
  const router = Router()

  // ADMIN: Full resource management
  router.get('/',
    requireAuth(),                              // Layer 1: JWT validation
    requirePermissions('resources:read:all'),   // Layer 2: Admin permission check
    validateQuery(AdminResourceQueryParams),    // Layer 3: Schema validation
    adminController.getAllResources,            // Layer 4: Admin business logic
  )

  router.post('/',
    requireAuth(),                              // Layer 1: JWT validation
    requirePermissions('resources:write:all'),  // Layer 2: Admin permission check
    validateBody(AdminCreateResourceRequest),   // Layer 3: Schema validation
    adminController.createResource,             // Layer 4: Admin business logic
  )

  return router
}

// InternalRoutes.ts - Service-to-service communication
export function createInternalRoutes(...): Router {
  const router = Router()

  // INTERNAL: Service authentication via API key (handled by server excludePaths)
  router.post('/by-ids',
    validateBody(GetResourcesByIdsRequest),     // Schema validation only
    internalController.getResourcesByIds,       // Service-to-service logic
  )

  router.post('/validate',
    validateBody(ValidateResourceRequest),      // Schema validation only
    internalController.validateResource,        // Service-to-service logic
  )

  return router
}
```

### **Controller Implementation with Defense in Depth**
```typescript
export class ResourceController {
  /**
   * GET /resources - Available to ALL authenticated users
   */
  async getAllResources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Layer 1: Authentication already verified by requireAuth() middleware
      // Layer 2: Schema validation already performed by validateQuery() middleware
      // Layer 3: Business logic with data filtering
      
      const query = getValidatedQuery<ResourceQueryParams>(req)
      
      const params = {
        categoryId: query.categoryId,
        active: true,    // Business rule: only show active resources to public
        verified: query.verified,
        search: query.search,
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc',
      }

      const result = await this.resourceService.getAllResources(params)
      
      // Transform to DTOs
      const response = {
        data: result.data.map(ResourceMapper.toDTO),
        pagination: result.pagination,
      }

      // Response validation (industry standard)
      const validatedResponse = resourcePublic.ResourceListResponse.parse(response)
      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /resources/:id - Available to ALL authenticated users  
   */
  async getResourceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Authentication and schema validation already handled by middleware
      const { id: resourceId } = req.params
      const query = getValidatedQuery<ResourceDetailQueryParams>(req)
      
      // Parse include parameter for relations
      const includeRelations = query.include?.split(',') || []
      const resource = await this.resourceService.getResourceById(resourceId, {
        user: includeRelations.includes('user'),
        category: includeRelations.includes('category'),
      })
      
      // Business logic: only show active resources to public
      if (!resource.active) {
        throw ErrorFactory.resourceNotFound('Resource', resourceId)
      }

      const response = ResourceMapper.toDTO(resource)
      const validatedResponse = resourcePublic.ResourceResponse.parse(response)
      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /resources/me - RESOURCE OWNERS ONLY
   */
  async getMyResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Layer 1: Authentication verified by requireAuth()
      // Layer 2: Permission verified by requirePermissions('resources:read:own')
      // Layer 3: Schema validation by validateQuery()
      // Layer 4: Business logic validation and ownership enforcement
      
      const context = RequestContext.getContext(req)
      const query = getValidatedQuery<ResourceDetailQueryParams>(req)
      
      // Double validation: route-level permission + controller-level role check
      if (context.role !== UserRole.RESOURCE_OWNER) {
        throw ErrorFactory.forbidden('Only resource owners can access this endpoint')
      }

      // Ownership enforcement through user context
      const resource = await this.resourceService.getResourceByUserId(context.userId)
      
      const response = ResourceMapper.toDTO(resource)
      const validatedResponse = resourcePublic.ResourceResponse.parse(response)
      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /resources/me - CREATE with ownership enforcement
   */
  async createMyResource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      
      // Business logic validation - only specific role can create
      if (context.role !== UserRole.RESOURCE_OWNER) {
        throw ErrorFactory.forbidden('Only resource owners can create resources')
      }

      // Ownership enforcement - inject authenticated user ID
      const data = {
        ...req.body,
        userId: context.userId, // Prevents creating resources for other users
      }

      const resource = await this.resourceService.createResource(data)

      // Transform and validate response
      const response = ResourceMapper.toDTO(resource)
      const validatedResponse = resourcePublic.ResourceResponse.parse(response)
      
      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
```

## RBAC Permission System

### **Permission Format: `resource:action:scope`**
```typescript
// Resource permissions
'resources:read:all'     // Admin: read all resources
'resources:read:own'     // Owner: read own resource
'resources:write:own'    // Owner: create/update own resource
'resources:manage:all'   // Admin: full resource management

// User permissions  
'users:read:own'         // User: read own profile
'users:write:own'        // User: update own profile
'users:manage:all'       // Admin: full user management

// Business permissions
'businesses:read:all'    // Admin: read all businesses
'businesses:read:own'    // Business: read own business
'businesses:write:own'   // Business: create/update own business
'businesses:manage:all'  // Admin: full business management
```

### **Role-to-Permission Mapping**
```typescript
// packages/types/src/rbac.ts
export function mapRoleToPermissions(role: UserRole): string[] {
  switch (role) {
    case UserRole.USER:
      return [
        'users:read:own',
        'users:write:own',
        // Can read public resources but cannot create/manage
      ]
      
    case UserRole.BUSINESS:
      return [
        'users:read:own',
        'users:write:own', 
        'businesses:read:own',     // Can read their business
        'businesses:write:own',    // Can create/update their business
      ]
      
    case UserRole.ADMIN:
      return [
        'users:read:all',
        'users:write:all',
        'users:manage:all',
        'businesses:read:all',
        'businesses:write:all', 
        'businesses:manage:all',
        'resources:read:all',
        'resources:write:all',
        'resources:manage:all',
      ]
  }
}
```

### **Context-Aware Authorization**
```typescript
// Controllers always use RequestContext for user information
const context = RequestContext.getContext(req)

// Available context properties:
context.userId      // Authenticated user UUID
context.email       // User email address
context.role        // User role (USER, BUSINESS, ADMIN)
context.permissions // Array of permission strings
context.sessionId   // JWT session identifier
context.correlationId // Request correlation ID for tracing
```

## Access Control Matrix

| Endpoint | USER | BUSINESS | ADMIN | Authentication | Authorization |
|----------|------|----------|-------|----------------|---------------|
| `GET /resources` | ✅ | ✅ | ✅ | JWT Required | All authenticated users |
| `GET /resources/:id` | ✅ | ✅ | ✅ | JWT Required | All authenticated users |
| `GET /resources/me` | ❌ | ✅ | ✅ | JWT Required | `resources:read:own` |
| `POST /resources/me` | ❌ | ✅ | ✅ | JWT Required | `resources:write:own` |
| `PUT /resources/me` | ❌ | ✅ | ✅ | JWT Required | `resources:write:own` |
| `GET /admin/resources` | ❌ | ❌ | ✅ | JWT Required | `resources:read:all` |
| `POST /admin/resources` | ❌ | ❌ | ✅ | JWT Required | `resources:write:all` |
| `POST /internal/resources/by-ids` | N/A | N/A | N/A | API Key | Service-to-service |

## Security Benefits

### **1. Zero Trust Architecture**
- Every request requires authentication
- No implicit trust based on network location
- Continuous verification of identity and permissions

### **2. Defense in Depth**
- Multiple security layers provide redundancy
- If one layer fails, others continue to protect
- Granular control at each security boundary

### **3. Principle of Least Privilege**
- Users receive minimum permissions needed
- Role-based access control prevents privilege escalation
- Ownership validation prevents lateral movement

### **4. Auditability and Compliance**
- Every request includes correlation IDs for tracing
- Permission checks are logged for audit trails
- Clear separation between authentication and authorization

### **5. Scalability and Maintainability**
- Permission system scales with new roles/resources
- Consistent patterns across all services
- Clear separation of concerns

## Implementation Checklist

### **Server Configuration:**
- [ ] JWT validation enabled for all routes except health/metrics/internal
- [ ] Internal routes use API key authentication
- [ ] Proper CORS and security headers configured
- [ ] Rate limiting and request size limits applied

### **Route Configuration:**
- [ ] `requireAuth()` middleware on all public/owner routes
- [ ] `requirePermissions()` middleware on owner/admin routes
- [ ] Schema validation middleware on all routes
- [ ] Proper middleware ordering (auth → permissions → validation → controller)

### **Controller Implementation:**
- [ ] `RequestContext.getContext()` used for user information
- [ ] Role validation in business logic
- [ ] Ownership enforcement through user context injection
- [ ] Response validation using Zod schemas
- [ ] Proper error handling with correlation IDs

### **Permission System:**
- [ ] Permissions follow `resource:action:scope` format
- [ ] Role-to-permission mapping implemented
- [ ] Permission validation in routes and controllers
- [ ] Clear documentation of required permissions

### **Testing:**
- [ ] Authentication failure tests (401 responses)
- [ ] Authorization failure tests (403 responses)
- [ ] Cross-user access prevention tests
- [ ] Permission boundary tests
- [ ] Integration tests with real JWT tokens

## Common Security Anti-Patterns (Avoid)

### **❌ Inconsistent Authentication**
```typescript
// DON'T: Mix authenticated and unauthenticated routes inconsistently
authOptions: {
  excludePaths: ['/resources', '/resources/*']  // ❌ Makes routes unauthenticated
}
// Then use requireAuth() in routes ❌ - Creates broken authentication
```

### **❌ Role Checks Instead of Permissions**
```typescript
// DON'T: Hard-code role checks in routes
if (user.role !== 'ADMIN') {  // ❌ Not scalable, breaks when roles change
  throw new Error('Forbidden')
}

// DO: Use permission-based access control
requirePermissions('resources:manage:all')  // ✅ Scalable and flexible
```

### **❌ Missing Ownership Validation**
```typescript
// DON'T: Trust client-provided user IDs
const resourceId = req.body.userId  // ❌ Client can manipulate this

// DO: Inject authenticated user context
const data = {
  ...req.body,
  userId: context.userId,  // ✅ Server-controlled ownership
}
```

### **❌ Inconsistent Response Validation**
```typescript
// DON'T: Return raw database objects
res.json(user)  // ❌ May expose sensitive fields

// DO: Use mappers and validate responses
const response = UserMapper.toDTO(user)
const validatedResponse = UserResponse.parse(response)  // ✅ Safe and validated
res.json(validatedResponse)
```

## Migration Strategy

### **For Existing Services:**

1. **Update Server Configuration**
   - Remove public routes from `excludePaths`
   - Keep only health/metrics/internal exclusions

2. **Add Route-Level Authentication**
   - Add `requireAuth()` to all public routes
   - Add `requirePermissions()` to owner/admin routes

3. **Update Controllers**
   - Use `RequestContext.getContext()` for user information
   - Add role validation and ownership enforcement
   - Implement response validation

4. **Test Security Boundaries**
   - Verify authentication failures return 401
   - Verify authorization failures return 403
   - Test cross-user access prevention

## Conclusion

This authentication architecture provides:

1. **Industry-Standard Security**: Follows OAuth 2.0 + RBAC patterns from major cloud providers
2. **Zero Trust Model**: Every request authenticated and authorized
3. **Defense in Depth**: Multiple security layers with redundant protection
4. **Scalable Permissions**: Flexible RBAC system that grows with the platform
5. **Audit Compliance**: Complete traceability and logging for security events

**This pattern is mandatory for all Pika services and represents current security best practices.**

---

## References

- **NIST Cybersecurity Framework** - Zero Trust Architecture
- **OAuth 2.0 Authorization Framework** - RFC 6749
- **RBAC Standard** - NIST RBAC Model
- **Google Cloud IAM** - Identity and Access Management Best Practices
- **AWS IAM** - Security Best Practices and Use Cases
- **Microsoft Azure AD** - Conditional Access and RBAC Implementation
- **OWASP Top 10** - Authentication and Authorization Vulnerabilities