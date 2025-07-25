# Contract Testing Strategy for Pika

## Executive Summary

This document outlines a comprehensive and extensible approach for implementing contract testing across the Pika platform's microservices architecture. It provides a standardized pattern that:

1. **Ensures API Compatibility**: Guarantees that services can communicate without integration failures
2. **Scales with Growth**: Adapts naturally as new services are added to the platform
3. **Leverages Existing Schemas**: Utilizes TypeBox schemas as the source of truth for contracts
4. **Minimal Infrastructure**: Uses file-based contracts for MVP stage with a clear path to more advanced setups

## Core Principles

Contract testing in Pika follows these key principles:

1. **Service Independence**: Each service is tested independently in two roles:
   - **As a Provider**: Ensuring it correctly implements the APIs that other services depend on
   - **As a Consumer**: Verifying it correctly uses the APIs of services it depends on

2. **Schema-Driven Contracts**: All contract tests are derived from the TypeBox schemas defined in the API package, providing a single source of truth.

3. **Progressive Implementation**: Services can be tested one at a time, building coverage incrementally.

4. **Extensibility**: The testing architecture naturally adapts as services are added or changed.

## Contract Testing Architecture

### 1. Consumer-Provider Matrix

| Consumer                | Provider         | Interaction Type |
| ----------------------- | ---------------- | ---------------- |
| API Gateway             | Booking Service  | HTTP/REST        |
| API Gateway             | Category Service | HTTP/REST        |
| API Gateway             | Service Service  | HTTP/REST        |
| API Gateway             | User Service     | HTTP/REST        |
| Booking Service         | Service Service  | HTTP/REST        |
| Booking Service         | User Service     | HTTP/REST        |
| Frontend (customer-app) | API Gateway      | HTTP/REST        |

### 2. Contract Testing Flow

1. **Consumer Tests**:
   - Define expected interactions with provider services
   - Generate Pact contract files
   - Verify consumer code against mocked providers

2. **Pact Broker**:
   - Central repository for contracts
   - Manages versions of contracts between services
   - Tracks compatibility matrices

3. **Provider Tests**:
   - Verify service implementations against consumer expectations
   - Run during build/CI process to catch breaking changes

4. **CI/CD Integration**:
   - Run contract tests in CI pipeline
   - Block deployments if contracts are broken
   - Deploy services safely when contracts are honored

## Per-Service Implementation Pattern

### Step 1: Service Setup

For each service (e.g., booking, category, service), follow these steps:

```bash
# Navigate to the service directory
cd packages/services/<service-name>

# Add Pact dependency if not already in the project
yarn add @pact-foundation/pact --dev

# Create test directories for contract tests
mkdir -p src/test/pact/{consumer,provider,fixtures}
```

### Step 2: Lightweight File Storage

For each service, contracts will be stored in a central location:

1. Contracts are stored as JSON files in a project-level `pacts` directory
2. Provider tests load contracts from this directory
3. Contracts are tracked in version control

This approach eliminates the need for complex infrastructure while still providing contract validation.

### Step 3: Create Shared Test Utilities

First, create shared test utilities that all services can use:

```typescript
// packages/tests/src/pact/index.ts
import { Pact, Matchers, Verifier } from '@pact-foundation/pact'
import path from 'path'
import { v4 as uuid } from 'uuid'

// Base configuration for Pact consumer tests
export function createPactConsumer(serviceName: string, providerName: string) {
  return new Pact({
    consumer: serviceName,
    provider: providerName,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    logLevel: 'warn',
    dir: path.resolve(process.cwd(), 'pacts'),
    cors: true,
    pactfileWriteMode: 'merge',
  })
}

// Base configuration for Pact provider tests
export function createPactVerifier(serviceName: string, servicePort: number) {
  return {
    provider: serviceName,
    providerBaseUrl: `http://localhost:${servicePort}`,
    pactUrls: findPactsForProvider(serviceName),
  }
}

// Find all pact files relevant to this provider
function findPactsForProvider(providerName: string) {
  const pactDir = path.resolve(process.cwd(), 'pacts')
  const glob = require('glob')
  return glob.sync(`${pactDir}/*-${providerName}.json`)
}

// Export helper functions for test data generation
export const testData = {
  uuid: () => uuid(),
  today: () => new Date().toISOString().split('T')[0],
  dateTime: () => new Date().toISOString(),
  time: (hours = 10, minutes = 0) => `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
  price: (min = 10, max = 500) => Number((Math.random() * (max - min) + min).toFixed(2)),
  sentence: (wordCount = 5) => {
    const words = ['test', 'data', 'fixture', 'booking', 'service', 'customer', 'provider', 'review', 'payment', 'contract']
    return Array(wordCount)
      .fill(0)
      .map(() => words[Math.floor(Math.random() * words.length)])
      .join(' ')
  },
}

// Export Pact matchers for use in tests
export const matchers = Matchers
```

### Step 4: Service-Specific Fixtures

For each service, create fixture generators from TypeBox schemas:

```typescript
// packages/services/<SERVICE_NAME>/src/test/pact/fixtures/schema-fixtures.ts
import { Static } from '@sinclair/typebox'
import { testData, matchers } from '@pika/tests/src/pact'

// Import schemas relevant to this service
import { ServiceSchema, ServiceCreateSchema } from '@api/schemas/marketplace/service'

/**
 * Creates a test object that matches a TypeBox schema
 */
export function createFixture<T>(schema: any, overrides: Partial<T> = {}): T {
  const fixture: any = {}

  // Generate data based on schema
  for (const [key, prop] of Object.entries(schema.properties || {})) {
    // Skip properties that are explicitly overridden
    if (key in overrides) continue

    // Handle different data types based on format or pattern
    if (prop.format === 'uuid' || (prop.pattern && prop.pattern.includes('uuid'))) {
      fixture[key] = testData.uuid()
    } else if (prop.format === 'date') {
      fixture[key] = testData.today()
    } else if (prop.format === 'date-time') {
      fixture[key] = testData.dateTime()
    } else if (prop.pattern?.includes('([0-1]?[0-9]|2[0-3]):[0-5][0-9]')) {
      fixture[key] = testData.time()
    } else if (prop.enum) {
      fixture[key] = prop.enum[0] // Use first enum value as default
    } else {
      // Default values based on type
      switch (prop.type) {
        case 'string':
          fixture[key] = `test-${key}`
          break
        case 'number':
        case 'integer':
          fixture[key] = 123
          break
        case 'boolean':
          fixture[key] = true
          break
      }
    }
  }

  return { ...fixture, ...overrides } as T
}

/**
 * Example fixture factory for a service
 * Replace with specific entity types for each service
 */
export const serviceFixtures = {
  // Complete service entity
  complete: (overrides = {}) => createFixture<Static<typeof ServiceSchema>>(ServiceSchema, overrides),

  // Service creation payload
  create: (overrides = {}) => createFixture<Static<typeof ServiceCreateSchema>>(ServiceCreateSchema, overrides),
}
```

### Step 5: Service Test State Handlers

Each service needs mockable state handlers for provider tests:

```typescript
// packages/services/<SERVICE_NAME>/src/test/pact/provider-states.ts
import { testData } from '@pika/tests/src/pact'
import { serviceFixtures } from './fixtures/schema-fixtures'

/**
 * Creates test state handlers for <SERVICE_NAME> service provider tests
 */
export function createStateHandlers(repository) {
  // In-memory data storage for tests
  const testData = {
    entities: new Map(),
  }

  // Reset test data
  const resetTestData = () => {
    testData.entities.clear()
  }

  // Seed some default test data
  const seedDefaultData = () => {
    const entity = serviceFixtures.complete()
    testData.entities.set(entity.id, entity)
    return entity
  }

  // Return handlers for different provider states
  return {
    // Default state handler - runs for general setup
    default: async () => {
      resetTestData()
      return { message: 'Default state set up' }
    },

    // Entity exists state
    'an entity with ID exists': async (params) => {
      resetTestData()

      const id = params.id || testData.uuid()
      const entity = serviceFixtures.complete({ id })

      // If using real repository:
      // await repository.createEntity(entity);

      // For in-memory testing:
      testData.entities.set(id, entity)

      return {
        id,
        message: `Created test entity with ID: ${id}`,
      }
    },

    // Multiple entities exist state
    'entities exist': async () => {
      resetTestData()

      // Create multiple test entities
      for (let i = 0; i < 3; i++) {
        const entity = serviceFixtures.complete()
        testData.entities.set(entity.id, entity)
      }

      return {
        count: testData.entities.size,
        message: `Created ${testData.entities.size} test entities`,
      }
    },
  }
}
```

### Step 6: Implement Consumer Tests

For each service as a consumer of other services:

```typescript
// packages/services/<SERVICE_NAME>/src/test/pact/consumer/<DEPENDENCY>-consumer.pact.spec.ts
import { createPactConsumer, matchers } from '@pika/tests/src/pact'
import { serviceFixtures } from '../fixtures/schema-fixtures'

// Import the client that calls the dependency
import { dependencyClient } from '@service-name/clients/dependencyClient'

describe('<SERVICE_NAME> as consumer of <DEPENDENCY_SERVICE>', () => {
  // Initialize Pact for this consumer-provider pair
  const pact = createPactConsumer('<SERVICE_NAME>', '<DEPENDENCY_SERVICE>')
  let client

  // Setup and teardown
  beforeAll(() => pact.setup())
  afterAll(() => pact.finalize())
  afterEach(() => pact.verify())

  beforeEach(() => {
    // Create a client that points to the mock service
    client = dependencyClient({ baseUrl: pact.mockService.baseUrl })
  })

  describe('GET /resources', () => {
    it('retrieves a list of resources', async () => {
      // Create test data
      const resources = [serviceFixtures.complete(), serviceFixtures.complete()]

      // Define the interaction
      await pact.addInteraction({
        state: 'resources exist',
        uponReceiving: 'a request for all resources',
        withRequest: {
          method: 'GET',
          path: '/resources',
          headers: { Accept: 'application/json' },
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            data: matchers.eachLike(resources[0]),
            pagination: {
              total: matchers.like(10),
              page: matchers.like(1),
              limit: matchers.like(20),
            },
          },
        },
      })

      // Make the request and verify
      const response = await client.getResources()
      expect(response.status).toEqual(200)
    })
  })

  // Additional test cases for other interactions...
})
```

### Step 7: Implement Provider Tests

For each service as a provider for other services:

```typescript
// packages/services/<SERVICE_NAME>/src/test/pact/provider/<SERVICE_NAME>-provider.pact.spec.ts
import { Verifier } from '@pact-foundation/pact';
import { createPactVerifier } from '@pika/tests/src/pact';
import { SERVICE_SERVER_PORT } from '@pika/environment';
import { createStateHandlers } from '../provider-states';
import { start<SERVICE_NAME>Service } from '../../app';

// Example provider test
describe('<SERVICE_NAME> as Provider', () => {
  let app;

  // Start the actual service before running tests
  beforeAll(async () => {
    app = await start<SERVICE_NAME>Service();
  });

  // Shut down the service after tests
  afterAll(async () => {
    await app.close();
  });

  // Test against all Pact contracts for this provider
  it('verifies all consumer contracts', async () => {
    // State handlers prepare test data for each scenario
    const stateHandlers = createStateHandlers();

    // Configure the Pact verifier
    const verifierOptions = {
      ...createPactVerifier('<SERVICE_NAME>', SERVICE_SERVER_PORT),
      stateHandlers,
      providerVersion: process.env.GIT_COMMIT || 'local',
      publishVerificationResult: false, // Set to true in CI
    };

    // Run the verification
    await new Verifier(verifierOptions).verifyProvider();
  });
});
```

### Step 8: Add Service-Specific Test Scripts

In each service's `package.json`, add scripts for running the tests:

```json
{
  "scripts": {
    "pact:consumer": "vitest run src/test/pact/consumer/*.pact.spec.ts",
    "pact:provider": "vitest run src/test/pact/provider/*.pact.spec.ts"
  }
}
```

## Example Implementation for Booking Service

Here's a concrete example for the Booking service:

### 1. Create Shared Test Utility

```typescript
// packages/tests/src/pact/index.ts
// ... shared code as defined earlier ...
```

### 2. Add Booking-Specific Fixtures

```typescript
// packages/services/booking/src/test/pact/fixtures/booking-fixtures.ts
import { Static } from '@sinclair/typebox'
import { testData, matchers } from '@pika/tests/src/pact'
import { BookingSchema, BookingCreateSchema, BookingStatusEnum } from '@api/schemas/marketplace/booking'

export const bookingFixtures = {
  // Creates a complete booking
  complete: (overrides = {}) => {
    const fixture = {
      id: testData.uuid(),
      customer_id: testData.uuid(),
      service_id: testData.uuid(),
      booking_date: testData.today(),
      start_time: testData.time(10, 0),
      end_time: testData.time(11, 0),
      status: 'CONFIRMED',
      total_price: testData.price(),
      notes: testData.sentence(),
      created_at: testData.dateTime(),
      updated_at: testData.dateTime(),
    }

    return { ...fixture, ...overrides }
  },

  // Creates a booking creation payload
  create: (overrides = {}) => {
    const fixture = {
      service_id: testData.uuid(),
      booking_date: testData.today(),
      start_time: testData.time(10, 0),
      end_time: testData.time(11, 0),
      notes: testData.sentence(),
    }

    return { ...fixture, ...overrides }
  },

  // Create booking in other states
  confirmed: (overrides = {}) => bookingFixtures.complete({ status: 'CONFIRMED', ...overrides }),

  cancelled: (overrides = {}) =>
    bookingFixtures.complete({
      status: 'CANCELLED',
      cancelled_at: testData.dateTime(),
      ...overrides,
    }),
}
```

### 3. Add Booking Provider States

```typescript
// packages/services/booking/src/test/pact/provider-states.ts
import { testData } from '@pika/tests/src/pact'
import { bookingFixtures } from './fixtures/booking-fixtures'

export function createStateHandlers(bookingRepository) {
  // Mock storage if not using real repository
  const testStorage = {
    bookings: new Map(),
  }

  return {
    // State: Bookings exist
    'bookings exist': async () => {
      // Reset test data
      testStorage.bookings.clear()

      // Create test bookings
      for (let i = 0; i < 5; i++) {
        const booking = bookingFixtures.complete()

        // If using a real repository:
        // await bookingRepository.createBooking({...});

        // For in-memory testing:
        testStorage.bookings.set(booking.id, booking)
      }

      return {
        count: testStorage.bookings.size,
        message: 'Created test bookings',
      }
    },

    // State: Specific booking exists
    'a booking with ID exists': async (params) => {
      const id = params.id || testData.uuid()
      const booking = bookingFixtures.complete({ id })

      // If using a real repository:
      // await bookingRepository.createBooking({...});

      // For in-memory testing:
      testStorage.bookings.set(id, booking)

      return { id, message: 'Booking created' }
    },
  }
}
```

### 4. Implement Consumer Test

```typescript
// packages/api-gateway/src/test/pact/consumer/booking-consumer.pact.spec.ts
import { createPactConsumer, matchers } from '@pika/tests/src/pact'
import { bookingFixtures } from '../fixtures/booking-fixtures'
import { bookingClient } from '@api-gateway/clients/bookingClient'

describe('API Gateway as consumer of Booking Service', () => {
  const pact = createPactConsumer('ApiGateway', 'BookingService')
  let client

  beforeAll(() => pact.setup())
  afterAll(() => pact.finalize())

  beforeEach(() => {
    client = bookingClient({ baseUrl: pact.mockService.baseUrl })
  })

  it('gets a list of bookings', async () => {
    // Test data
    const booking = bookingFixtures.complete()

    // Define interaction
    await pact.addInteraction({
      state: 'bookings exist',
      uponReceiving: 'a request for bookings',
      withRequest: {
        method: 'GET',
        path: '/bookings',
      },
      willRespondWith: {
        status: 200,
        body: {
          data: matchers.eachLike(booking),
          pagination: {
            total: matchers.like(10),
            page: matchers.like(1),
          },
        },
      },
    })

    // Execute and verify
    const response = await client.getBookings()
    expect(response.status).toBe(200)
  })
})
```

### 5. Implement Provider Test

```typescript
// packages/services/booking/src/test/pact/provider/booking-provider.pact.spec.ts
import { Verifier } from '@pact-foundation/pact'
import { createPactVerifier } from '@pika/tests/src/pact'
import { BOOKING_SERVER_PORT } from '@pika/environment'
import { createStateHandlers } from '../provider-states'
import { startBookingService } from '../../app'

describe('Booking Service as Provider', () => {
  let app

  beforeAll(async () => {
    app = await startBookingService()
  })

  afterAll(async () => {
    await app.close()
  })

  it('verifies consumer contracts', async () => {
    const stateHandlers = createStateHandlers()

    const verifierOptions = {
      ...createPactVerifier('BookingService', BOOKING_SERVER_PORT),
      stateHandlers,
    }

    await new Verifier(verifierOptions).verifyProvider()
  })
})
```

## Extensible Service Testing Architecture

This section outlines a future-proof approach for implementing contract testing with natural extensibility for new services.

### 1. Core Architecture Components

#### 1.1 Central Test Utilities

Create a shared test module that all services use:

```typescript
// packages/tests/src/pact/index.ts
import { Pact, Matchers, Verifier } from '@pact-foundation/pact'
import path from 'path'
import { v4 as uuid } from 'uuid'

// Base configurations that apply to all services
export function createPactConsumer(serviceName: string, providerName: string) {
  return new Pact({
    consumer: serviceName,
    provider: providerName,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    logLevel: 'warn',
    dir: path.resolve(process.cwd(), 'pacts'),
    cors: true,
    pactfileWriteMode: 'merge',
  })
}

export function createPactVerifier(serviceName: string, servicePort: number) {
  return {
    provider: serviceName,
    providerBaseUrl: `http://localhost:${servicePort}`,
    pactUrls: findPactsForProvider(serviceName),
  }
}

// Test data generators for any entity type
export const testData = {
  uuid,
  today: () => new Date().toISOString().split('T')[0],
  dateTime: () => new Date().toISOString(),
  time: (hours = 10, minutes = 0) => `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
  price: (min = 10, max = 500) => Number((Math.random() * (max - min) + min).toFixed(2)),
  sentence: (wordCount = 5) => {
    const words = ['test', 'data', 'fixture', 'booking', 'service', 'customer', 'provider', 'review', 'payment', 'contract']
    return Array(wordCount)
      .fill(0)
      .map(() => words[Math.floor(Math.random() * words.length)])
      .join(' ')
  },
}

// Export all Pact matchers
export const matchers = Matchers

// Helper to find contracts - will work for any service
function findPactsForProvider(providerName: string) {
  const pactDir = path.resolve(process.cwd(), 'pacts')
  const glob = require('glob')
  return glob.sync(`${pactDir}/*-${providerName}.json`)
}

// Automatic fixture generation - can be used with any schema
export function createFixtureFromSchema<T>(schema: any, overrides: Partial<T> = {}): T {
  // Implementation same as earlier, but placed in shared module for reuse
  // This ensures consistent fixture generation across all services
  const fixture: any = {}

  for (const [key, prop] of Object.entries(schema.properties || {})) {
    if (key in overrides) continue

    if (prop.format === 'uuid' || (prop.pattern && prop.pattern.includes('uuid'))) {
      fixture[key] = testData.uuid()
    } else if (prop.format === 'date') {
      fixture[key] = testData.today()
    } else if (prop.format === 'date-time') {
      fixture[key] = testData.dateTime()
    } else if (prop.pattern?.includes('([0-1]?[0-9]|2[0-3]):[0-5][0-9]')) {
      fixture[key] = testData.time()
    } else if (prop.enum) {
      fixture[key] = prop.enum[0]
    } else {
      switch (prop.type) {
        case 'string':
          fixture[key] = `test-${key}`
          break
        case 'number':
        case 'integer':
          fixture[key] = 123
          break
        case 'boolean':
          fixture[key] = true
          break
      }
    }
  }

  return { ...fixture, ...overrides } as T
}
```

#### 1.2 Generic Service Test Template

Create a template pattern that all services - current and future - can reuse:

```bash
# Service test structure - reusable for any service
packages/services/<SERVICE_NAME>/src/test/pact/
├── fixtures/                        # Test data generators
│   └── <SERVICE_NAME>-fixtures.ts   # Entity-specific fixtures
├── consumer/                        # Consumer tests
│   └── <DEPENDENCY>-consumer.pact.spec.ts
├── provider/                        # Provider tests
│   └── <SERVICE_NAME>-provider.pact.spec.ts
└── provider-states.ts               # Test state handlers
```

### 2. Service Test Implementation Process

For each new service, follow this consistent process:

1. **Create directory structure**:

   ```bash
   mkdir -p packages/services/<SERVICE_NAME>/src/test/pact/{consumer,provider,fixtures}
   ```

2. **Add service-specific fixtures** using the shared fixture generator:

   ```typescript
   // packages/services/<SERVICE_NAME>/src/test/pact/fixtures/<SERVICE_NAME>-fixtures.ts
   import { Static } from '@sinclair/typebox'
   import { testData, matchers, createFixtureFromSchema } from '@pika/tests/src/pact'
   import { EntitySchema } from '@api/schemas/<SERVICE_PATH>/<ENTITY>'

   export const entityFixtures = {
     complete: (overrides = {}) => createFixtureFromSchema<Static<typeof EntitySchema>>(EntitySchema, overrides),
     // Add other entity states as needed
   }
   ```

3. **Add provider state handlers** that can be extended for new states:

   ```typescript
   // packages/services/<SERVICE_NAME>/src/test/pact/provider-states.ts
   import { testData } from '@pika/tests/src/pact'
   import { entityFixtures } from './fixtures/<SERVICE_NAME>-fixtures'

   export function createStateHandlers(repository) {
     const testStorage = { entities: new Map() }

     // Common setup/teardown functions
     const resetData = () => testStorage.entities.clear()

     // Basic state handlers that work for any entity
     return {
       default: async () => {
         resetData()
         return { message: 'Default state reset' }
       },

       'entities exist': async () => {
         resetData()
         for (let i = 0; i < 3; i++) {
           const entity = entityFixtures.complete()
           testStorage.entities.set(entity.id, entity)
         }
         return { count: testStorage.entities.size }
       },

       'an entity with ID exists': async (params) => {
         resetData()
         const id = params.id || testData.uuid()
         const entity = entityFixtures.complete({ id })
         testStorage.entities.set(id, entity)
         return { id }
       },

       // Add service-specific states as needed
     }
   }
   ```

4. **Add package.json scripts** for consistency across services:
   ```json
   {
     "scripts": {
       "pact:consumer": "vitest run src/test/pact/consumer/*.pact.spec.ts",
       "pact:provider": "vitest run src/test/pact/provider/*.pact.spec.ts",
       "pact:all": "yarn pact:consumer && yarn pact:provider"
     }
   }
   ```

### 3. Central Orchestration

Add scripts to the root package.json for running tests across all services:

```json
{
  "scripts": {
    "test:pact:consumer": "nx run-many --target=pact:consumer --all",
    "test:pact:provider": "nx run-many --target=pact:provider --all",
    "test:pact:all": "yarn test:pact:consumer && yarn test:pact:provider"
  }
}
```

## Instructions for AI Implementation

When asking AI to implement contract testing for a specific service, use this template:

```
Please implement contract testing for the <SERVICE_NAME> service following the extensible pattern defined in ai/CONTRACT_TESTING_PLAN.md. The implementation should:

1. Create a shared Pact utilities module in packages/tests/src/pact if it doesn't already exist
2. Set up the standard directory structure for <SERVICE_NAME> contract tests
3. Implement fixture generators that leverage TypeBox schemas from the API package
4. Create generic provider state handlers that can be extended for future scenarios
5. Implement consumer tests for any dependencies this service has
6. Implement the provider verification test
7. Add standardized scripts to package.json

Make the implementation extensible so it can adapt to new features and requirements. Use the shared utilities wherever possible for consistency across all services.
```

This approach ensures:

1. Each service implementation is consistent with others
2. The testing infrastructure grows naturally as you add services
3. New test cases can be added without changing the testing architecture
4. TypeBox schemas are leveraged as the source of truth for contracts

## Testing Matrix and Priorities

### Phase 1: Core Consumer-Provider Pairs

1. **API Gateway ↔ Booking Service**
   - GET /bookings (list)
   - GET /bookings/:id (detail)
   - POST /bookings (create)
   - PATCH /bookings/:id (update)
   - DELETE /bookings/:id (delete)

2. **API Gateway ↔ Category Service**
   - GET /categories (list)
   - GET /categories/:id (detail)

### Phase 2: Extended Service Interactions

1. **Booking Service ↔ Service Service**
   - Service availability verification
   - Service details retrieval

2. **Frontend ↔ API Gateway**
   - Focus on critical customer journeys

### Phase 3: Complete Coverage

1. All remaining consumer-provider pairs
2. Edge cases and error scenarios

## Scaling the Testing Strategy

This architecture naturally scales as your services and organization grow:

### 1. Adding New Services

When new services are developed:

1. **Automated Setup**: Use the standardized folder structure and template files
2. **Reuse Patterns**: Share test utilities and patterns from existing services
3. **Immediate Integration**: New services automatically participate in the contract testing ecosystem
4. **Verification**: Services can verify contracts even before all consumer tests are written

### 2. Future Expansion Path

As the system evolves:

1. **Pact Broker Integration**: When team size or deployment complexity increases:

   ```typescript
   // Update shared utility to support broker:
   export function createPactVerifier(serviceName, servicePort, options = {}) {
     const defaultConfig = {
       provider: serviceName,
       providerBaseUrl: `http://localhost:${servicePort}`,
     }

     // Use broker if available, otherwise file-based
     const pactLocation = process.env.PACT_BROKER_URL ? { pactBrokerUrl: process.env.PACT_BROKER_URL } : { pactUrls: findPactsForProvider(serviceName) }

     return {
       ...defaultConfig,
       ...pactLocation,
       ...options,
     }
   }
   ```

2. **CI/CD Expansion**: Implement staged verification:

   ```yaml
   # In CI configuration
   jobs:
     contract_tests:
       steps:
         - run: yarn test:pact:consumer
         - run: yarn pact:publish # Publish to broker when ready
         - run: yarn can-i-deploy # Verify deployment compatibility
   ```

3. **Advanced Provider States**: Add integration with test databases:

   ```typescript
   // Evolution of provider state handlers
   export function createAdvancedStateHandlers(repository) {
     return {
       // Original handlers for backward compatibility
       ...createStateHandlers(),

       // New handlers with database integration
       'complex state setup': async (params) => {
         await repository.setupTestData(params)
         return { setup: 'complete' }
       },
     }
   }
   ```

## Comprehensive Implementation Checklist

### 1. Core Infrastructure

- [ ] Add Pact dependencies

  ```bash
  yarn add @pact-foundation/pact @pact-foundation/pact-node glob --dev
  ```

- [ ] Create central pacts directory

  ```bash
  mkdir -p pacts
  touch pacts/.gitkeep
  ```

- [ ] Add to .gitignore (optional, if you want to track contracts)
  ```
  # Uncomment to exclude Pact files
  # pacts/*.json
  ```

### 2. Shared Utilities

- [ ] Create shared test utilities

  ```bash
  mkdir -p packages/tests/src/pact
  ```

- [ ] Implement shared helpers
  ```bash
  touch packages/tests/src/pact/index.ts
  touch packages/tests/src/pact/schema-helpers.ts
  ```

### 3. Service Implementation

For each service (e.g., booking, category, service):

- [ ] Create test directory structure

  ```bash
  mkdir -p packages/services/<SERVICE_NAME>/src/test/pact/{consumer,provider,fixtures}
  ```

- [ ] Implement service-specific fixtures

  ```bash
  touch packages/services/<SERVICE_NAME>/src/test/pact/fixtures/<SERVICE_NAME>-fixtures.ts
  ```

- [ ] Add provider state handlers

  ```bash
  touch packages/services/<SERVICE_NAME>/src/test/pact/provider-states.ts
  ```

- [ ] Implement consumer tests for dependencies
- [ ] Implement provider verification test
- [ ] Add package.json scripts

### 4. Central Orchestration

- [ ] Add root package.json scripts for running all tests

### 5. Documentation

- [ ] Document common provider states
- [ ] Add examples for extending the test architecture
- [ ] Create templates for new services

## Quick Reference Commands

### Setup Commands

```bash
# Install dependencies
yarn add @pact-foundation/pact @pact-foundation/pact-node glob --dev

# Create core directories
mkdir -p pacts
mkdir -p packages/tests/src/pact
```

### Development Commands

```bash
# Create test structure for a new service
mkdir -p packages/services/<SERVICE_NAME>/src/test/pact/{consumer,provider,fixtures}

# Run tests for a specific service
cd packages/services/<SERVICE_NAME>
yarn pact:consumer        # Run consumer tests for this service
yarn pact:provider        # Run provider tests for this service
yarn pact:all             # Run all Pact tests for this service

# Run specific test file
npx vitest run src/test/pact/consumer/<DEPENDENCY>-consumer.pact.spec.ts
```

### Project-wide Commands

```bash
# Run all consumer tests across the project
yarn test:pact:consumer

# Run all provider tests across the project
yarn test:pact:provider

# Run all Pact tests
yarn test:pact:all
```

### Advanced Commands (Future Use)

```bash
# When using a Pact Broker
PACT_BROKER_URL=http://broker:9292 yarn pact:publish

# Verify deployment safety
PACT_BROKER_URL=http://broker:9292 npx pact-broker can-i-deploy \
  --pacticipant=<SERVICE_NAME> \
  --version=$(git rev-parse --short HEAD) \
  --to=production
```

## Implementation Checklist for Each Service

When implementing contract testing for a service, follow this complete checklist:

### 1. Initial Service Setup

- [ ] Create shared test utilities module (if not already done)

  ```bash
  mkdir -p packages/tests/src/pact
  touch packages/tests/src/pact/index.ts
  ```

- [ ] Set up test directory structure

  ```bash
  mkdir -p packages/services/<SERVICE_NAME>/src/test/pact/{consumer,provider,fixtures}
  ```

- [ ] Create service-specific package.json scripts
  ```json
  "scripts": {
    "pact:consumer": "vitest run src/test/pact/consumer/*.pact.spec.ts",
    "pact:provider": "vitest run src/test/pact/provider/*.pact.spec.ts",
    "pact:all": "yarn pact:consumer && yarn pact:provider"
  }
  ```

### 2. Schema Integration

- [ ] Identify relevant TypeBox schemas for this service
- [ ] Create fixture generators based on these schemas
- [ ] Test fixture generation with multiple scenarios

### 3. Provider Implementation

- [ ] Identify which services consume this service's API
- [ ] Create provider state handlers for test data setup
- [ ] Implement provider verification test
- [ ] Test against existing contracts (if any)

### 4. Consumer Implementation

- [ ] Identify which services this service depends on
- [ ] Create consumer tests for each dependency
- [ ] Generate contract files for each provider

### 5. Verification and Integration

- [ ] Verify tests pass locally with `yarn pact:all`
- [ ] Add tests to CI pipeline
- [ ] Document provider states and consumer interactions
- [ ] Ensure contracts are stored appropriately (in VCS or broker)

### 6. Validation and Documentation

- [ ] Validate contract syntax with Pact compatibility check
- [ ] Add examples of how to extend the tests
- [ ] Document provider states this service supports

## Best Practices

1. **Naming Conventions**:
   - File names: `<service-name>-fixtures.ts`, `<dependency>-consumer.pact.spec.ts`
   - Provider states: Use clear, descriptive names like `resources exist` or `a resource with ID exists`
   - Test describe blocks: `<Consumer> as consumer of <Provider>`

2. **TypeBox Schema Integration**:
   - Import schemas directly from the API package
   - Generate test data that matches schema structures exactly
   - Create fixture factories for common entity states (complete, minimal, etc.)

3. **Service Provider States**:
   - Keep provider state handlers simple at first
   - Use in-memory test data before implementing repository-based test data
   - Make state handlers reusable across different test scenarios

4. **Implementation Approach**:
   - Start with one key service and validate the pattern works
   - Expand to more services in priority order
   - Begin with core CRUD operations before edge cases

5. **Code Organization**:
   - Group tests by consumer-provider relationship
   - Separate fixtures from test implementation
   - Create reusable utilities for common scenarios
