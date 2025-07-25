# Session Service Admin Extension Implementation Plan

## Current Status Assessment

### ✅ ALREADY IMPLEMENTED

The Session service **already has comprehensive admin functionality fully implemented and working**:

- **Admin Controllers**: Complete `AdminSessionController` with all CRUD operations
- **Admin Services**: `AdminSessionService` with privileged operations and audit trails
- **Admin Schemas**: Comprehensive admin schemas in `/packages/api/src/admin/schemas/session/`
- **Admin Routes**: Separate admin route definitions with proper authentication
- **API Generation**: All admin session endpoints included in OpenAPI specification
- **Service Architecture**: Following clean architecture pattern with proper separation

### 🎯 REQUIRED ENHANCEMENTS

Based on the frontend SDK requirements and User service patterns, the following enhancements are needed:

## 1. Enhanced Admin Session List Endpoint

### Current Implementation Gap

The existing admin session management may not provide the exact structure needed for frontend hooks.

### Required Enhancement: `getAdminSessionsAll`

**Endpoint**: `POST /admin/sessions/list`

**Request Schema**:

```typescript
// /packages/api/src/admin/schemas/session/management.ts
export const GetAdminSessionsAllRequest = z.object({
  userId: z.string().optional(), // Filter by specific user
  gymId: z.string().optional(), // Filter by specific gym
  status: z.enum(['UPCOMING', 'PENDING_APPROVAL', 'PAYMENT_PENDING', 'COMPLETED', 'CANCELLED', 'DECLINED']).optional(),
  purpose: z.enum(['WORKING', 'WORKOUT', 'CONTENT']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  include: z.array(z.enum(['user', 'gym', 'invitees', 'reviews'])).optional(),
})

export const GetAdminSessionsAllResponse = z.object({
  data: z.array(AdminSessionWithRelationsDTO),
  pagination: PaginationMetaDTO,
})
```

**Response Structure** (camelCase):

```typescript
{
  data: Array<{
    id: string,
    userId: string,
    user?: UserDomain, // Optional user relation
    gymId: string,
    gym?: GymDomain,   // Optional gym relation (full object, not just name)
    date: string,      // ISO date string
    startTime: string, // ISO datetime string
    endTime: string,   // ISO datetime string
    duration: number,  // Duration in minutes
    status: SessionStatus,
    price: number,     // Price in cents
    purpose: SessionPurpose,
    createdAt: string, // ISO datetime string
    updatedAt: string, // ISO datetime string
    // Optional relations based on include parameter
    invitees?: Array<SessionInviteeDomain>,
    reviews?: Array<SessionReviewDomain>,
  }>,
  pagination: {
    currentPage: number,
    totalPages: number,
    totalItems: number,
    itemsPerPage: number,
    hasNextPage: boolean,
    hasPreviousPage: boolean,
  }
}
```

## 2. Repository Enhancement

### Required Changes in `SessionRepository`

```typescript
// /packages/services/session/src/repositories/SessionRepository.ts

async findAllForAdmin(
  params: AdminSessionSearchParams,
  parsedIncludes?: ParsedIncludes
): Promise<PaginatedResult<SessionDomainWithRelations>> {
  const include = parsedIncludes && Object.keys(parsedIncludes).length > 0
    ? (toPrismaInclude(parsedIncludes) as Prisma.SessionInclude)
    : undefined

  // Build where clause with admin filters
  const where: Prisma.SessionWhereInput = {
    ...(params.userId && { userId: params.userId }),
    ...(params.gymId && { gymId: params.gymId }),
    ...(params.status && { status: params.status }),
    ...(params.purpose && { purpose: params.purpose }),
    ...(params.startDate && params.endDate && {
      date: {
        gte: new Date(params.startDate),
        lte: new Date(params.endDate),
      }
    }),
  }

  const [sessions, total] = await Promise.all([
    this.prisma.session.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    this.prisma.session.count({ where }),
  ])

  return {
    data: sessions.map(session =>
      include
        ? SessionMapper.fromDocumentWithRelations(session)
        : SessionMapper.fromDocument(session)
    ),
    pagination: createPaginationMeta(params.page, params.limit, total),
  }
}
```

## 3. Service Layer Enhancement

### Required Changes in `AdminSessionService`

```typescript
// /packages/services/session/src/services/AdminSessionService.ts

async getAllSessions(
  params: AdminSessionSearchParams,
  parsedIncludes?: ParsedIncludes
): Promise<PaginatedResult<SessionDomainWithRelations>> {
  try {
    // Use repository for database query
    const result = await this.sessionRepository.findAllForAdmin(params, parsedIncludes)

    // Handle internal API calls for relations not in database
    if (parsedIncludes?.user || parsedIncludes?.gym) {
      // Enhance with service client data if needed
      for (const session of result.data) {
        if (parsedIncludes.user && !session.user) {
          session.user = await this.userServiceClient?.getUser(session.userId)
        }
        if (parsedIncludes.gym && !session.gym) {
          session.gym = await this.gymServiceClient?.getGym(session.gymId)
        }
      }
    }

    return result
  } catch (error) {
    this.logger.error('Failed to get admin sessions', { error, params })
    throw ErrorFactory.fromError(error)
  }
}
```

## 4. Controller Enhancement

### Required Changes in `AdminSessionController`

```typescript
// /packages/services/session/src/controllers/AdminSessionController.ts

async getAllSessions(
  request: Request<{}, {}, GetAdminSessionsAllRequest>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = request.body
    const parsedIncludes = parseIncludes(params.include)

    const result = await this.adminSessionService.getAllSessions(params, parsedIncludes)

    // Transform to DTOs using mapper
    const dtoResult = {
      data: result.data.map(session => SessionMapper.toAdminDTO(session)),
      pagination: result.pagination,
    }

    response.json(dtoResult)
  } catch (error) {
    next(error)
  }
}
```

## 5. Mapper Enhancement

### Required Changes in `SessionMapper`

```typescript
// /packages/sdk/src/mappers/SessionMapper.ts

static toAdminDTO(domain: SessionDomainWithRelations): AdminSessionWithRelationsDTO {
  const base = {
    id: domain.id,
    userId: domain.userId,
    gymId: domain.gymId,
    date: domain.date.toISOString(),
    startTime: domain.startTime.toISOString(),
    endTime: domain.endTime.toISOString(),
    duration: domain.duration,
    status: domain.status,
    price: domain.price,
    purpose: domain.purpose,
    createdAt: domain.createdAt.toISOString(),
    updatedAt: domain.updatedAt.toISOString(),
  }

  // Include optional relations
  return {
    ...base,
    ...(domain.user && { user: UserMapper.toDTO(domain.user) }),
    ...(domain.gym && { gym: GymMapper.toDTO(domain.gym) }),
    ...(domain.invitees && { invitees: domain.invitees.map(SessionInviteeMapper.toDTO) }),
    ...(domain.reviews && { reviews: domain.reviews.map(SessionReviewMapper.toDTO) }),
  }
}
```

## 6. Route Registration

### Required Changes in Admin Routes

```typescript
// /packages/services/session/src/routes/adminRoutes.ts

router.post('/list', requireAuth(), requireAdmin(), validateBody(schemas.GetAdminSessionsAllRequest), adminSessionController.getAllSessions)
```

## 7. Service Client Injection

### Required Changes in Service Factory

```typescript
// /packages/services/session/src/app.ts

export async function createSessionServer(config: { prisma: PrismaClient; cacheService: ICacheService; userServiceClient?: UserServiceClient; gymServiceClient?: GymServiceClient }) {
  // Inject service clients into AdminSessionService
  const adminSessionService = new AdminSessionService(sessionRepository, cacheService, config.userServiceClient, config.gymServiceClient)
}
```

## 8. API Generation Updates

### Schema Registration Enhancement

```typescript
// /packages/api/src/scripts/generators/admin-api.ts

// Register new schemas
registry.registerSchema('GetAdminSessionsAllRequest', adminSessionSchemas.GetAdminSessionsAllRequest)
registry.registerSchema('GetAdminSessionsAllResponse', adminSessionSchemas.GetAdminSessionsAllResponse)
registry.registerSchema('AdminSessionWithRelationsDTO', adminSessionSchemas.AdminSessionWithRelationsDTO)

// Register new route
registry.registerRoute({
  method: 'post',
  path: '/sessions/admin/sessions/list',
  summary: 'Get all sessions with admin filters and relations',
  tags: ['Session Management'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: adminSessionSchemas.GetAdminSessionsAllRequest,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Admin sessions list with relations',
      content: {
        'application/json': {
          schema: adminSessionSchemas.GetAdminSessionsAllResponse,
        },
      },
    },
  },
})
```

## 9. Domain Model Updates

### Enhanced Session Domain with Relations

```typescript
// /packages/sdk/src/types/session.ts

export interface SessionDomainWithRelations extends SessionDomain {
  user?: UserDomain
  gym?: GymDomain
  invitees?: SessionInviteeDomain[]
  reviews?: SessionReviewDomain[]
}

// Admin-specific include relations
export const ADMIN_SESSION_RELATIONS = ['user', 'gym', 'invitees', 'reviews'] as const
```

## 10. Testing Requirements

### Integration Test Updates

```typescript
// /packages/services/session/src/tests/integration/admin/sessions.test.ts

describe('Admin Sessions List', () => {
  it('should return sessions with user filter', async () => {
    const response = await supertest(app.server)
      .post('/admin/sessions/list')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: testUserId, include: ['user', 'gym'] })
      .expect(200)

    expect(response.body.data).toBeDefined()
    expect(response.body.data[0]).toHaveProperty('user')
    expect(response.body.data[0]).toHaveProperty('gym')
  })
})
```

## Implementation Priority

1. **High Priority**: Enhance `AdminSessionService.getAllSessions()` method
2. **High Priority**: Update admin session schemas with proper relations
3. **Medium Priority**: Implement service client injection for user/gym data
4. **Medium Priority**: Add comprehensive integration tests
5. **Low Priority**: Update API documentation and SDK generation

## Key Considerations

### ✅ Following Established Patterns

- **Clean Architecture**: Controller → Service → Repository pattern
- **Manual DI**: Constructor injection without DI container
- **Mapper Pattern**: Comprehensive data transformation using SDK mappers
- **CamelCase Convention**: Consistent camelCase throughout all layers
- **Service Communication**: Use injected service clients for cross-service data

### ✅ Gym Relation Standards

- **Full Gym Objects**: Include complete `GymDomain` objects, not just `gymName`
- **Include Parameter**: Use `parsedIncludes` for optional relation loading
- **Service Client Pattern**: Use `GymServiceClient` for cross-service gym data
- **Graceful Handling**: Handle missing gym data appropriately

### ✅ Authentication & Authorization

- **Admin Security**: Use `requireAuth()` + `requireAdmin()` middleware
- **Service Context**: Include correlation IDs and service identification

### ✅ Error Handling

- **ErrorFactory**: Use standardized error creation
- **Correlation IDs**: Include request tracing
- **Logging**: Comprehensive error logging with context

## Conclusion

The Session service **already has robust admin functionality implemented**. The required enhancements focus on:

1. **API Response Structure**: Ensuring exact frontend SDK compatibility
2. **Relation Handling**: Proper gym object inclusion following SOLO60 standards
3. **Service Communication**: Enhanced user/gym data via service clients
4. **CamelCase Consistency**: Maintaining consistent naming conventions

These changes build upon the existing solid foundation while ensuring seamless integration with frontend admin hooks and maintaining architectural consistency across the microservices platform.
