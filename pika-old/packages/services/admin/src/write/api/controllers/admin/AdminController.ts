import { CreateAdminCommandHandler } from '@admin-write/application/use_cases/commands/CreateAdminCommandHandler.js'
import { DeleteAdminCommandHandler } from '@admin-write/application/use_cases/commands/DeleteAdminCommandHandler.js'
import { UpdateAdminCommandHandler } from '@admin-write/application/use_cases/commands/UpdateAdminCommandHandler.js'
import { type AdminCreateDTO } from '@admin-write/domain/dtos/AdminDTO.js'
import { AdminDocumentAdapter } from '@admin-write/infrastructure/adapters/AdminDocumentAdapter.js'
import { adaptFastifyMultipart } from '@pika/http'
import { AdminDocument as SDKAdminDocument, AdminDomain, AdminMapper } from '@pika/sdk'
import { ErrorFactory, FileStoragePort, logger } from '@pika/shared'
import { type FastifyReply, type FastifyRequest } from 'fastify'

/**
 * Controller for Admin write operations
 * Handles HTTP requests, delegates to command handlers, and handles responses
 */
export class AdminController {
  constructor(
    private readonly createHandler: CreateAdminCommandHandler,
    private readonly updateHandler: UpdateAdminCommandHandler,
    private readonly deleteHandler: DeleteAdminCommandHandler,
    private readonly fileStorage: FileStoragePort,
  ) {}

  /**
   * Create a new admin
   * POST /admins
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const dto = request.body as AdminCreateDTO

      const admin = await this.createHandler.execute(dto)

      // Map domain entity to DTO format using SDK mapper with proper typing
      const adminDomain = admin.toObject() as AdminDomain
      const responseDTO = AdminMapper.toDTO(adminDomain)

      reply.code(201).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error creating admin:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
      })

      // Re-throw for global error handler
      throw error
    }
  }

  /**
   * Update an existing admin
   * PATCH /admins/:admin_id
   */
  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { admin_id } = request.params as { admin_id: string }
      // Convert SDK AdminDocument format to local format
      const sdkDoc = request.body as Partial<SDKAdminDocument>
      const localDoc = AdminDocumentAdapter.fromSDK(sdkDoc)

      const admin = await this.updateHandler.execute(admin_id, localDoc)

      // Map domain entity to DTO format
      const adminDomain = admin.toObject() as AdminDomain
      const responseDTO = AdminMapper.toDTO(adminDomain)

      reply.code(200).send(responseDTO)
    } catch (error: any) {
      logger.error('Error updating admin:', {
        error: error.message,
        adminId: (request.params as any)?.admin_id,
        stack: error.stack,
        context: error.context,
      })

      // Re-throw for global error handler
      throw error
    }
  }

  /**
   * Delete an admin
   * DELETE /admins/:admin_id
   */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { admin_id } = request.params as { admin_id: string }

      await this.deleteHandler.execute(admin_id)

      reply.code(204).send()
    } catch (error: any) {
      logger.error('Error deleting admin:', {
        error: error.message,
        adminId: (request.params as any)?.admin_id,
        stack: error.stack,
        context: error.context,
      })

      // Re-throw for global error handler
      throw error
    }
  }

  /**
   * Upload admin profile image
   * POST /admins/:admin_id/upload
   */
  async uploadImage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { admin_id } = request.params as { admin_id: string }

      // Handle multipart file upload
      const data = await request.file()

      if (!data) {
        throw ErrorFactory.validationError(
          { file: ['No file provided'] },
          {
            source: 'AdminController.uploadImage',
            suggestion: 'Provide a valid image file',
          },
        )
      }

      // Validate file type
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/svg+xml',
      ]

      if (!allowedMimeTypes.includes(data.mimetype)) {
        throw ErrorFactory.validationError(
          { file: ['Invalid file type. Only JPEG, PNG, WebP, and SVG images are allowed'] },
          {
            source: 'AdminController.uploadImage',
            suggestion: 'Upload a valid image file',
          },
        )
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024
      const buffer = await data.toBuffer()

      if (buffer.length > maxSize) {
        throw ErrorFactory.validationError(
          { file: ['File size exceeds 5MB limit'] },
          {
            source: 'AdminController.uploadImage',
            suggestion: 'Upload a smaller image file',
          },
        )
      }

      const fileUpload = adaptFastifyMultipart(data)

      // Store the file using the file storage service
      const storedFile = await this.fileStorage.saveFile(
        fileUpload,
        `admins/${admin_id}/profile`,
      )

      reply.code(200).send({
        url: storedFile.url,
        filename: storedFile.filename,
        size: storedFile.size,
        mime_type: storedFile.mimetype,
      })
    } catch (error: any) {
      logger.error('Error uploading admin image:', {
        error: error.message,
        adminId: (request.params as any)?.admin_id,
        stack: error.stack,
      })

      // Handle file upload specific errors
      if (error.code === 'INVALID_FILE_TYPE') {
        throw ErrorFactory.validationError(
          { file: ['Invalid file type. Only images are allowed.'] },
          {
            source: 'AdminController.uploadImage',
            suggestion: 'Upload a valid image file (JPEG, PNG, WebP, SVG)',
          },
        )
      }

      if (error.code === 'FILE_TOO_LARGE') {
        throw ErrorFactory.validationError(
          { file: ['File size exceeds 5MB limit'] },
          {
            source: 'AdminController.uploadImage',
            suggestion: 'Reduce file size and try again',
          },
        )
      }

      // Re-throw for global error handler
      throw error
    }
  }
}
