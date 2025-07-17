# Admin Service API Tests

This directory contains tests for the Admin Service API endpoints including both unit tests and integration tests.

## Test Structure

```
/test/
├── fixtures/           # Test data creation helpers
│   └── adminFixtures.ts
├── integration/        # Integration tests
│   └── e2e/            # End-to-end API tests
│       ├── environment.ts            # Test environment configuration
│       ├── setup.ts                  # Common setup for e2e tests
│       └── admin.integration.test.ts  # API tests
├── mocks/              # Mock implementations
│   ├── adminReadMocks.ts
│   └── adminWriteMocks.ts
├── read/               # Read API unit tests
│   └── api/
│       ├── admin/
│       │   ├── getAdmins.test.ts
│       │   └── getAdminById.test.ts
│       └── setup.ts
├── write/              # Write API unit tests
│   └── api/
│       ├── admin/
│       │   ├── createAdmin.test.ts
│       │   ├── deleteAdmin.test.ts
│       │   └── updateAdmin.test.ts
│       └── setup.ts
└── README.md           # Documentation (this file)
```

## Unit Tests

The unit tests are organized by HTTP method/functionality:

- `getAdmins.test.ts` - Tests for listing admins (GET /admins)
- `getAdminById.test.ts` - Tests for retrieving a specific admin (GET /admins/:id)
- `createAdmin.test.ts` - Tests for creating admins (POST /admins)
- `updateAdmin.test.ts` - Tests for updating admins (PATCH /admins/:id)
- `deleteAdmin.test.ts` - Tests for deleting admins (DELETE /admins/:id)

### Unit Test Components

- **Fixtures**: Located in `fixtures/adminFixtures.ts` - Provides test data generation functions
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

- GET /admins
  - Retrieval with pagination
  - Filtering by role
  - Filtering by status
  - Filtering by email
  - Filtering by permissions
  - Sorting by specified fields
  - Pagination functionality
  - Language preference handling

- GET /admins/:admin_id
  - Retrieval by ID
  - Language preference handling
  - Error handling for non-existent admins

#### Write API Tests

- POST /admins
  - Creating new admins
  - Creating admins with different roles and permissions
  - Validation of required fields
  - Preventing duplicate emails
  - Admin authentication requirements

- PATCH /admins/:admin_id
  - Updating existing admins
  - Partial updates of specific fields
  - Updating profile data and multilingual content
  - Error handling for non-existent admins
  - Preventing duplicate emails
  - Admin authentication requirements

- DELETE /admins/:admin_id
  - Deleting admins
  - Error handling for non-existent admins
  - Admin authentication requirements

- POST /admins/:admin_id/upload
  - Uploading admin profile images
  - File validation and size limits
  - Error handling for missing files

#### Additional Tests

- Error handling for invalid inputs
- Error handling for invalid UUIDs in path parameters
- Multilingual content preservation during updates

## Running the Tests

```bash
# Run all tests (unit and integration)
yarn test "packages/services/admin/**/*.test.ts"

# Run only integration tests
yarn test:integration

# Run specifically the admin integration tests
yarn vitest "packages/services/admin/src/test/integration/**/*.integration.test.ts"
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
- Role-based access control
- Permission management

## Overall Test Coverage

The combined unit and integration tests provide complete coverage for the Admin Service API, including:

- Filtering, pagination, and sorting
- Validation of required fields and constraints
- Error handling
- Role and permission management
- Multilingual content handling
- Security and access control
- File upload functionality

## Admin-Specific Test Scenarios

The Admin Service tests include specific scenarios for:

- **Role Management**: Testing SUPER_ADMIN, ADMIN, and MODERATOR roles
- **Permission Systems**: Testing granular permissions (MANAGE_PLATFORM, MANAGE_PROVIDERS, etc.)
- **User Mapping**: Testing userId to adminId relationships
- **Status Management**: Testing ACTIVE, INACTIVE, and SUSPENDED statuses
- **Profile Management**: Testing bio updates, phone numbers, timezone settings
- **Multilingual Bios**: Testing bio field localization in es, en, gn languages

## Contributing

When adding new tests:

1. Follow the existing patterns for test organization
2. Ensure tests are isolated and don't depend on each other
3. Use the existing fixtures and helpers
4. Make sure to clean up any test data created
5. Cover both success and error cases
6. Test role-based access controls thoroughly
7. Validate multilingual content handling
