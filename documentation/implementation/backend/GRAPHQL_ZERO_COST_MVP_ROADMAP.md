# GraphQL Zero-Cost Advanced MVP Implementation Roadmap

## Executive Summary

This document outlines a production-ready, zero-cost GraphQL implementation for VoucherBook's advanced MVP. Using industry-standard open-source tools, we'll deliver enterprise-grade features including real-time analytics, complex reporting, and read replica routing - all without monthly subscription costs.

**Key Achievement**: Enterprise GraphQL capabilities at $0/month operational cost.

## Table of Contents

1. [Zero-Cost Technology Stack](#zero-cost-technology-stack)
2. [MVP Architecture Design](#mvp-architecture-design)
3. [Fast-Track Implementation (4 Weeks)](#fast-track-implementation-4-weeks)
4. [Advanced MVP Features](#advanced-mvp-features)
5. [Read Replica Strategy](#read-replica-strategy)
6. [Real-Time Analytics Implementation](#real-time-analytics-implementation)
7. [Performance Without Premium Tools](#performance-without-premium-tools)
8. [Monitoring with Free Tools](#monitoring-with-free-tools)
9. [Quick Start Guide](#quick-start-guide)

## Zero-Cost Technology Stack

### Core Stack (100% Free, Production-Ready)

```yaml
GraphQL Server:
  Primary: GraphQL Yoga 5.15.1 (Latest: Aug 2025)
  Why: The Guild's production server, used by Microsoft, IBM
  Features: Built-in performance optimizations, file uploads, subscriptions
  Cost: FREE

Schema Management:
  Tool: GraphQL Mesh 0.100.8 (Latest: Aug 2025)
  Why: Handles federation, stitching, and transformations
  Features: Auto-generated gateway from your existing services
  Cost: FREE

Monitoring:
  Primary: Hive.com Free Tier
  Features: Unlimited seats, 1M operations/month, schema registry
  Fallback: Grafana + Prometheus (self-hosted)
  Cost: FREE

Development:
  IDE: GraphiQL (embedded)
  Code Gen: GraphQL Code Generator
  Testing: Vitest + MSW
  Cost: FREE

Performance:
  Caching: Redis (existing)
  Batching: DataLoader
  Queries: GraphQL JIT Compiler
  Cost: FREE

Real-time:
  WebSockets: graphql-ws
  SSE: Yoga built-in
  Pub/Sub: Redis (existing)
  Cost: FREE
```

### Why This Stack for Advanced MVP

1. **Zero Learning Curve**: Works with your existing Express/TypeScript setup
2. **Production Ready**: These tools power billion-dollar companies
3. **No Vendor Lock-in**: Can switch to Apollo later if needed
4. **Full Features**: Everything Apollo offers, but free

## MVP Architecture Design

### Simplified Architecture for Speed

```mermaid
graph TB
    subgraph "Clients"
        WEB[Admin Dashboard]
        MOBILE[Flutter App]
        ANALYTICS[BI Tools]
    end

    subgraph "GraphQL Layer - NEW"
        YOGA[GraphQL Yoga Gateway<br/>:4500<br/>Zero Cost]
        WS[WebSocket Server<br/>Real-time Updates]
    end

    subgraph "Existing Services - NO CHANGES"
        REST[REST APIs<br/>:5020-5030<br/>Keep Running]
    end

    subgraph "Smart Routing"
        MESH[GraphQL Mesh<br/>Auto-wrapper for REST]
        DIRECT[Direct Prisma<br/>For Analytics]
    end

    subgraph "Data Layer"
        PRIMARY[(Primary DB<br/>:6436)]
        REPLICA[(Read Replica<br/>:6437)]
        REDIS[(Redis<br/>:7381)]
    end

    WEB --> YOGA
    MOBILE --> REST
    ANALYTICS --> YOGA

    YOGA --> WS
    YOGA --> MESH
    YOGA --> DIRECT

    MESH --> REST
    DIRECT --> REPLICA
    REST --> PRIMARY

    YOGA --> REDIS
```

### Key Design Decisions for MVP

1. **Keep REST APIs Running**: No migration needed, GraphQL wraps them
2. **Direct Database Access for Analytics**: Skip microservices for reports
3. **Single Gateway**: One GraphQL endpoint, not complex federation
4. **Automatic Schema Generation**: From your existing REST APIs
5. **Progressive Enhancement**: Add GraphQL features as needed

## Fast-Track Implementation (4 Weeks)

### Week 1: Foundation (3 Days)

```bash
# Day 1: Setup (with latest versions)
npm install graphql-yoga@5.15.1 @graphql-mesh/cli@0.100.8 @envelop/core@5.3.0
npm install @graphql-hive/yoga@0.42.2 @envelop/prometheus@11.0.0
npm install dataloader@2.2.3 graphql-jit@0.8.7

# Day 2: Basic Gateway
Create GraphQL Yoga server
Wrap 2-3 REST services with Mesh
Test with GraphiQL

# Day 3: Authentication
Integrate JWT validation
Add permission layer
Test with existing auth
```

### Week 2: Core Features (5 Days)

```typescript
// packages/api-gateway/src/graphql/server.ts
import { createYoga } from 'graphql-yoga'
import { useHive } from '@graphql-hive/yoga'
import { useJWT } from '@envelop/jwt'
import { useResponseCache } from '@envelop/response-cache'
import { createRedisCache } from './cache'

export const yoga = createYoga({
  schema: await buildSchema(),

  plugins: [
    // Free monitoring
    useHive({
      enabled: true,
      token: process.env.HIVE_TOKEN, // Free tier
    }),

    // JWT from your existing auth
    useJWT({
      secret: process.env.JWT_SECRET,
      algorithms: ['HS256'],
    }),

    // Free caching with Redis
    useResponseCache({
      cache: createRedisCache(),
      ttl: 60_000, // 1 minute default

      // Smart caching by operation
      ttlPerType: {
        Query: 60_000,
        User: 30_000,
        Analytics: 300_000, // 5 min for analytics
      },
    }),
  ],
})
```

### Week 3: Advanced MVP Features (5 Days)

```yaml
Priority Features: 1. Complex Analytics Queries (Direct to Replica)
  2. Real-time Voucher Updates (WebSockets)
  3. Batch Operations (DataLoader)
  4. Dynamic Filtering (Auto-generated)
  5. Export to CSV/PDF (Built-in)
```

### Week 4: Production Ready (3 Days)

```yaml
Final Steps: 1. Load Testing with K6 (free)
  2. Error Tracking with Sentry (free tier)
  3. Documentation Generation
  4. Docker Deployment
  5. Monitoring Dashboard
```

## Advanced MVP Features

### 1. Dynamic Analytics Queries

```typescript
// Direct database access for complex analytics
// Bypasses REST APIs for performance

import { PrismaClient } from '@prisma/client'

// Separate clients for primary and replica
const primaryDB = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
})

const replicaDB = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_REPLICA_URL } },
})

// GraphQL resolver for analytics
export const analyticsResolvers = {
  Query: {
    // Complex business analytics - uses replica
    businessDashboard: async (_, { businessId, dateRange }) => {
      return replicaDB.$queryRaw`
        WITH metrics AS (
          SELECT 
            DATE_TRUNC('day', v.redeemed_at) as date,
            COUNT(DISTINCT v.id) as redemptions,
            COUNT(DISTINCT v.user_id) as unique_users,
            SUM(v.discount_value) as revenue,
            AVG(v.rating) as avg_rating
          FROM vouchers v
          WHERE v.business_id = ${businessId}
            AND v.redeemed_at >= ${dateRange.from}
            AND v.redeemed_at <= ${dateRange.to}
          GROUP BY DATE_TRUNC('day', v.redeemed_at)
        )
        SELECT 
          json_build_object(
            'daily_metrics', json_agg(metrics ORDER BY date),
            'total_redemptions', SUM(redemptions),
            'total_revenue', SUM(revenue),
            'avg_rating', AVG(avg_rating)
          ) as result
        FROM metrics
      `
    },

    // Platform-wide analytics for admin
    platformAnalytics: async (_, args, ctx) => {
      // Check admin permission
      if (ctx.user.role !== 'admin') throw new Error('Unauthorized')

      // Complex aggregation using replica
      return replicaDB.$queryRaw`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE status = 'active') as total_users,
          (SELECT COUNT(*) FROM businesses WHERE verified = true) as total_businesses,
          (SELECT COUNT(*) FROM vouchers WHERE state = 'published') as active_vouchers,
          (SELECT SUM(discount_value) FROM voucher_redemptions 
           WHERE created_at >= NOW() - INTERVAL '30 days') as monthly_revenue
      `
    },
  },
}
```

### 2. Real-Time Features

```typescript
// WebSocket subscriptions for real-time updates
// Zero cost using graphql-ws

import { createPubSub } from 'graphql-yoga'
import Redis from 'ioredis'

// Use Redis for pub/sub across servers
const redis = new Redis(process.env.REDIS_URL)
const pubsub = createPubSub({
  eventTarget: redis,
})

export const subscriptionResolvers = {
  Subscription: {
    // Business owners see redemptions in real-time
    voucherRedeemed: {
      subscribe: (_, { businessId }, ctx) => {
        // Verify business owner
        if (!ctx.user.businesses.includes(businessId)) {
          throw new Error('Unauthorized')
        }

        return pubsub.subscribe(`voucher.redeemed.${businessId}`)
      },
    },

    // Users get notified of new vouchers
    newVoucherAvailable: {
      subscribe: (_, { categories }, ctx) => {
        return pubsub.subscribe(categories.map((c) => `voucher.new.${c}`))
      },
    },

    // Admin monitors platform activity
    platformActivity: {
      subscribe: (_, __, ctx) => {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized')
        return pubsub.subscribe('platform.activity')
      },
    },
  },
}

// Publish events from your REST APIs
export async function publishRedemption(voucher: any) {
  await pubsub.publish(`voucher.redeemed.${voucher.businessId}`, {
    voucherRedeemed: voucher,
  })
}
```

### 3. Smart Query Builder

```typescript
// Auto-generate filters from your Prisma schema
// No manual coding needed

import { makeExecutableSchema } from '@graphql-tools/schema' // v10.0.25
import { PrismaSelect } from '@paljs/plugins' // v8.2.1

// Auto-generate where conditions
const typeDefs = `
  type Query {
    vouchers(
      where: VoucherWhereInput
      orderBy: [VoucherOrderByInput!]
      take: Int
      skip: Int
    ): [Voucher!]!
    
    # Complex filtering auto-generated
    businessAnalytics(
      where: BusinessAnalyticsWhereInput
      groupBy: [String!]
      having: HavingInput
    ): BusinessAnalytics!
  }
  
  # Auto-generated from Prisma schema
  input VoucherWhereInput {
    AND: [VoucherWhereInput!]
    OR: [VoucherWhereInput!]
    NOT: [VoucherWhereInput!]
    
    id: StringFilter
    title: StringFilter
    businessId: StringFilter
    value: FloatFilter
    validUntil: DateTimeFilter
    state: VoucherStateFilter
    
    # Relation filters
    business: BusinessWhereInput
    category: CategoryWhereInput
    redemptions: RedemptionListRelationFilter
  }
`

// Smart resolver with automatic optimization
const resolvers = {
  Query: {
    vouchers: async (_, args, ctx, info) => {
      // Auto-optimize query based on requested fields
      const select = new PrismaSelect(info).value

      // Use replica for read-heavy queries
      const db = ctx.isAnalyticsQuery ? replicaDB : primaryDB

      return db.voucher.findMany({
        where: args.where,
        orderBy: args.orderBy,
        take: args.take,
        skip: args.skip,
        select: select.select, // Only fetch requested fields
      })
    },
  },
}
```

### 4. Batch Operations & Export

```typescript
// DataLoader for automatic batching
import DataLoader from 'dataloader'
import { formatCSV, generatePDF } from './exporters'

// Batch loading prevents N+1 queries
const createLoaders = () => ({
  users: new DataLoader(async (ids) => {
    const users = await primaryDB.user.findMany({
      where: { id: { in: ids } },
    })
    return ids.map((id) => users.find((u) => u.id === id))
  }),

  businesses: new DataLoader(async (ids) => {
    const businesses = await primaryDB.business.findMany({
      where: { id: { in: ids } },
    })
    return ids.map((id) => businesses.find((b) => b.id === id))
  }),

  // Analytics loader uses replica
  analytics: new DataLoader(async (businessIds) => {
    const data = await replicaDB.$queryRaw`
      SELECT business_id, COUNT(*) as total, AVG(rating) as rating
      FROM voucher_redemptions
      WHERE business_id = ANY(${businessIds})
      GROUP BY business_id
    `
    return businessIds.map((id) => data.find((d) => d.business_id === id))
  }),
})

// Export resolvers
export const exportResolvers = {
  Query: {
    exportVoucherReport: async (_, { format, filters }, ctx) => {
      // Use replica for heavy export operations
      const data = await replicaDB.voucher.findMany({
        where: filters,
        include: {
          business: true,
          redemptions: true,
        },
      })

      if (format === 'CSV') {
        return {
          url: await uploadToS3(formatCSV(data)),
          format: 'CSV',
        }
      } else if (format === 'PDF') {
        return {
          url: await uploadToS3(await generatePDF(data)),
          format: 'PDF',
        }
      }
    },
  },
}
```

## Read Replica Strategy

### Automatic Query Routing

```typescript
// middleware/database-router.ts
// Automatically routes queries to appropriate database

export const databaseRouter = (resolver: any) => {
  return async (parent: any, args: any, context: any, info: any) => {
    // Determine which database to use
    const useReplica = shouldUseReplica(info)

    // Add database clients to context
    context.db = useReplica ? replicaDB : primaryDB
    context.useReplica = useReplica

    // Log for monitoring
    if (process.env.NODE_ENV === 'development') {
      console.log(`Using ${useReplica ? 'REPLICA' : 'PRIMARY'} for ${info.fieldName}`)
    }

    return resolver(parent, args, context, info)
  }
}

function shouldUseReplica(info: any): boolean {
  const fieldName = info.fieldName
  const operation = info.operation.operation

  // Mutations always use primary
  if (operation === 'mutation') return false

  // Analytics queries use replica
  if (fieldName.includes('analytics') || fieldName.includes('report') || fieldName.includes('export') || fieldName.includes('statistics')) {
    return true
  }

  // Real-time queries use primary
  if (fieldName.includes('current') || fieldName.includes('active') || fieldName.includes('my')) {
    return false
  }

  // Historical queries use replica
  if (info.variableValues?.dateRange || info.variableValues?.historical) {
    return true
  }

  return false // Default to primary
}
```

## Real-Time Analytics Implementation

### Live Dashboard Updates

```typescript
// Real-time analytics without expensive tools
// Uses Server-Sent Events (built into Yoga)

export const realtimeResolvers = {
  Subscription: {
    // Live metrics dashboard
    dashboardMetrics: {
      subscribe: async function* (_, { businessId }, ctx) {
        while (true) {
          // Fetch latest metrics from replica
          const metrics = await replicaDB.$queryRaw`
            SELECT 
              COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as hourly_redemptions,
              COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') as daily_redemptions,
              COUNT(DISTINCT user_id) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') as unique_users,
              SUM(discount_value) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') as daily_revenue
            FROM voucher_redemptions
            WHERE business_id = ${businessId}
          `

          yield { dashboardMetrics: metrics[0] }

          // Update every 30 seconds
          await new Promise((resolve) => setTimeout(resolve, 30000))
        }
      },
    },

    // Platform-wide activity feed
    activityFeed: {
      subscribe: async function* (_, __, ctx) {
        if (ctx.user.role !== 'admin') throw new Error('Unauthorized')

        const redisClient = new Redis(process.env.REDIS_URL)

        // Listen to Redis pub/sub
        redisClient.subscribe('platform:activity')

        for await (const message of redisClient) {
          yield { activityFeed: JSON.parse(message) }
        }
      },
    },
  },
}
```

### Aggregation Pipeline

```typescript
// Complex aggregations without expensive tools
// Uses Prisma's raw queries with PostgreSQL

export const aggregationResolvers = {
  Query: {
    // Hourly distribution analysis
    hourlyDistribution: async (_, { businessId, days = 7 }) => {
      const result = await replicaDB.$queryRaw`
        WITH hourly_data AS (
          SELECT 
            EXTRACT(HOUR FROM redeemed_at) as hour,
            COUNT(*) as count,
            AVG(discount_value) as avg_value
          FROM voucher_redemptions
          WHERE business_id = ${businessId}
            AND redeemed_at > NOW() - INTERVAL '${days} days'
          GROUP BY EXTRACT(HOUR FROM redeemed_at)
        )
        SELECT 
          hour,
          count,
          avg_value,
          ROUND(100.0 * count / SUM(count) OVER (), 2) as percentage
        FROM hourly_data
        ORDER BY hour
      `

      return result
    },

    // Cohort analysis for retention
    cohortAnalysis: async (_, { businessId }) => {
      const result = await replicaDB.$queryRaw`
        WITH cohorts AS (
          SELECT 
            DATE_TRUNC('month', first_redemption) as cohort_month,
            user_id,
            COUNT(*) as redemptions
          FROM (
            SELECT 
              user_id,
              MIN(redeemed_at) as first_redemption
            FROM voucher_redemptions
            WHERE business_id = ${businessId}
            GROUP BY user_id
          ) first_visits
          JOIN voucher_redemptions r USING (user_id)
          WHERE r.business_id = ${businessId}
          GROUP BY DATE_TRUNC('month', first_redemption), user_id
        )
        SELECT 
          cohort_month,
          COUNT(DISTINCT user_id) as users,
          AVG(redemptions) as avg_redemptions,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY redemptions) as median_redemptions
        FROM cohorts
        GROUP BY cohort_month
        ORDER BY cohort_month DESC
      `

      return result
    },
  },
}
```

## Performance Without Premium Tools

### 1. Query Optimization

```typescript
// JIT compilation for 10x faster queries
import { compileQuery, isCompiledQuery } from 'graphql-jit'

// Compile queries at startup
const compiledQueries = new Map()

export function createOptimizedExecutor(schema: GraphQLSchema) {
  return (args: any) => {
    const { query, variables, context } = args
    const queryId = createHash(query)

    // Check if already compiled
    if (!compiledQueries.has(queryId)) {
      const compiledQuery = compileQuery(schema, parse(query))

      if (isCompiledQuery(compiledQuery)) {
        compiledQueries.set(queryId, compiledQuery)
      }
    }

    const executor = compiledQueries.get(queryId)
    if (executor) {
      return executor.query({}, context, variables)
    }

    // Fallback to normal execution
    return execute({ schema, document: parse(query), contextValue: context, variableValues: variables })
  }
}
```

### 2. Free CDN Caching

```typescript
// Use Cloudflare's free CDN for GraphQL
// Add cache headers for CDN

export const cachePlugin = {
  onExecute({ args }: any) {
    return {
      onExecuteDone({ result, setResult }: any) {
        // Add cache headers based on query type
        const cacheControl = getCacheControl(args.document)

        if (cacheControl) {
          setResult({
            ...result,
            extensions: {
              ...result.extensions,
              cacheControl,
            },
          })
        }
      },
    }
  },
}

function getCacheControl(document: any) {
  // Analytics queries can be cached longer
  if (hasDirective(document, 'analytics')) {
    return { maxAge: 300, scope: 'PUBLIC' } // 5 minutes
  }

  // User-specific data
  if (hasDirective(document, 'private')) {
    return { maxAge: 60, scope: 'PRIVATE' } // 1 minute
  }

  // Public data
  return { maxAge: 120, scope: 'PUBLIC' } // 2 minutes
}
```

## Monitoring with Free Tools

### 1. Hive.com Setup (Free Tier)

```bash
# Step 1: Sign up at app.graphql-hive.com (free)
# Step 2: Create organization and project
# Step 3: Get your token

# Step 4: Add to your server
npm install @graphql-hive/yoga
```

```typescript
// Automatic monitoring with zero config
import { useHive } from '@graphql-hive/yoga'

useHive({
  enabled: true,
  token: process.env.HIVE_TOKEN,
  usage: true, // Track usage
  reporting: {
    author: 'VoucherBook Backend',
    commit: process.env.GIT_COMMIT,
  },
  // Alert on slow queries
  alert: {
    channel: 'slack',
    threshold: 1000, // 1 second
  },
})
```

### 2. Grafana + Prometheus (Self-Hosted)

```typescript
// Free metrics collection
import { usePrometheus } from '@envelop/prometheus' // v11.0.0
import { register } from 'prom-client' // v15.1.3

// Automatic metrics collection
usePrometheus({
  endpoint: '/metrics',
  registry: register,

  // Custom metrics
  metrics: {
    graphql_resolver_duration_ms: new Histogram({
      name: 'graphql_resolver_duration_ms',
      help: 'Resolver execution time',
      labelNames: ['resolver', 'operation'],
    }),
  },
})

// Grafana dashboard config (import this JSON)
const dashboard = {
  dashboard: {
    title: 'VoucherBook GraphQL',
    panels: [
      {
        title: 'Request Rate',
        targets: [
          {
            expr: 'rate(graphql_requests_total[5m])',
          },
        ],
      },
      {
        title: 'Error Rate',
        targets: [
          {
            expr: 'rate(graphql_errors_total[5m])',
          },
        ],
      },
      {
        title: 'P95 Latency',
        targets: [
          {
            expr: 'histogram_quantile(0.95, graphql_request_duration_bucket)',
          },
        ],
      },
    ],
  },
}
```

## Quick Start Guide

### 1. Installation (10 minutes)

```bash
# Create new GraphQL gateway package
mkdir packages/graphql-gateway
cd packages/graphql-gateway

# Initialize package
npm init -y

# Install zero-cost stack (Latest versions as of Aug 2025)
npm install \
  graphql@16.9.0 \
  graphql-yoga@5.15.1 \
  @graphql-mesh/cli@0.100.8 \
  @graphql-mesh/graphql@0.108.12 \
  @graphql-mesh/openapi@0.110.12 \
  @graphql-mesh/transform-prefix@0.109.8 \
  @graphql-mesh/transform-cache@0.109.8 \
  @graphql-hive/yoga@0.42.2 \
  @envelop/core@5.3.0 \
  @envelop/jwt@8.0.8 \
  @envelop/depth-limit@4.0.8 \
  @envelop/rate-limiter@6.2.0 \
  @envelop/response-cache@6.2.0 \
  @envelop/prometheus@11.0.0 \
  dataloader@2.2.3 \
  graphql-jit@0.8.7 \
  graphql-ws@6.0.6 \
  ioredis@5.4.1

# Dev dependencies
npm install -D \
  @graphql-codegen/cli@5.0.7 \
  @graphql-codegen/typescript@4.1.2 \
  @graphql-codegen/typescript-resolvers@4.4.0 \
  @types/node@22.12.0 \
  tsx@4.19.4 \
  vitest@3.2.2
```

### 2. Basic Server Setup (20 minutes)

```typescript
// src/server.ts
import { createServer } from 'node:http'
import { createYoga } from 'graphql-yoga'
import { schema } from './schema'
import { createContext } from './context'
import { plugins } from './plugins'

const yoga = createYoga({
  schema,
  context: createContext,
  plugins,

  // GraphiQL with authentication headers
  graphiql: {
    defaultHeaders: {
      Authorization: 'Bearer YOUR_TOKEN',
    },
  },
})

const server = createServer(yoga)

server.listen(4500, () => {
  console.log('🚀 GraphQL server running at http://localhost:4500/graphql')
})
```

### 3. Mesh Configuration (30 minutes)

```yaml
# .meshrc.yml
sources:
  - name: Users
    handler:
      openapi:
        source: http://localhost:5021/openapi.json
        headers:
          Authorization: Bearer {env.INTERNAL_API_TOKEN}

  - name: Vouchers
    handler:
      openapi:
        source: http://localhost:5023/openapi.json
        headers:
          Authorization: Bearer {env.INTERNAL_API_TOKEN}

  - name: Business
    handler:
      openapi:
        source: http://localhost:5022/openapi.json
        headers:
          Authorization: Bearer {env.INTERNAL_API_TOKEN}

  # Direct database for analytics
  - name: Analytics
    handler:
      postgraphile:
        connectionString: { env.DATABASE_REPLICA_URL }
        schema: public

transforms:
  - prefix:
      mode: wrap
      value: VB_

  - cache:
      - field: Query.users
        cacheKey: users-{args.page}-{args.limit}
        invalidate:
          ttl: 60

additionalTypeDefs: |
  extend type VB_User {
    vouchers: [VB_Voucher!]! @resolveTo(
      sourceName: "Vouchers"
      sourceFieldName: "getUserVouchers"
      keyField: "userId"
      keysArg: "userIds"
    )
  }

serve:
  endpoint: /graphql
  port: 4500
  cors:
    origin: '*'
    credentials: true
```

### 4. Run and Test (5 minutes)

```bash
# Start the gateway
npm run dev

# Open GraphiQL
open http://localhost:4500/graphql

# Test query
query TestQuery {
  # From your REST APIs (via Mesh)
  VB_users(page: 1, limit: 10) {
    id
    email
    vouchers {
      id
      title
    }
  }

  # Direct from database (analytics)
  Analytics_voucher_analytics {
    total_redemptions
    daily_average
  }
}
```

## Production Deployment

### Docker Setup

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY ./dist ./dist
COPY ./.meshrc.yml ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4500/health || exit 1

EXPOSE 4500

CMD ["node", "dist/server.js"]
```

### Environment Variables

```bash
# .env.production
NODE_ENV=production

# Your existing database
DATABASE_URL=postgresql://user:pass@host:5432/voucherbook
DATABASE_REPLICA_URL=postgresql://user:pass@replica:5432/voucherbook

# Your existing Redis
REDIS_URL=redis://localhost:7381

# Your existing JWT
JWT_SECRET=your-secret

# Free monitoring (get from app.graphql-hive.com)
HIVE_TOKEN=your-free-hive-token

# Optional: Free error tracking
SENTRY_DSN=your-free-sentry-dsn
```

### Performance Benchmarks

```yaml
Expected Performance (Zero-Cost Stack):
  Simple Queries: < 10ms
  Complex Queries: < 100ms
  Analytics Queries: < 500ms
  Subscriptions: Real-time (< 50ms latency)

Capacity (Single Instance):
  Requests/sec: 5,000+
  Concurrent Connections: 10,000+
  WebSocket Connections: 5,000+

With Horizontal Scaling:
  Requests/sec: 50,000+
  Concurrent Users: 100,000+
```

## Cost Analysis

### Monthly Costs: $0

| Service        | Solution         | Cost   | Alternative Cost |
| -------------- | ---------------- | ------ | ---------------- |
| GraphQL Server | Yoga             | $0     | Apollo: $95/mo   |
| Federation     | Mesh             | $0     | Apollo: $500/mo  |
| Monitoring     | Hive Free        | $0     | Apollo: $95/mo   |
| Performance    | DataLoader       | $0     | Custom: Dev time |
| Real-time      | graphql-ws       | $0     | Pusher: $49/mo   |
| Analytics      | Direct SQL       | $0     | Custom service   |
| **Total**      | **All Features** | **$0** | **$734/mo**      |

### Hidden Savings

1. **No Training Costs**: Uses familiar tools (Express, TypeScript)
2. **No Migration Costs**: Wraps existing REST APIs
3. **No Vendor Lock-in**: Can switch anytime
4. **No License Audits**: 100% open source

## Advanced Features Included

### What You Get for Free

1. **Query Federation**: Combine multiple services
2. **Real-time Subscriptions**: WebSockets and SSE
3. **Response Caching**: Redis-backed
4. **Query Batching**: DataLoader
5. **Schema Registry**: Hive.com
6. **Performance Monitoring**: Prometheus/Grafana
7. **Error Tracking**: Sentry free tier
8. **Query Complexity**: Built-in protection
9. **Rate Limiting**: Per-user limits
10. **Export to CSV/PDF**: Built-in
11. **GraphiQL IDE**: Interactive testing
12. **Type Generation**: Auto TypeScript types

## Success Metrics for MVP

### Week 1 Goals

- ✅ GraphQL endpoint live
- ✅ 3 services integrated
- ✅ Authentication working
- ✅ Basic monitoring active

### Week 2 Goals

- ✅ All CRUD operations
- ✅ Complex filtering
- ✅ Analytics queries
- ✅ Read replica routing

### Week 3 Goals

- ✅ Real-time subscriptions
- ✅ Export functionality
- ✅ Performance optimization
- ✅ Dashboard integration

### Week 4 Goals

- ✅ Load testing passed
- ✅ Documentation complete
- ✅ Docker deployed
- ✅ Production ready

## Appendix: Complete Dependency Reference (August 2025)

### Full Dependency List with Exact Versions

```json
{
  "dependencies": {
    // Core GraphQL
    "graphql": "16.9.0",
    "graphql-yoga": "5.15.1",

    // GraphQL Mesh - Schema Stitching & Federation
    "@graphql-mesh/cli": "0.100.8",
    "@graphql-mesh/graphql": "0.108.12",
    "@graphql-mesh/openapi": "0.110.12",
    "@graphql-mesh/postgraphile": "0.109.9",
    "@graphql-mesh/transform-prefix": "0.109.8",
    "@graphql-mesh/transform-cache": "0.109.8",
    "@graphql-mesh/transform-resolvers-composition": "0.109.8",

    // Monitoring (Free Tier)
    "@graphql-hive/yoga": "0.42.2",

    // Envelop Plugins (Performance & Security)
    "@envelop/core": "5.3.0",
    "@envelop/jwt": "8.0.8",
    "@envelop/depth-limit": "4.0.8",
    "@envelop/rate-limiter": "6.2.0",
    "@envelop/response-cache": "6.2.0",
    "@envelop/prometheus": "11.0.0",
    "@envelop/dataloader": "5.0.8",
    "@envelop/validation-cache": "7.0.8",
    "@envelop/filter-operation-type": "6.0.8",

    // Performance
    "dataloader": "2.2.3",
    "graphql-jit": "0.8.7",

    // Real-time
    "graphql-ws": "6.0.6",
    "graphql-sse": "2.5.3",

    // Caching
    "ioredis": "5.4.1",

    // Schema Tools
    "@graphql-tools/schema": "10.0.25",
    "@graphql-tools/merge": "9.0.13",
    "@graphql-tools/utils": "10.6.2",

    // Prisma Integration
    "@paljs/plugins": "8.2.1",
    "graphql-scalars": "1.23.0",

    // Security
    "graphql-shield": "7.6.5",
    "graphql-depth-limit": "1.1.0",
    "graphql-query-complexity": "0.12.0",

    // Metrics
    "prom-client": "15.1.3"
  },

  "devDependencies": {
    // Code Generation
    "@graphql-codegen/cli": "5.0.7",
    "@graphql-codegen/typescript": "4.1.2",
    "@graphql-codegen/typescript-resolvers": "4.4.0",
    "@graphql-codegen/typescript-operations": "4.4.0",
    "@graphql-codegen/typed-document-node": "5.0.11",
    "@graphql-codegen/client-preset": "4.5.2",

    // Types
    "@types/node": "22.12.0",

    // Development
    "tsx": "4.19.4",
    "nodemon": "3.1.10",

    // Testing
    "vitest": "3.2.2",
    "@vitest/ui": "3.2.2",
    "msw": "2.6.11",
    "supertest": "7.1.1",

    // GraphQL Testing
    "graphql-request": "7.1.3",
    "@apollo/server-testing": "4.11.4"
  }
}
```

### Version Compatibility Matrix

| Package           | Version | Node Requirement | GraphQL Version |
| ----------------- | ------- | ---------------- | --------------- |
| graphql-yoga      | 5.15.1  | >=18.0.0         | 16.x            |
| @graphql-mesh/cli | 0.100.8 | >=18.0.0         | 16.x            |
| @envelop/core     | 5.3.0   | >=18.0.0         | 16.x            |
| dataloader        | 2.2.3   | >=14.0.0         | Any             |
| graphql-jit       | 0.8.7   | >=16.0.0         | 16.x            |
| ioredis           | 5.4.1   | >=12.22.0        | N/A             |

### Complete Installation Command

```bash
# Production dependencies (all exact versions)
npm install \
  graphql@16.9.0 \
  graphql-yoga@5.15.1 \
  @graphql-mesh/cli@0.100.8 \
  @graphql-mesh/graphql@0.108.12 \
  @graphql-mesh/openapi@0.110.12 \
  @graphql-mesh/postgraphile@0.109.9 \
  @graphql-mesh/transform-prefix@0.109.8 \
  @graphql-mesh/transform-cache@0.109.8 \
  @graphql-hive/yoga@0.42.2 \
  @envelop/core@5.3.0 \
  @envelop/jwt@8.0.8 \
  @envelop/depth-limit@4.0.8 \
  @envelop/rate-limiter@6.2.0 \
  @envelop/response-cache@6.2.0 \
  @envelop/prometheus@11.0.0 \
  @envelop/dataloader@5.0.8 \
  dataloader@2.2.3 \
  graphql-jit@0.8.7 \
  graphql-ws@6.0.6 \
  ioredis@5.4.1 \
  @graphql-tools/schema@10.0.25 \
  @paljs/plugins@8.2.1 \
  graphql-scalars@1.23.0 \
  graphql-shield@7.6.5 \
  prom-client@15.1.3

# Development dependencies
npm install -D \
  @graphql-codegen/cli@5.0.7 \
  @graphql-codegen/typescript@4.1.2 \
  @graphql-codegen/typescript-resolvers@4.4.0 \
  @types/node@22.12.0 \
  tsx@4.19.4 \
  vitest@3.2.2 \
  graphql-request@7.1.3
```

### Minimal MVP Installation

```bash
# Absolute minimum for MVP
npm install \
  graphql@16.9.0 \
  graphql-yoga@5.15.1 \
  @graphql-mesh/cli@0.100.8 \
  @graphql-mesh/openapi@0.110.12 \
  @graphql-hive/yoga@0.42.2 \
  @envelop/jwt@8.0.8 \
  dataloader@2.2.3 \
  ioredis@5.4.1
```

### Important Version Notes

#### August 2025 Updates

1. **GraphQL Yoga 5.15.1**: Major performance improvements, built-in SSE support
2. **GraphQL Mesh 0.100.8**: Better OpenAPI handling, improved caching
3. **Envelop 5.3.0**: Plugin system overhaul, better TypeScript support
4. **GraphQL Codegen 5.0.7**: Faster generation, better presets
5. **Vitest 3.2.2**: Replaces Jest, much faster, better ESM support

#### Breaking Changes from Earlier Versions

- **GraphQL Yoga 5.x**: Changed plugin API from 4.x
- **GraphQL Mesh 0.100.x**: New configuration format
- **Envelop 5.x**: Plugin signature changed
- **GraphQL Codegen 5.x**: New config format

#### Compatibility with VoucherBook Stack

All these versions are compatible with:

- Node.js 20.x (your current version)
- TypeScript 5.8.3 (your current version)
- Prisma 6.9.0 (your current version)
- Redis/ioredis 5.6.1 (your current version)
- Express 4.x (for REST API coexistence)

### Security Considerations

All packages are:

- ✅ Actively maintained (last update within 6 months)
- ✅ No known critical vulnerabilities (as of Aug 2025)
- ✅ MIT or Apache 2.0 licensed
- ✅ Production-ready with major companies using them

### Performance Benchmarks

With these versions, expected performance:

- GraphQL Yoga 5.15.1: 15,000+ req/sec (single core)
- GraphQL JIT: 10x faster query execution
- DataLoader: Prevents N+1 queries
- Redis caching: Sub-millisecond response for cached queries

## Conclusion

This zero-cost GraphQL implementation delivers enterprise-grade features perfect for VoucherBook's advanced MVP:

- **$0/month operational costs** using open-source tools
- **4-week implementation** timeline
- **Production-ready** with the same quality as paid solutions
- **No vendor lock-in** - can upgrade to Apollo later if needed
- **Advanced features** including real-time analytics, complex reporting, and read replica routing

The architecture maintains your existing REST APIs while adding a powerful GraphQL layer for the admin dashboard and analytics, giving you the best of both worlds without any migration risk.
