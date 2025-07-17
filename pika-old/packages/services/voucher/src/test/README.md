# Voucher Service API Tests

This directory contains tests for the Voucher Service API endpoints including integration tests.

## Test Structure

```
/test/
├── fixtures/           # Test data creation helpers
│   └── voucherFixtures.ts
├── integration/        # Integration tests
│   └── e2e/            # End-to-end API tests
│       └── voucher.integration.test.ts  # API tests
├── mocks/              # Mock implementations
│   ├── voucherReadMocks.ts
│   └── voucherWriteMocks.ts
└── README.md           # Documentation (this file)
```

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

- GET /vouchers
  - Retrieval with pagination
  - Filtering by state
  - Filtering by provider_id
  - Filtering by category_id
  - Geospatial search (when location support is added)
  - Sorting by specified fields
  - Language preference handling

- GET /vouchers/:voucher_id
  - Retrieval by ID
  - Including codes when requested (include_codes=true)
  - Language preference handling
  - Error handling for non-existent vouchers

- GET /vouchers/provider/:provider_id
  - Retrieval of all vouchers for a specific provider
  - Pagination and filtering support

- GET /vouchers/user/:user_id
  - Retrieval of vouchers claimed by a specific user
  - Pagination and filtering support

#### Write API Tests

- POST /vouchers
  - Creating new vouchers with NEW state
  - Validation of required fields
  - Admin/Service Provider authentication requirements
  - Multi-code generation support

- PATCH /vouchers/:voucher_id
  - Updating existing vouchers
  - Partial updates of specific fields
  - Decimal value handling
  - Error handling for non-existent vouchers
  - Admin/Service Provider authorization (own vouchers only)

- POST /vouchers/:voucher_id/publish
  - Publishing vouchers (NEW → PUBLISHED state transition)
  - State validation
  - Admin/Service Provider authorization

- POST /vouchers/:voucher_id/expire
  - Expiring vouchers (any state → EXPIRED)
  - Admin/Service Provider authorization

- POST /vouchers/:voucher_id/claim
  - Claiming vouchers by customers (PUBLISHED → CLAIMED)
  - Customer authentication requirements
  - Redemption limit checks

- POST /vouchers/:voucher_id/redeem
  - Redeeming vouchers with codes (CLAIMED → REDEEMED)
  - Code validation
  - Location verification (when supported)
  - Customer authentication

- DELETE /vouchers/:voucher_id
  - Deleting vouchers
  - Preventing deletion of redeemed vouchers
  - Error handling for non-existent vouchers
  - Admin/Service Provider authorization

#### Additional Tests

- Health check endpoint
- Error handling for invalid inputs
- Decimal value formatting consistency

## Running the Tests

```bash
# Run all tests
yarn test "packages/services/voucher/**/*.test.ts"

# Run only integration tests
yarn vitest "packages/services/voucher/src/test/integration/**/*.integration.test.ts"

# Run with watch mode for development
yarn vitest "packages/services/voucher/src/test/integration/**/*.integration.test.ts" --watch
```

## Test Environment Setup for Integration Tests

The integration tests automatically set up the required environment:

1. A PostgreSQL container is created for each test run
2. Prisma connects to this test database
3. A Fastify server is created with test configurations
4. In-memory cache and file storage services are used
5. Authentication helpers create test users with different roles

This ensures tests are isolated, repeatable, and don't affect the development or production environments.

## Test Patterns

All tests follow the Arrange-Act-Assert pattern and test:

- Happy path scenarios
- Edge cases and error handling
- Validation and business rules
- Authentication/authorization using header-based auth
- Multilingual support
- State transitions

## Authentication in Tests

The voucher service uses header-based authentication:

- `x-user-id`: User's unique identifier
- `x-user-email`: User's email address
- `x-user-role`: User's role (ADMIN, SERVICE_PROVIDER, CUSTOMER)

These headers are set by the API Gateway in production and simulated in tests using the E2EAuthHelper.

## Overall Test Coverage

The integration tests provide comprehensive coverage for the Voucher Service API, including:

- All CRUD operations
- State management and transitions
- Multi-code system (QR, SHORT, STATIC)
- Filtering, pagination, and sorting
- Validation of required fields and constraints
- Error handling
- Multilingual content handling
- Security and access control
- Decimal value precision

## Contributing

When adding new tests:

1. Follow the existing patterns for test organization
2. Ensure tests are isolated and don't depend on each other
3. Use the existing fixtures and helpers
4. Make sure to clean up any test data created
5. Cover both success and error cases
6. Test state transitions thoroughly
7. Verify authentication and authorization
