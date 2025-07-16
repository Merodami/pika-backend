# Frontend SDK Documentation

## Overview

The Pika Frontend SDK is maintained as a separate Git repository within the main project structure. This allows:

- Backend team to easily generate and update the SDK
- Frontend team to install it as a dependency from GitHub

## Repository Structure

```
pika/
├── api-microservices-sdk/     # Frontend SDK (Git submodule)
├── packages/
│   ├── api/                   # API definitions (source of truth)
│   └── sdk/                   # Backend SDK (deprecated openapi-typescript-codegen)
└── ...
```

The `api-microservices-sdk` is managed as a Git submodule, which means:

- It's a separate repository with its own Git history
- It's linked to the main project at a specific commit
- Developers need to initialize submodules when cloning

## SDK Generation Workflow

### For Backend Developers

1. **Make API changes** in `packages/api/src/schemas/`

2. **Generate all SDKs**:

   ```bash
   yarn generate:all-sdks
   ```

   This will:
   - Generate OpenAPI specs
   - Update backend SDK in `packages/sdk`
   - Update frontend SDK in `api-microservices-sdk`

3. **Commit changes** in the Frontend SDK:

   ```bash
   cd api-microservices-sdk
   git add .
   git commit -m "feat: update SDK with latest API changes"
   git push origin main
   ```

4. **Tag releases** (optional):
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

### For Frontend Developers (in their own frontend project)

**You DON'T need to clone the Pika backend repository!**

1. **Install the SDK in your frontend project**:

   ```bash
   # In your Next.js/React/Vue/etc project
   cd my-frontend-app

   # Install latest from main branch
   yarn add github:pika-sixty/api-microservices-sdk

   # Or specific version
   yarn add github:pika-sixty/api-microservices-sdk#v1.0.1
   ```

2. **Update to latest**:

   ```bash
   yarn upgrade @pika/frontend-sdk
   ```

3. **Use in code**:

   ```typescript
   import { createPublicApiClient, publicApi } from '@pikasdk'

   const client = createPublicApiClient({
     baseUrl: process.env.NEXT_PUBLIC_API_URL,
   })
   ```

## Key Commands

- `yarn generate:api` - Generate OpenAPI specifications only
- `yarn generate:sdk` - Generate backend SDK only (packages/sdk)
- `yarn generate:frontend-sdk` - Generate frontend SDK only (api-microservices-sdk)
- `yarn generate:all-sdks` - Generate both SDKs
- `yarn local:generate` - Full setup including SDK generation

## Why Two SDKs?

1. **Backend SDK** (`packages/sdk`):
   - Uses deprecated `openapi-typescript-codegen` v0.29.0
   - Tightly integrated with backend services
   - Will be migrated to @hey-api/openapi-ts in future

2. **Frontend SDK** (`api-microservices-sdk`):
   - Uses modern `@hey-api/openapi-ts` v0.77.0
   - Separate repository for clean dependency management
   - Includes only public and admin APIs (no internal APIs)
   - Committed generated files for immediate use

## Working with Git Submodules (Backend Team Only)

### For New Backend Developers

When cloning the main Pika repository:

```bash
# Clone with submodules
git clone --recurse-submodules git@github.com:pika-sixty/pikait

# Or if already cloned
git submodule update --init --recursive
```

**Note**: Frontend developers don't need to deal with submodules. They just install the SDK package directly in their frontend projects.

### Updating the Frontend SDK

After generating new SDK files:

```bash
# 1. Generate the SDK
yarn generate:frontend-sdk

# 2. Commit changes in the SDK submodule
cd api-microservices-sdk
git add .
git commit -m "feat: update SDK with latest API changes"
git push origin main

# 3. Update the submodule reference in main repo
cd ..
git add api-microservices-sdk
git commit -m "chore: update frontend SDK submodule"
```

**Important**:

- `git add .` in the main repo will NOT stage changes inside submodules
- You must commit and push within the submodule first
- Then update the submodule reference in the main repo

### Keeping Submodules in Sync

```bash
# Update all submodules to latest
git submodule update --remote --merge

# Update a specific submodule
git submodule update --remote api-microservices-sdk
```

## Best Practices

1. **Always regenerate** after API changes
2. **Commit generated files** in the frontend SDK
3. **Tag releases** for version control
4. **Document breaking changes** in commit messages
5. **Keep both SDKs in sync** with API changes

## Frontend Session Type Pattern

Frontend applications typically create their own `Session` interface that transforms the API's `LoginResponse` structure:

### API Response Structure

```typescript
// From the SDK (LoginResponse)
{
  user: AuthUserResponse,
  tokens: {
    accessToken: string,
    refreshToken: string,
    tokenType: string,
    expiresIn: number
  }
}
```

### Frontend Session Interface

```typescript
// Frontend application's Session type
interface Session {
  user: AuthUserResponse
  accessToken: string // Flattened from tokens.accessToken
  refreshToken?: string // Optional, from tokens.refreshToken
  error?: string // For error state management
}
```

### Key Principles

- **Use `accessToken`** as the standard field name (not `token`)
- **Flatten nested structures** for easier state management
- **Add error handling** at the application level
- **Import types from SDK** to maintain type safety
