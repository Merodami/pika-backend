import { type CategoryCreateDTO } from '@category-write/domain/dtos/CategoryDTO.js'
import { Category } from '@category-write/domain/entities/Category.js'
import { type CategoryWriteRepositoryPort } from '@category-write/domain/port/category/CategoryWriteRepositoryPort.js'
import { CategoryDocument, CategoryMapper } from '@pika/sdk'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import { Prisma, type PrismaClient } from '@prisma/client'

/**
 * Prisma implementation of the CategoryWriteRepository
 * Handles persistence and data mapping to/from the database
 */
export class PrismaCategoryWriteRepository
  implements CategoryWriteRepositoryPort
{
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Calculates hierarchy metadata (level and path) for a category
   * based on its parent, if any
   * @private
   */
  private async calculateHierarchyMetadata(
    parentId: string | null | undefined,
  ): Promise<{ level: number; path: string }> {
    // Default values for root categories (level 1, path '/')
    let level = 1
    let path = '/'

    // If this is a child category, fetch the parent information
    if (parentId) {
      logger.debug(
        'Calculating hierarchy metadata for child with parentId:',
        parentId,
      )

      const parent = await this.prisma.category.findUnique({
        where: { id: parentId },
      })

      if (!parent) {
        throw ErrorFactory.validationError(
          { parentId: ['Parent category does not exist'] },
          {
            source: 'PrismaCategoryWriteRepository.calculateHierarchyMetadata',
          },
        )
      }

      // Set child level based on parent level
      level = parent.level + 1
      // Set child path based on parent path
      path = `${parent.path}${parentId}/`

      logger.debug('Calculated hierarchy metadata:', {
        parentId,
        parentLevel: parent.level,
        childLevel: level,
        childPath: path,
      })
    }

    return { level, path }
  }

  /**
   * Updates the path and level for all child categories recursively
   * when a parent's path or level changes
   * @private
   */
  private async updateChildrenHierarchy(
    categoryId: string,
    parentLevel: number,
    parentPath: string,
  ): Promise<void> {
    // Check if there are child categories that will need hierarchy updates
    const childCount = await this.prisma.category.count({
      where: { parentId: categoryId },
    })

    // Find all direct children of this category if any exist
    const children =
      childCount > 0
        ? await this.prisma.category.findMany({
            where: { parentId: categoryId },
          })
        : []

    if (children.length === 0) {
      logger.debug('No children to update for category:', categoryId)

      return
    }

    logger.debug(
      `Updating hierarchy for ${children.length} children of category:`,
      categoryId,
    )

    // Update each child's level and path
    for (const child of children) {
      // Calculate new level and path for this child
      const childLevel = parentLevel + 1
      const childPath = `${parentPath}${categoryId}/`

      logger.debug('Updating child hierarchy:', {
        childId: child.id,
        oldLevel: child.level,
        newLevel: childLevel,
        oldPath: child.path,
        newPath: childPath,
      })

      // Update this child
      await this.prisma.category.update({
        where: { id: child.id },
        data: {
          level: childLevel,
          path: childPath,
        },
      })

      // Recursively update this child's children
      await this.updateChildrenHierarchy(child.id, childLevel, childPath)
    }
  }

  /**
   * Creates a new category in the database
   */
  async createCategory(dto: CategoryCreateDTO): Promise<Category> {
    try {
      // Prepare data for database using SDK mapper to ensure proper formatting
      logger.debug('dto', { dto })

      // Calculate hierarchy metadata (level and path) based on parent, if any
      const { level, path } = await this.calculateHierarchyMetadata(
        dto.parentId,
      )

      const createData = {
        name: CategoryMapper.ensureMultilingualText(dto.name) as any,
        description: CategoryMapper.ensureMultilingualText(
          dto.description,
        ) as any,
        iconUrl: dto.iconUrl,
        slug: dto.slug,
        parentId: dto.parentId,
        level: level,
        path: path,
        active: dto.active ?? true,
        sortOrder: dto.sortOrder ?? 0,
      }

      logger.debug('Final createData for Prisma:', createData)

      // Create the category in the database
      const created = await this.prisma.category.create({
        data: createData,
      })

      logger.debug('Category created in database:', {
        id: created.id,
        parentId: created.parentId,
        level: created.level,
        path: created.path,
      })

      // Verify the record actually exists with correct values
      const verifyCreated = await this.prisma.category.findUnique({
        where: { id: created.id },
      })

      logger.debug('Verification after creation:', {
        id: verifyCreated?.id,
        parentId: verifyCreated?.parentId,
        level: verifyCreated?.level,
        path: verifyCreated?.path,
      })

      return this.mapToDomainEntity(created)
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (error.code === 'P2002') {
          // Extract the field name from the error
          const metaTarget = error.meta?.target as string[] | undefined
          const field =
            metaTarget && metaTarget.length > 0 ? metaTarget[0] : 'slug'
          const value = (dto[field as keyof typeof dto] as string) || 'unknown'

          throw ErrorFactory.uniqueConstraintViolation(
            'Category',
            field,
            typeof value === 'string' ? value : JSON.stringify(value),
            {
              source: 'PrismaCategoryWriteRepository.createCategory',
            },
          )
        }

        // Foreign key constraint failure
        if (error.code === 'P2003') {
          // This is a true validation error as the client provided an invalid parent ID
          throw ErrorFactory.validationError(
            { parentId: ['Parent category does not exist'] },
            {
              source: 'PrismaCategoryWriteRepository.createCategory',
            },
          )
        }
      }

      // Handle other database errors
      throw ErrorFactory.databaseError(
        'create_category',
        'Failed to create category',
        error,
        {
          source: 'PrismaCategoryWriteRepository.createCategory',
          metadata: {
            slug: dto.slug,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  /**
   * Updates an existing category in the database
   */
  async updateCategory(
    id: string,
    dto: Partial<CategoryDocument>,
  ): Promise<Category> {
    try {
      // Check if the category exists
      const exists = await this.prisma.category.count({ where: { id } })

      if (exists === 0) {
        logger.debug('Category not found for update:', id)
        throw ErrorFactory.resourceNotFound('Category', id, {
          source: 'PrismaCategoryWriteRepository.updateCategory',
          httpStatus: 404,
        })
      }

      const raw = await this.prisma.category.findUnique({ where: { id } })

      logger.debug('dto', { dto })
      logger.debug('raw', { raw })

      // This should not happen since we already checked for existence
      if (!raw) {
        throw ErrorFactory.resourceNotFound('Category', id, {
          source: 'PrismaCategoryWriteRepository.updateCategory',
          httpStatus: 404,
        })
      }

      // Validate that category is not being set as its own parent
      if (dto.parentId === id) {
        const validationError = ErrorFactory.validationError(
          { parentId: ['A category cannot be its own parent'] },
          {
            source: 'PrismaCategoryWriteRepository.updateCategory',
            suggestion:
              'Select a different parent category or set to null for a root category',
            httpStatus: 400, // Explicitly set HTTP status to 400
          },
        )

        // Make this error distinct from other errors so it's properly handled in the catch block
        throw validationError
      }

      const domain = Category.reconstitute(
        id,
        raw as unknown as CategoryDocument,
        raw.createdAt,
        raw.updatedAt,
      )

      logger.debug('domain before update', { domain })

      // Check if parent is changing
      const isParentChanging =
        dto.parentId !== undefined && dto.parentId !== domain.parentId

      // Cache original parentId for later comparison
      const originalParentId = domain.parentId

      // 2) apply your partial changes
      domain.update(dto)

      logger.debug('domain after update', { domain })

      // 3) build a clean Prisma update payload
      const updateData: Prisma.CategoryUpdateInput = {}

      // multilingual JSONB columns
      updateData.name = domain.name.toObject() as any
      updateData.description = domain.description.toObject() as any

      // scalar columns
      if (domain.iconUrl !== undefined) {
        updateData.iconUrl = domain.iconUrl
      }

      updateData.slug = domain.slug
      updateData.active = domain.active
      updateData.sortOrder = domain.sortOrder

      // Calculate new hierarchy metadata if parent is changing
      if (isParentChanging) {
        logger.debug('Parent is changing from', {
          originalParentId,
          newParentId: domain.parentId,
        })

        const { level, path } = await this.calculateHierarchyMetadata(
          domain.parentId,
        )

        // Update level and path in the update payload
        updateData.level = level
        updateData.path = path

        logger.debug('Updated hierarchy metadata', { level, path })

        // Handle the parent relationship in Prisma
        updateData.parent = domain.parentId
          ? { connect: { id: domain.parentId } }
          : { disconnect: true }
      } else if (domain.parentId !== undefined) {
        // Parent isn't changing but was included in the update
        updateData.parent = domain.parentId
          ? { connect: { id: domain.parentId } }
          : { disconnect: true }
      }

      // 4) persist
      const updated = await this.prisma.category.update({
        where: { id },
        data: updateData,
      })

      // 5) If parent changed, we need to update all children's paths recursively
      if (isParentChanging && updated.level !== raw.level) {
        logger.debug('Updating children hierarchies after parent change', {
          categoryId: id,
          oldLevel: raw.level,
          newLevel: updated.level,
          oldPath: raw.path,
          newPath: updated.path,
        })

        await this.updateChildrenHierarchy(id, updated.level, updated.path)
      }

      return this.mapToDomainEntity(updated)
    } catch (error) {
      // First check for our own validation errors, which should be propagated as-is
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors with their already set status code
      }

      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation (e.g., duplicate slug)
        if (error.code === 'P2002') {
          const metaTarget = error.meta?.target as string[] | undefined
          const field =
            metaTarget && metaTarget.length > 0 ? metaTarget[0] : 'slug'
          const value = (dto[field as keyof typeof dto] as string) || 'unknown'

          throw ErrorFactory.uniqueConstraintViolation(
            'Category',
            field,
            typeof value === 'string' ? value : JSON.stringify(value),
            {
              source: 'PrismaCategoryWriteRepository.updateCategory',
            },
          )
        }

        // Foreign key constraint failure
        if (error.code === 'P2003') {
          throw ErrorFactory.validationError(
            { parentId: ['Parent category does not exist'] },
            {
              source: 'PrismaCategoryWriteRepository.updateCategory',
              httpStatus: 400, // Ensure status is set
            },
          )
        }
      }

      // Handle other database errors
      throw ErrorFactory.databaseError(
        'update_category',
        'Failed to update category',
        error,
        {
          source: 'PrismaCategoryWriteRepository.updateCategory',
          metadata: {
            categoryId: id,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  /**
   * Deletes a category from the database
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      // Check if the category exists before attempting to delete
      const exists = await this.prisma.category.count({ where: { id } })

      if (exists === 0) {
        logger.debug('Category not found for deletion:', id)
        throw ErrorFactory.resourceNotFound('Category', id, {
          source: 'PrismaCategoryWriteRepository.deleteCategory',
          httpStatus: 404,
        })
      }

      // Log the operation (for audit purposes)
      logger.debug('Deleting category from database', { id })

      // First check if category has children, as we shouldn't allow deletion in that case
      const childCount = await this.prisma.category.count({
        where: { parentId: id },
      })

      if (childCount > 0) {
        throw ErrorFactory.businessRuleViolation(
          'Category has child categories',
          `Cannot delete category with ${childCount} child categories`,
          {
            source: 'PrismaCategoryWriteRepository.deleteCategory',
            suggestion:
              'Remove all child categories first before deleting this category',
            metadata: { childCount },
            httpStatus: 400, // Make sure this propagates with 400 status
          },
        )
      }

      // Check if category has providers assigned to it
      const providerCount = await this.prisma.provider
        .count({
          where: { categoryId: id },
        })
        .catch(() => 0) // Fail gracefully if provider table doesn't exist or we don't have access

      if (providerCount > 0) {
        throw ErrorFactory.businessRuleViolation(
          'Category has providers',
          `Cannot delete category with ${providerCount} providers`,
          {
            source: 'PrismaCategoryWriteRepository.deleteCategory',
            suggestion:
              'Remove or reassign all providers first before deleting this category',
            metadata: { providerCount },
          },
        )
      }

      // Delete the category from the database
      await this.prisma.category.delete({ where: { id } })

      logger.info('Category deleted successfully', { id })
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Category', id, {
            source: 'PrismaCategoryWriteRepository.deleteCategory',
          })
        }

        // Foreign key constraint failure (has dependent records)
        if (error.code === 'P2003') {
          // This is a business rule violation - not a validation error
          throw ErrorFactory.businessRuleViolation(
            'Category has dependent entities',
            'Cannot delete category with child categories or services',
            {
              source: 'PrismaCategoryWriteRepository.deleteCategory',
              suggestion:
                'Remove all child categories and related services first',
            },
          )
        }
      }

      // If it's already a BaseError, rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle other database errors
      throw ErrorFactory.databaseError(
        'delete_category',
        'Failed to delete category',
        error,
        {
          source: 'PrismaCategoryWriteRepository.deleteCategory',
          severity: ErrorSeverity.ERROR,
          metadata: {
            categoryId: id,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
          retryable: false,
        },
      )
    }
  }

  /**
   * Maps a database record to a domain entity
   * Optimized to avoid double conversion by using SDK mapper directly
   */
  private mapToDomainEntity(record: any): Category {
    // Log the raw record to see what's coming from the database
    logger.debug('Raw record from database:', {
      id: record.id,
      parentId: record.parentId,
      level: record.level,
      path: record.path,
    })

    // First map to SDK domain entity format
    const sdkEntity = CategoryMapper.fromDocument({
      id: record.id,
      name: record.name,
      description: record.description,
      iconUrl: record.iconUrl,
      slug: record.slug,
      parentId: record.parentId,
      level: record.level,
      path: record.path,
      active: record.active,
      sortOrder: record.sortOrder,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })

    logger.debug('SDK entity after mapping:', {
      id: sdkEntity.id,
      parentId: sdkEntity.parentId,
      level: sdkEntity.level,
      path: sdkEntity.path,
    })

    return Category.create(sdkEntity, record.id)
  }
}
