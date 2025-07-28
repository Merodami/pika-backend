# Flow Tests

Flow scripts for testing complete user journeys through the API.

## Auth Flow

**Script:** `auth-flow.ts`  
**Command:** `yarn flow:auth`

Tests the complete authentication flow:
- User registration with email verification
- Login attempts (blocked until verified)
- Email verification process
- Token operations (refresh, introspect)
- Password management
- Profile updates

### Key validations:
- Registration returns `emailSent` status
- Unverified emails cannot login
- OAuth 2.0 compliant responses

## Category Flow

**Script:** `category-flow.ts`  
**Command:** `yarn flow:category`

Tests complete category management across user roles:

### Admin Operations:
- Create parent categories
- Create subcategories (hierarchical)
- Update category details
- Toggle activation status
- Delete categories

### Public Operations:
- List categories (anonymous)
- Get category hierarchy
- Get category path (breadcrumb)

### Key validations:
- Hierarchical structure support
- Admin-only write operations
- Public read access
- Parent-child relationships