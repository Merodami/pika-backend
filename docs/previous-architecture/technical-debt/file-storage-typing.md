# File Storage Typing Technical Debt

## Issue Description

Currently, the file storage interface is typed as `any` across multiple services in the codebase. This needs to be properly typed and standardized.

## Current State

1. **Multiple Services Affected**:
   - Gym Service
   - User Service (for avatar uploads)
   - Session Service (potentially)
   - Any other service that handles file uploads

2. **Interface Inconsistency**:
   - `fileStorage?: any` is used in server configurations
   - No shared interface definition
   - Mock implementations in tests are not type-safe

3. **Function Signature Mismatches**:
   - Some routers expect 3 parameters (prisma, cache, fileStorage)
   - Server.ts files sometimes only pass 2 parameters
   - This causes runtime errors when fileStorage-dependent features are used

## Proposed Solution

### 1. Create a Shared FileStorage Interface

```typescript
// packages/shared/src/ports/FileStoragePort.ts
export interface FileStoragePort {
  saveFile(file: Express.Multer.File, options?: SaveFileOptions): Promise<SaveFileResult>

  deleteFile(filePath: string): Promise<void>

  getFileUrl(filePath: string): Promise<string>

  moveFile(sourcePath: string, destinationPath: string): Promise<void>
}

export interface SaveFileOptions {
  prefix?: string
  bucket?: string
  contentType?: string
  metadata?: Record<string, string>
}

export interface SaveFileResult {
  url: string
  path: string
  size: number
  contentType: string
}
```

### 2. Update Service Configurations

```typescript
// All server.ts files should be updated
export interface ServerConfig {
  port: number
  host?: string
  prisma: PrismaClient
  cacheService: ICacheService
  fileStorage?: FileStoragePort // Properly typed
}
```

### 3. Update Router Signatures

All router creation functions should consistently expect the same parameters:

```typescript
export function createServiceRouter(prisma: PrismaClient, cache: ICacheService, fileStorage?: FileStoragePort): Router
```

### 4. Implement Adapters

Create adapters for different storage providers:

- S3StorageAdapter
- LocalStorageAdapter
- MinioStorageAdapter

## Migration Steps

1. Create the FileStoragePort interface in @pika/shared
2. Update all ServerConfig interfaces across services
3. Update all router creation functions to use consistent signatures
4. Update server.ts files to pass fileStorage parameter
5. Update tests to use properly typed mocks
6. Implement actual storage adapters
7. Remove all `any` types related to file storage

## Quick Fix (Temporary)

For now, to get tests passing:

1. Make fileStorage optional in router functions
2. Pass undefined where not needed
3. Document with TODO comments where proper implementation is needed

## Impact

- **High Priority**: This affects type safety across multiple services
- **Effort**: Medium (2-3 days to implement properly)
- **Risk**: Low (mostly type changes, minimal logic changes)

## Dependencies

- Need to decide on file storage strategy (S3, local, etc.)
- May need to update @pikaervice to export proper types
- Tests will need updating to use proper mocks

## Notes

This was discovered while implementing admin gym endpoints - the createAdminGymRouter expected 3 parameters but server.ts was only passing 2, causing the routes to fail to initialize properly.
