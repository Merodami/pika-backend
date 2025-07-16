# Category Service Migration Task

## Current Project Status

### Completed Tasks

1. ✅ All `@solo60` references have been renamed to `@pika`
2. ✅ `/pika` folder has been added to all ignore files
3. ✅ Domain-specific services (gym, session, social) have been removed
4. ✅ Comprehensive migration analysis completed (see MIGRATION_ANALYSIS.md)

### Project Context

- **Old Architecture**: Located in `/pika` folder - uses CQRS, TypeBox, complex patterns
- **New Architecture**: Main codebase - uses Clean Architecture, Zod, simplified patterns
- We are migrating business logic from old to new while following the new architecture patterns

## Your Task: Migrate Category Service

### Overview

Migrate the Category service from the old Pika architecture (`/pika/packages/services/category`) to the new architecture, following the established patterns and structure.

### Source Analysis

The old Category service in `/pika/packages/services/category` includes:

- Hierarchical categories (parent-child relationships)
- Multilingual support (name and description in multiple languages)
- Active/inactive status
- Icon support
- Sorting capabilities

### Database Schema

The category table (from `/pika/packages/database/prisma/models/category.prisma`):

```prisma
model Category {
  id          String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name        Json      @db.JsonB  // Multilingual: { en: "Food", es: "Comida" }
  description Json?     @db.JsonB  // Multilingual
  icon        String?
  parentId    String?   @db.Uuid
  parent      Category? @relation("CategoryToCategory", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryToCategory")
  isActive    Boolean   @default(true)
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  providers   Provider[]
  vouchers    Voucher[]
}
```

## New Architecture Pattern (MUST FOLLOW)

### 1. Service Structure

Create the following structure under `/packages/services/category/`:

```
/packages/services/category/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Main export
│   ├── app.ts            # Express app setup
│   ├── server.ts         # Server configuration
│   ├── controllers/
│   │   ├── CategoryController.ts      # Public API endpoints
│   │   └── AdminCategoryController.ts # Admin API endpoints
│   ├── services/
│   │   └── CategoryService.ts         # Business logic
│   ├── repositories/
│   │   └── CategoryRepository.ts      # Data access
│   ├── routes/
│   │   ├── CategoryRoutes.ts          # Public routes
│   │   └── AdminCategoryRoutes.ts     # Admin routes
│   ├── mappers/
│   │   └── CategoryMapper.ts          # Data transformation
│   ├── types/
│   │   ├── index.ts
│   │   └── search.ts                  # Search parameters
│   └── utils/
│       └── index.ts
```

### 2. API Structure (CRITICAL)

We follow a **three-tier API design**:

#### Public API (`/api/public/schemas/category/`)

- Customer-facing endpoints
- Read operations (browse categories)
- No authentication required for listing
- Limited fields exposed

#### Admin API (`/api/admin/schemas/category/`)

- Full CRUD operations
- All fields accessible
- Requires admin authentication
- Bulk operations

#### Internal API (`/api/internal/schemas/category/`)

- Service-to-service communication
- No rate limiting
- API key authentication
- Optimized for performance

### 3. Implementation Patterns

#### Controller Pattern

```typescript
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {
    // IMPORTANT: Bind all methods
    this.getCategories = this.getCategories.bind(this)
    this.getCategoryById = this.getCategoryById.bind(this)
  }

  async getCategories(request: Request<{}, {}, {}, CategoryQueryParams>, response: Response, next: NextFunction): Promise<void> {
    try {
      const params = {
        page: Number(request.query.page) || 1,
        limit: Number(request.query.limit) || 20,
        parentId: request.query.parentId,
        isActive: request.query.isActive,
        // ... other params
      }

      const result = await this.categoryService.getCategories(params)

      // IMPORTANT: Use mapper for data transformation
      const dtoResult = {
        data: result.data.map(CategoryMapper.toDTO),
        pagination: result.pagination,
      }

      response.json(dtoResult)
    } catch (error) {
      next(error)
    }
  }
}
```

#### Service Pattern

```typescript
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async getCategories(params: CategorySearchParams): Promise<PaginatedResult<CategoryDomain>> {
    // Business logic here
    // DO NOT put database queries here - use repository
    const result = await this.categoryRepository.findAll(params)
    return result
  }
}
```

#### Repository Pattern

```typescript
export class CategoryRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async findAll(params: CategorySearchParams): Promise<PaginatedResult<Category>> {
    // Database queries ONLY here
    // Handle pagination, filtering, sorting
  }
}
```

#### Mapper Pattern (REQUIRED)

```typescript
export class CategoryMapper {
  // Database → Domain
  static toDomain(dbCategory: Category): CategoryDomain {
    return {
      id: dbCategory.id,
      name: dbCategory.name as MultilingualText,
      description: dbCategory.description as MultilingualText | null,
      icon: dbCategory.icon,
      parentId: dbCategory.parentId,
      isActive: dbCategory.isActive,
      sortOrder: dbCategory.sortOrder,
      createdAt: dbCategory.createdAt,
      updatedAt: dbCategory.updatedAt,
    }
  }

  // Domain → DTO (for API responses)
  static toDTO(domain: CategoryDomain): CategoryDTO {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      icon: domain.icon,
      parentId: domain.parentId,
      isActive: domain.isActive,
      sortOrder: domain.sortOrder,
    }
  }
}
```

### 4. Zod Schema Creation

Create schemas in `/packages/api/src/`:

#### Public Schemas (`/public/schemas/category/index.ts`)

```typescript
import { z } from 'zod'
import { paginationSchema, multilingualTextField } from '../../common/schemas'

export const CategoryResponse = z.object({
  id: z.string().uuid(),
  name: multilingualTextField,
  description: multilingualTextField.nullable(),
  icon: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
})

export const CategoryListResponse = z.object({
  data: z.array(CategoryResponse),
  pagination: paginationSchema,
})

export const CategoryQueryParams = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  parentId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
})
```

#### Admin Schemas (`/admin/schemas/category/index.ts`)

```typescript
export const CreateCategoryRequest = z.object({
  name: multilingualTextField,
  description: multilingualTextField.optional(),
  icon: z.string().optional(),
  parentId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
})

export const UpdateCategoryRequest = CreateCategoryRequest.partial()
```

### 5. Route Setup

#### Public Routes

```typescript
export function createCategoryRoutes(categoryController: CategoryController): Router {
  const router = Router()

  router.get('/', validateQuery(CategoryQueryParams), categoryController.getCategories)

  router.get('/:id', validateParams(z.object({ id: z.string().uuid() })), categoryController.getCategoryById)

  return router
}
```

#### Admin Routes

```typescript
export function createAdminCategoryRoutes(adminCategoryController: AdminCategoryController): Router {
  const router = Router()

  router.post('/', requireAdmin(), validateBody(CreateCategoryRequest), adminCategoryController.createCategory)

  router.put('/:id', requireAdmin(), validateParams(z.object({ id: z.string().uuid() })), validateBody(UpdateCategoryRequest), adminCategoryController.updateCategory)

  router.delete('/:id', requireAdmin(), validateParams(z.object({ id: z.string().uuid() })), adminCategoryController.deleteCategory)

  return router
}
```

### 6. Dependency Injection

In `app.ts`:

```typescript
export async function createCategoryServer(dependencies: { prisma: PrismaClient; cacheService: ICacheService }) {
  const app = await createExpressServer({
    serviceName: 'category',
    dependencies,
  })

  // Create instances
  const categoryRepository = new CategoryRepository(dependencies.prisma)
  const categoryService = new CategoryService(categoryRepository, dependencies.cacheService)
  const categoryController = new CategoryController(categoryService)
  const adminCategoryController = new AdminCategoryController(categoryService)

  // Setup routes
  app.use('/categories', createCategoryRoutes(categoryController))
  app.use('/admin/categories', createAdminCategoryRoutes(adminCategoryController))

  return app
}
```

## Important Patterns to Follow

### 1. Error Handling

Use the `ErrorFactory` from `@pika/shared`:

```typescript
import { ErrorFactory } from '@pika/shared'

throw ErrorFactory.notFound('Category', categoryId)
throw ErrorFactory.badRequest('Parent category cannot be the same as the category')
```

### 2. Validation

Always validate inputs using Zod middleware:

```typescript
import { validateBody, validateQuery, validateParams } from '@pika/shared'
```

### 3. Authentication

Use authentication helpers:

```typescript
import { requireAuth, requireAdmin } from '@pika/auth'
```

### 4. Caching

Use the cache decorator for read operations:

```typescript
import { Cache } from '@pika/redis'

@Cache({ ttl: 3600, prefix: 'categories' })
async getCategories() { }
```

### 5. Types Organization

- **Domain Types**: Internal representation of data
- **DTO Types**: External API representation
- **Database Types**: Prisma generated types

## Testing Requirements

Create integration tests in `/packages/services/category/test/integration/`:

```typescript
describe('Category Service', () => {
  let app: Application
  let testDb: TestDatabase

  beforeEach(async () => {
    testDb = await createTestDatabase()
    app = await createCategoryServer({
      prisma: testDb.prisma,
      cacheService: new MemoryCacheService(),
    })
  })

  describe('GET /categories', () => {
    it('should return paginated categories', async () => {
      // Test implementation
    })
  })
})
```

## Multilingual Support

Categories support multilingual content. Example:

```json
{
  "name": {
    "en": "Food & Dining",
    "es": "Comida y Restaurantes",
    "gn": "Tembi'u ha Okaruha"
  }
}
```

Always preserve multilingual fields when transforming data.

## Package.json Setup

```json
{
  "name": "@pika/category-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts"
  },
  "dependencies": {
    "@pika/shared": "workspace:^",
    "@pika/database": "workspace:^",
    "@pika/http": "workspace:^",
    "@pika/redis": "workspace:^",
    "@pika/auth": "workspace:^",
    "@pika/types": "workspace:^",
    "@pika/environment": "workspace:^",
    "express": "^4.21.2"
  }
}
```

## Success Criteria

1. ✅ Service follows Clean Architecture pattern exactly
2. ✅ All three API tiers implemented (public, admin, internal)
3. ✅ Zod schemas created and registered
4. ✅ Mappers handle all data transformations
5. ✅ Integration tests pass
6. ✅ Service builds without errors
7. ✅ Multilingual support preserved
8. ✅ Hierarchical categories work correctly

## Questions or Blockers?

If you encounter any issues:

1. Check the existing services (auth, user, communication) for patterns
2. Refer to CLAUDE.md for architecture guidelines
3. The other Claude instance is handling cleanup tasks in parallel

Good luck with the migration! 🚀
