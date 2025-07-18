# Admin Routes Validation Audit

## Summary

This audit identifies admin routes across all services that use `requireAdmin()` middleware but lack proper request validation middleware. These routes are potential security vulnerabilities as they don't validate incoming request data.

## Admin Schemas Available

The following admin schemas exist in `packages/api/src/admin/`:

### User Management (`admin/schemas/user/management.ts`)

- `AdminUserDetail`
- `AdminUserSearchParams`
- `UpdateUserStatusRequest`
- `UpdateUserRoleRequest`
- `AddUserFlagRequest`
- `AddAdminNoteRequest`
- `BulkUserUpdateRequest`

### Payment Management (`admin/schemas/payment/`)

- Credit management schemas
- Credit pack schemas
- Transaction schemas

### Gym Management (`admin/schemas/gym/management.ts`)

- Gym management schemas

### Support Management (`admin/schemas/support/`)

- Ticket management schemas

### System Monitoring (`admin/schemas/system/monitoring.ts`)

- System monitoring schemas

### Dashboard (`admin/schemas/dashboard.ts`)

- Dashboard-related schemas

## Routes Missing Validation

### 1. Session Service (`packages/services/session/src/routes/SessionRoutes.ts`)

**Admin routes without validation:**

```typescript
router.get('/admin/analytics', requireAdmin(), adminController.getAnalytics)
router.get('/admin/all', requireAdmin(), adminController.getAllSessions)
router.get('/admin/:id', requireAdmin(), adminController.getSessionDetails)
router.delete('/admin/:id', requireAdmin(), adminController.deleteSession)
router.post('/admin/:id/approve', requireAdmin(), adminController.approveContentSession)
router.post('/admin/:id/decline', requireAdmin(), adminController.declineContentSession)
router.post('/admin/force-checkin', requireAdmin(), adminController.forceCheckIn)
router.post('/admin/cleanup-expired-reservations', requireAdmin(), adminController.cleanupExpiredReservations)
```

**Issues:**

- No validation for route parameters (`:id`)
- No validation for query parameters on GET routes
- No validation for request bodies on POST routes
- Missing session-specific admin schemas

### 2. User Service (`packages/services/user/src/routes/UserRoutes.ts`)

**Admin routes without validation:**

```typescript
router.get('/', requireAdmin(), controller.getAllUsers) // No query param validation
router.get('/email/:email', requireAdmin(), controller.getUserByEmail) // No param validation
router.patch('/:user_id', requireAdmin(), controller.updateUser) // No body validation
router.delete('/:user_id', requireAdmin(), controller.deleteUser) // No param validation
router.put('/:user_id/status', requireAdmin(), controller.updateUserStatus) // No body validation
router.put('/:user_id/ban', requireAdmin(), controller.banUser) // No body validation
router.put('/:user_id/unban', requireAdmin(), controller.unbanUser) // No body validation
```

**Note:** The service has admin schemas available but they're not being used.

### 3. Subscription Service (`packages/services/subscription/src/routes/SubscriptionRoutes.ts`)

**Admin routes without validation:**

```typescript
router.post('/:id/process-credits', requireAdmin(), controller.processSubscriptionCredits) // No validation
router.get('/', requireAdmin(), controller.getSubscriptions) // No query param validation
```

### 4. Other Services with Proper Validation

The following services have proper validation on their admin routes:

- **Payment Service** - Uses validation for credits and credit pack operations
- **Gym Service** - Validates all admin operations
- **Support Service** - Validates admin problem management routes

## Recommendations

### 1. Create Missing Admin Schemas

Create admin-specific schemas for services that lack them:

#### Session Admin Schemas Needed:

- `AdminSessionSearchParams` - For `/admin/all` route
- `AdminSessionAnalyticsParams` - For `/admin/analytics` route
- `AdminForceCheckInRequest` - For `/admin/force-checkin` route
- `SessionIdParam` - For routes with `:id` parameter

#### Subscription Admin Schemas Needed:

- `AdminSubscriptionSearchParams` - For admin listing subscriptions
- `ProcessCreditsRequest` - For credit processing

### 2. Apply Existing Admin Schemas

For User Service, apply the existing admin schemas:

- Use `AdminUserSearchParams` for `GET /` route
- Use `UpdateUserStatusRequest` for `PUT /:user_id/status`
- Create and use `BanUserRequest` and `UnbanUserRequest` schemas

### 3. Implement Consistent Validation Pattern

All admin routes should follow this pattern:

```typescript
router.get(
  '/admin/resource',
  requireAdmin(),
  validateQuery(AdminResourceSearchParams), // For GET routes
  controller.method,
)

router.post(
  '/admin/resource/:id/action',
  requireAdmin(),
  validateParams(ResourceIdParam), // For route params
  validateBody(AdminActionRequest), // For POST/PUT/PATCH bodies
  controller.method,
)
```

### 4. Security Best Practices

1. **Always validate route parameters** - Even simple ID parameters should be validated
2. **Validate query parameters** - Especially for search/filter operations
3. **Validate request bodies** - All POST/PUT/PATCH operations need body validation
4. **Use typed schemas** - Leverage Zod schemas from `@solo60/api/admin`
5. **Consider rate limiting** - Admin endpoints should have rate limiting

## Priority Actions

1. **HIGH PRIORITY**: Add validation to Session Service admin routes (8 unvalidated routes)
2. **HIGH PRIORITY**: Fix User Service admin routes to use existing schemas
3. **MEDIUM PRIORITY**: Add validation to Subscription Service admin routes
4. **LOW PRIORITY**: Create comprehensive admin schema documentation

## Code Examples

### Example: Properly Validated Admin Route

```typescript
// Good - has all necessary validation
router.post('/admin/users/:userId/status', requireAdmin(), validateParams(UserIdParam), validateBody(UpdateUserStatusRequest), controller.updateUserStatus)
```

### Example: Unvalidated Admin Route (Security Risk)

```typescript
// Bad - no validation
router.post(
  '/admin/:id/approve',
  requireAdmin(), // Only checks if user is admin
  controller.approveContentSession, // No validation of :id or body
)
```
