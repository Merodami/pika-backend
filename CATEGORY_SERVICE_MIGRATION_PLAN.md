# Category Service Migration Plan

## Analysis of Old Category Service

### 1. Service Structure and Architecture

The old Category service follows a CQRS pattern with:
- **Read side**: Separate controllers, use cases, repositories for queries
- **Write side**: Separate controllers, use cases, repositories for commands
- **Domain-Driven Design**: Rich domain entities with business logic
- **Clean Architecture**: Clear separation of concerns across layers

### 2. Core Features and Business Logic

**Entity Properties:**
- `id`: UUID primary key
- `name`: Multilingual text (JSON) supporting es/en/gn languages
- `description`: Multilingual text (JSON)
- `icon`: String for category icon (renamed from iconUrl)
- `parentId`: Self-referencing for hierarchy
- `isActive`: Boolean for soft enable/disable (renamed from active)
- `sortOrder`: Integer for ordering
- `createdAt`, `updatedAt`, `deletedAt`: Timestamps

**Business Rules:**
- Root categories have `parentId = null`
- Categories support hierarchical structure with parent-child relationships
- Categories must be active to be visible in public APIs
- Categories can have associated providers and vouchers

### 3. API Endpoints

**Public API:**
- `GET /categories` - List active categories with filters
- `GET /categories/:id` - Get single category

**Admin API:**
- `GET /admin/categories` - List all categories (including inactive)
- `GET /admin/categories/:id` - Get single category with full details
- `POST /admin/categories` - Create new category
- `PUT /admin/categories/:id` - Update category
- `DELETE /admin/categories/:id` - Delete category

**Internal API:**
- `GET /internal/categories/by-ids` - Batch fetch categories by IDs
- `GET /internal/categories/validate` - Validate category exists and is active

### 4. Migration Plan

## Phase 1: Project Setup

### Step 1: Create Service Structure
```bash
packages/services/category/
├── package.json
├── tsconfig.json
├── project.json
├── vitest.config.ts
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── server.ts
│   ├── controllers/
│   │   ├── CategoryController.ts
│   │   ├── AdminCategoryController.ts
│   │   └── InternalCategoryController.ts
│   ├── services/
│   │   └── CategoryService.ts
│   ├── repositories/
│   │   └── CategoryRepository.ts
│   ├── routes/
│   │   ├── CategoryRoutes.ts
│   │   ├── AdminCategoryRoutes.ts
│   │   └── InternalCategoryRoutes.ts
│   ├── mappers/
│   │   └── CategoryMapper.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── domain.ts
│   │   └── search.ts
│   └── utils/
│       └── categoryHelpers.ts
└── test/
    └── integration/
        ├── category.test.ts
        ├── admin-category.test.ts
        └── internal-category.test.ts
```

### Step 2: Package Configuration

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
    "build": "tsc",
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
    "express": "^4.21.2",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/express": "^5.0.1",
    "@types/node": "^22.10.6",
    "tsx": "^4.19.4",
    "typescript": "~5.8.3",
    "vitest": "^3.2.2"
  }
}
```

## Phase 2: API Schema Creation

### Step 1: Create Public API Schemas
Location: `/packages/api/src/public/schemas/category/index.ts`

```typescript
import { z } from 'zod'
import { paginationRequestSchema, paginationResponseSchema } from '../../common/schemas/pagination.js'
import { multilingualTextField } from '../../common/schemas/fields.js'

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
  updatedAt: z.string().datetime()
})

export const CategoryWithChildrenResponse = CategoryResponse.extend({
  children: z.array(CategoryResponse).optional()
})

export const CategoryListResponse = z.object({
  data: z.array(CategoryResponse),
  pagination: paginationResponseSchema
})

// Query parameters
export const CategoryQueryParams = paginationRequestSchema.extend({
  parentId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  includeChildren: z.coerce.boolean().optional()
})

export const CategoryByIdParams = z.object({
  id: z.string().uuid()
})

// Export types
export type CategoryResponse = z.infer<typeof CategoryResponse>
export type CategoryWithChildrenResponse = z.infer<typeof CategoryWithChildrenResponse>
export type CategoryListResponse = z.infer<typeof CategoryListResponse>
export type CategoryQueryParams = z.infer<typeof CategoryQueryParams>
```

### Step 2: Create Admin API Schemas
Location: `/packages/api/src/admin/schemas/category/index.ts`

```typescript
import { z } from 'zod'
import { multilingualTextField } from '../../../common/schemas/fields.js'
import { CategoryResponse, CategoryListResponse, CategoryQueryParams } from '../../../public/schemas/category/index.js'

// Request schemas
export const CreateCategoryRequest = z.object({
  name: multilingualTextField,
  description: multilingualTextField.optional(),
  icon: z.string().optional(),
  parentId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
})

export const UpdateCategoryRequest = CreateCategoryRequest.partial()

export const BulkUpdateCategoriesRequest = z.object({
  categories: z.array(z.object({
    id: z.string().uuid(),
    updates: UpdateCategoryRequest
  }))
})

// Reuse public schemas with admin extensions
export const AdminCategoryResponse = CategoryResponse.extend({
  deletedAt: z.string().datetime().nullable()
})

export const AdminCategoryListResponse = z.object({
  data: z.array(AdminCategoryResponse),
  pagination: paginationResponseSchema
})

// Admin-specific query params
export const AdminCategoryQueryParams = CategoryQueryParams.extend({
  includeDeleted: z.coerce.boolean().optional()
})

// Export types
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequest>
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequest>
export type AdminCategoryResponse = z.infer<typeof AdminCategoryResponse>
```

### Step 3: Create Internal API Schemas
Location: `/packages/api/src/internal/schemas/category/service.ts`

```typescript
import { z } from 'zod'
import { CategoryResponse } from '../../../public/schemas/category/index.js'

// Batch operations
export const GetCategoriesByIdsRequest = z.object({
  categoryIds: z.array(z.string().uuid()).min(1).max(100)
})

export const GetCategoriesByIdsResponse = z.object({
  categories: z.array(CategoryResponse)
})

// Validation
export const ValidateCategoryRequest = z.object({
  categoryId: z.string().uuid()
})

export const ValidateCategoryResponse = z.object({
  valid: z.boolean(),
  category: CategoryResponse.optional(),
  reason: z.string().optional()
})

// Hierarchy operations
export const GetCategoryHierarchyRequest = z.object({
  categoryId: z.string().uuid()
})

export const GetCategoryHierarchyResponse = z.object({
  hierarchy: z.array(CategoryResponse)
})

// Export types
export type GetCategoriesByIdsRequest = z.infer<typeof GetCategoriesByIdsRequest>
export type ValidateCategoryResponse = z.infer<typeof ValidateCategoryResponse>
```

## Phase 3: Core Implementation

### Step 1: Domain Types
Location: `/packages/services/category/src/types/domain.ts`

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
}

export interface CategoryWithChildren extends CategoryDomain {
  children?: CategoryDomain[]
}

export interface CategoryHierarchy {
  category: CategoryDomain
  ancestors: CategoryDomain[]
}
```

### Step 2: Search Parameters
Location: `/packages/services/category/src/types/search.ts`

```typescript
export interface CategorySearchParams {
  page?: number
  limit?: number
  parentId?: string
  isActive?: boolean
  search?: string
  includeChildren?: boolean
  includeDeleted?: boolean
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'sortOrder'
  sortOrder?: 'asc' | 'desc'
}

export interface CategoryFilters {
  parentId?: string
  isActive?: boolean
  search?: string
  includeDeleted?: boolean
}
```

### Step 3: Mapper Implementation
Location: `/packages/services/category/src/mappers/CategoryMapper.ts`

```typescript
import type { Category } from '@pika/database'
import type { 
  CategoryResponse, 
  CreateCategoryRequest,
  UpdateCategoryRequest 
} from '@pika/api'
import type { CategoryDomain, CategoryWithChildren } from '../types/domain.js'
import type { MultilingualText } from '@pika/types'

export class CategoryMapper {
  // Database to Domain
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
      deletedAt: dbCategory.deletedAt
    }
  }

  // Domain to API Response
  static toResponse(domain: CategoryDomain): CategoryResponse {
    return {
      id: domain.id,
      name: domain.name,
      description: domain.description,
      icon: domain.icon,
      parentId: domain.parentId,
      isActive: domain.isActive,
      sortOrder: domain.sortOrder,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString()
    }
  }

  // API Request to Domain (for create)
  static fromCreateRequest(request: CreateCategoryRequest): Omit<CategoryDomain, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
    return {
      name: request.name,
      description: request.description || null,
      icon: request.icon || null,
      parentId: request.parentId || null,
      isActive: request.isActive ?? true,
      sortOrder: request.sortOrder ?? 0
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

  // Domain with children to Response
  static toResponseWithChildren(domain: CategoryWithChildren): CategoryResponse & { children?: CategoryResponse[] } {
    const response = this.toResponse(domain)
    
    if (domain.children) {
      return {
        ...response,
        children: domain.children.map(child => this.toResponse(child))
      }
    }
    
    return response
  }

  // Array transformations
  static toDomainArray(dbCategories: Category[]): CategoryDomain[] {
    return dbCategories.map(cat => this.toDomain(cat))
  }

  static toResponseArray(domains: CategoryDomain[]): CategoryResponse[] {
    return domains.map(domain => this.toResponse(domain))
  }
}
```

### Step 4: Repository Implementation
Location: `/packages/services/category/src/repositories/CategoryRepository.ts`

```typescript
import type { PrismaClient, Prisma } from '@pika/database'
import type { ICacheService } from '@pika/redis'
import type { PaginatedResult } from '@pika/types'
import { ErrorFactory } from '@pika/shared'
import type { CategoryDomain } from '../types/domain.js'
import type { CategorySearchParams, CategoryFilters } from '../types/search.js'
import { CategoryMapper } from '../mappers/CategoryMapper.js'

export interface ICategoryRepository {
  findAll(params: CategorySearchParams): Promise<PaginatedResult<CategoryDomain>>
  findById(id: string): Promise<CategoryDomain | null>
  findByIds(ids: string[]): Promise<CategoryDomain[]>
  findByParentId(parentId: string | null): Promise<CategoryDomain[]>
  create(data: Omit<CategoryDomain, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<CategoryDomain>
  update(id: string, data: Partial<CategoryDomain>): Promise<CategoryDomain>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
  hasChildren(id: string): Promise<boolean>
  getAncestors(id: string): Promise<CategoryDomain[]>
}

export class CategoryRepository implements ICategoryRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService
  ) {}

  async findAll(params: CategorySearchParams): Promise<PaginatedResult<CategoryDomain>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
      ...filters
    } = params

    const where = this.buildWhereClause(filters)
    const orderBy = this.buildOrderBy(sortBy, sortOrder)

    // Get total count
    const total = await this.prisma.category.count({ where })

    // Get paginated data
    const categories = await this.prisma.category.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    })

    const data = CategoryMapper.toDomainArray(categories)

    // Include children if requested
    if (params.includeChildren) {
      const categoriesWithChildren = await Promise.all(
        data.map(async (category) => {
          const children = await this.findByParentId(category.id)
          return { ...category, children }
        })
      )
      
      return {
        data: categoriesWithChildren,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async findById(id: string): Promise<CategoryDomain | null> {
    const category = await this.prisma.category.findUnique({
      where: { id }
    })

    return category ? CategoryMapper.toDomain(category) : null
  }

  async findByIds(ids: string[]): Promise<CategoryDomain[]> {
    const categories = await this.prisma.category.findMany({
      where: { id: { in: ids } }
    })

    return CategoryMapper.toDomainArray(categories)
  }

  async findByParentId(parentId: string | null): Promise<CategoryDomain[]> {
    const categories = await this.prisma.category.findMany({
      where: { parentId },
      orderBy: { sortOrder: 'asc' }
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
          sortOrder: data.sortOrder
        }
      })

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
      const { id: _, createdAt, updatedAt, deletedAt, ...updateData } = data

      const category = await this.prisma.category.update({
        where: { id },
        data: updateData
      })

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
        data: { deletedAt: new Date() }
      })
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
      where: { id, deletedAt: null }
    })
    return count > 0
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await this.prisma.category.count({
      where: { parentId: id, deletedAt: null }
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

    if (filters.search) {
      where.OR = [
        {
          name: {
            path: ['en'],
            string_contains: filters.search
          }
        },
        {
          name: {
            path: ['es'],
            string_contains: filters.search
          }
        },
        {
          name: {
            path: ['gn'],
            string_contains: filters.search
          }
        }
      ]
    }

    return where
  }

  private buildOrderBy(
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Prisma.CategoryOrderByWithRelationInput {
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
}
```

### Step 5: Service Implementation
Location: `/packages/services/category/src/services/CategoryService.ts`

```typescript
import type { ICategoryRepository } from '../repositories/CategoryRepository.js'
import type { ICacheService } from '@pika/redis'
import type { PaginatedResult } from '@pika/types'
import { ErrorFactory } from '@pika/shared'
import type { CategoryDomain, CategoryWithChildren, CategoryHierarchy } from '../types/domain.js'
import type { CategorySearchParams } from '../types/search.js'

export interface ICategoryService {
  getCategories(params: CategorySearchParams): Promise<PaginatedResult<CategoryDomain>>
  getCategoryById(id: string, includeChildren?: boolean): Promise<CategoryDomain | null>
  getCategoriesByIds(ids: string[]): Promise<CategoryDomain[]>
  createCategory(data: Omit<CategoryDomain, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<CategoryDomain>
  updateCategory(id: string, data: Partial<CategoryDomain>): Promise<CategoryDomain>
  deleteCategory(id: string): Promise<void>
  validateCategory(id: string): Promise<{ valid: boolean; reason?: string }>
  getCategoryHierarchy(id: string): Promise<CategoryHierarchy>
}

export class CategoryService implements ICategoryService {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly cacheService: ICacheService
  ) {}

  async getCategories(params: CategorySearchParams): Promise<PaginatedResult<CategoryDomain>> {
    // Add default filters for public access
    const publicParams = {
      ...params,
      isActive: params.isActive ?? true,
      includeDeleted: false
    }

    return this.categoryRepository.findAll(publicParams)
  }

  async getCategoryById(id: string, includeChildren = false): Promise<CategoryDomain | null> {
    const category = await this.categoryRepository.findById(id)
    
    if (!category) {
      return null
    }

    if (includeChildren) {
      const children = await this.categoryRepository.findByParentId(id)
      return { ...category, children }
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

    return this.categoryRepository.findByIds(ids)
  }

  async createCategory(
    data: Omit<CategoryDomain, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Promise<CategoryDomain> {
    // Validate parent category if provided
    if (data.parentId) {
      const parentExists = await this.categoryRepository.exists(data.parentId)
      if (!parentExists) {
        throw ErrorFactory.badRequest('Parent category not found')
      }

      // Check for circular reference
      if (data.parentId === data.id) {
        throw ErrorFactory.badRequest('Category cannot be its own parent')
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
        if (parentAncestors.some(ancestor => ancestor.id === id)) {
          throw ErrorFactory.badRequest('This change would create a circular hierarchy')
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
      throw ErrorFactory.conflict(
        'Cannot delete category with child categories',
        'Delete or reassign child categories first'
      )
    }

    // TODO: Check if category has associated providers or vouchers
    // This would require service client calls to provider and voucher services

    await this.categoryRepository.delete(id)
  }

  async validateCategory(id: string): Promise<{ valid: boolean; reason?: string }> {
    const category = await this.categoryRepository.findById(id)
    
    if (!category) {
      return { valid: false, reason: 'Category not found' }
    }

    if (!category.isActive) {
      return { valid: false, reason: 'Category is not active' }
    }

    if (category.deletedAt) {
      return { valid: false, reason: 'Category has been deleted' }
    }

    return { valid: true }
  }

  async getCategoryHierarchy(id: string): Promise<CategoryHierarchy> {
    const category = await this.categoryRepository.findById(id)
    if (!category) {
      throw ErrorFactory.notFound('Category', id)
    }

    const ancestors = await this.categoryRepository.getAncestors(id)
    
    return {
      category,
      ancestors: ancestors.slice(0, -1) // Remove the category itself from ancestors
    }
  }

  private validateMultilingualText(text: any, fieldName: string): void {
    if (!text || typeof text !== 'object') {
      throw ErrorFactory.badRequest(`${fieldName} must be a multilingual text object`)
    }

    const languages = ['en', 'es', 'gn']
    const hasAtLeastOneLanguage = languages.some(lang => text[lang] && typeof text[lang] === 'string')
    
    if (!hasAtLeastOneLanguage) {
      throw ErrorFactory.badRequest(
        `${fieldName} must have at least one language (en, es, or gn)`
      )
    }
  }
}
```

### Step 6: Controller Implementations

**CategoryController.ts:**
```typescript
import type { Request, Response, NextFunction } from 'express'
import type { ICategoryService } from '../services/CategoryService.js'
import type { CategoryQueryParams, CategoryByIdParams } from '@pika/api/public'
import { CategoryMapper } from '../mappers/CategoryMapper.js'

export class CategoryController {
  constructor(private readonly categoryService: ICategoryService) {
    // Bind methods to preserve context
    this.getCategories = this.getCategories.bind(this)
    this.getCategoryById = this.getCategoryById.bind(this)
  }

  async getCategories(
    request: Request<{}, {}, {}, CategoryQueryParams>,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = {
        page: request.query.page || 1,
        limit: request.query.limit || 20,
        parentId: request.query.parentId,
        isActive: request.query.isActive,
        search: request.query.search,
        includeChildren: request.query.includeChildren
      }

      const result = await this.categoryService.getCategories(params)
      
      const dtoResult = {
        data: result.data.map(CategoryMapper.toResponse),
        pagination: result.pagination
      }

      response.json(dtoResult)
    } catch (error) {
      next(error)
    }
  }

  async getCategoryById(
    request: Request<CategoryByIdParams>,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = request.params
      const includeChildren = request.query.includeChildren === 'true'

      const category = await this.categoryService.getCategoryById(id, includeChildren)
      
      if (!category) {
        return next(ErrorFactory.notFound('Category', id))
      }

      const dto = includeChildren && 'children' in category
        ? CategoryMapper.toResponseWithChildren(category as CategoryWithChildren)
        : CategoryMapper.toResponse(category)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }
}
```

**AdminCategoryController.ts:**
```typescript
import type { Request, Response, NextFunction } from 'express'
import type { ICategoryService } from '../services/CategoryService.js'
import type { 
  CreateCategoryRequest, 
  UpdateCategoryRequest,
  AdminCategoryQueryParams,
  CategoryByIdParams
} from '@pika/api/admin'
import { CategoryMapper } from '../mappers/CategoryMapper.js'
import { ErrorFactory } from '@pika/shared'

export class AdminCategoryController {
  constructor(private readonly categoryService: ICategoryService) {
    this.getCategories = this.getCategories.bind(this)
    this.getCategoryById = this.getCategoryById.bind(this)
    this.createCategory = this.createCategory.bind(this)
    this.updateCategory = this.updateCategory.bind(this)
    this.deleteCategory = this.deleteCategory.bind(this)
  }

  async getCategories(
    request: Request<{}, {}, {}, AdminCategoryQueryParams>,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const params = {
        page: request.query.page || 1,
        limit: request.query.limit || 20,
        parentId: request.query.parentId,
        isActive: request.query.isActive,
        search: request.query.search,
        includeChildren: request.query.includeChildren,
        includeDeleted: request.query.includeDeleted
      }

      const result = await this.categoryService.getCategories(params)
      
      const dtoResult = {
        data: result.data.map(CategoryMapper.toResponse),
        pagination: result.pagination
      }

      response.json(dtoResult)
    } catch (error) {
      next(error)
    }
  }

  async getCategoryById(
    request: Request<CategoryByIdParams>,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = request.params
      const category = await this.categoryService.getCategoryById(id, true)
      
      if (!category) {
        return next(ErrorFactory.notFound('Category', id))
      }

      response.json(CategoryMapper.toResponse(category))
    } catch (error) {
      next(error)
    }
  }

  async createCategory(
    request: Request<{}, {}, CreateCategoryRequest>,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categoryData = CategoryMapper.fromCreateRequest(request.body)
      const category = await this.categoryService.createCategory(categoryData)
      
      response.status(201).json(CategoryMapper.toResponse(category))
    } catch (error) {
      next(error)
    }
  }

  async updateCategory(
    request: Request<CategoryByIdParams, {}, UpdateCategoryRequest>,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = request.params
      const updates = CategoryMapper.fromUpdateRequest(request.body)
      
      const category = await this.categoryService.updateCategory(id, updates)
      
      response.json(CategoryMapper.toResponse(category))
    } catch (error) {
      next(error)
    }
  }

  async deleteCategory(
    request: Request<CategoryByIdParams>,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = request.params
      
      await this.categoryService.deleteCategory(id)
      
      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
```

**InternalCategoryController.ts:**
```typescript
import type { Request, Response, NextFunction } from 'express'
import type { ICategoryService } from '../services/CategoryService.js'
import type { 
  GetCategoriesByIdsRequest,
  ValidateCategoryRequest,
  GetCategoryHierarchyRequest 
} from '@pika/api/internal'
import { CategoryMapper } from '../mappers/CategoryMapper.js'

export class InternalCategoryController {
  constructor(private readonly categoryService: ICategoryService) {
    this.getCategoriesByIds = this.getCategoriesByIds.bind(this)
    this.validateCategory = this.validateCategory.bind(this)
    this.getCategoryHierarchy = this.getCategoryHierarchy.bind(this)
  }

  async getCategoriesByIds(
    request: Request<{}, {}, GetCategoriesByIdsRequest>,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { categoryIds } = request.body
      
      const categories = await this.categoryService.getCategoriesByIds(categoryIds)
      
      response.json({
        categories: CategoryMapper.toResponseArray(categories)
      })
    } catch (error) {
      next(error)
    }
  }

  async validateCategory(
    request: Request<{}, {}, ValidateCategoryRequest>,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { categoryId } = request.body
      
      const validation = await this.categoryService.validateCategory(categoryId)
      const category = validation.valid 
        ? await this.categoryService.getCategoryById(categoryId)
        : null
      
      response.json({
        valid: validation.valid,
        category: category ? CategoryMapper.toResponse(category) : undefined,
        reason: validation.reason
      })
    } catch (error) {
      next(error)
    }
  }

  async getCategoryHierarchy(
    request: Request<{}, {}, GetCategoryHierarchyRequest>,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { categoryId } = request.body
      
      const hierarchy = await this.categoryService.getCategoryHierarchy(categoryId)
      
      response.json({
        hierarchy: CategoryMapper.toResponseArray(hierarchy.ancestors.concat(hierarchy.category))
      })
    } catch (error) {
      next(error)
    }
  }
}
```

## Phase 4: Route Setup and Server Configuration

### Step 1: Route Definitions

**CategoryRoutes.ts:**
```typescript
import { Router } from 'express'
import type { CategoryController } from '../controllers/CategoryController.js'
import { validateQuery, validateParams } from '@pika/shared'
import { CategoryQueryParams, CategoryByIdParams } from '@pika/api/public'

export function createCategoryRoutes(
  categoryController: CategoryController
): Router {
  const router = Router()

  router.get(
    '/',
    validateQuery(CategoryQueryParams),
    categoryController.getCategories
  )

  router.get(
    '/:id',
    validateParams(CategoryByIdParams),
    categoryController.getCategoryById
  )

  return router
}
```

**AdminCategoryRoutes.ts:**
```typescript
import { Router } from 'express'
import type { AdminCategoryController } from '../controllers/AdminCategoryController.js'
import { validateQuery, validateParams, validateBody, requireAdmin } from '@pika/shared'
import { 
  AdminCategoryQueryParams, 
  CategoryByIdParams,
  CreateCategoryRequest,
  UpdateCategoryRequest 
} from '@pika/api/admin'

export function createAdminCategoryRoutes(
  adminCategoryController: AdminCategoryController
): Router {
  const router = Router()

  // All admin routes require admin authentication
  router.use(requireAdmin())

  router.get(
    '/',
    validateQuery(AdminCategoryQueryParams),
    adminCategoryController.getCategories
  )

  router.get(
    '/:id',
    validateParams(CategoryByIdParams),
    adminCategoryController.getCategoryById
  )

  router.post(
    '/',
    validateBody(CreateCategoryRequest),
    adminCategoryController.createCategory
  )

  router.put(
    '/:id',
    validateParams(CategoryByIdParams),
    validateBody(UpdateCategoryRequest),
    adminCategoryController.updateCategory
  )

  router.delete(
    '/:id',
    validateParams(CategoryByIdParams),
    adminCategoryController.deleteCategory
  )

  return router
}
```

**InternalCategoryRoutes.ts:**
```typescript
import { Router } from 'express'
import type { InternalCategoryController } from '../controllers/InternalCategoryController.js'
import { validateBody } from '@pika/shared'
import { 
  GetCategoriesByIdsRequest,
  ValidateCategoryRequest,
  GetCategoryHierarchyRequest 
} from '@pika/api/internal'

export function createInternalCategoryRoutes(
  internalCategoryController: InternalCategoryController
): Router {
  const router = Router()

  router.post(
    '/by-ids',
    validateBody(GetCategoriesByIdsRequest),
    internalCategoryController.getCategoriesByIds
  )

  router.post(
    '/validate',
    validateBody(ValidateCategoryRequest),
    internalCategoryController.validateCategory
  )

  router.post(
    '/hierarchy',
    validateBody(GetCategoryHierarchyRequest),
    internalCategoryController.getCategoryHierarchy
  )

  return router
}
```

### Step 2: App Configuration

**app.ts:**
```typescript
import type { PrismaClient } from '@pika/database'
import type { ICacheService } from '@pika/redis'
import { createExpressServer } from '@pika/http'
import { ErrorFactory } from '@pika/shared'
import { CategoryRepository } from './repositories/CategoryRepository.js'
import { CategoryService } from './services/CategoryService.js'
import { CategoryController } from './controllers/CategoryController.js'
import { AdminCategoryController } from './controllers/AdminCategoryController.js'
import { InternalCategoryController } from './controllers/InternalCategoryController.js'
import { createCategoryRoutes } from './routes/CategoryRoutes.js'
import { createAdminCategoryRoutes } from './routes/AdminCategoryRoutes.js'
import { createInternalCategoryRoutes } from './routes/InternalCategoryRoutes.js'

export interface CategoryServerDependencies {
  prisma: PrismaClient
  cacheService: ICacheService
}

export async function createCategoryServer(dependencies: CategoryServerDependencies) {
  const { prisma, cacheService } = dependencies

  // Create service instances
  const categoryRepository = new CategoryRepository(prisma, cacheService)
  const categoryService = new CategoryService(categoryRepository, cacheService)
  
  // Create controllers
  const categoryController = new CategoryController(categoryService)
  const adminCategoryController = new AdminCategoryController(categoryService)
  const internalCategoryController = new InternalCategoryController(categoryService)

  // Create Express app
  const app = await createExpressServer({
    serviceName: 'category',
    dependencies,
    authOptions: {
      enabled: true,
      excludePaths: [
        '/health',
        '/metrics',
        '/categories' // Public category listing doesn't require auth
      ]
    },
    cacheOptions: {
      enabled: true,
      defaultTTL: 3600
    },
    idempotencyOptions: {
      enabled: true,
      methods: ['POST', 'PUT', 'PATCH'],
      excludeRoutes: ['/health', '/metrics']
    }
  })

  // Register routes
  app.use('/categories', createCategoryRoutes(categoryController))
  app.use('/admin/categories', createAdminCategoryRoutes(adminCategoryController))
  app.use('/internal/categories', createInternalCategoryRoutes(internalCategoryController))

  return app
}
```

**server.ts:**
```typescript
import { createPrismaClient } from '@pika/database'
import { createCacheService } from '@pika/redis'
import { getServiceConfig } from '@pika/environment'
import { logger } from '@pika/shared'
import { createCategoryServer } from './app.js'

export async function startCategoryServer() {
  try {
    // Get service configuration
    const config = getServiceConfig('category')

    // Initialize dependencies
    const prisma = createPrismaClient()
    const cacheService = createCacheService({
      keyPrefix: 'category:',
      defaultTTL: 3600
    })

    // Create and start server
    const app = await createCategoryServer({ prisma, cacheService })
    
    const server = app.listen(config.port, () => {
      logger.info(`Category service started on port ${config.port}`)
    })

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully')
      server.close(() => {
        prisma.$disconnect()
        cacheService.disconnect()
        process.exit(0)
      })
    })

    return server
  } catch (error) {
    logger.error('Failed to start category service', error)
    process.exit(1)
  }
}
```

**index.ts:**
```typescript
import { startCategoryServer } from './server.js'

// Start the server
startCategoryServer().catch((error) => {
  console.error('Failed to start category service:', error)
  process.exit(1)
})

// Export types and interfaces for other services
export type { ICategoryService } from './services/CategoryService.js'
export type { ICategoryRepository } from './repositories/CategoryRepository.js'
export type { CategoryDomain, CategoryWithChildren, CategoryHierarchy } from './types/domain.js'
export type { CategorySearchParams, CategoryFilters } from './types/search.js'
```

## Phase 5: Testing

### Integration Test Example
Location: `/packages/services/category/test/integration/category.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import supertest from 'supertest'
import type { Application } from 'express'
import { createTestDatabase, createTestUser } from '@pika/tests'
import { MemoryCacheService } from '@pika/redis'
import { createCategoryServer } from '../../src/app.js'

describe('Category Service Integration Tests', () => {
  let app: Application
  let testDb: any
  let authToken: string

  beforeEach(async () => {
    testDb = await createTestDatabase()
    const cacheService = new MemoryCacheService()
    
    const server = await createCategoryServer({
      prisma: testDb.prisma,
      cacheService
    })
    
    app = server
    
    // Create test user and get auth token
    const { token } = await createTestUser(testDb.prisma)
    authToken = token
  })

  afterEach(async () => {
    await testDb.cleanup()
  })

  describe('GET /categories', () => {
    it('should return paginated categories', async () => {
      // Create test categories
      await testDb.prisma.category.createMany({
        data: [
          {
            name: { en: 'Food', es: 'Comida' },
            description: { en: 'Food category' },
            isActive: true,
            sortOrder: 1
          },
          {
            name: { en: 'Technology', es: 'Tecnología' },
            description: { en: 'Tech category' },
            isActive: true,
            sortOrder: 2
          }
        ]
      })

      const response = await supertest(app)
        .get('/categories')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data).toHaveLength(2)
      expect(response.body.pagination.total).toBe(2)
    })

    it('should filter by parentId', async () => {
      const parent = await testDb.prisma.category.create({
        data: {
          name: { en: 'Parent' },
          isActive: true
        }
      })

      await testDb.prisma.category.create({
        data: {
          name: { en: 'Child' },
          parentId: parent.id,
          isActive: true
        }
      })

      const response = await supertest(app)
        .get('/categories')
        .query({ parentId: parent.id })
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].name.en).toBe('Child')
    })

    it('should include children when requested', async () => {
      const parent = await testDb.prisma.category.create({
        data: {
          name: { en: 'Parent' },
          isActive: true
        }
      })

      await testDb.prisma.category.create({
        data: {
          name: { en: 'Child' },
          parentId: parent.id,
          isActive: true
        }
      })

      const response = await supertest(app)
        .get(`/categories/${parent.id}`)
        .query({ includeChildren: true })
        .expect(200)

      expect(response.body.children).toBeDefined()
      expect(response.body.children).toHaveLength(1)
    })
  })

  describe('POST /admin/categories', () => {
    it('should create a new category', async () => {
      const categoryData = {
        name: { en: 'New Category', es: 'Nueva Categoría' },
        description: { en: 'Test description' },
        isActive: true,
        sortOrder: 1
      }

      const response = await supertest(app)
        .post('/admin/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.name).toEqual(categoryData.name)
      expect(response.body.description).toEqual(categoryData.description)
    })

    it('should validate parent category exists', async () => {
      const categoryData = {
        name: { en: 'Child Category' },
        parentId: '00000000-0000-0000-0000-000000000000'
      }

      await supertest(app)
        .post('/admin/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(400)
    })
  })

  describe('PUT /admin/categories/:id', () => {
    it('should update an existing category', async () => {
      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'Original' },
          isActive: true
        }
      })

      const updates = {
        name: { en: 'Updated', es: 'Actualizado' }
      }

      const response = await supertest(app)
        .put(`/admin/categories/${category.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200)

      expect(response.body.name).toEqual(updates.name)
    })

    it('should prevent circular hierarchy', async () => {
      const parent = await testDb.prisma.category.create({
        data: { name: { en: 'Parent' } }
      })

      const child = await testDb.prisma.category.create({
        data: { 
          name: { en: 'Child' },
          parentId: parent.id
        }
      })

      // Try to make parent a child of its own child
      await supertest(app)
        .put(`/admin/categories/${parent.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ parentId: child.id })
        .expect(400)
    })
  })

  describe('DELETE /admin/categories/:id', () => {
    it('should soft delete a category', async () => {
      const category = await testDb.prisma.category.create({
        data: { name: { en: 'To Delete' } }
      })

      await supertest(app)
        .delete(`/admin/categories/${category.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204)

      // Verify soft delete
      const deleted = await testDb.prisma.category.findUnique({
        where: { id: category.id }
      })
      
      expect(deleted?.deletedAt).not.toBeNull()
    })

    it('should prevent deletion of categories with children', async () => {
      const parent = await testDb.prisma.category.create({
        data: { name: { en: 'Parent' } }
      })

      await testDb.prisma.category.create({
        data: { 
          name: { en: 'Child' },
          parentId: parent.id
        }
      })

      await supertest(app)
        .delete(`/admin/categories/${parent.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409)
    })
  })
})
```

## Phase 6: Project Configuration

### NX Project Configuration
Location: `/packages/services/category/project.json`

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

### Environment Configuration
Add to `/packages/environment/src/constants/service.ts`:

```typescript
export const SERVICE_PORTS = {
  // ... existing ports
  category: parseInt(process.env.CATEGORY_SERVICE_PORT || '5025', 10),
} as const
```

## Migration Execution Steps

1. **Create service structure** - Set up all directories and files
2. **Install dependencies** - Ensure all packages are available
3. **Create API schemas** - Define Zod schemas for all API tiers
4. **Implement core logic** - Repository, Service, Controllers
5. **Set up routes** - Configure Express routes
6. **Create tests** - Write integration tests
7. **Register in API docs** - Update API documentation generators
8. **Update gateway** - Add category service to API gateway routes
9. **Test end-to-end** - Verify service works with full stack

## Success Metrics

- [ ] Service builds without TypeScript errors
- [ ] All integration tests pass
- [ ] API documentation includes all endpoints
- [ ] Service integrates with API gateway
- [ ] Multilingual support works correctly
- [ ] Hierarchical categories function properly
- [ ] Admin operations require authentication
- [ ] Public endpoints return only active categories
- [ ] Performance is acceptable (sub-100ms responses)
- [ ] Error handling follows platform standards

## Additional Notes

1. The Category service is foundational - other services depend on it
2. Maintain backward compatibility during migration
3. Preserve all business logic from old implementation
4. Follow the new architecture patterns exactly
5. Use proper error handling and logging throughout
6. Implement comprehensive tests for all functionality
7. Document any deviations or issues encountered

This completes the comprehensive migration plan for the Category Service.