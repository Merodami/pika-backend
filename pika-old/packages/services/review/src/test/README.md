# Review Service API Tests

This directory contains tests for the Review Service API endpoints including both unit tests and integration tests.

## Test Structure

```
/test/
├── fixtures/           # Test data creation helpers
│   └── reviewFixtures.ts
├── integration/        # Integration tests
│   └── e2e/            # End-to-end API tests
│       ├── environment.ts            # Test environment configuration
│       ├── setup.ts                  # Common setup for e2e tests
│       └── review.integration.test.ts  # API tests
├── mocks/              # Mock implementations
│   ├── reviewReadMocks.ts
│   └── reviewWriteMocks.ts
├── read/               # Read API unit tests
│   └── api/
│       ├── review/
│       │   ├── getReviews.test.ts
│       │   └── getReviewById.test.ts
│       └── setup.ts
├── write/              # Write API unit tests
│   └── api/
│       ├── review/
│       │   ├── createReview.test.ts
│       │   ├── deleteReview.test.ts
│       │   ├── updateReview.test.ts
│       │   └── addProviderResponse.test.ts
│       └── setup.ts
└── README.md           # Documentation (this file)
```

## Unit Tests

The unit tests are organized by HTTP method/functionality:

- `getReviews.test.ts` - Tests for listing reviews (GET /reviews)
- `getReviewById.test.ts` - Tests for retrieving a specific review (GET /reviews/:id)
- `createReview.test.ts` - Tests for creating reviews (POST /reviews)
- `updateReview.test.ts` - Tests for updating reviews (PUT /reviews/:id)
- `deleteReview.test.ts` - Tests for deleting reviews (DELETE /reviews/:id)
- `addProviderResponse.test.ts` - Tests for adding provider responses (POST /reviews/:id/response)

### Unit Test Components

- **Fixtures**: Located in `fixtures/reviewFixtures.ts` - Provides test data generation functions
- **Mocks**: Located in `mocks/` - Provides mock implementations of the repositories
- **Setup Helper**: Located in `read/api/setup.ts` and `write/api/setup.ts` - Provides reusable test app setup functions

## Integration Tests

The integration tests are in the `integration/e2e/` directory and test the entire API with a real database connection using test containers.

### Technology Stack for Integration Tests

- **Vitest**: Test runner and assertion library
- **Supertest**: HTTP assertion library for testing API endpoints
- **Testcontainers**: Library for spinning up isolated PostgreSQL containers for testing
- **Prisma**: ORM for database interactions within tests

### Integration Tests Coverage

The integration tests cover the following endpoints and scenarios:

#### Read API Tests

- GET /reviews
  - Retrieval with pagination
  - Filtering by provider_id
  - Filtering by customer_id
  - Filtering by rating
  - Sorting by rating, created_at, updated_at
  - Pagination functionality

- GET /reviews/providers/:providerId
  - Retrieval of all reviews for a provider
  - Sorting and pagination

- GET /reviews/customers/:customerId
  - Retrieval of all reviews by a customer
  - Authentication requirements
  - Sorting and pagination

- GET /reviews/providers/:providerId/stats
  - Provider review statistics
  - Average rating calculation
  - Rating distribution
  - Total review count

- GET /reviews/:id
  - Retrieval by ID
  - Including relations (provider, customer)
  - Error handling for non-existent reviews

#### Write API Tests

- POST /reviews
  - Creating new reviews
  - Validation of rating (1-5)
  - Preventing duplicate reviews (customer-provider pair)
  - Customer authentication requirements

- PUT /reviews/:id
  - Updating existing reviews
  - Only review author can update
  - Partial updates of rating and review text
  - Error handling for non-existent reviews
  - Authentication requirements

- DELETE /reviews/:id
  - Soft deleting reviews
  - Only review author can delete
  - Error handling for non-existent reviews
  - Authentication requirements

- POST /reviews/:id/response
  - Adding provider responses to reviews
  - Only the reviewed provider can respond
  - One response per review limitation
  - Provider authentication requirements

#### Additional Tests

- Error handling for invalid inputs
- Error handling for invalid UUIDs in path parameters
- Rating validation (must be 1-5)

## Running the Tests

```bash
# Run all tests (unit and integration)
yarn test "packages/services/review/**/*.test.ts"

# Run only integration tests
yarn test:integration

# Run specifically the review integration tests
yarn vitest "packages/services/review/src/test/integration/**/*.integration.test.ts"
```

## Test Environment Setup for Integration Tests

The integration tests automatically set up the required environment:

1. A PostgreSQL container is created for each test run
2. Prisma connects to this test database
3. A Fastify server is created with test configurations
4. In-memory cache and file storage services are used

This ensures tests are isolated, repeatable, and don't affect the development or production environments.

## Test Patterns

All tests follow the Arrange-Act-Assert pattern and test:

- Happy path scenarios
- Edge cases and error handling
- Validation and business rules
- Authentication/authorization
- Review constraints (one per customer-provider pair)

## Overall Test Coverage

The combined unit and integration tests provide complete coverage for the Review Service API, including:

- Filtering, pagination, and sorting
- Validation of ratings and review text
- Error handling
- Resource relationships (provider/customer relations)
- Security and access control
- Provider response functionality

## Contributing

When adding new tests:

1. Follow the existing patterns for test organization
2. Ensure tests are isolated and don't depend on each other
3. Use the existing fixtures and helpers
4. Make sure to clean up any test data created
5. Cover both success and error cases
