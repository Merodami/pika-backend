# Fix Redis Multiple Connections Issue on Vercel

## Problem Description

When deploying to Vercel, the application is creating too many Redis connections to Upstash, causing connection limit errors:

```
[Redis] INFO: Redis Client Connected (multiple times)
[Redis] ERROR: Failed to initialize Redis connection: MaxRetriesPerRequestError: Reached the max retries per request limit (which is 20)
```

## Root Cause Analysis

### 1. Multiple Redis Client Instantiations

The logs show multiple "Redis Client Connected" messages, indicating that multiple Redis clients are being created:

```
2025-07-28T20:01:50.146Z [info] [Redis] INFO: Redis Client Connected
2025-07-28T20:01:50.303Z [info] [Redis] INFO: Redis Client Connected
2025-07-28T20:01:50.509Z [info] [Redis] INFO: Redis Client Connected
... (continues)
```

### 2. Service Architecture Issue

In the Vercel deployment adapter (`packages/deployment/src/adapters/vercel/adapter.ts`):

- One cache instance is created in `initializeInfrastructure()`
- This instance is passed to all services via `ServiceDependencies`
- However, services might be creating additional connections

### 3. Serverless Environment Constraints

Upstash Redis has connection limits, especially for serverless environments:

- Each service initialization creates a new connection
- In the embedded mode, all 11 services are initialized at once
- This quickly exhausts the connection pool

## Investigation Findings

### Current Implementation Flow

1. **Vercel Adapter Initialization**:

   ```typescript
   // packages/deployment/src/adapters/vercel/adapter.ts
   private async initializeInfrastructure(): Promise<void> {
     // Creates one cache instance
     this.cache = await initializeCache()
   }
   ```

2. **Service Creation**:

   ```typescript
   // Each service receives the same cache instance
   const dependencies: ServiceDependencies = {
     prisma: this.prisma!,
     cache: this.cache!,
     services: createServiceClients(this),
   }
   ```

3. **Potential Issues**:
   - Services might be creating their own Redis connections internally
   - HTTP package might create separate cache instances
   - Each service's `createExpressServer` might initialize its own cache

### Services Creating Extra Connections

**CONFIRMED ISSUE**: All services are creating their own Redis connections in their `app.ts` files:

```typescript
// Every service has this pattern:
const cacheService = await initializeCache()
```

Services creating connections:

- `packages/services/auth/src/app.ts`
- `packages/services/user/src/app.ts`
- `packages/services/business/src/app.ts`
- `packages/services/category/src/app.ts`
- `packages/services/payment/src/app.ts`
- `packages/services/subscription/src/app.ts`
- `packages/services/communication/src/app.ts`
- `packages/services/support/src/app.ts`
- `packages/services/storage/src/app.ts`
- `packages/services/pdf/src/app.ts`
- `packages/services/voucher/src/app.ts`

This means:

1. The Vercel adapter creates 1 connection
2. Each of the 11 services creates 1 connection
3. Total: 12+ Redis connections on startup
4. This exceeds Upstash connection limits

## Solution Approaches

### 1. Singleton Pattern for Redis Client (Recommended)

Create a singleton Redis client that's shared across all services:

```typescript
// packages/redis/src/infrastructure/services/singleton.ts
let sharedRedisInstance: ICacheService | null = null

export async function getSharedCacheInstance(): Promise<ICacheService> {
  if (!sharedRedisInstance) {
    sharedRedisInstance = await initializeCache()
  }
  return sharedRedisInstance
}
```

### 2. Connection Pooling Configuration

Configure ioredis with proper connection pooling for Upstash:

```typescript
// packages/redis/src/infrastructure/services/redis.ts
this.client = new Redis({
  host: config?.host || redisConfig.host,
  port: config?.port || redisConfig.port,
  password: config?.password || REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3, // Reduce from 20
  enableReadyCheck: false, // Disable for serverless
  lazyConnect: true, // Connect only when needed
  connectionPool: {
    min: 1,
    max: 3, // Limit max connections
  },
})
```

### 3. Disable Redis for Non-Critical Services

Some services might not need Redis caching:

```typescript
// For services that don't critically need caching
const cache = DEPLOYMENT_PLATFORM === 'vercel' ? new MemoryCacheService() : await initializeCache()
```

### 4. Use Upstash REST API

Instead of persistent connections, use Upstash's REST API:

```typescript
// Use @upstash/redis which uses HTTP instead of persistent connections
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})
```

## Immediate Fix (RECOMMENDED FOR NOW)

The quickest fix is to set `CACHE_DISABLED=true` in Vercel environment variables, which will make all services use in-memory caching instead of Redis.

**Steps:**

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `CACHE_DISABLED=true`
3. Redeploy the application

This will bypass all Redis connections and use memory cache, which is acceptable for MVP/testing.

## Long-term Solution

1. **Implement singleton pattern** for Redis connections
2. **Audit all services** to ensure they use the passed cache instance
3. **Consider using Upstash REST client** for serverless compatibility
4. **Implement connection pooling** with strict limits
5. **Add connection monitoring** to track connection usage

## Files to Modify

1. `packages/redis/src/infrastructure/services/redis.ts` - Add connection pooling
2. `packages/redis/src/infrastructure/services/initializeCache.ts` - Implement singleton
3. `packages/deployment/src/adapters/vercel/adapter.ts` - Ensure single cache instance
4. `packages/http/src/server/createExpressServer.ts` - Check if creating extra connections
5. All service files that use `createExpressServer` - Ensure they pass cache instance

## Testing

1. Set `CACHE_DISABLED=true` and verify the app works
2. Implement singleton pattern and test locally
3. Deploy with limited connection pool and monitor
4. Consider load testing to ensure connection limits aren't exceeded

## Root Cause Summary

The issue occurs because:

1. **Service Independence**: Each service is designed to run independently with its own `app.ts`
2. **Deployment Assumption**: Services assume they're running in separate processes/containers
3. **Vercel Reality**: All services run in the same process in embedded mode
4. **Connection Explosion**: Each `initializeCache()` call creates a new Redis connection
5. **Upstash Limits**: Serverless Redis has strict connection limits

The architecture works fine when services run separately but breaks in the embedded/monolith deployment model used for Vercel.
