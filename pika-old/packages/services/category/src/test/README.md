# Category Service API Tests

This directory contains tests for the Category Service API endpoints including both unit tests and integration tests.

## Test Structure

```
/test/
├── fixtures/           # Test data creation helpers
│   └── categoryFixtures.ts
├── integration/        # Integration tests
│   └── e2e/            # End-to-end API tests
│       ├── environment.ts            # Test environment configuration
│       ├── setup.ts                  # Common setup for e2e tests
│       └── category.integration.test.ts  # API tests
├── mocks/              # Mock implementations
│   ├── categoryReadMocks.ts
│   └── categoryWriteMocks.ts
├── read/               # Read API unit tests
│   └── api/
│       ├── category/
│       │   ├── getCategories.test.ts
│       │   └── getCategoryById.test.ts
│       └── setup.ts
├── write/              # Write API unit tests
│   └── api/
│       ├── category/
│       │   ├── createCategory.test.ts
│       │   ├── deleteCategory.test.ts
│       │   └── updateCategory.test.ts
│       └── setup.ts
└── README.md           # Documentation (this file)
```

## Unit Tests

The unit tests are organized by HTTP method/functionality:

- `getCategories.test.ts` - Tests for listing categories (GET /categories)
- `getCategoryById.test.ts` - Tests for retrieving a specific category (GET /categories/:id)
- `createCategory.test.ts` - Tests for creating categories (POST /categories)
- `updateCategory.test.ts` - Tests for updating categories (PATCH /categories/:id)
- `deleteCategory.test.ts` - Tests for deleting categories (DELETE /categories/:id)

### Unit Test Components

- **Fixtures**: Located in `fixtures/categoryFixtures.ts` - Provides test data generation functions
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

- GET /categories
  - Retrieval with pagination
  - Filtering by parent_id
  - Filtering by level
  - Filtering by active status
  - Sorting by specified fields
  - Pagination functionality
  - Language preference handling

- GET /categories/:category_id
  - Retrieval by ID
  - Including children in response
  - Language preference handling
  - Error handling for non-existent categories

#### Write API Tests

- POST /categories
  - Creating new categories
  - Creating child categories with correct hierarchy
  - Validation of required fields
  - Preventing duplicate slugs
  - Admin authentication requirements

- PATCH /categories/:category_id
  - Updating existing categories
  - Partial updates of specific fields
  - Updating parent relationships
  - Error handling for non-existent categories
  - Preventing duplicate slugs
  - Admin authentication requirements

- DELETE /categories/:category_id
  - Deleting categories
  - Preventing deletion of categories with children
  - Error handling for non-existent categories
  - Admin authentication requirements

#### Additional Tests

- Error handling for invalid inputs
- Error handling for invalid UUIDs in path parameters

## Running the Tests

```bash
# Run all tests (unit and integration)
yarn test "packages/services/category/**/*.test.ts"

# Run only integration tests
yarn test:integration

# Run specifically the category integration tests
yarn vitest "packages/services/category/src/test/integration/**/*.integration.test.ts"
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
- Multilingual support

## Overall Test Coverage

The combined unit and integration tests provide complete coverage for the Category Service API, including:

- Filtering, pagination, and sorting
- Validation of required fields and constraints
- Error handling
- Resource relationships (parent/child categories)
- Multilingual content handling
- Security and access control

## Contributing

When adding new tests:

1. Follow the existing patterns for test organization
2. Ensure tests are isolated and don't depend on each other
3. Use the existing fixtures and helpers
4. Make sure to clean up any test data created
5. Cover both success and error cases
