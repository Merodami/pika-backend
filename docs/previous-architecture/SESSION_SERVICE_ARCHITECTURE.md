# Session Service Architecture

## Overview

The Session Service (`@pika/session`) manages workout sessions, bookings, and trainer assignments following clean architecture principles with optimized performance through denormalization.

## Key Architecture Decisions

### 1. Denormalized Data Storage

To improve query performance and reduce the need for expensive joins, we store denormalized data directly in the session table:

```typescript
interface Session {
  // Core fields
  id: string
  userId: string
  gymId: string
  trainerId?: string

  // Denormalized fields for performance
  gymName?: string // Stored to avoid joining with gyms table
  trainerName?: string // Stored to avoid joining with users table
}
```

**Benefits:**

- Faster queries (no joins needed for common operations)
- Better performance when listing sessions
- Reduced database load
- Simpler queries for filtering and sorting

**Trade-offs:**

- Data duplication (managed through service layer)
- Need to update when gym/trainer names change (rare operation)

### 2. Clean Architecture Implementation

The service strictly follows the Controller → Service → Repository pattern:

```
SessionController → SessionService → SessionRepository
     ↓                    ↓
  API Types         Service Clients
                    (UserServiceClient,
                     GymServiceClient)
```

#### Repository Layer

- **Responsibility**: Data persistence only
- **No external service calls**: Repositories never call other services
- **Pure database operations**: CRUD operations with Prisma

```typescript
// SessionRepository - Pure data access
export class SessionRepository {
  async create(data: CreateSessionInput): Promise<Session> {
    // Direct database operation only
    return this.prisma.session.create({ data })
  }
}
```

#### Service Layer

- **Responsibility**: Business logic and orchestration
- **Cross-service communication**: Calls other services via service clients
- **Data enrichment**: Fetches additional data before persistence

```typescript
// SessionService - Business logic and orchestration
export class SessionService {
  async createSession(userId: string, data: CreateSessionDTO) {
    // Fetch gym details from Gym Service
    const gym = await this.gymServiceClient.getGym(data.gymId)

    // Enrich data with denormalized fields
    const sessionData = {
      ...data,
      gymName: gym.name, // Store gym name for performance
      userId,
    }

    // Persist through repository
    return this.sessionRepository.create(sessionData)
  }
}
```

### 3. Admin vs Regular Operations

The service separates admin operations into a dedicated `AdminSessionService`:

- **SessionService**: Regular user operations (booking, viewing own sessions)
- **AdminSessionService**: Admin-only operations (trainer assignment, bulk operations)

```typescript
// Admin-only operations
export class AdminSessionService {
  async assignTrainer(sessionId: string, trainerId: string, adminUserId: string) {
    // Fetch trainer details
    const trainer = await this.userServiceClient.getUser(trainerId)

    // Update with denormalized data
    return this.sessionRepository.update(sessionId, {
      trainerId,
      trainerName: `${trainer.firstName} ${trainer.lastName}`,
    })
  }
}
```

### 4. Sorting and Filtering

The API uses `date` (not `dateTime`) for sorting to match the database schema:

```typescript
// API Schema
sortBy: z.enum(['createdAt', 'date', 'gymName', 'status'])

// Maps directly to database columns - no translation needed
orderBy: { [sortBy]: sortOrder }
```

## Database Schema

```prisma
model Session {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  gymId           String    @map("gym_id")
  trainerId       String?   @map("trainer_id")

  // Denormalized fields
  gymName         String?   @map("gym_name")
  trainerName     String?   @map("trainer_name")

  // Temporal fields
  date            DateTime  @map("date")
  startTime       DateTime  @map("start_time")
  endTime         DateTime  @map("end_time")
  duration        Int       @map("duration")

  // Other fields...
}
```

## Seeding Strategy

The session seeder creates realistic test data:

- **Each user gets 20-200 sessions** for comprehensive testing
- **Even distribution** ensures all users have session history
- **Realistic data patterns** with various statuses and dates

```typescript
// Seeding configuration
minSessionsPerUser: 20,
maxSessionsPerUser: 200,

// Results in ~11,000 sessions for 98 users
// Average: ~112 sessions per user
```

## Performance Optimizations

### 1. Caching Strategy

Two-tier caching for optimal performance:

```typescript
// Method-level caching with decorators
@Cache({ ttl: 3600, prefix: 'sessions' })
async getAllSessions(params: SearchParams) {
  // Implementation
}
```

### 2. Query Optimization

Direct queries without joins for common operations:

```sql
-- Fast query with denormalized data
SELECT * FROM sessions
WHERE gym_name LIKE '%fitness%'
ORDER BY date DESC

-- Instead of slow join query
SELECT s.*, g.name as gym_name
FROM sessions s
JOIN gyms g ON s.gym_id = g.id
WHERE g.name LIKE '%fitness%'
ORDER BY s.date DESC
```

### 3. Batch Operations

Efficient batch processing for bulk updates:

```typescript
// Batch update for session completion
await this.prisma.session.updateMany({
  where: {
    date: { lt: new Date() },
    status: 'UPCOMING',
  },
  data: { status: 'COMPLETED' },
})
```

## API Endpoints

### Public Endpoints

- `GET /sessions` - List user's sessions
- `GET /sessions/:id` - Get session details
- `POST /sessions` - Create new session
- `PUT /sessions/:id` - Update session
- `DELETE /sessions/:id` - Cancel session

### Admin Endpoints

- `GET /admin/sessions` - List all sessions with filters
- `POST /admin/sessions/book` - Book session for any user
- `POST /admin/sessions/:id/cancel` - Cancel any session
- `POST /admin/sessions/:id/assign-trainer` - Assign trainer
- `GET /admin/sessions/stats/bookings` - Booking statistics

## Testing Approach

### Integration Tests

- Real database with Testcontainers
- Complete request/response cycle
- Service client mocking for cross-service calls

### Test Data

- Comprehensive seeding for all scenarios
- 20-200 sessions per user for realistic testing
- Various session states and dates

## Best Practices

1. **Always populate denormalized fields** when creating/updating sessions
2. **Use service clients** for cross-service communication
3. **Keep repositories pure** - no business logic or external calls
4. **Separate admin operations** into dedicated services
5. **Use mappers** for data transformation between layers

## Migration Guide

When adding new denormalized fields:

1. Add field to Prisma schema
2. Create and run migration
3. Update repository interfaces
4. Update service to populate field
5. Backfill existing data if needed
6. Update tests

## Common Pitfalls to Avoid

1. **Don't call services from repositories** - Breaks clean architecture
2. **Don't skip denormalized fields** - Causes performance issues
3. **Don't use dateTime for sorting** - Use 'date' to match schema
4. **Don't import API types in services** - Use domain types
5. **Don't bypass service layer** - Always go through proper channels
