# SDK Integration Issue

## Current Problem

The SDK generation pipeline is broken because it expects an external `api-microservices-sdk` directory that no longer exists.

### Current Flow
1. `yarn generate:api` → generates OpenAPI specs from Zod schemas
2. `yarn generate:sdk` → expects `api-microservices-sdk/` directory to exist
3. **FAILS**: Directory doesn't exist, SDK generation is skipped

### Root Cause
The original architecture had a separate project for SDK generation, but this has been deprecated. The SDK now needs to be integrated directly into the frontend admin dashboard.

## Current Package.json Scripts

```json
{
  "generate:api": "yarn generate:openapi && yarn generate:sdk",
  "generate:sdk": "[ -d api-microservices-sdk ] && (cd api-microservices-sdk && npm run generate) || echo 'Frontend SDK directory not found - skipping (OK in CI)'",
  "generate:openapi": "cd packages/api && yarn generate:openapi && cd ../.. && nx run @pikapi:build"
}
```

## Impact

- **Category Service**: Cannot test SDK generation for new schemas
- **Frontend Development**: No typed API client available
- **CI/CD**: SDK generation silently fails in CI
- **Developer Experience**: No autocomplete/type safety for API calls

## Required Solution

### Option 1: Internal SDK Package
Create `packages/frontend-sdk/` that:
- Consumes generated OpenAPI specs
- Generates TypeScript client
- Exports typed API client
- Can be imported by frontend dashboard

### Option 2: Direct Integration
Move SDK generation directly into the frontend dashboard:
- Generate client code into `packages/frontend/dashboard/src/api/`
- Update dashboard build process to regenerate on API changes
- Keep SDK generation as part of frontend build

### Option 3: Hybrid Approach
- Keep OpenAPI generation in backend
- Create frontend-specific SDK generation script
- Integrate with frontend dashboard build process

## Recommended Solution

**Option 1: Internal SDK Package** is recommended because:
- ✅ Maintains separation of concerns
- ✅ Reusable across multiple frontend projects
- ✅ Follows existing monorepo patterns
- ✅ Easy to version and manage
- ✅ Consistent with current package structure

## Implementation Steps

1. Create `packages/frontend-sdk/` package
2. Install OpenAPI code generation tools
3. Create generation script that consumes `packages/api/generated/openapi/*.json`
4. Update root `package.json` scripts
5. Test with existing schemas
6. Integrate with Category service schemas

## Priority

**HIGH** - This blocks:
- Category service completion
- Frontend development
- API schema validation
- Developer productivity

## Timeline

- **Immediate**: Document issue (✅ Done)
- **Next Session**: Implement solution
- **Before Category Service**: Must be resolved

## Dependencies

- OpenAPI specs generation (✅ Working)
- Frontend dashboard structure (❓ Needs investigation)
- Code generation tools (❓ Needs selection)

---

**Status**: 🔴 Blocking - Requires immediate attention
**Assigned**: Next development session
**Priority**: Critical for Category service completion