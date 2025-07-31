# Backend API Requirements for Dashboard

## Type Issues in Generated SDK

### UserManagementService.getAdminUserList

**Issue**: The method returns an inline type instead of using `AdminUserListResponse`  
**Impact**: TypeScript errors in frontend due to missing `hasNext` and `hasPrev` fields  
**Fix Required**: Update OpenAPI spec to reference `AdminUserListResponse` schema instead of inline type definition
