# NestJS Performance Optimization Guide

## Architecture Context

### Actors in Modern Web Applications

- **Frontend (Client-Side)**:
  - **React**: SPA (Single Page Application) running in the browser
  - **Next.js**: Full-stack React framework with SSR/SSG capabilities (can act as both frontend and BFF)
  - **Mobile Apps**: React Native, Flutter, native iOS/Android

- **Backend (Server-Side)**:
  - **NestJS API**: REST/GraphQL API server (this guide's focus)
  - **BFF (Backend for Frontend)**: Sometimes Next.js serves this role
  - **Microservices**: Individual NestJS services for specific domains

- **Infrastructure**:
  - **Database**: PostgreSQL, MongoDB, MySQL, etc.
  - **Cache Layer**: Redis, Memcached
  - **Message Queue**: RabbitMQ, Kafka, BullMQ
  - **CDN**: CloudFlare, AWS CloudFront (for static assets)

### Communication Flow

```
[React/Next.js Frontend] → HTTP/WebSocket → [NestJS Backend] → [Database/Cache/Queue]
         ↓                                           ↓
    [Browser Cache]                          [Worker Threads]
```

## 1. Using Fastify Adapter

**Actor**: NestJS Backend
**When to use**: During NestJS application initialization
**Impact on Frontend**: Faster API response times for React/Next.js applications

Replace Express with Fastify for better performance (2x faster for plain text responses).

```typescript
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(), // Switch to Fastify
  )
  await app.listen(3000, '0.0.0.0') // Note: Fastify requires '0.0.0.0' for external access
}
bootstrap()
```

## 2. Cache Interceptor

Implement caching to reduce redundant database calls and computations.

```typescript
import { Controller, Get, UseInterceptors, CacheInterceptor } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'

// In your module
@Module({
  imports: [
    CacheModule.register({
      ttl: 60, // seconds
      max: 100, // maximum number of items in cache
    }),
  ],
})
export class AppModule {}

// In your controller
@Controller('posts')
@UseInterceptors(CacheInterceptor)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(): Promise<Post[]> {
    // This heavy database call will only run if the result is not in the cache
    return this.postsService.findAll()
  }
}
```

## 3. Module Lazy Loading

Load modules on-demand to reduce initial application startup time.

```typescript
import { RouterModule } from '@nestjs/core'
import { Module } from '@nestjs/common'

@Module({
  imports: [
    RouterModule.register([
      {
        path: 'admin', // When a request hits the /admin route...
        module: 'src/admin/admin.module#AdminModule', // ...load this module
      },
      {
        path: 'users',
        module: 'src/users/users.module#UsersModule',
      },
    ]),
    // ... other modules
  ],
})
export class AppRoutingModule {}
```

## 4. Database Optimization

### Key Strategies

- **Select Specific Columns**: Don't use `SELECT *`. Only retrieve the columns you actually need.
- **Avoid the N+1 Problem**: Use JOINs in your queries to fetch related data in a single trip to the database.
- **Indexing**: Ensure your database tables have proper indexes on columns that are frequently used in WHERE clauses, JOINs, or for ordering.
- **Connection Pooling**: Use a connection pool to reuse database connections.

### TypeORM Example

```typescript
// Bad - N+1 problem
const users = await this.userRepository.find()
for (const user of users) {
  const posts = await this.postRepository.find({ where: { userId: user.id } })
}

// Good - Single query with relations
const users = await this.userRepository.find({
  relations: ['posts'],
  select: ['id', 'name', 'email'], // Select only needed columns
})

// Even better - Query builder for complex queries
const users = await this.userRepository.createQueryBuilder('user').leftJoinAndSelect('user.posts', 'post').select(['user.id', 'user.name', 'post.title']).where('user.active = :active', { active: true }).getMany()
```

## 5. Faster Builds with SWC

Use SWC (Speedy Web Compiler) instead of TypeScript compiler for faster builds.

### nest-cli.json Configuration

```json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "builder": "swc", // Use SWC builder
    "typeCheck": true,
    "tsConfigPath": "tsconfig.build.json"
  }
}
```

### Installation

```bash
npm i -D @swc/core @swc/cli
```

## 6. Offload CPU-Intensive Tasks

### Worker Threads

Use Node.js's built-in worker_threads module for CPU-intensive operations.

```typescript
import { Injectable } from '@nestjs/common'
import { Worker } from 'worker_threads'

@Injectable()
export class HeavyComputationService {
  async performHeavyTask(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./path/to/worker.js', {
        workerData: data,
      })

      worker.on('message', resolve)
      worker.on('error', reject)
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`))
        }
      })
    })
  }
}
```

### Queue Systems with BullMQ

For background job processing and task queuing.

```typescript
import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
})
export class AppModule {}

// Processor
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  async process(job: Job<any>): Promise<any> {
    // Process the job
    console.log('Processing job:', job.data)
    // Send email logic here
    return {}
  }
}
```

## 7. Additional Performance Tips

### Compression

```typescript
import compression from '@fastify/compress'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())

  await app.register(compression, { encodings: ['gzip', 'deflate'] })
  await app.listen(3000, '0.0.0.0')
}
```

### Rate Limiting

```typescript
import { ThrottlerModule } from '@nestjs/throttler'

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
})
export class AppModule {}
```

### Health Checks

```typescript
import { TerminusModule } from '@nestjs/terminus'
import { HttpModule } from '@nestjs/axios'

@Module({
  imports: [TerminusModule, HttpModule],
})
export class HealthModule {}
```

### Clustering

```typescript
import cluster from 'cluster'
import { cpus } from 'os'

if (cluster.isPrimary) {
  const numCPUs = cpus().length

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`)
    cluster.fork() // Restart worker
  })
} else {
  // Worker process - start NestJS app
  bootstrap()
}
```

## 8. Monitoring and Profiling

### Performance Monitoring

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now()
    return next.handle().pipe(tap(() => console.log(`After... ${Date.now() - now}ms`)))
  }
}
```

### Memory Management

```typescript
// Monitor memory usage
setInterval(() => {
  const used = process.memoryUsage()
  console.log({
    rss: `${Math.round((used.rss / 1024 / 1024) * 100) / 100} MB`,
    heapTotal: `${Math.round((used.heapTotal / 1024 / 1024) * 100) / 100} MB`,
    heapUsed: `${Math.round((used.heapUsed / 1024 / 1024) * 100) / 100} MB`,
    external: `${Math.round((used.external / 1024 / 1024) * 100) / 100} MB`,
  })
}, 10000)
```

## Best Practices Summary

1. **Use Fastify** instead of Express for better performance
2. **Implement caching** strategically for expensive operations
3. **Lazy load modules** to reduce startup time
4. **Optimize database queries** and use connection pooling
5. **Use SWC** for faster compilation
6. **Offload heavy tasks** to worker threads or queue systems
7. **Enable compression** for response payloads
8. **Implement rate limiting** to prevent abuse
9. **Use clustering** to utilize multiple CPU cores
10. **Monitor performance** continuously to identify bottlenecks
