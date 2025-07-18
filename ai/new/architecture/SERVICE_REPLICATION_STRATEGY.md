# Service Replication Strategy

## Overview

This document outlines a pragmatic approach for quickly replicating services in the Pika platform during the MVP fast-pacing stage. The strategy focuses on direct file replication and minimal modifications to get new services up and running quickly.

## Quick Replication Process

### 1. Identify Source Service

The `category` service is an excellent template for new services because it:

- Has a clean implementation
- Follows the DDD+CQRS pattern
- Includes both read and write operations
- Handles multilingual content and file uploads

### 2. Direct Replication Workflow

1. **Copy the Entire Service Structure**:

   ```bash
   cp -r packages/services/category packages/services/new-service-name
   ```

2. **Global Find & Replace**:
   - Replace all occurrences of "category" with "new-service-name" (maintain original casing pattern)
   - Replace all occurrences of "Category" with "NewServiceName" (maintain original casing pattern)

3. **Update Base Configuration Files**:
   - Modify `package.json` with the new service name and description
   - Modify `project.json` if needed

4. **Update Domain Entity**:
   - Edit `src/write/domain/entities/Entity.ts` to reflect the new entity's properties
   - Update corresponding DTOs in `src/write/domain/dtos/`
   - Update repository ports in `src/write/domain/port/`

5. **Update Infrastructure**:
   - Modify the repository implementations to work with the new entity
   - Update database access code

6. **Update Application Layer**:
   - Adjust use cases for the new entity's operations

7. **Update API**:
   - Modify controllers and routes as needed

### 3. Environment Registration

1. **Add Service Constants**:
   - Add to `packages/environment/src/constants/service.ts`:

   ```typescript
   export const NEW_SERVICE_NAME = getEnvVariable(
     'NEW_SERVICE_NAME',
     String,
     'new_service_name'
   )

   export const NEW_SERVICE_SERVER_PORT = getEnvVariable(
     'NEW_SERVICE_SERVER_PORT',
     Number,
     4XXX // Choose next available port
   )
   ```

2. **Add API URL**:
   - Add to `packages/environment/src/constants/apiUrls.ts`:

   ```typescript
   export const NEW_SERVICE_API_URL = getEnvVariable('NEW_SERVICE_API_URL', String, 'http://localhost:4XXX')
   ```

3. **Update API Gateway**:
   - Add to `packages/api-gateway/src/api/routes/setupProxyRoutes.ts`:
   ```typescript
   {
     name: 'new-services',
     prefix: '/api/v1/new-services',
     readUpstream: NEW_SERVICE_API_URL,
     writeUpstream: NEW_SERVICE_API_URL,
   }
   ```

## File Replication Checklist

### Core Files to Modify

Here are the key files that need modification for a successful service replication:

1. **Basic Configuration**
   - `package.json` - Update name, description
   - `project.json` - Update name

2. **Core Service Files**
   - `src/app.ts` - Update service name, port, and entity references
   - `src/index.ts` - No changes needed

3. **Domain Layer**
   - `src/write/domain/entities/Entity.ts` - Update properties and methods
   - `src/write/domain/dtos/EntityDTO.ts` - Update DTOs
   - `src/write/domain/port/entity/EntityWriteRepositoryPort.ts` - Update repository interface
   - `src/read/domain/port/entity/EntityReadRepositoryPort.ts` - Update read repository interface

4. **Infrastructure Layer**
   - `src/write/infrastructure/persistence/pgsql/repositories/PrismaEntityWriteRepository.ts` - Update database operations
   - `src/read/infrastructure/persistence/pgsql/repositories/PrismaEntityReadRepository.ts` - Update read operations

5. **Application Layer**
   - `src/write/application/use_cases/commands/` - Update command handlers
   - `src/read/application/use_cases/queries/` - Update query handlers

6. **API Layer**
   - `src/write/api/controllers/entity/EntityController.ts` - Update controller
   - `src/write/api/routes/EntityRouter.ts` - Update routes
   - `src/read/api/controllers/entity/EntityController.ts` - Update read controller
   - `src/read/api/routes/EntityRouter.ts` - Update read routes

## AI Implementation Approach

When implementing a new service, the AI should follow these steps:

### Step 1: Initial File Structure Preparation

```bash
# Create the new service directory and copy all files
mkdir -p packages/services/new-service-name
cp -r packages/services/category/* packages/services/new-service-name/
```

### Step 2: Name Replacement Strategy

The AI should use a systematic approach to replace names throughout the copied files:

1. **Maintain Case Sensitivity**:
   - `category` → `new-service-name` (kebab-case for paths, packages)
   - `Category` → `NewServiceName` (PascalCase for classes, types)
   - `category_` → `new_service_name_` (snake_case for variables, fields)
   - `categoryName` → `newServiceName` (camelCase for variables, methods)

2. **Handle Path Aliases**:
   - `@category-read` → `@new-service-name-read`
   - `@category-write` → `@new-service-name-write`

3. **Update Prisma References**:
   - Match database table and schema names

### Step 3: Entity Property Transformation

1. **Analyze Target Entity**:
   - Use Prisma schema to understand the entity structure
   - Match database properties to entity properties

2. **Update Entity Class**:
   - Modify constructor parameters
   - Update factory methods
   - Adjust validation logic for domain-specific rules

3. **Update Related DTOs**:
   - Ensure DTOs match the entity properties
   - Include all required validation rules

### Step 4: Infrastructure Adaptation

1. **Update Repository Implementations**:
   - Match Prisma table names and fields
   - Update mapping functions between domain and persistence
   - Adjust error handling for entity-specific constraints

### Step 5: Service Configuration

1. **Environment Configuration**:
   - Add service name and port to environment constants
   - Add API URL to API constants
   - Update API gateway registration

2. **Update Service Bootstrap**:
   - Modify `app.ts` service name, routes, and repositories
   - Configure entity-specific services (like file storage settings)

### Step 6: Example Commands for AI

```bash
# Command to find all files containing "category" (case-insensitive)
find packages/services/new-service-name -type f -exec grep -l -i "category" {} \;

# Command to replace text in all files (maintaining case)
find packages/services/new-service-name -type f -exec sed -i '' 's/category/new-service-name/g; s/Category/NewServiceName/g' {} \;

# Command to check for any missed replacements
find packages/services/new-service-name -type f -exec grep -l -i "category" {} \;
```

## Post-Replication Testing

After replicating the service:

1. **Run Typecheck**:

   ```bash
   yarn nx run @pika/new-service-name:typecheck
   ```

2. **Start the Service Locally**:

   ```bash
   yarn nx run @pika/new-service-name:local
   ```

3. **Test Basic Operations**:
   - Create entity
   - Get entity by ID
   - Update entity
   - Delete entity

## Example Replication Workflow

```
1. User: "Create a new product service based on the category service"

2. AI:
   - Copies category service to product service
   - Performs global replacements (category → product, Category → Product)
   - Updates entity properties based on Prisma schema
   - Updates environment configuration
   - Validates the changes with typecheck

3. User tests the new service
```

## Notes

- This approach is intended for the MVP fast-pacing stage only
- A more robust, architectural approach should be implemented for later stages
- File replication creates technical debt that will need to be addressed later
- The service may need adaptation based on specific requirements
