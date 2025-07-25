# Simple RBAC Implementation Using Existing Infrastructure

## The Good News

The project already has a solid authorization system! We just need to use it consistently.

## What Already Exists

### 1. Authorization Middleware (`packages/http/src/infrastructure/fastify/middleware/auth.ts`)

- ✅ Permission checking with `createAuthorizationMiddleware()`
- ✅ Role-based helpers: `requireAdmin()`, `requireServiceProvider()`, `requireCustomer()`
- ✅ User context extraction via `UserContextService`
- ✅ Permission mapping per role

### 2. Smart Pattern: userId = entityId

The project uses a clever pattern where:

- `userId` === `serviceProviderId`
- `userId` === `customerId`

This eliminates database lookups and keeps controllers clean!

### 3. Error Handling

- ✅ `NotAuthorizedError` for 403 responses
- ✅ `NotAuthenticatedError` for 401 responses
- ✅ Consistent error format

## What Needs to Be Done

### 1. Apply Existing Middleware to Routes

```typescript
// In service routes - just add the preHandler!
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

### 2. Add Simple Ownership Check in Use Cases

```typescript
// In UpdateServiceCommandHandler
async execute(serviceId: string, dto: UpdateDTO, userId: string) {
  // Get the service
  const service = await this.repository.findById(serviceId);

  // Simple ownership check
  if (service.serviceProviderId !== userId) {
    throw new NotAuthorizedError('You do not own this service');
  }

  // Update
  return this.repository.update(serviceId, dto);
}
```

### 3. Filter Data in Repositories

```typescript
// In BookingRepository
async findAll(params: SearchParams, userId: string, role: UserRole) {
  const where: any = { deletedAt: null };

  // Apply role-based filtering
  if (role === UserRole.CUSTOMER) {
    where.customerId = userId;
  } else if (role === UserRole.SERVICE_PROVIDER) {
    where.service = { serviceProviderId: userId };
  }
  // Admins see all (no filter)

  return this.prisma.booking.findMany({ where });
}
```

## Implementation Checklist

For each service:

1. **Routes** - Add preHandler with appropriate middleware:

   ```typescript
   preHandler: [requirePermissions('resource:action')]
   // or
   preHandler: [requireServiceProvider()]
   // or
   preHandler: [requireCustomer()]
   ```

2. **Controllers** - Extract user context:

   ```typescript
   const userId = request.headers['x-user-id'] as string
   const userRole = request.headers['x-user-role'] as UserRole
   ```

3. **Use Cases** - Add ownership checks where needed:

   ```typescript
   if (resource.ownerId !== userId) {
     throw new NotAuthorizedError('You do not own this resource')
   }
   ```

4. **Repositories** - Filter based on role:
   ```typescript
   if (role !== UserRole.ADMIN) {
     where.ownerId = userId
   }
   ```

## Examples

### Booking Service

```typescript
// Routes
fastify.post('/bookings', {
  preHandler: [requireCustomer()] // Only customers can book
}, controller.create);

// Controller
async create(request: FastifyRequest) {
  const customerId = request.headers['x-user-id'] as string;
  const booking = await this.handler.execute(dto, customerId);
  return booking;
}

// Repository
async getCustomerBookings(customerId: string) {
  return this.prisma.booking.findMany({
    where: { customerId, deletedAt: null }
  });
}
```

### Service Management

```typescript
// Routes
fastify.post('/services', {
  preHandler: [requireServiceProvider()]
}, controller.create);

// Use Case
async execute(serviceId: string, updates: any, providerId: string) {
  const service = await this.repo.findById(serviceId);

  if (service.serviceProviderId !== providerId) {
    throw new NotAuthorizedError('Not your service');
  }

  return this.repo.update(serviceId, updates);
}
```

## Benefits of This Approach

1. **Uses Existing Code** - No new systems to learn
2. **Simple & Clear** - Easy to understand and implement
3. **Maintains Current Patterns** - userId = entityId works great
4. **Minimal Changes** - Just add middleware and checks
5. **Already Tested** - The auth system is already working

## Migration Time Estimate

- Per service: ~1-2 hours
- Total for all services: ~1-2 days
- No breaking changes required!

## Summary

The project already has excellent authorization infrastructure. We just need to:

1. Use the existing middleware consistently
2. Add simple ownership checks in use cases
3. Filter data in repositories based on role

No need for complex new systems - the existing patterns work perfectly!
