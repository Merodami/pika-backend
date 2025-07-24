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

### Translation System Multi-Language Support

- **Issue**: VoucherForBook interface expects multi-language translation objects (`Record<string, string>`) but current implementation only provides single-language strings
- **Location**: `InternalVoucherService.getVouchersForBook()` method in voucher service
- **Current Behavior**: Uses single resolved translation or fallback to translation keys
- **Expected Behavior**: Should fetch all language versions of translation keys and format as `{ "en": "Title", "es": "Título", "gn": "Título" }`
- **Architecture Impact**: Need to implement proper multi-language translation fetching that works with the existing translation service architecture
- **Dependencies**: Requires understanding of how to fetch all language versions for a set of translation keys
- **Action Required**:
  1. Research how translation service provides multi-language data
  2. Implement helper method to fetch all languages for given translation keys
  3. Update getVouchersForBook to use proper multi-language format
  4. Test with all supported languages (en, es, gn)
- **Priority**: Medium - affects PDF generation and voucher book functionality

---

**Created**: 2025-01-24
**Last Updated**: 2025-01-24
