# General Technical Debt and TODOs

This file tracks general technical debt and improvement tasks across the entire codebase.

## Import Path Standardization

### Communication Service Import Paths

- **Issue**: Communication service uses relative imports (`../`) instead of proper package aliases
- **Expected Pattern**: Use `@communication/` aliases like other services (e.g., `@business/`, `@category/`)
- **Files to Check**: All files in `packages/services/communication/src/`
- **Action Required**:
  1. Update tsconfig.json path mappings to include `@communication/*` alias
  2. Replace all relative imports with proper package aliases
  3. Update all import statements throughout the service
- **Priority**: Medium - improves consistency and maintainability

### Other Services to Audit

- Check if other services also have inconsistent import patterns
- Ensure all services follow the same `@servicename/` pattern

## Schema Organization

### Admin Schema Types

- **Issue**: Need to verify all admin schemas use existing types from `@pika/types` instead of creating duplicates
- **Action Required**: Audit all admin schema files to use existing enums and types
- **Priority**: Low - prevents code duplication

## Architecture Consistency

### Repository Pagination Pattern

- **Issue**: Ensure all services follow the repository-builds-pagination pattern from SCHEMA_ORGANIZATION.md
- **Action Required**: Audit all repository methods to return `PaginatedResult<T>`
- **Priority**: Medium - architectural consistency

---

**Created**: 2025-01-24
**Last Updated**: 2025-01-24
