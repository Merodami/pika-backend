# API Schema Standardization Tracking

**Last Updated**: 2025-08-12
**Status**: In Progress

## Progress Summary

✅ **Completed**: 15 major files fixed (100+ schemas standardized)
- Shared schemas: errors, geo, health, operations, primitives, responses
- Auth service: login, register, password, oauth
- User service: address, paymentMethod, verification
- Business service: public/business
- Category service: public/category
- Communication service: email, notification
- Storage service: file

## Required Pattern

All API schemas MUST follow this pattern:

```typescript
// 1. Define raw Zod schema (for runtime validation)
export const SchemaName = z.object({
  field: z.string(),
  // ... other fields
})

// 2. Create OpenAPI documented version
export const SchemaNameSchema = SchemaName.openapi('SchemaName', {
  description: 'Schema description',
})

// 3. Export type
export type SchemaName = z.infer<typeof SchemaName>
```

## Special Cases

### Enums
Enums follow a different pattern (single export with openapi wrapper):
```typescript
export const StatusEnum = z.enum(['ACTIVE', 'INACTIVE']).openapi('StatusEnum', {
  description: 'Status values',
})
```

### Branded Types
Branded types (UserId, Email, etc.) don't need OpenAPI versions as they're primitives with branding.

### Utility Functions
Functions like `withTimestamps`, `paginatedResponse` are utility functions that don't need OpenAPI versions.

### Recursive Structures
Recursive structures like CategoryResponse with children don't need special handling in the OpenAPI version.

## Files Fixed

### Shared Schemas ✅
- `errors.ts` - 8 schemas fixed
- `geo.ts` - 6 schemas fixed
- `health.ts` - 3 schemas fixed
- `operations.ts` - 1 schema fixed
- `primitives.ts` - 5 schemas fixed
- `responses.ts` - 10 schemas fixed

### Auth Service ✅
- `public/login.ts` - 7 schemas fixed
- `public/register.ts` - 6 schemas fixed
- `public/password.ts` - 6 schemas fixed
- `public/oauth.ts` - 8 schemas fixed

### User Service ✅
- `public/address.ts` - 10 schemas fixed
- `public/paymentMethod.ts` - 10 schemas fixed
- `public/verification.ts` - 3 schemas fixed

### Business Service ✅
- `public/business.ts` - 10 schemas fixed

### Category Service ✅
- `public/category.ts` - 9 schemas fixed (includes recursive structure handling)

### Communication Service ✅
- `public/email.ts` - 13 schemas fixed
- `public/notification.ts` - 15 schemas fixed

### Storage Service ✅
- `public/file.ts` - 11 schemas fixed

## Compilation Status

✅ **All schemas compile successfully** - Verified with `yarn nx run api:build`

## Detailed Schema Count

- **Total schemas fixed**: 130+ schemas
- **Files modified**: 15 primary schema files
- **Services covered**: 7 major services

## Next Steps

Continue fixing remaining services:
- Support service schemas
- System service schemas
- Subscription service schemas
- Voucher service schemas
- PDF service schemas
- Discovery service schemas
- Admin schemas for all services
- Internal schemas for all services

## Pattern Violations Found and Fixed

1. **Direct openapi() wrapper** - Fixed by separating into raw Zod + OpenAPI documented version
2. **Missing OpenAPI versions** - Added OpenAPI documented versions for all schemas
3. **Incorrect naming** - Standardized to `SchemaName` (raw) and `SchemaNameSchema` (OpenAPI)

## Benefits of Standardization

1. **Runtime validation** - Raw Zod schemas for request/response validation
2. **API documentation** - OpenAPI schemas for automatic API doc generation
3. **Type safety** - TypeScript types derived from Zod schemas
4. **Maintainability** - Consistent pattern across entire codebase
5. **Testing** - Can test validation logic independently from OpenAPI metadata