# Vercel Deployment Fixes

## Changes Made

### 1. Fixed Service Client Configuration

- **File**: `packages/deployment/src/services/clients.ts`
- **Issue**: Service clients were passing config objects instead of URL strings
- **Fix**: Changed to pass baseURL directly: `new ServiceClass(baseURL)`

### 2. Implemented Gateway as Entry Point Pattern

- **File**: `packages/api-gateway/src/api/server.ts`
- **Added**: `createGatewayWithServices()` function for embedded mode
- **File**: `packages/api-gateway/src/api/routes/setupEmbeddedServices.ts` (NEW)
- **Purpose**: Mount services directly instead of proxying in Vercel

### 3. Updated Vercel Adapter

- **File**: `packages/deployment/src/adapters/vercel/adapter.ts`
- **Change**: Use API Gateway as main application with embedded services

### 4. Fixed Redis URL Parsing

- **File**: `packages/environment/src/constants/redis.ts`
- **Added**: Auto-parse REDIS_URL to set REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- **File**: `packages/redis/src/infrastructure/services/redis.ts`
- **Added**: Password support for cloud Redis providers

### 5. Removed tsc-alias from API Gateway

- **File**: `packages/api-gateway/project.json`
- **Issue**: tsc-alias causing directory import errors
- **Fix**: Removed tsc-alias from build command

### 6. Fixed Express 5 Compatibility

- **File**: `packages/api-gateway/src/api/routes/docsRoutes.ts`
- **Change**: Route pattern from `/openapi/:api.json` to `/openapi/:api`
- **File**: `packages/api-gateway/src/api/routes/setupEmbeddedServices.ts`
- **Change**: Wildcard route from `/api/v1/*` to `/api/v1/*splat`
- **Removed**: Non-existent category service route

### 7. Fixed Rate Limiting for Trust Proxy

- **File**: `packages/http/src/application/api/server.ts`
- **Added**: Custom keyGenerator for express-rate-limit to work with proxies

### 8. Fixed Redis Connection Issues (July 15, 2025)

- **File**: `packages/services/auth/src/app.ts`
- **Issue**: Redis connection attempts even when CACHE_DISABLED=true
- **Fix**: Added conditional Redis initialization checking CACHE_DISABLED flag
- **Added**: Graceful fallback to MemoryCacheService when Redis fails or disabled

### 9. Fixed Serverless Request Context Property Error (July 15, 2025)

- **File**: `packages/http/src/infrastructure/express/middleware/requestContext.ts`
- **Issue**: "Cannot redefine property: requestContext" in serverless environments
- **Fix**: Changed configurable: false to configurable: true for request property
- **Added**: Check for existing property before defining to prevent redefinition errors

### 10. Updated Supabase Database Schema (July 15, 2025)

- **Issue**: Schema conflicts with Supabase's built-in "auth" and "storage" schemas
- **Fix**: Renamed schemas to avoid conflicts:
  - "auth" → "identity"
  - "storage" → "files"
- **Files Updated**: All Prisma model files and enums.prisma
- **Migration**: Generated complete SQL schema for manual Supabase deployment

### 11. Fixed Service-to-Service Communication in Serverless (July 15, 2025)

- **Issue**: "ECONNREFUSED 127.0.0.1:5501" errors when services try to communicate via localhost
- **Root Cause**: No local HTTP servers run in serverless environment (no localhost:5501, etc.)
- **Fix**:
  1. Configure service URLs through Vercel Environment Variables to use the public API gateway
  2. Added internal route mappings to embedded services setup
  3. Fixed base adapter to return full URLs for Vercel platform
  4. Fixed embedded services to use correct SERVICE_API_KEY environment variable
  5. Fixed all route mount path mismatches between gateway and services
  6. Added missing requireAuth() middleware to /userinfo endpoint
- **Files Updated**:
  - `packages/api-gateway/src/api/routes/setupEmbeddedServices.ts` - Fixed all route mappings to match actual service mounts
  - `packages/deployment/src/adapters/base.ts` - Fixed getServiceUrl to return full URLs for Vercel
  - `packages/deployment/src/adapters/vercel/adapter.ts` - Reverted to standard service client creation
  - `packages/services/auth/src/routes/AuthRoutes.ts` - Added missing auth middleware to userinfo
  - `.env.vercel.example` - Added service URL examples
- **Files Deleted**:
  - `packages/deployment/src/services/embedded-clients.ts` - Not needed with env var approach
- **Route Fixes**:
  - User admin routes: `/users/admin` → `/admin/users`
  - Gym admin routes: `/gyms/admin` → `/admin/gyms`
  - Added gym additional routes: `/stuff`, `/admin/stuff`, `/inductions`, `/favorites`
  - Session routes: Added `/reviews`, `/waiting-list`
  - Payment routes: Mapped actual routes (`/credits`, `/credit-packs`, etc.) instead of `/payments`
  - Subscription routes: Added `/plans`
- **Solution**: Set all service API URLs in Vercel dashboard to point to the deployed gateway
- **How it works**: Services communicate through the public API gateway URL with proper
  route mapping and service authentication

### 12. Fixed Redis/Cache Initialization for Serverless (July 16, 2025)

- **Issue**: Multiple Redis connection attempts causing 504 Gateway Timeout errors on Vercel
- **Root Cause**: Services ignoring CACHE_DISABLED environment variable
- **Changes Made**:
  1. **Moved initializeCache to @pika/redis package**
     - File: `packages/redis/src/infrastructure/services/initializeCache.ts` (NEW)
     - Centralized cache initialization logic with CACHE_DISABLED checking
     - Added runtime environment variable checking for better reliability
  2. **Updated all services to use shared initializeCache**
     - Files: All `packages/services/*/src/app.ts`
     - Changed from local cache initialization to importing from @pika
  3. **Fixed Vercel deployment adapter**
     - File: `packages/deployment/src/adapters/vercel/adapter.ts`
     - Uses shared initializeCache function respecting CACHE_DISABLED
     - Fixed cache health check to use ICacheService interface methods
  4. **Fixed environment loading**
     - File: `api/index.js`
     - Don't load local .env files on Vercel (environment vars provided by platform)
     - Only load getLocalEnv() in non-production environments
- **Best Practice**: Set CACHE_DISABLED=true for Vercel deployments to use memory cache

## Environment Variables Required

Add these to Vercel dashboard:

### Core Variables

- DATABASE_URL=postgresql://postgres.xxx:password@xxx.supabase.com:6543/postgres?pgbouncer=true
- REDIS_URL=redis://default:password@xxx.upstash.io:6379
- JWT_SECRET=your-jwt-secret
- SERVICE_API_KEY=your-internal-api-key
- CACHE_DISABLED=true (recommended for Redis reliability)
- NODE_ENV=production
- LOG_LEVEL=info
- RATE_LIMIT_ENABLE=true

### Service URLs (CRITICAL for serverless)

All service URLs must point to the deployed API gateway:

- USER_API_URL=https://pikaapi.vercel.app/api/v1
- AUTH_API_URL=https://pikai.vercel.app/api/v1
- GYM_API_URL=https://pikai.vercel.app/api/v1
- SESSION_API_URL=https://pikai.vercel.app/api/v1
- PAYMENT_API_URL=https://pikai.vercel.app/api/v1
- SUBSCRIPTION_API_URL=https://pikai.vercel.app/api/v1
- COMMUNICATION_API_URL=https://pikai.vercel.app/api/v1
- SUPPORT_API_URL=https://pikai.vercel.app/api/v1
- SOCIAL_API_URL=https://pikai.vercel.app/api/v1
- FILE_STORAGE_API_URL=https://pikai.vercel.app/api/v1
