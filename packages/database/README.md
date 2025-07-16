# Database Package

Database schema management and Prisma configuration for the Pika platform, providing centralized data models and migration management.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn db:generate

# Run migrations
yarn db:migrate

# Seed database
yarn db:seed
```

## 📋 Overview

The Database package manages all data persistence for the Pika platform:

- **Prisma Schema**: Centralized database schema definition
- **Migrations**: Database version control and evolution
- **Seeding**: Initial data population and test fixtures
- **Models**: TypeScript type generation from schema
- **Database Client**: Configured Prisma client for all services

## 🏗️ Architecture

### Schema Organization

```
prisma/
├── base.prisma           # Base configuration and generators
├── enums.prisma          # Enum definitions
├── models/               # Individual model files
│   ├── user.prisma       # User and profile models
│   ├── auth.prisma       # Authentication models
│   ├── gym.prisma        # Gym and facility models
│   ├── session.prisma    # Session and booking models
│   ├── payment.prisma    # Payment and billing models
│   ├── subscription.prisma # Subscription models
│   ├── communication-log.prisma # Communication logs
│   ├── notification.prisma # Notification models
│   ├── support-comment.prisma # Support system
│   ├── audit-log.prisma  # Audit trail
│   └── ...              # Additional domain models
├── migrations/           # Database migration files
├── seed/                 # Database seeding
│   ├── index.ts          # Main seed script
│   ├── seeders/          # Individual seeders
│   └── utils/            # Seeding utilities
├── merge.ts              # Schema compilation script
└── schema.prisma         # Compiled schema (auto-generated)
```

### Key Components

- **Modular Schema**: Domain-separated model files
- **Type Safety**: Full TypeScript integration
- **Migration System**: Version-controlled schema changes
- **Seeding System**: Reproducible test data
- **Multi-Environment**: Development, test, production configs

## 🗄️ Database Models

### Core Entities

#### User Management

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String
  lastName  String
  role      UserRole @default(USER)
  status    UserStatus @default(ACTIVE)

  // Relations
  profile   UserProfile?
  sessions  Session[]
  payments  Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model UserProfile {
  id           String    @id @default(cuid())
  userId       String    @unique
  dateOfBirth  DateTime?
  phone        String?
  bio          String?

  // Relations
  user         User      @relation(fields: [userId], references: [id])
  addresses    Address[]
  parq         ParQ?

  @@map("user_profiles")
}
```

#### Gym & Sessions

```prisma
model Gym {
  id          String  @id @default(cuid())
  name        String
  description String?
  address     Json    // Structured address data
  amenities   String[] // Array of amenity strings
  equipment   String[] // Array of equipment strings

  // Relations
  sessions    Session[]
  inductions  Induction[]

  @@map("gyms")
}

model Session {
  id            String      @id @default(cuid())
  title         String
  description   String?
  gymId         String
  trainerId     String?
  startTime     DateTime
  endTime       DateTime
  capacity      Int         @default(20)
  creditCost    Int         @default(1)
  status        SessionStatus @default(SCHEDULED)

  // Relations
  gym           Gym         @relation(fields: [gymId], references: [id])
  trainer       User?       @relation(fields: [trainerId], references: [id])
  bookings      SessionBooking[]
  reviews       SessionReview[]

  @@map("sessions")
}
```

#### Payment & Billing

```prisma
model Payment {
  id              String        @id @default(cuid())
  userId          String
  amount          Decimal       @db.Decimal(10,2)
  currency        String        @default("USD")
  status          PaymentStatus
  type            PaymentType
  stripePaymentId String?       @unique

  // Relations
  user            User          @relation(fields: [userId], references: [id])
  credits         CreditTransaction[]

  createdAt       DateTime      @default(now())

  @@map("payments")
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:6436/pika
DATABASE_SCHEMA=public

# Connection Pool
DATABASE_CONNECTION_LIMIT=20
DATABASE_POOL_TIMEOUT=20000

# Migration Settings
MIGRATE_DEPLOY_ON_START=false
DATABASE_LOGGING=false

# Test Database
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:6436/pikaest
```

### Prisma Configuration

```prisma
// base.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 🧪 Testing

```bash
# Run database tests
yarn test packages/database

# Test migrations
yarn db:migrate:test

# Test seeding
yarn db:seed:test

# Reset test database
yarn db:test:reset
```

### Test Database Setup

```typescript
import { PrismaClient } from '@prisma/client'
import { createTestDatabase } from '@pika/tests'

describe('Database Models', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    const testDb = await createTestDatabase()
    prisma = testDb.prisma
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should create user with profile', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        profile: {
          create: {
            dateOfBirth: new Date('1990-01-01'),
            phone: '+1234567890',
          },
        },
      },
      include: { profile: true },
    })

    expect(user.profile).toBeDefined()
    expect(user.profile?.dateOfBirth).toEqual(new Date('1990-01-01'))
  })
})
```

## 📁 Migration Management

### Creating Migrations

```bash
# Create new migration
yarn db:migrate:dev --name add_new_feature

# Deploy migrations to production
yarn db:migrate:deploy

# Reset database (development only)
yarn db:migrate:reset
```

### Migration Best Practices

1. **Incremental Changes**: Small, focused migrations
2. **Backwards Compatible**: Support existing data
3. **Data Migration**: Include data transformation scripts
4. **Testing**: Test migrations on copy of production data
5. **Rollback Plan**: Document rollback procedures

### Example Migration

```sql
-- CreateTable
CREATE TABLE "gym_equipment" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gym_equipment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "gym_equipment" ADD CONSTRAINT "gym_equipment_gymId_fkey"
FOREIGN KEY ("gymId") REFERENCES "gyms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## 🌱 Database Seeding

### Seeding System

```typescript
// seed/index.ts
import { PrismaClient } from '@prisma/client'
import { seedUsers } from './seeders/user.seeder'
import { seedSubscriptionPlans } from './seeders/subscription-plan.seeder'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Seed in dependency order
  await seedSubscriptionPlans(prisma)
  await seedUsers(prisma)

  console.log('✅ Database seeded successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

### Seeder Examples

```typescript
// seeders/user.seeder.ts
export async function seedUsers(prisma: PrismaClient) {
  const users = [
    {
      email: 'admin@pika
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      profile: {
        create: {
          dateOfBirth: new Date('1985-01-01'),
          bio: 'Platform administrator',
        },
      },
    },
    {
      email: 'trainer@pika
      firstName: 'John',
      lastName: 'Trainer',
      role: 'TRAINER',
      profile: {
        create: {
          dateOfBirth: new Date('1990-05-15'),
          bio: 'Certified personal trainer',
        },
      },
    },
  ]

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    })
  }

  console.log(`✅ Seeded ${users.length} users`)
}
```

## 🔄 Schema Development

### Modular Schema Architecture

The database uses a modular approach where each domain has its own schema file:

```typescript
// merge.ts - Schema compilation
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const schemaFiles = [
  'base.prisma',
  'enums.prisma',
  'models/user.prisma',
  'models/gym.prisma',
  'models/session.prisma',
  // ... other model files
]

let compiledSchema = ''

schemaFiles.forEach((file) => {
  const content = readFileSync(resolve(__dirname, file), 'utf8')
  compiledSchema += content + '\n\n'
})

writeFileSync(resolve(__dirname, 'schema.prisma'), compiledSchema)
```

### Schema Guidelines

1. **File Naming**: Use kebab-case for file names
2. **Model Naming**: Use PascalCase for models
3. **Field Naming**: Use camelCase for fields
4. **Relations**: Always define both sides of relations
5. **Indexes**: Add indexes for frequent queries
6. **Constraints**: Use database constraints for data integrity

## 📊 Performance Optimization

### Query Optimization

```typescript
// Use select to limit fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    profile: {
      select: {
        firstName: true,
        lastName: true,
      },
    },
  },
})

// Use pagination for large datasets
const sessions = await prisma.session.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { startTime: 'desc' },
})
```

### Connection Management

- **Connection Pooling**: Configured for optimal performance
- **Query Logging**: Enable in development for debugging
- **Prepared Statements**: Automatic query optimization
- **Batch Operations**: Use transactions for multiple operations

## 🔄 Future Enhancements

- [ ] Read replicas for scaling
- [ ] Database sharding strategy
- [ ] Advanced indexing optimization
- [ ] Real-time subscriptions
- [ ] Data archiving system
- [ ] Multi-tenant support
- [ ] Database monitoring dashboard
- [ ] Automated backup system
