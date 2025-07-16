# Category Service Migration Plan (Updated)

## Overview

This is the updated migration plan for the Category Service, incorporating all architectural patterns and best practices from the documentation review.

## Key Architecture Principles to Follow

### 1. Clean Architecture & Separation of Concerns

- **Controllers** → Handle HTTP concerns only (extract params, call service, return response)
- **Services** → Business logic, validation, orchestration (NO database queries, NO API types)
- **Repositories** → Data access and persistence only
- **Mappers** → Data transformation between layers (Database ↔ Domain ↔ DTO)

### 2. Import Rules (CRITICAL)

- **Controllers CAN import**: `@pika/api`, `@pika/sdk`, service interfaces
- **Services CAN import**: `@pika/shared` (for service clients), repository interfaces, domain types
- **Repositories CAN import**: `@prisma/client`, `@pika/database`
- **NEVER**: Import API types in services, import Prisma in controllers, cross-service direct imports

### 3. Validation Pattern

- Use Zod schemas from `@pika/api` with validation middleware
- Use `createSearchSchema` and `createByIdQuerySchema` utilities for consistency
- Never manually parse schemas in controllers - let middleware handle it

### 4. Relation Handling Pattern

- Use `include` parameter pattern (JSON:API spec) for optional relations
- Return complete objects when included, not just ID/name pairs
- Support hierarchical categories with parent/children relations

### 5. Type Safety

- Use proper Request generics: `Request<Params, {}, Body, Query>`
- Never use type assertions or `unknown` casts
- Let validation middleware ensure runtime safety

## Implementation Plan

### Phase 1: API Schema Creation (Zod)

#### 1.1 Common Schema Utilities

```typescript
// Use existing utilities from @pika/api/common
import { createSearchSchema, createByIdQuerySchema, multilingualTextField } from '@pika/api/common'
```

#### 1.2 Public API Schema (`/packages/api/src/public/schemas/category/index.ts`)

```typescript
import { z } from 'zod'
import { createSearchSchema, createByIdQuerySchema, multilingualTextField } from '../../common/schemas/index.js'

// Define allowed relations and sort fields
export const CATEGORY_RELATIONS = ['parent', 'children'] as const
export const CATEGORY_SORT_FIELDS = ['name', 'sortOrder', 'createdAt', 'updatedAt'] as const

// Response schemas
export const CategoryResponse = z.object({
  id: z.string().uuid(),
  name: multilingualTextField,
  description: multilingualTextField.nullable(),
  icon: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Include pattern for complete objects
  parent: z.lazy(() => CategoryResponse).optional(),
  children: z.array(z.lazy(() => CategoryResponse)).optional(),
})

// Search schema using utility
export const SearchCategoriesRequest = createSearchSchema({
  sortFields: CATEGORY_SORT_FIELDS,
  includeRelations: CATEGORY_RELATIONS,
  defaultSortField: 'sortOrder',
  additionalParams: {
    parentId: z.string().uuid().optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(),
    level: z.number().int().min(1).optional(),
  },
})

// By ID query schema
export const GetCategoryByIdQuery = createByIdQuerySchema(CATEGORY_RELATIONS)

// ID parameter
export const CategoryIdParam = z.object({
  id: z.string().uuid(),
})

// List response
export const CategoryListResponse = z.object({
  data: z.array(CategoryResponse),
  pagination: paginationResponseSchema,
})

// Export types
export type CategoryResponse = z.infer<typeof CategoryResponse>
export type SearchCategoriesRequest = z.infer<typeof SearchCategoriesRequest>
export type GetCategoryByIdQuery = z.infer<typeof GetCategoryByIdQuery>
```

#### 1.3 Admin API Schema (`/packages/api/src/admin/schemas/category/management.ts`)

```typescript
import { z } from 'zod'
import { multilingualTextField } from '../../../common/schemas/fields.js'
import { CategoryResponse, CATEGORY_RELATIONS } from '../../../public/schemas/category/index.js'

// Request schemas
export const CreateCategoryRequest = z.object({
  name: multilingualTextField,
  description: multilingualTextField.optional(),
  icon: z.string().optional(),
  parentId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const UpdateCategoryRequest = CreateCategoryRequest.partial()

// Admin response includes soft delete info
export const AdminCategoryResponse = CategoryResponse.extend({
  deletedAt: z.string().datetime().nullable(),
})

// Admin can see deleted categories
export const AdminSearchCategoriesRequest = createSearchSchema({
  sortFields: CATEGORY_SORT_FIELDS,
  includeRelations: CATEGORY_RELATIONS,
  defaultSortField: 'sortOrder',
  additionalParams: {
    parentId: z.string().uuid().optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(),
    includeDeleted: z.coerce.boolean().optional(),
  },
})

export const AdminCategoryListResponse = z.object({
  data: z.array(AdminCategoryResponse),
  pagination: paginationResponseSchema,
})

// Bulk operations
export const BulkUpdateCategoriesRequest = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      data: UpdateCategoryRequest,
    }),
  ),
})

// Export types
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequest>
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequest>
export type AdminCategoryResponse = z.infer<typeof AdminCategoryResponse>
```

#### 1.4 Internal API Schema (`/packages/api/src/internal/schemas/category/service.ts`)

```typescript
import { z } from 'zod'
import { CategoryResponse } from '../../../public/schemas/category/index.js'

// Batch operations
export const GetCategoriesByIdsRequest = z.object({
  categoryIds: z.array(z.string().uuid()).min(1).max(100),
})

export const GetCategoriesByIdsResponse = z.object({
  categories: z.array(CategoryResponse),
})

// Validation
export const ValidateCategoryRequest = z.object({
  categoryId: z.string().uuid(),
  checkActive: z.boolean().default(true),
})

export const ValidateCategoryResponse = z.object({
  valid: z.boolean(),
  category: CategoryResponse.optional(),
  reason: z.string().optional(),
})

// Hierarchy operations
export const GetCategoryPathRequest = z.object({
  categoryId: z.string().uuid(),
})

export const GetCategoryPathResponse = z.object({
  path: z.array(CategoryResponse),
})

// Tree operations
export const GetCategoryTreeRequest = z.object({
  rootId: z.string().uuid().optional(),
  maxDepth: z.number().int().min(1).max(10).default(5),
})

export const GetCategoryTreeResponse = z.object({
  tree: z.array(CategoryResponse),
})

// Export types
export type GetCategoriesByIdsRequest = z.infer<typeof GetCategoriesByIdsRequest>
export type ValidateCategoryResponse = z.infer<typeof ValidateCategoryResponse>
```

### Phase 2: Service Structure Creation

#### 2.1 Create Directory Structure

```bash
mkdir -p packages/services/category/{src/{controllers,services,repositories,routes,mappers,types,utils},test/integration}
```

#### 2.2 Package Configuration

**package.json:**

```json
{
  "name": "@pika/category-service",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "local": "tsx src/index.ts"
  },
  "dependencies": {
    "@pika/shared": "workspace:^",
    "@pika/database": "workspace:^",
    "@pika/http": "workspace:^",
    "@pika/redis": "workspace:^",
    "@pika/auth": "workspace:^",
    "@pika/types": "workspace:^",
    "@pika/environment": "workspace:^",
    "@pika/api": "workspace:^",
    "@pika/sdk": "workspace:^",
    "@prisma/client": "^6.1.0",
    "express": "^4.21.2",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/express": "^5.0.1",
    "@types/node": "^22.10.6",
    "@pika/tests": "workspace:^",
    "tsx": "^4.19.4",
    "typescript": "~5.8.3",
    "vitest": "^3.2.2",
    "supertest": "^7.1.1"
  }
}
```

**tsconfig.json:**

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "tsBuildInfoFile": "./dist/tsconfig.tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

**project.json:**

```json
{
  "name": "@pika/category-service",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/services/category/src",
  "projectType": "application",
  "implicitDependencies": ["@pika/database"],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "outputs": ["{projectRoot}/dist"],
      "options": {
        "command": "tsc -p packages/services/category/tsconfig.json && tsc-alias -p packages/services/category/tsconfig.json"
      }
    },
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsx watch packages/services/category/src/index.ts"
      }
    },
    "local": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsx packages/services/category/src/index.ts"
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "outputs": ["{projectRoot}/coverage"],
      "options": {
        "config": "packages/services/category/vitest.config.ts"
      }
    },
    "test:integration": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vitest run --config packages/services/category/vitest.integration.config.ts"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"]
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit -p packages/services/category/tsconfig.json"
      }
    }
  }
}
```

### Phase 3: Core Implementation

#### 3.1 Domain Types (`/types/domain.ts`)

```typescript
import type { Category } from '@pika/database'
import type { MultilingualText } from '@pika/types'

export interface CategoryDomain {
  id: string
  name: MultilingualText
  description: MultilingualText | null
  icon: string | null
  parentId: string | null
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  // Relations
  parent?: CategoryDomain
  children?: CategoryDomain[]
}

export interface CategoryPath {
  category: CategoryDomain
  ancestors: CategoryDomain[]
}

export interface CategoryTree {
  category: CategoryDomain
  children: CategoryTree[]
}
```

#### 3.2 Search Types (`/types/search.ts`)

```typescript
import type { ParsedIncludes } from '@pika/shared'

export interface CategorySearchParams {
  page?: number
  limit?: number
  sortBy?: 'name' | 'sortOrder' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  parentId?: string
  isActive?: boolean
  search?: string
  level?: number
  includeDeleted?: boolean
  parsedIncludes?: ParsedIncludes
}

export interface CategoryFilters {
  parentId?: string
  isActive?: boolean
  search?: string
  level?: number
  includeDeleted?: boolean
}
```

#### 3.3 Mapper Implementation (`/mappers/CategoryMapper.ts`)

```typescript
import type { Category, Prisma } from '@pika/database'
import type { CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest } from '@pika/api'
import type { CategoryDomain } from '../types/domain.js'
import type { MultilingualText } from '@pika/types'

type CategoryWithRelations = Category & {
  parent?: Category | null
  children?: Category[]
}

export class CategoryMapper {
  // Database to Domain
  static toDomain(dbCategory: CategoryWithRelations): CategoryDomain {
    const domain: CategoryDomain = {
      id: dbCategory.id,
      name: dbCategory.name as MultilingualText,
      description: dbCategory.description as MultilingualText | null,
      icon: dbCategory.icon,
      parentId: dbCategory.parentId,
      isActive: dbCategory.isActive,
      sortOrder: dbCategory.sortOrder,
      createdAt: dbCategory.createdAt,
      updatedAt: dbCategory.updatedAt,
      deletedAt: dbCategory.deletedAt,
    }

    // Map relations if present
    if (dbCategory.parent) {
      domain.parent = this.toDomain(dbCategory.parent)
    }

    if (dbCategory.children) {
      domain.children = dbCategory.children.map((child) => this.toDomain(child))
    }

    return domain
  }

  // Domain to API Response
  static toResponse(domain: CategoryDomain): CategoryResponse {
    const response: CategoryResponse = {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      icon: domain.icon,
      parentId: domain.parentId,
      isActive: domain.isActive,
      sortOrder: domain.sortOrder,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    }

    // Include relations if present
    if (domain.parent) {
      response.parent = this.toResponse(domain.parent)
    }

    if (domain.children) {
      response.children = domain.children.map((child) => this.toResponse(child))
    }

    return response
  }

  // API Request to Domain (for create)
  static fromCreateRequest(request: CreateCategoryRequest): Omit<CategoryDomain, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
    return {
      name: request.name,
      description: request.description || null,
      icon: request.icon || null,
      parentId: request.parentId || null,
      isActive: request.isActive ?? true,
      sortOrder: request.sortOrder ?? 0,
    }
  }

  // API Request to Domain (for update)
  static fromUpdateRequest(request: UpdateCategoryRequest): Partial<CategoryDomain> {
    const updates: Partial<CategoryDomain> = {}

    if (request.name !== undefined) updates.name = request.name
    if (request.description !== undefined) updates.description = request.description
    if (request.icon !== undefined) updates.icon = request.icon
    if (request.parentId !== undefined) updates.parentId = request.parentId
    if (request.isActive !== undefined) updates.isActive = request.isActive
    if (request.sortOrder !== undefined) updates.sortOrder = request.sortOrder

    return updates
  }

  // Array transformations
  static toDomainArray(dbCategories: CategoryWithRelations[]): CategoryDomain[] {
    return dbCategories.map((cat) => this.toDomain(cat))
  }

  static toResponseArray(domains: CategoryDomain[]): CategoryResponse[] {
    return domains.map((domain) => this.toResponse(domain))
  }
}
```

#### 3.4 Repository Implementation (`/repositories/CategoryRepository.ts`)

```typescript
import type { PrismaClient, Prisma } from '@pika/database'
import type { ICacheService } from '@pika/redis'
import type { PaginatedResult, ParsedIncludes } from '@pika/types'
import { ErrorFactory } from '@pika/shared'
import { toPrismaInclude } from '@pika/shared'
import type { CategoryDomain, CategoryTree } from '../types/domain.js'
import type { CategorySearchParams, CategoryFilters } from '../types/search.js'
import { CategoryMapper } from '../mappers/CategoryMapper.js'

export interface ICategoryRepository {
  findAll(params: CategorySearchParams): Promise<PaginatedResult<CategoryDomain>>
  findById(id: string, parsedIncludes?: ParsedIncludes): Promise<CategoryDomain | null>
  findByIds(ids: string[]): Promise<CategoryDomain[]>
  findByParentId(parentId: string | null): Promise<CategoryDomain[]>
  create(data: Omit<CategoryDomain, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<CategoryDomain>
  update(id: string, data: Partial<CategoryDomain>): Promise<CategoryDomain>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
  hasChildren(id: string): Promise<boolean>
  getAncestors(id: string): Promise<CategoryDomain[]>
  getCategoryTree(rootId?: string, maxDepth?: number): Promise<CategoryTree[]>
}

export class CategoryRepository implements ICategoryRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async findAll(params: CategorySearchParams): Promise<PaginatedResult<CategoryDomain>> {
    const { page = 1, limit = 20, sortBy = 'sortOrder', sortOrder = 'asc', parsedIncludes, ...filters } = params

    const where = this.buildWhereClause(filters)
    const orderBy = this.buildOrderBy(sortBy, sortOrder)
    const include = this.buildInclude(parsedIncludes)

    // Get total count
    const total = await this.prisma.category.count({ where })

    // Get paginated data
    const categories = await this.prisma.category.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include,
    })

    const data = CategoryMapper.toDomainArray(categories)

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: string, parsedIncludes?: ParsedIncludes): Promise<CategoryDomain | null> {
    const include = this.buildInclude(parsedIncludes)

    const category = await this.prisma.category.findUnique({
      where: { id },
      include,
    })

    return category ? CategoryMapper.toDomain(category) : null
  }

  async findByIds(ids: string[]): Promise<CategoryDomain[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
    })

    return CategoryMapper.toDomainArray(categories)
  }

  async findByParentId(parentId: string | null): Promise<CategoryDomain[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        parentId,
        deletedAt: null,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return CategoryMapper.toDomainArray(categories)
  }

  async create(data: Omit<CategoryDomain, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<CategoryDomain> {
    try {
      const category = await this.prisma.category.create({
        data: {
          name: data.name,
          description: data.description,
          icon: data.icon,
          parentId: data.parentId,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        },
      })

      // Clear cache
      if (this.cache) {
        await this.cache.del('categories:*')
      }

      return CategoryMapper.toDomain(category)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003' && data.parentId) {
          throw ErrorFactory.badRequest('Parent category not found')
        }
      }
      throw ErrorFactory.databaseError('create', 'category', error)
    }
  }

  async update(id: string, data: Partial<CategoryDomain>): Promise<CategoryDomain> {
    try {
      // Remove fields that shouldn't be updated directly
      const { id: _, createdAt, updatedAt, deletedAt, parent, children, ...updateData } = data

      const category = await this.prisma.category.update({
        where: { id },
        data: updateData,
      })

      // Clear cache
      if (this.cache) {
        await this.cache.del('categories:*')
      }

      return CategoryMapper.toDomain(category)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.notFound('Category', id)
        }
        if (error.code === 'P2003' && data.parentId) {
          throw ErrorFactory.badRequest('Parent category not found')
        }
      }
      throw ErrorFactory.databaseError('update', 'category', error)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.category.update({
        where: { id },
        data: { deletedAt: new Date() },
      })

      // Clear cache
      if (this.cache) {
        await this.cache.del('categories:*')
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.notFound('Category', id)
        }
      }
      throw ErrorFactory.databaseError('delete', 'category', error)
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { id, deletedAt: null },
    })
    return count > 0
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { parentId: id, deletedAt: null },
    })
    return count > 0
  }

  async getAncestors(id: string): Promise<CategoryDomain[]> {
    const ancestors: CategoryDomain[] = []
    let currentId: string | null = id

    while (currentId) {
      const category = await this.findById(currentId)
      if (!category) break

      ancestors.unshift(category)
      currentId = category.parentId
    }

    return ancestors
  }

  async getCategoryTree(rootId?: string, maxDepth: number = 5): Promise<CategoryTree[]> {
    // Implementation for tree structure
    // This would use recursive queries or build the tree in memory
    // For now, returning empty array
    return []
  }

  private buildWhereClause(filters: CategoryFilters): Prisma.CategoryWhereInput {
    const where: Prisma.CategoryWhereInput = {}

    if (!filters.includeDeleted) {
      where.deletedAt = null
    }

    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters.level !== undefined) {
      // This would need a level field in the database or calculated logic
    }

    if (filters.search) {
      where.OR = [
        {
          name: {
            path: ['en'],
            string_contains: filters.search,
          },
        },
        {
          name: {
            path: ['es'],
            string_contains: filters.search,
          },
        },
        {
          name: {
            path: ['gn'],
            string_contains: filters.search,
          },
        },
      ]
    }

    return where
  }

  private buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): Prisma.CategoryOrderByWithRelationInput {
    const orderBy: Prisma.CategoryOrderByWithRelationInput = {}

    switch (sortBy) {
      case 'name':
        // Sort by English name by default
        orderBy.name = sortOrder
        break
      case 'createdAt':
        orderBy.createdAt = sortOrder
        break
      case 'updatedAt':
        orderBy.updatedAt = sortOrder
        break
      case 'sortOrder':
      default:
        orderBy.sortOrder = sortOrder
        break
    }

    return orderBy
  }

  private buildInclude(parsedIncludes?: ParsedIncludes): Prisma.CategoryInclude | undefined {
    if (!parsedIncludes || Object.keys(parsedIncludes).length === 0) {
      return undefined
    }

    const include: Prisma.CategoryInclude = {}

    if (parsedIncludes.parent) {
      include.parent = true
    }

    if (parsedIncludes.children) {
      include.children = {
        where: { deletedAt: null, isActive: true },
        orderBy: { sortOrder: 'asc' },
      }
    }

    return include
  }
}
```

#### 3.5 Service Implementation (`/services/CategoryService.ts`)

```typescript
import type { ICategoryRepository } from '../repositories/CategoryRepository.js'
import type { ICacheService } from '@pika/redis'
import type { PaginatedResult, ParsedIncludes } from '@pika/types'
import { ErrorFactory } from '@pika/shared'
import type { CategoryDomain, CategoryPath, CategoryTree } from '../types/domain.js'
import type { CategorySearchParams } from '../types/search.js'

export interface ICategoryService {
  getCategories(params: CategorySearchParams): Promise<PaginatedResult<CategoryDomain>>
  getCategoryById(id: string, parsedIncludes?: ParsedIncludes): Promise<CategoryDomain | null>
  getCategoriesByIds(ids: string[]): Promise<CategoryDomain[]>
  createCategory(data: Omit<CategoryDomain, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<CategoryDomain>
  updateCategory(id: string, data: Partial<CategoryDomain>): Promise<CategoryDomain>
  deleteCategory(id: string): Promise<void>
  validateCategory(id: string, checkActive?: boolean): Promise<{ valid: boolean; category?: CategoryDomain; reason?: string }>
  getCategoryPath(id: string): Promise<CategoryPath>
  getCategoryTree(rootId?: string, maxDepth?: number): Promise<CategoryTree[]>
}

export class CategoryService implements ICategoryService {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly cacheService: ICacheService,
  ) {}

  async getCategories(params: CategorySearchParams): Promise<PaginatedResult<CategoryDomain>> {
    // For public access, ensure only active categories unless explicitly requested
    const publicParams = {
      ...params,
      isActive: params.isActive ?? true,
      includeDeleted: params.includeDeleted ?? false,
    }

    return this.categoryRepository.findAll(publicParams)
  }

  async getCategoryById(id: string, parsedIncludes?: ParsedIncludes): Promise<CategoryDomain | null> {
    const cacheKey = `category:${id}:${JSON.stringify(parsedIncludes || {})}`

    // Try cache first
    const cached = await this.cacheService.get<CategoryDomain>(cacheKey)
    if (cached) {
      return cached
    }

    const category = await this.categoryRepository.findById(id, parsedIncludes)

    if (category && category.isActive && !category.deletedAt) {
      // Cache for 1 hour
      await this.cacheService.set(cacheKey, category, 3600)
    }

    return category
  }

  async getCategoriesByIds(ids: string[]): Promise<CategoryDomain[]> {
    if (ids.length === 0) {
      return []
    }

    if (ids.length > 100) {
      throw ErrorFactory.badRequest('Cannot fetch more than 100 categories at once')
    }

    // Remove duplicates
    const uniqueIds = [...new Set(ids)]

    return this.categoryRepository.findByIds(uniqueIds)
  }

  async createCategory(data: Omit<CategoryDomain, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<CategoryDomain> {
    // Validate parent category if provided
    if (data.parentId) {
      const parentExists = await this.categoryRepository.exists(data.parentId)
      if (!parentExists) {
        throw ErrorFactory.badRequest('Parent category not found')
      }

      // Check depth limit (prevent too deep nesting)
      const ancestors = await this.categoryRepository.getAncestors(data.parentId)
      if (ancestors.length >= 5) {
        throw ErrorFactory.badRequest('Category hierarchy cannot exceed 5 levels')
      }
    }

    // Validate multilingual fields
    this.validateMultilingualText(data.name, 'name')
    if (data.description) {
      this.validateMultilingualText(data.description, 'description')
    }

    return this.categoryRepository.create(data)
  }

  async updateCategory(id: string, data: Partial<CategoryDomain>): Promise<CategoryDomain> {
    // Check if category exists
    const existingCategory = await this.categoryRepository.findById(id)
    if (!existingCategory) {
      throw ErrorFactory.notFound('Category', id)
    }

    // Validate parent category if being updated
    if (data.parentId !== undefined) {
      if (data.parentId) {
        // Check parent exists
        const parentExists = await this.categoryRepository.exists(data.parentId)
        if (!parentExists) {
          throw ErrorFactory.badRequest('Parent category not found')
        }

        // Check for circular reference
        if (data.parentId === id) {
          throw ErrorFactory.badRequest('Category cannot be its own parent')
        }

        // Check if this would create a circular hierarchy
        const parentAncestors = await this.categoryRepository.getAncestors(data.parentId)
        if (parentAncestors.some((ancestor) => ancestor.id === id)) {
          throw ErrorFactory.badRequest('This change would create a circular hierarchy')
        }

        // Check depth limit
        if (parentAncestors.length >= 5) {
          throw ErrorFactory.badRequest('Category hierarchy cannot exceed 5 levels')
        }
      }
    }

    // Validate multilingual fields if provided
    if (data.name) {
      this.validateMultilingualText(data.name, 'name')
    }
    if (data.description) {
      this.validateMultilingualText(data.description, 'description')
    }

    return this.categoryRepository.update(id, data)
  }

  async deleteCategory(id: string): Promise<void> {
    // Check if category exists
    const category = await this.categoryRepository.findById(id)
    if (!category) {
      throw ErrorFactory.notFound('Category', id)
    }

    // Check if category has children
    const hasChildren = await this.categoryRepository.hasChildren(id)
    if (hasChildren) {
      throw ErrorFactory.conflict('Cannot delete category with child categories', 'Delete or reassign child categories first')
    }

    // TODO: Check if category has associated providers or vouchers
    // This would require service client calls to provider and voucher services
    // For now, we'll skip this check

    await this.categoryRepository.delete(id)
  }

  async validateCategory(id: string, checkActive: boolean = true): Promise<{ valid: boolean; category?: CategoryDomain; reason?: string }> {
    const category = await this.categoryRepository.findById(id)

    if (!category) {
      return { valid: false, reason: 'Category not found' }
    }

    if (category.deletedAt) {
      return { valid: false, reason: 'Category has been deleted' }
    }

    if (checkActive && !category.isActive) {
      return { valid: false, reason: 'Category is not active' }
    }

    return { valid: true, category }
  }

  async getCategoryPath(id: string): Promise<CategoryPath> {
    const category = await this.categoryRepository.findById(id)
    if (!category) {
      throw ErrorFactory.notFound('Category', id)
    }

    const ancestors = await this.categoryRepository.getAncestors(id)

    return {
      category,
      ancestors: ancestors.slice(0, -1), // Remove the category itself from ancestors
    }
  }

  async getCategoryTree(rootId?: string, maxDepth: number = 5): Promise<CategoryTree[]> {
    return this.categoryRepository.getCategoryTree(rootId, maxDepth)
  }

  private validateMultilingualText(text: any, fieldName: string): void {
    if (!text || typeof text !== 'object') {
      throw ErrorFactory.badRequest(`${fieldName} must be a multilingual text object`)
    }

    const languages = ['en', 'es', 'gn']
    const hasAtLeastOneLanguage = languages.some((lang) => text[lang] && typeof text[lang] === 'string')

    if (!hasAtLeastOneLanguage) {
      throw ErrorFactory.badRequest(`${fieldName} must have at least one language (en, es, or gn)`)
    }

    // Check each provided language has non-empty string
    for (const lang of languages) {
      if (text[lang] !== undefined && (typeof text[lang] !== 'string' || text[lang].trim() === '')) {
        throw ErrorFactory.badRequest(`${fieldName}.${lang} must be a non-empty string if provided`)
      }
    }
  }
}
```

### Phase 4: Controller Implementations

#### 4.1 Public Controller (`/controllers/CategoryController.ts`)

```typescript
import type { Request, Response, NextFunction } from 'express'
import type { ICategoryService } from '../services/CategoryService.js'
import type { SearchCategoriesRequest, GetCategoryByIdQuery, CategoryIdParam, CATEGORY_RELATIONS } from '@pika/api/public'
import { CategoryMapper } from '../mappers/CategoryMapper.js'
import { parseIncludeParam, getValidatedQuery } from '@pika/shared'
import { ErrorFactory } from '@pika/shared'

export class CategoryController {
  constructor(private readonly categoryService: ICategoryService) {
    // Bind methods to preserve context
    this.getCategories = this.getCategories.bind(this)
    this.getCategoryById = this.getCategoryById.bind(this)
  }

  async getCategories(request: Request<{}, {}, {}, SearchCategoriesRequest>, response: Response, next: NextFunction): Promise<void> {
    try {
      const query = getValidatedQuery<SearchCategoriesRequest>(request)

      // Parse include parameter
      const parsedIncludes = query.include ? parseIncludeParam(query.include, CATEGORY_RELATIONS as unknown as string[]) : {}

      const params = {
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: query.sortBy || 'sortOrder',
        sortOrder: query.sortOrder || 'asc',
        parentId: query.parentId,
        isActive: query.isActive,
        search: query.search,
        level: query.level,
        parsedIncludes,
      }

      const result = await this.categoryService.getCategories(params)

      const dtoResult = {
        data: result.data.map(CategoryMapper.toResponse),
        pagination: result.pagination,
      }

      response.json(dtoResult)
    } catch (error) {
      next(error)
    }
  }

  async getCategoryById(request: Request<CategoryIdParam, {}, {}, GetCategoryByIdQuery>, response: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = request.params
      const query = getValidatedQuery<GetCategoryByIdQuery>(request)

      // Parse include parameter
      const parsedIncludes = query.include ? parseIncludeParam(query.include, CATEGORY_RELATIONS as unknown as string[]) : {}

      const category = await this.categoryService.getCategoryById(id, parsedIncludes)

      if (!category) {
        return next(ErrorFactory.notFound('Category', id))
      }

      const dto = CategoryMapper.toResponse(category)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }
}
```

#### 4.2 Admin Controller (`/controllers/AdminCategoryController.ts`)

```typescript
import type { Request, Response, NextFunction } from 'express'
import type { ICategoryService } from '../services/CategoryService.js'
import type { CreateCategoryRequest, UpdateCategoryRequest, AdminSearchCategoriesRequest, BulkUpdateCategoriesRequest, CategoryIdParam, GetCategoryByIdQuery, CATEGORY_RELATIONS } from '@pika/api/admin'
import { CategoryMapper } from '../mappers/CategoryMapper.js'
import { parseIncludeParam, getValidatedQuery } from '@pika/shared'
import { ErrorFactory } from '@pika/shared'

export class AdminCategoryController {
  constructor(private readonly categoryService: ICategoryService) {
    this.getCategories = this.getCategories.bind(this)
    this.getCategoryById = this.getCategoryById.bind(this)
    this.createCategory = this.createCategory.bind(this)
    this.updateCategory = this.updateCategory.bind(this)
    this.deleteCategory = this.deleteCategory.bind(this)
    this.bulkUpdateCategories = this.bulkUpdateCategories.bind(this)
  }

  async getCategories(request: Request<{}, {}, {}, AdminSearchCategoriesRequest>, response: Response, next: NextFunction): Promise<void> {
    try {
      const query = getValidatedQuery<AdminSearchCategoriesRequest>(request)

      // Parse include parameter
      const parsedIncludes = query.include ? parseIncludeParam(query.include, CATEGORY_RELATIONS as unknown as string[]) : {}

      const params = {
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: query.sortBy || 'sortOrder',
        sortOrder: query.sortOrder || 'asc',
        parentId: query.parentId,
        isActive: query.isActive,
        search: query.search,
        includeDeleted: query.includeDeleted,
        parsedIncludes,
      }

      const result = await this.categoryService.getCategories(params)

      const dtoResult = {
        data: result.data.map(CategoryMapper.toResponse),
        pagination: result.pagination,
      }

      response.json(dtoResult)
    } catch (error) {
      next(error)
    }
  }

  async getCategoryById(request: Request<CategoryIdParam, {}, {}, GetCategoryByIdQuery>, response: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = request.params
      const query = getValidatedQuery<GetCategoryByIdQuery>(request)

      // Parse include parameter
      const parsedIncludes = query.include ? parseIncludeParam(query.include, CATEGORY_RELATIONS as unknown as string[]) : {}

      const category = await this.categoryService.getCategoryById(id, parsedIncludes)

      if (!category) {
        return next(ErrorFactory.notFound('Category', id))
      }

      response.json(CategoryMapper.toResponse(category))
    } catch (error) {
      next(error)
    }
  }

  async createCategory(request: Request<{}, {}, CreateCategoryRequest>, response: Response, next: NextFunction): Promise<void> {
    try {
      const categoryData = CategoryMapper.fromCreateRequest(request.body)
      const category = await this.categoryService.createCategory(categoryData)

      response.status(201).json(CategoryMapper.toResponse(category))
    } catch (error) {
      next(error)
    }
  }

  async updateCategory(request: Request<CategoryIdParam, {}, UpdateCategoryRequest>, response: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = request.params
      const updates = CategoryMapper.fromUpdateRequest(request.body)

      const category = await this.categoryService.updateCategory(id, updates)

      response.json(CategoryMapper.toResponse(category))
    } catch (error) {
      next(error)
    }
  }

  async deleteCategory(request: Request<CategoryIdParam>, response: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = request.params

      await this.categoryService.deleteCategory(id)

      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  async bulkUpdateCategories(request: Request<{}, {}, BulkUpdateCategoriesRequest>, response: Response, next: NextFunction): Promise<void> {
    try {
      const { updates } = request.body

      const results = await Promise.all(
        updates.map(async ({ id, data }) => {
          try {
            const updatedData = CategoryMapper.fromUpdateRequest(data)
            const category = await this.categoryService.updateCategory(id, updatedData)
            return { id, success: true, category: CategoryMapper.toResponse(category) }
          } catch (error) {
            return { id, success: false, error: error.message }
          }
        }),
      )

      response.json({ results })
    } catch (error) {
      next(error)
    }
  }
}
```

#### 4.3 Internal Controller (`/controllers/InternalCategoryController.ts`)

```typescript
import type { Request, Response, NextFunction } from 'express'
import type { ICategoryService } from '../services/CategoryService.js'
import type { GetCategoriesByIdsRequest, ValidateCategoryRequest, GetCategoryPathRequest, GetCategoryTreeRequest } from '@pika/api/internal'
import { CategoryMapper } from '../mappers/CategoryMapper.js'

export class InternalCategoryController {
  constructor(private readonly categoryService: ICategoryService) {
    this.getCategoriesByIds = this.getCategoriesByIds.bind(this)
    this.validateCategory = this.validateCategory.bind(this)
    this.getCategoryPath = this.getCategoryPath.bind(this)
    this.getCategoryTree = this.getCategoryTree.bind(this)
  }

  async getCategoriesByIds(request: Request<{}, {}, GetCategoriesByIdsRequest>, response: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryIds } = request.body

      const categories = await this.categoryService.getCategoriesByIds(categoryIds)

      response.json({
        categories: CategoryMapper.toResponseArray(categories),
      })
    } catch (error) {
      next(error)
    }
  }

  async validateCategory(request: Request<{}, {}, ValidateCategoryRequest>, response: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId, checkActive } = request.body

      const validation = await this.categoryService.validateCategory(categoryId, checkActive)

      response.json({
        valid: validation.valid,
        category: validation.category ? CategoryMapper.toResponse(validation.category) : undefined,
        reason: validation.reason,
      })
    } catch (error) {
      next(error)
    }
  }

  async getCategoryPath(request: Request<{}, {}, GetCategoryPathRequest>, response: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = request.body

      const path = await this.categoryService.getCategoryPath(categoryId)

      response.json({
        path: CategoryMapper.toResponseArray(path.ancestors.concat(path.category)),
      })
    } catch (error) {
      next(error)
    }
  }

  async getCategoryTree(request: Request<{}, {}, GetCategoryTreeRequest>, response: Response, next: NextFunction): Promise<void> {
    try {
      const { rootId, maxDepth } = request.body

      const tree = await this.categoryService.getCategoryTree(rootId, maxDepth)

      // Transform tree structure to response format
      const transformTree = (nodes: CategoryTree[]): any[] => {
        return nodes.map((node) => ({
          ...CategoryMapper.toResponse(node.category),
          children: transformTree(node.children),
        }))
      }

      response.json({
        tree: transformTree(tree),
      })
    } catch (error) {
      next(error)
    }
  }
}
```

### Phase 5: Route Setup and Server Configuration

#### 5.1 Route Definitions

**CategoryRoutes.ts:**

```typescript
import { Router } from 'express'
import type { CategoryController } from '../controllers/CategoryController.js'
import { validateQuery, validateParams } from '@pika/http'
import { SearchCategoriesRequest, GetCategoryByIdQuery, CategoryIdParam } from '@pika/api/public'

export function createCategoryRoutes(categoryController: CategoryController): Router {
  const router = Router()

  router.get('/', validateQuery(SearchCategoriesRequest), categoryController.getCategories)

  router.get('/:id', validateParams(CategoryIdParam), validateQuery(GetCategoryByIdQuery), categoryController.getCategoryById)

  return router
}
```

**AdminCategoryRoutes.ts:**

```typescript
import { Router } from 'express'
import type { AdminCategoryController } from '../controllers/AdminCategoryController.js'
import { validateQuery, validateParams, validateBody } from '@pika/http'
import { AdminSearchCategoriesRequest, CategoryIdParam, GetCategoryByIdQuery, CreateCategoryRequest, UpdateCategoryRequest, BulkUpdateCategoriesRequest } from '@pika/api/admin'

export function createAdminCategoryRoutes(adminCategoryController: AdminCategoryController): Router {
  const router = Router()

  router.get('/', validateQuery(AdminSearchCategoriesRequest), adminCategoryController.getCategories)

  router.get('/:id', validateParams(CategoryIdParam), validateQuery(GetCategoryByIdQuery), adminCategoryController.getCategoryById)

  router.post('/', validateBody(CreateCategoryRequest), adminCategoryController.createCategory)

  router.put('/:id', validateParams(CategoryIdParam), validateBody(UpdateCategoryRequest), adminCategoryController.updateCategory)

  router.delete('/:id', validateParams(CategoryIdParam), adminCategoryController.deleteCategory)

  router.post('/bulk-update', validateBody(BulkUpdateCategoriesRequest), adminCategoryController.bulkUpdateCategories)

  return router
}
```

**InternalCategoryRoutes.ts:**

```typescript
import { Router } from 'express'
import type { InternalCategoryController } from '../controllers/InternalCategoryController.js'
import { validateBody } from '@pika/http'
import { GetCategoriesByIdsRequest, ValidateCategoryRequest, GetCategoryPathRequest, GetCategoryTreeRequest } from '@pika/api/internal'

export function createInternalCategoryRoutes(internalCategoryController: InternalCategoryController): Router {
  const router = Router()

  router.post('/by-ids', validateBody(GetCategoriesByIdsRequest), internalCategoryController.getCategoriesByIds)

  router.post('/validate', validateBody(ValidateCategoryRequest), internalCategoryController.validateCategory)

  router.post('/path', validateBody(GetCategoryPathRequest), internalCategoryController.getCategoryPath)

  router.post('/tree', validateBody(GetCategoryTreeRequest), internalCategoryController.getCategoryTree)

  return router
}
```

#### 5.2 App Configuration (app.ts)

```typescript
import { CATEGORY_SERVICE_PORT } from '@pika/environment'
import { type ICacheService, initializeCache } from '@pika/redis'
import { logger } from '@pika/shared'
import { startServer } from '@pika/http'
import { PrismaClient } from '@prisma/client'

import { createCategoryServer } from './server.js'

async function initializeDatabase(): Promise<PrismaClient> {
  const prisma = new PrismaClient()

  try {
    await prisma.$queryRaw`SELECT 1`
    logger.info('Successfully connected to PostgreSQL database')

    return prisma
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL database:', error)
    throw error
  }
}

export async function startService(): Promise<void> {
  let prisma: PrismaClient | undefined
  let cacheService: ICacheService | undefined

  try {
    // Initialize dependencies
    prisma = await initializeDatabase()
    cacheService = await initializeCache()

    const app = await createCategoryServer({
      port: CATEGORY_SERVICE_PORT,
      prisma,
      cacheService,
    })

    // Start the server
    await startServer(app, CATEGORY_SERVICE_PORT, {
      onShutdown: async () => {
        logger.info('Shutting down Category service...')
        await prisma?.$disconnect()
        await cacheService?.disconnect()
        logger.info('Category service shutdown complete')
      },
      onUnhandledRejection: (reason) => {
        logger.error('Unhandled Promise Rejection in Category service:', reason)
      },
    })
  } catch (error) {
    logger.error('Failed to start category service', error)

    // Cleanup on startup failure
    await prisma?.$disconnect()
    await cacheService?.disconnect()

    throw error
  }
}
```

#### 5.3 Server Configuration (server.ts)

```typescript
import { createExpressServer, errorMiddleware } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'

import { CategoryRepository } from './repositories/CategoryRepository.js'
import { CategoryService } from './services/CategoryService.js'
import { CategoryController } from './controllers/CategoryController.js'
import { AdminCategoryController } from './controllers/AdminCategoryController.js'
import { InternalCategoryController } from './controllers/InternalCategoryController.js'
import { createCategoryRoutes } from './routes/CategoryRoutes.js'
import { createAdminCategoryRoutes } from './routes/AdminCategoryRoutes.js'
import { createInternalCategoryRoutes } from './routes/InternalCategoryRoutes.js'

export interface ServerConfig {
  port: number
  prisma: PrismaClient
  cacheService: ICacheService
}

export async function createCategoryServer(config: ServerConfig) {
  const app = await createExpressServer({
    serviceName: 'category-service',
    port: config.port,
    cacheService: config.cacheService,
    authOptions: {
      excludePaths: [
        '/categories', // Public category listing doesn't require auth
        '/categories/*', // Public category details
        '/internal/*', // Internal routes use service authentication
      ],
    },
    healthChecks: [
      {
        name: 'postgres',
        check: async () => {
          try {
            await config.prisma.$queryRaw`SELECT 1`
            return true
          } catch {
            return false
          }
        },
        details: { type: 'PostgreSQL' },
      },
      {
        name: 'redis',
        check: async () => {
          try {
            if (typeof config.cacheService.checkHealth === 'function') {
              const health = await config.cacheService.checkHealth()
              return health.status === 'healthy' || health.status === 'degraded'
            }
            await config.cacheService.set('health_check', 'ok', 5)
            const result = await config.cacheService.get('health_check')
            return result === 'ok'
          } catch (error) {
            logger.error('Cache health check failed:', error)
            return false
          }
        },
        details: { type: 'Cache' },
      },
    ],
    idempotencyOptions: {
      enabled: true,
      defaultTTL: 86400,
      methods: ['POST', 'PUT', 'PATCH'],
      excludeRoutes: ['/health', '/metrics'],
    },
  })

  // Create service instances
  const categoryRepository = new CategoryRepository(config.prisma, config.cacheService)
  const categoryService = new CategoryService(categoryRepository, config.cacheService)

  // Create controllers
  const categoryController = new CategoryController(categoryService)
  const adminCategoryController = new AdminCategoryController(categoryService)
  const internalCategoryController = new InternalCategoryController(categoryService)

  // Mount public routes
  app.use('/categories', createCategoryRoutes(categoryController))

  // Mount admin routes
  app.use('/admin/categories', createAdminCategoryRoutes(adminCategoryController))

  // Mount internal routes for service-to-service communication
  app.use('/internal/categories', createInternalCategoryRoutes(internalCategoryController))

  // Register error middleware AFTER all routes (Express requirement)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  return app
}
```

#### 5.4 Index File (index.ts)

```typescript
import { startService } from './app.js'

// Start the service
startService().catch((error) => {
  console.error('Failed to start category service:', error)
  process.exit(1)
})

// Export types and interfaces for other services
export type { ICategoryService } from './services/CategoryService.js'
export type { ICategoryRepository } from './repositories/CategoryRepository.js'
export type { CategoryDomain, CategoryPath, CategoryTree } from './types/domain.js'
export type { CategorySearchParams, CategoryFilters } from './types/search.js'
export { CategoryMapper } from './mappers/CategoryMapper.js'
```

### Phase 6: Additional Configurations

#### 6.1 Environment Variables

Add to `/packages/environment/src/constants/service.ts`:

```typescript
export const CATEGORY_SERVICE_PORT = parseInt(process.env.CATEGORY_SERVICE_PORT || '5025', 10)
```

#### 6.2 Update nx.json

Add category service to the projects list.

#### 6.3 API Documentation Registration

Update `/packages/api/src/scripts/generators/public-api.ts`, `/admin-api.ts`, and `/internal-api.ts` to include category schemas and routes.

### Phase 7: Testing Strategy

Create comprehensive integration tests following the patterns in communication service tests.

## Key Differences from Original Plan

1. **Proper Import Rules**: Following strict separation of concerns
2. **Include Pattern**: Using industry-standard include parameter for relations
3. **Complete Objects**: Returning full parent/children objects when included
4. **Validation Utilities**: Using createSearchSchema for consistency
5. **Proper Type Safety**: No type assertions, proper Request generics
6. **Cache Strategy**: Implementing proper caching at service level
7. **Error Handling**: Using ErrorFactory consistently
8. **No API Types in Services**: Services only use domain types

## Migration Checklist

- [ ] Create API schemas (public, admin, internal)
- [ ] Create service directory structure
- [ ] Implement domain types and interfaces
- [ ] Implement CategoryMapper with proper transformations
- [ ] Implement CategoryRepository with include support
- [ ] Implement CategoryService with business logic
- [ ] Implement all three controllers
- [ ] Create route definitions
- [ ] Create app.ts and server.ts
- [ ] Add environment variables
- [ ] Update nx configuration
- [ ] Register API schemas in documentation
- [ ] Create integration tests
- [ ] Test with API Gateway
- [ ] Verify all architectural rules are followed

This updated plan ensures the Category Service follows all architectural patterns and best practices established in the Pika platform.
