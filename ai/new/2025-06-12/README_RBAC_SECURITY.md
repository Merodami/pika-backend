# RBAC Security Implementation in Pika

## Overview

This document explains the Role-Based Access Control (RBAC) security implementation across the Pika platform, particularly focusing on how authorization is handled in microservices.

## Architecture Decision: Business Logic Layer Authorization

Instead of using generic permission middleware at the route level, we implement context-aware authorization in the business logic layer. This provides more granular and secure access control.

### Why This Approach?

1. **Context-Aware Security**: Can enforce ownership rules (users can only access their own resources)
2. **Clean Architecture**: Keeps HTTP concerns separate from business logic
3. **Flexibility**: Different services can implement custom authorization logic
4. **Better Testing**: Authorization logic can be unit tested independently

## Implementation Pattern

### 1. Route Layer (No Permission Middleware)

```typescript
// ❌ OLD: Generic permission check
fastify.get('/notifications', {
  preHandler: requirePermissions('notifications:read'), // This fails for scoped permissions
  schema: { ... }
})

// ✅ NEW: Authentication only at route level
fastify.get('/notifications', {
  schema: { ... }
})
```

### 2. Controller Layer (Extract User Context)

```typescript
async getUserNotifications(request: FastifyRequest) {
  // Extract authenticated user context
  const context = RequestContext.fromHeaders(request)
  const userId = context.userId

  // Pass to business logic
  return this.handler.execute({ userId, ...params })
}
```

### 3. Business Logic Layer (Enforce Authorization)

```typescript
async execute(command: { userId: string, resourceId: string }) {
  // Verify ownership or appropriate permissions
  const resource = await this.repository.findById(command.resourceId)

  if (resource.ownerId !== command.userId) {
    throw new NotAuthorizedError('You can only access your own resources')
  }

  // Proceed with business logic
}
```

## Service-Specific Implementations

### Messaging Service

- **Security**: Users can only access conversations they participate in
- **Implementation**: Firebase paths enforce ownership (`conversations/{conversationId}/participants/{userId}`)

### Notification Service

- **Read Security**: Users can only read their own notifications
- **Write Security**: Only internal services can publish notifications
- **Implementation**: Firebase paths enforce ownership (`users/{userId}/notifications`)

### Voucher Service

- **Security**: Users can only access their own vouchers (customers see their claimed vouchers, retailers see vouchers they created)
- **Implementation**: Use case handlers check ownership based on user role

## Permission Scopes

The system uses scoped permissions with the `:own` suffix to indicate resource ownership:

- `notifications:read:own` - Can read own notifications
- `conversations:write:own` - Can write to own conversations
- `vouchers:read:own` - Can read own vouchers

Only admin users have permissions without the `:own` suffix, allowing broader access.

## Security Best Practices

1. **Always Authenticate**: All routes require valid JWT tokens
2. **Extract Context Early**: Use `RequestContext.fromHeaders()` in controllers
3. **Validate Ownership**: Check resource ownership in use case handlers
4. **Use Repository Patterns**: Let repositories handle user-scoped queries
5. **Audit Trails**: Log all authorization decisions for security monitoring

## Internal Service Communication

For service-to-service communication (e.g., voucher service creating notifications):

1. Use internal API tokens
2. Validate requests come from trusted services
3. Consider implementing service mesh for mTLS in production

## Testing Security

Always test:

1. Unauthorized access (no token)
2. Cross-user access attempts (user A accessing user B's data)
3. Role-based access (customer vs provider vs admin)
4. Edge cases (deleted users, expired resources)

## Future Enhancements

1. Implement API Gateway for centralized authentication
2. Add rate limiting per user/role
3. Implement audit logging for all authorization decisions
4. Consider OAuth2 for third-party integrations
5. Implement field-level permissions for sensitive data
