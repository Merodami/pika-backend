/**
 * Domain interfaces for Category service
 */

// ============= Repository Interfaces =============

/**
 * Category repository interface
 */
export interface ICategoryRepository {
  /**
   * Get all categories with optional filtering and pagination
   */
  findAll(params: CategorySearchParams): Promise<PaginatedResult<Category>>

  /**
   * Get category by ID
   */
  findById(id: string): Promise<Category | null>

  /**
   * Get multiple categories by IDs
   */
  findByIds(ids: string[]): Promise<Category[]>

  /**
   * Create new category
   */
  create(data: CreateCategoryData): Promise<Category>

  /**
   * Update category by ID
   */
  update(id: string, data: UpdateCategoryData): Promise<Category>

  /**
   * Delete category by ID
   */
  delete(id: string): Promise<void>

  /**
   * Check if category exists
   */
  exists(id: string): Promise<boolean>

  /**
   * Get category hierarchy (children)
   */
  getHierarchy(rootId?: string): Promise<Category[]>

  /**
   * Get category path (breadcrumb)
   */
  getPath(id: string): Promise<Category[]>
}

// ============= Service Interfaces =============

/**
 * Category service interface
 */
export interface ICategoryService {
  /**
   * Get all categories
   */
  getAll(params: CategorySearchParams): Promise<PaginatedResult<Category>>

  /**
   * Get category by ID
   */
  getById(id: string): Promise<Category>

  /**
   * Get multiple categories by IDs
   */
  getByIds(ids: string[]): Promise<Category[]>

  /**
   * Create new category
   */
  create(data: CreateCategoryData): Promise<Category>

  /**
   * Update category
   */
  update(id: string, data: UpdateCategoryData): Promise<Category>

  /**
   * Delete category
   */
  delete(id: string): Promise<void>

  /**
   * Check if category exists and is active
   */
  exists(id: string): Promise<boolean>

  /**
   * Get category hierarchy
   */
  getHierarchy(rootId?: string): Promise<Category[]>

  /**
   * Get category path (breadcrumb)
   */
  getPath(id: string): Promise<Category[]>

  /**
   * Validate category IDs
   */
  validateIds(ids: string[]): Promise<ValidationResult>
}

// ============= Domain Types =============

/**
 * Category domain entity
 */
export interface Category {
  id: string
  nameKey: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive: boolean
  sortOrder: number
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt: Date
  children?: Category[]
}

/**
 * Category search parameters
 */
export interface CategorySearchParams {
  search?: string
  parentId?: string
  isActive?: boolean
  createdBy?: string
  page?: number
  limit?: number
  sortBy?: 'NAME' | 'SORT_ORDER' | 'CREATED_AT' | 'UPDATED_AT'
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Create category data
 */
export interface CreateCategoryData {
  nameKey: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive?: boolean
  sortOrder?: number
  createdBy: string
}

/**
 * Update category data
 */
export interface UpdateCategoryData {
  nameKey?: string
  descriptionKey?: string
  icon?: string
  parentId?: string
  isActive?: boolean
  sortOrder?: number
  updatedBy?: string
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

/**
 * Category validation result
 */
export interface ValidationResult {
  valid: string[]
  invalid: string[]
  categories: Category[]
}