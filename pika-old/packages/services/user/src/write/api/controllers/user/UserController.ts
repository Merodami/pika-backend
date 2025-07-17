import { schemas } from '@pika/api'
import { RequestContext } from '@pika/http'
import { UserMapper } from '@pika/sdk'
import {
  ErrorFactory,
  ErrorSeverity,
  FileStoragePort,
  logger,
  NotAuthorizedError,
} from '@pika/shared'
import { UserRole, UserStatus } from '@pika/types-core'
import { UserWriteRepositoryPort } from '@user-write/domain/port/user/UserWriteRepositoryPort.js'
import { type FastifyRequest } from 'fastify'

/**
 * Controller for User write operations
 * Handles HTTP requests, delegates to command handlers, and handles responses
 *
 * NOTE: This is a placeholder implementation. Full functionality will be
 * implemented when user management features are developed.
 */
export class UserController {
  constructor(
    private readonly userRepository: UserWriteRepositoryPort,
    private readonly fileStorage: FileStoragePort,
  ) {
    // Bind methods
    this.create = this.create.bind(this)
    this.update = this.update.bind(this)
    this.delete = this.delete.bind(this)
  }

  /**
   * Create a new user
   * POST /users
   */
  async create(request: FastifyRequest<{ Body: schemas.UserCreate }>) {
    try {
      const dto = request.body as any // PropertyTransformerHook converts snake_case to camelCase

      // Schema validation is handled by Fastify/AJV at route level

      // Create user data for repository (data is already in camelCase)
      const createUserData = {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        role: dto.role as UserRole,
        password: 'temporary_password', // In real implementation, this would be hashed
        avatarUrl: undefined,
      }

      // Create user via repository
      const createdUser = await this.userRepository.create(createUserData)

      // Map domain entity to DTO format using SDK mapper (converts back to snake_case)
      const userDomain = UserMapper.fromDocument(createdUser as any)

      return UserMapper.toDTO(userDomain)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error creating user:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        correlationId: request.id,
      })

      // Handle validation errors from ErrorFactory
      if (
        error &&
        typeof error === 'object' &&
        error.context &&
        error.context.domain === 'validation'
      ) {
        throw error // Pass through validation errors from repository
      }

      // Handle validation errors by name
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      // Handle validation errors by checking the constructor name
      if (
        error &&
        error.constructor &&
        error.constructor.name === 'ValidationError'
      ) {
        throw error // Pass through validation errors
      }

      // Handle duplicate user errors (fallback if not caught above)
      if (error.code === 'P2002' || error.message?.includes('already exists')) {
        throw ErrorFactory.validationError(
          { email: ['Email already exists'] },
          {
            correlationId: request.id,
            source: 'UserController.create',
            suggestion: 'Use a different email or username',
          },
        )
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(error, 'Failed to create user', {
        source: 'UserController.create',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        suggestion: 'Please check your input and try again',
      })
    }
  }

  /**
   * Update an existing user
   * PATCH /users/{user_id}
   */
  async update(
    request: FastifyRequest<{
      Params: { user_id: string }
      Body: schemas.UserUpdate
    }>,
  ) {
    try {
      const { user_id } = request.params
      const dto = request.body as any // PropertyTransformerHook converts snake_case to camelCase
      const context = RequestContext.fromHeaders(request)

      // Validate user ID
      if (!user_id || user_id.trim() === '') {
        throw ErrorFactory.validationError(
          { userId: ['User ID is required'] },
          {
            correlationId: request.id,
            source: 'UserController.update',
            suggestion: 'Provide a valid user ID',
          },
        )
      }

      // Authorization: Users can only update their own profile unless they're admin
      if (context.role !== UserRole.ADMIN && context.userId !== user_id) {
        throw new NotAuthorizedError('You can only update your own profile', {
          source: 'UserController.update',
          metadata: { userId: user_id, requesterId: context.userId },
        })
      }

      // Non-admins cannot update user status
      if (context.role !== UserRole.ADMIN && dto.status !== undefined) {
        throw new NotAuthorizedError(
          'Only administrators can change user status',
          {
            source: 'UserController.update',
            metadata: { userId: user_id, field: 'status' },
          },
        )
      }

      // Prepare update data for repository (data is already in camelCase)
      const userUpdateData = {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        status: dto.status as UserStatus | undefined,
      }

      // Remove undefined values
      Object.keys(userUpdateData).forEach((key) => {
        if (userUpdateData[key as keyof typeof userUpdateData] === undefined) {
          delete userUpdateData[key as keyof typeof userUpdateData]
        }
      })

      // Update user via repository
      const updatedUser = await this.userRepository.updateById(
        user_id,
        userUpdateData,
      )

      // Map domain entity to DTO format using SDK mapper (converts back to snake_case)
      const userDomain = UserMapper.fromDocument(updatedUser as any)

      return UserMapper.toDTO(userDomain)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error updating user:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: request.params.user_id,
        correlationId: request.id,
      })

      // Handle validation errors from ErrorFactory
      if (
        error &&
        typeof error === 'object' &&
        error.context &&
        error.context.domain === 'validation'
      ) {
        throw error // Pass through validation errors from repository
      }

      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      // Handle user not found
      if (error.code === 'P2025' || error.message?.includes('not found')) {
        throw ErrorFactory.resourceNotFound('User', request.params.user_id, {
          correlationId: request.id,
          source: 'UserController.update',
          httpStatus: 404,
          suggestion: 'Check that the user ID exists',
        })
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(error, 'Failed to update user', {
        source: 'UserController.update',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          userId: request.params.user_id,
        },
        suggestion: 'Please check your input and try again',
      })
    }
  }

  /**
   * Delete an existing user
   * DELETE /users/{user_id}
   */
  async delete(request: FastifyRequest<{ Params: { user_id: string } }>) {
    try {
      const { user_id } = request.params
      const context = RequestContext.fromHeaders(request)

      // Validate user ID
      if (!user_id || user_id.trim() === '') {
        throw ErrorFactory.validationError(
          { userId: ['User ID is required'] },
          {
            correlationId: request.id,
            source: 'UserController.delete',
            suggestion: 'Provide a valid user ID',
          },
        )
      }

      // Authorization: Only admins can delete users
      if (context.role !== UserRole.ADMIN) {
        throw new NotAuthorizedError(
          'Only administrators can delete user accounts',
          {
            source: 'UserController.delete',
            metadata: { userId: user_id, requesterId: context.userId },
          },
        )
      }

      // Soft delete user via repository
      await this.userRepository.softDelete(user_id)

      // No return needed - route will handle 204 status
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error deleting user:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        userId: request.params.user_id,
        correlationId: request.id,
      })

      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      // Handle user not found
      if (error.code === 'P2025' || error.message?.includes('not found')) {
        throw ErrorFactory.resourceNotFound('User', request.params.user_id, {
          correlationId: request.id,
          source: 'UserController.delete',
          httpStatus: 404,
          suggestion: 'Check that the user ID exists',
        })
      }

      // Handle constraint violations (user has related data)
      if (
        error.code === 'P2003' ||
        error.message?.includes('foreign key constraint')
      ) {
        throw ErrorFactory.validationError(
          {
            user: ['Cannot delete user with active services'],
          },
          {
            source: 'UserController.delete',
            httpStatus: 400,
            correlationId: request.id,
            suggestion: 'Remove all related data before deleting the user',
            metadata: { userId: request.params.user_id },
          },
        )
      }

      // Handle unexpected errors
      throw ErrorFactory.fromError(error, 'Failed to delete user', {
        source: 'UserController.delete',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          userId: request.params.user_id,
        },
        suggestion: 'Check if the user has dependencies and try again',
      })
    }
  }
}
