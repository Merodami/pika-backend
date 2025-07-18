# RBAC Implementation - Final Practical Guide

## What Went Wrong?

The initial analysis identified real security issues, but the solution became over-engineered because:

1. We didn't fully appreciate the existing authorization system
2. We created new abstractions instead of using what was already there
3. We missed that the `userId = serviceProviderId` pattern is intentional and smart

## The Right Approach

### 1. Use Existing Authorization Middleware

The project already has everything needed in `packages/http/src/infrastructure/fastify/middleware/auth.ts`:

```typescript
// Available helpers
requireAdmin() // Requires ADMIN role
requireServiceProvider() // Requires SERVICE_PROVIDER role
requireCustomer() // Requires CUSTOMER role
requirePermissions('permission:string') // Check specific permissions
```

### 2. Simple Implementation Pattern

#### Step 1: Protect Routes

```typescript
// In route files - just add preHandler
fastify.post(
  '/services',
  {
    preHandler: [requireServiceProvider()],
  },
  controller.create,
)

fastify.patch(
  '/services/:id',
  {
    preHandler: [requirePermissions('services:write')],
  },
  controller.update,
)
```

#### Step 2: Add Ownership Checks in Use Cases

```typescript
// In use case handlers
async execute(serviceId: string, dto: UpdateDTO, userId: string) {
  const service = await this.repository.findById(serviceId);

  // Simple ownership check
  if (service.serviceProviderId !== userId) {
    throw new NotAuthorizedError('You do not own this service');
  }

  return this.repository.update(serviceId, dto);
}
```

#### Step 3: Filter Data in Repositories

```typescript
// Add role-based filtering
async findAll(params: SearchParams, userId: string, role: UserRole) {
  const where: any = { deletedAt: null };

  if (role === UserRole.CUSTOMER) {
    where.customerId = userId;
  } else if (role === UserRole.SERVICE_PROVIDER) {
    where.service = { serviceProviderId: userId };
  }
  // ADMIN sees all (no filter)

  return this.prisma.booking.findMany({ where });
}
```

## Practical Examples

### Booking Service

```typescript
// 1. Routes (add preHandler)
fastify.get('/bookings', {
  preHandler: [requirePermissions('bookings:read:own')]
}, controller.getMyBookings);

// 2. Controller (extract user info)
async getMyBookings(request: FastifyRequest) {
  const userId = request.headers['x-user-id'] as string;
  const role = request.headers['x-user-role'] as UserRole;

  return this.handler.execute({ customerId: userId }, userId, role);
}

// 3. Repository (filter by role)
async getBookings(params: any, userId: string, role: UserRole) {
  if (role === UserRole.CUSTOMER) {
    params.customerId = userId;
  }
  return this.findAll(params);
}
```

### Service Management

```typescript
// 1. Routes
fastify.delete('/services/:id', {
  preHandler: [requirePermissions('services:delete:own')]
}, controller.delete);

// 2. Use Case
async deleteService(serviceId: string, userId: string) {
  const service = await this.repo.findById(serviceId);

  if (!service) {
    throw new ResourceNotFoundError('Service', serviceId);
  }

  if (service.serviceProviderId !== userId) {
    throw new NotAuthorizedError('You do not own this service');
  }

  return this.repo.delete(serviceId);
}
```

## Implementation Checklist

For each service that needs authorization:

- [ ] Add `preHandler` to routes with appropriate middleware
- [ ] Extract `userId` and `role` from headers in controllers
- [ ] Add ownership checks in use cases where needed
- [ ] Add role-based filtering in repository methods
- [ ] Test with different user roles

## Why This Works

1. **Uses Existing Infrastructure** - No new code to maintain
2. **Simple & Clear** - Easy to understand and audit
3. **Follows Project Patterns** - Consistent with existing code
4. **Minimal Changes** - Can be implemented incrementally
5. **Battle-Tested** - The auth system is already in production

## Security Fixed

This simple approach still fixes the identified vulnerabilities:

- ✅ Enforces role-based permissions
- ✅ Validates resource ownership
- ✅ Prevents unauthorized data access
- ✅ Consistent authorization across services

## Time to Implement

- Per endpoint: ~15 minutes
- Per service: ~1-2 hours
- Total: 1-2 days for all services

No breaking changes, no new dependencies, just consistent use of existing tools.
