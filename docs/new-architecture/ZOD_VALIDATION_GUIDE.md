# Zod Validation Guide

This guide consolidates all Zod validation documentation for the Pika platform.

## Overview

The platform uses Zod for request validation across all services. Zod provides:

- Type-safe validation with TypeScript inference
- Excellent error messages
- Intuitive API
- Strong ecosystem support

## Quick Start

### Service Routes

```typescript
import { validateBody, validateQuery, validateParams } from '@pika/http'
import { CreateUserRequest, UserSearchParams } from '@pikac'

// Body validation
router.post('/users', requireAuth(), validateBody(CreateUserRequest), controller.createUser)

// Query validation
router.get('/users', requireAuth(), validateQuery(UserSearchParams), controller.getUsers)

// Params validation
router.get('/users/:id', requireAuth(), validateParams(z.object({ id: z.string().uuid() })), controller.getUserById)
```

## Schema Organization

### Package Structure

```
@pika
├── public/     # Public API schemas (frontend/mobile)
├── admin/      # Admin API schemas
└── internal/   # Internal service-to-service schemas
```

### Import Pattern

```typescript
// Public API schemas
import { LoginRequest, UserProfile } from '@pikac'

// Admin API schemas
import { CreateCreditPackRequest } from '@pika'

// Internal API schemas
import { InternalCreditOperationRequest } from '@pikanal'
```

## Common Schemas

### Branded Types

```typescript
import { UserId, Email, Money, Credits } from '@pikac'

// Strong typing with validation
const userId = UserId.parse('123e4567-e89b-12d3-a456-426614174000')
const email = Email.parse('USER@EXAMPLE.COM') // Normalized to lowercase
const amount = Money.parse(1000) // Amount in cents
```

### Pagination

```typescript
import { PaginatedRequest, PaginatedResponse } from '@pikac'

// Request with pagination
const SearchRequest = PaginatedRequest.extend({
  name: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

// Response with pagination
const SearchResponse = PaginatedResponse(UserSchema)
```

### Error Responses

```typescript
import { ErrorResponse, ValidationErrorResponse } from '@pikac'

// Consistent error format
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "path": ["email"],
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Service Implementation

### Controller Pattern (Industry Best Practices)

Based on the Business service implementation, which demonstrates the most mature authentication and validation patterns:

```typescript
export class BusinessController {
  constructor(private readonly businessService: IBusinessService) {
    // Bind methods to preserve 'this' context
    this.getMyBusiness = this.getMyBusiness.bind(this)
    this.createMyBusiness = this.createMyBusiness.bind(this)
  }

  /**
   * GET /businesses/me - Business owner access with role validation
   */
  async getMyBusiness(
    req: Request,
    res: Response<businessPublic.BusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Get authenticated user context
      const context = RequestContext.getContext(req)
      const query = getValidatedQuery<businessPublic.BusinessDetailQueryParams>(req)

      // 2. Role-based access control at controller level
      if (context.role !== UserRole.BUSINESS) {
        throw ErrorFactory.forbidden('Only business owners can access this endpoint')
      }

      // 3. Parse include parameter for relations
      const includeRelations = query.include?.split(',') || []
      const business = await this.businessService.getBusinessByUserId(context.userId, {
        user: includeRelations.includes('user'),
        category: includeRelations.includes('category'),
      })

      // 4. Transform to DTO
      const response = BusinessMapper.toDTO(business)
      
      // 5. Validate response against Zod schema
      const validatedResponse = businessPublic.BusinessResponse.parse(response)
      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /businesses/me - Create business with ownership validation
   */
  async createMyBusiness(
    req: Request<{}, {}, businessPublic.CreateMyBusinessRequest>,
    res: Response<businessPublic.BusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)

      // Business logic validation - only business role can create
      if (context.role !== UserRole.BUSINESS) {
        throw ErrorFactory.forbidden('Only users with business role can create a business')
      }

      // Inject authenticated user ID into request data
      const data = {
        ...req.body,
        userId: context.userId, // Ownership enforcement
      }

      const business = await this.businessService.createBusiness(data)

      // Transform and validate response
      const response = BusinessMapper.toDTO(business)
      const validatedResponse = businessPublic.BusinessResponse.parse(response)
      
      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }
}
```

### Route Setup with Advanced Authentication

```typescript
export function createBusinessRoutes(
  prisma: PrismaClient, 
  cache: ICacheService,
  translationClient: TranslationClient
): Router {
  const router = Router()

  // Initialize dependencies
  const repository = new BusinessRepository(prisma, cache)
  const service = new BusinessService(repository, translationClient, cache)
  const controller = new BusinessController(service)

  // Public routes - require authentication but available to all users
  router.get(
    '/',
    requireAuth(),
    validateQuery(businessPublic.BusinessQueryParams),
    controller.getAllBusinesses,
  )

  // Business owner routes - layered authentication
  router.get(
    '/me',
    requireAuth(),                                          // JWT authentication
    requirePermissions('businesses:read:own'),              // Permission-based access
    validateQuery(businessPublic.BusinessDetailQueryParams), // Schema validation
    controller.getMyBusiness,
  )

  router.post(
    '/me',
    requireAuth(),
    requirePermissions('businesses:write:own'),
    validateBody(businessPublic.CreateMyBusinessRequest),
    controller.createMyBusiness,
  )

  // Public detail routes with parameters
  router.get(
    '/:id',
    requireAuth(),
    validateParams(businessPublic.BusinessPathParams),
    validateQuery(businessPublic.BusinessDetailQueryParams),
    controller.getBusinessById,
  )

  return router
}
```

### Server Configuration (Best Practices)

```typescript
export async function createBusinessServer({ prisma, cacheService, translationClient }) {
  const app = await createExpressServer({
    serviceName: 'business-service',
    port: BUSINESS_SERVICE_PORT,
    cacheService,
    // Idempotency for safe retries
    idempotencyOptions: {
      enabled: true,
      defaultTTL: 86400, // 24 hours
      methods: ['POST', 'PUT', 'PATCH'],
      excludeRoutes: ['/health', '/metrics'],
    },
    // Authentication configuration
    authOptions: {
      excludePaths: [
        '/businesses',     // Public business list endpoint
        '/businesses/*',   // Public business detail endpoints  
        '/health',
        '/metrics',
        '/internal/*',     // Service-to-service communication
      ],
    },
    healthChecks: [
      // Health check configurations...
    ],
  })

  // Mount routes with proper namespacing
  app.use('/businesses', createBusinessRoutes(prisma, cacheService, translationClient))
  app.use('/admin/businesses', createAdminBusinessRoutes(prisma, cacheService, translationClient))
  app.use('/internal/businesses', createInternalBusinessRoutes(prisma, cacheService))

  return app
}
```

## API Gateway Integration

### Validation Middleware

```typescript
import { validateBody, validateQuery } from '@pika
import { LoginRequest } from '@pikac'

// Gateway validates before forwarding
router.post('/api/v1/auth/login', validateBody(LoginRequest), proxyToService('auth-service'))
```

### Headers

Services receive a header when gateway has validated:

```typescript
if (req.headers['x-gateway-validated'] === 'true') {
  // Skip validation in service
}
```

## Error Handling

Validation errors return HTTP 400 with consistent format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation error: Invalid input",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email",
      "code": "invalid_string"
    }
  ],
  "correlationId": "req_123456",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Advanced Authentication Patterns

### Layered Security Architecture

The Business service demonstrates a comprehensive layered security approach:

#### 1. Server-Level Path Exclusions
```typescript
authOptions: {
  excludePaths: [
    '/businesses',     // Public endpoints that don't require auth
    '/businesses/*',   // Public business details
    '/internal/*',     // Service-to-service with API keys
  ],
}
```

#### 2. Route-Level Permission Control  
```typescript
// Multi-layer authentication and authorization
router.post('/me',
  requireAuth(),                                   // Layer 1: JWT validation
  requirePermissions('businesses:write:own'),      // Layer 2: Permission check
  validateBody(CreateMyBusinessRequest),           // Layer 3: Schema validation
  controller.createMyBusiness                      // Layer 4: Business logic
)
```

#### 3. Controller-Level Business Validation
```typescript
// Role-based access control with business context
const context = RequestContext.getContext(req)

if (context.role !== UserRole.BUSINESS) {
  throw ErrorFactory.forbidden('Only business owners can access this endpoint')
}

// Ownership validation - inject authenticated user ID
const data = {
  ...req.body,
  userId: context.userId, // Prevents accessing other user's resources
}
```

### Permission System Patterns

#### Resource:Action:Scope Format
```typescript
// Examples of permission strings
'businesses:read:own'     // Read own business
'businesses:write:own'    // Modify own business  
'businesses:read:all'     // Admin: read all businesses
'users:manage:all'        // Admin: full user management
```

#### Context-Aware Authorization
```typescript
// Get user context from authenticated request
const context = RequestContext.getContext(req)

// Available context properties:
context.userId    // Authenticated user ID
context.email     // User email
context.role      // User role (USER, BUSINESS, ADMIN)
context.permissions // Array of permission strings
```

### Response Validation Pattern

#### Industry Standard: Always Validate Responses
```typescript
// 1. Execute business logic
const business = await this.businessService.getBusinessByUserId(userId)

// 2. Transform to DTO using mapper
const response = BusinessMapper.toDTO(business)

// 3. Validate against Zod schema before sending
const validatedResponse = businessPublic.BusinessResponse.parse(response)

// 4. Send validated response
res.json(validatedResponse)
```

#### Benefits of Response Validation:
- **Contract Enforcement**: Ensures API matches documented schema
- **Runtime Safety**: Catches mapper/transformation errors immediately  
- **Type Narrowing**: TypeScript knows exact response type after validation
- **Schema Evolution**: Breaking changes caught during development

### Include Relations Pattern

#### Query Parameter-Based Includes
```typescript
// Client requests related data
GET /businesses/me?include=user,category

// Controller parses include parameter
const includeRelations = query.include?.split(',') || []
const business = await this.businessService.getBusinessByUserId(userId, {
  user: includeRelations.includes('user'),
  category: includeRelations.includes('category'),
})
```

#### Repository-Level Conditional Includes
```typescript
// Repository handles conditional Prisma includes
const include: any = {}
if (parsedIncludes?.user) include.user = true
if (parsedIncludes?.category) include.category = true

const business = await this.prisma.business.findUnique({
  where: { userId },
  include: Object.keys(include).length > 0 ? include : undefined,
})
```

## Best Practices

1. **Always use schemas from @pika packages** - Don't define validation schemas in services
2. **Import from the correct API scope** - Use `/public`, `/admin`, or `/internal`
3. **Use branded types** - Prefer `UserId` over `string` for type safety
4. **Let middleware handle validation** - Don't call `parse()` manually in controllers for requests
5. **Always validate responses** - Use `Schema.parse()` on response objects
6. **Use layered authentication** - Server → Route → Controller → Business logic
7. **Implement ownership validation** - Inject authenticated user context into operations
8. **Use permission-based access control** - Prefer `requirePermissions()` over role checks
9. **Handle includes properly** - Parse comma-separated includes, pass to repository layer
10. **Use proper error handling** - Validation errors are handled by error middleware

## Testing

```typescript
describe('POST /users', () => {
  it('should validate request body', async () => {
    const response = await request(app).post('/users').send({ email: 'invalid-email' }).expect(400)

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      details: expect.arrayContaining([
        expect.objectContaining({
          path: ['email'],
          message: expect.stringContaining('email'),
        }),
      ]),
    })
  })
})
```

## Available Validation Functions

| Function         | Purpose               | Example                           |
| ---------------- | --------------------- | --------------------------------- |
| `validateBody`   | Validate request body | `validateBody(CreateUserRequest)` |
| `validateQuery`  | Validate query params | `validateQuery(SearchParams)`     |
| `validateParams` | Validate route params | `validateParams(IdParam)`         |

## Schema Helpers

```typescript
// Make schema partial (all fields optional)
const UpdateRequest = CreateRequest.partial()

// Pick specific fields
const EmailOnly = UserSchema.pick({ email: true })

// Omit fields
const UserWithoutPassword = UserSchema.omit({ password: true })

// Extend schemas
const ExtendedUser = UserSchema.extend({
  role: z.enum(['USER', 'ADMIN']),
})
```
