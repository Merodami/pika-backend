import { CreateCategoryCommandHandler } from '@category-write/application/use_cases/commands/CreateCategoryCommandHandler.js'
import { DeleteCategoryCommandHandler } from '@category-write/application/use_cases/commands/DeleteCategoryCommandHandler.js'
import { UpdateCategoryCommandHandler } from '@category-write/application/use_cases/commands/UpdateCategoryCommandHandler.js'
import { type CategoryCreateDTO } from '@category-write/domain/dtos/CategoryDTO.js'
import { schemas } from '@pika/api'
import { adaptFastifyMultipart } from '@pika/http'
import { CategoryDocument, CategoryDomain, CategoryMapper } from '@pika/sdk'
import { ErrorFactory, FileStoragePort, logger } from '@pika/shared'
import { type FastifyReply, type FastifyRequest } from 'fastify'

/**
 * Controller for Category write operations
 * Handles HTTP requests, delegates to command handlers, and handles responses
 */
export class CategoryController {
  constructor(
    private readonly createHandler: CreateCategoryCommandHandler,
    private readonly updateHandler: UpdateCategoryCommandHandler,
    private readonly deleteHandler: DeleteCategoryCommandHandler,
    private readonly fileStorage: FileStoragePort,
  ) {}

  /**
   * Create a new category
   * POST /categories
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const dto = request.body as CategoryCreateDTO

      const category = await this.createHandler.execute(dto)

      // Map domain entity to DTO format using SDK mapper with proper typing
      const categoryDomain = category.toObject() as CategoryDomain
      const responseDTO = CategoryMapper.toDTO(categoryDomain)

      reply.code(201).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error creating category:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
      })

      // Re-throw for global error handler
      throw error
    }
  }

  /**
   * Update an existing category
   * PATCH /categories/{category_id}
   */
  async update(
    request: FastifyRequest<{
      Params: schemas.CategoryId
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { category_id } = request.params
      const dto = request.body as Partial<CategoryDocument>

      // Validate that the request contains at least one field to update
      if (Object.keys(dto).length === 0) {
        throw ErrorFactory.validationError(
          { _: ['No update fields provided'] },
          {
            source: 'CategoryController.update',
            suggestion: 'Provide at least one field to update',
          },
        )
      }

      const category = await this.updateHandler.execute(category_id, dto)

      // Map domain entity to DTO format using SDK mapper with proper typing
      const categoryDomain = category.toObject() as CategoryDomain
      const responseDTO = CategoryMapper.toDTO(categoryDomain)

      reply.code(200).send(responseDTO)
    } catch (error: any) {
      logger.error('Error updating category:', {
        error: error.message,
        categoryId: request.params.category_id,
        stack: error.stack,
        context: error.context,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError') {
        throw error // Pass through not found errors
      }

      // Re-throw for global error handler
      throw error
    }
  }

  /**
   * Delete an existing category
   * DELETE /categories/{category_id}
   */
  async delete(
    request: FastifyRequest<{
      Params: schemas.CategoryId
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { category_id } = request.params

      await this.deleteHandler.execute(category_id)

      reply.code(204).send()
    } catch (error: any) {
      logger.error('Error deleting category:', {
        error: error.message,
        categoryId: request.params.category_id,
        stack: error.stack,
        context: error.context,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError') {
        throw error // Pass through not found errors
      }

      // Special handling for constraint violations
      if (
        error.code === 'P2003' ||
        error.message?.includes('foreign key constraint') ||
        error.message?.includes('child categories') ||
        error.name === 'BusinessRuleViolationError'
      ) {
        throw ErrorFactory.businessRuleViolation(
          'Cannot delete category with dependencies',
          'Remove all child categories and related services first',
          {
            source: 'CategoryController.delete',
            metadata: { categoryId: request.params.category_id },
          },
        )
      }

      // Re-throw all other errors for global handler
      throw error
    }
  }

  /**
   * Upload icon for an existing category
   * POST /categories/{category_id}/icon
   */
  async uploadIcon(
    request: FastifyRequest<{
      Params: schemas.CategoryId
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { category_id } = request.params

      // Get the file from the request
      const data = await request.file()

      if (!data) {
        throw ErrorFactory.validationError(
          { icon: ['No file provided'] },
          {
            source: 'CategoryController.uploadIcon',
            suggestion: 'Please provide an icon file to upload',
          },
        )
      }

      // Save the file
      const result = await this.fileStorage.saveFile(
        adaptFastifyMultipart(data),
        'category-icons',
      )

      // Update the category with the new icon URL
      const updatedCategory = await this.updateHandler.execute(category_id, {
        iconUrl: result.url,
      })

      // Map domain entity to DTO format
      const categoryDomain = updatedCategory.toObject() as CategoryDomain
      const responseDTO = CategoryMapper.toDTO(categoryDomain)

      reply.code(200).send(responseDTO)
    } catch (error: any) {
      logger.error('Error uploading category icon:', {
        error: error.message,
        categoryId: request.params.category_id,
        stack: error.stack,
        context: error.context,
      })

      // Re-throw for global error handler
      throw error
    }
  }
}
