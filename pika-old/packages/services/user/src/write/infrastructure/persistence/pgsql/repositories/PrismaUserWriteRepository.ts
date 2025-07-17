import { ErrorFactory, logger } from '@pika/shared'
import { UserStatus } from '@pika/types-core'
import { Prisma, PrismaClient } from '@prisma/client'
import { User } from '@user-write/domain/entities/User.js'
import {
  CreateUserData,
  UpdatePasswordData,
  UpdateUserData,
  UserWriteRepositoryPort,
} from '@user-write/domain/port/user/UserWriteRepositoryPort.js'

import { UserDocumentMapper } from '../mappers/UserDocumentMapper.js'

/**
 * Prisma implementation of the UserWriteRepository
 * Handles persistence and data mapping to/from the database
 */
export class PrismaUserWriteRepository implements UserWriteRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {
    logger.info('PrismaUserWriteRepository initialized')
  }

  async create(userData: CreateUserData): Promise<User> {
    try {
      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (existingUser) {
        throw ErrorFactory.validationError(
          { email: ['Email already exists'] },
          {
            source: 'PrismaUserWriteRepository.create',
          },
        )
      }

      // Check if phone number already exists (if provided)
      if (userData.phoneNumber) {
        const existingPhone = await this.prisma.user.findFirst({
          where: { phoneNumber: userData.phoneNumber },
        })

        if (existingPhone) {
          throw ErrorFactory.validationError(
            { phoneNumber: ['Phone number already exists'] },
            {
              source: 'PrismaUserWriteRepository.create',
            },
          )
        }
      }

      // Create user
      const createdUser = await this.prisma.user.create({
        data: {
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          role: userData.role,
          avatarUrl: userData.avatarUrl,
          status: 'ACTIVE',
          emailVerified: false,
          phoneVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          addresses: true,
          paymentMethods: true,
          customer: true,
          provider: true,
        },
      })

      logger.info('User created successfully', {
        userId: createdUser.id,
        email: userData.email,
      })

      return UserDocumentMapper.mapDocumentToDomain(createdUser)
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (error.code === 'P2002') {
          const metaTarget = error.meta?.target as string[] | undefined
          const field =
            metaTarget && metaTarget.length > 0 ? metaTarget[0] : 'email'

          if (field === 'email') {
            throw ErrorFactory.validationError(
              { email: ['Email already exists'] },
              {
                source: 'PrismaUserWriteRepository.create',
                httpStatus: 400,
              },
            )
          }

          if (field === 'phoneNumber') {
            throw ErrorFactory.validationError(
              { phoneNumber: ['Phone number already exists'] },
              {
                source: 'PrismaUserWriteRepository.create',
                httpStatus: 400,
              },
            )
          }

          throw ErrorFactory.uniqueConstraintViolation(
            'User',
            field,
            String(userData[field as keyof typeof userData] || 'unknown'),
            {
              source: 'PrismaUserWriteRepository.create',
            },
          )
        }

        // Invalid UUID format
        if (error.code === 'P2023') {
          throw ErrorFactory.validationError(
            { general: ['Invalid UUID format provided'] },
            {
              source: 'PrismaUserWriteRepository.create',
              suggestion: 'Ensure all IDs are in valid UUID format',
            },
          )
        }

        // Foreign key constraint failure
        if (error.code === 'P2003') {
          throw ErrorFactory.validationError(
            { role: ['Invalid role specified'] },
            {
              source: 'PrismaUserWriteRepository.create',
            },
          )
        }

        // Record not found (shouldn't happen in create but good to handle)
        if (error.code === 'P2025') {
          throw ErrorFactory.validationError(
            { general: ['Invalid data provided'] },
            {
              source: 'PrismaUserWriteRepository.create',
            },
          )
        }
      }

      // Handle validation errors that we throw ourselves
      if (
        error instanceof Error &&
        (error.message.includes('validation') ||
          error.constructor.name === 'ValidationError')
      ) {
        throw error
      }

      // Handle connection errors
      if (error instanceof Prisma.PrismaClientInitializationError) {
        logger.error('Database connection error during user creation', error)
        throw ErrorFactory.databaseError(
          'database_connection',
          'Database connection failed',
          error,
          {
            source: 'PrismaUserWriteRepository.create',
          },
        )
      }

      // Handle timeout errors
      if (error instanceof Prisma.PrismaClientRustPanicError) {
        logger.error('Database panic during user creation', error)
        throw ErrorFactory.databaseError(
          'database_panic',
          'Database operation failed unexpectedly',
          error,
          {
            source: 'PrismaUserWriteRepository.create',
          },
        )
      }

      logger.error('Failed to create user', error)
      throw ErrorFactory.databaseError(
        'create_user',
        'Failed to create user',
        error,
        {
          source: 'PrismaUserWriteRepository.create',
          metadata: {
            email: userData.email,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  async updateById(userId: string, userData: UpdateUserData): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      if (!existingUser) {
        throw ErrorFactory.resourceNotFound('User', userId, {
          source: 'PrismaUserWriteRepository.updateById',
        })
      }

      // Check phone uniqueness if updating phone
      if (
        userData.phoneNumber &&
        userData.phoneNumber !== existingUser.phoneNumber
      ) {
        const phoneExists = await this.prisma.user.findFirst({
          where: {
            phoneNumber: userData.phoneNumber,
            id: { not: userId },
          },
        })

        if (phoneExists) {
          throw ErrorFactory.validationError(
            { phoneNumber: ['Phone number already exists'] },
            {
              source: 'PrismaUserWriteRepository.updateById',
            },
          )
        }
      }

      // Update user
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...userData,
          updatedAt: new Date(),
        },
        include: {
          addresses: true,
          paymentMethods: true,
          customer: true,
          provider: true,
        },
      })

      logger.info('User updated successfully', { userId })

      return UserDocumentMapper.mapDocumentToDomain(updatedUser)
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Invalid UUID format
        if (error.code === 'P2023') {
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format: ${userId}`] },
            {
              source: 'PrismaUserWriteRepository.updateById',
              metadata: { userId },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', userId, {
            source: 'PrismaUserWriteRepository.updateById',
          })
        }

        // Unique constraint violation
        if (error.code === 'P2002') {
          const metaTarget = error.meta?.target as string[] | undefined
          const field =
            metaTarget && metaTarget.length > 0 ? metaTarget[0] : 'field'

          if (field === 'phoneNumber') {
            throw ErrorFactory.validationError(
              { phoneNumber: ['Phone number already exists'] },
              {
                source: 'PrismaUserWriteRepository.updateById',
              },
            )
          }

          throw ErrorFactory.uniqueConstraintViolation(
            'User',
            field,
            String(userData[field as keyof typeof userData] || 'unknown'),
            {
              source: 'PrismaUserWriteRepository.updateById',
            },
          )
        }
      }

      // If it's already a domain error, rethrow it
      if (
        error instanceof Error &&
        (error.message.includes('not found') ||
          error.message.includes('validation') ||
          error.constructor.name === 'ValidationError')
      ) {
        throw error
      }

      logger.error('Failed to update user', error)
      throw ErrorFactory.databaseError(
        'update_user',
        'Failed to update user',
        error,
        {
          source: 'PrismaUserWriteRepository.updateById',
          metadata: { userId },
        },
      )
    }
  }

  async updatePassword(
    userId: string,
    passwordData: UpdatePasswordData,
  ): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: passwordData.hashedPassword,
          updatedAt: passwordData.updatedAt,
        },
      })
      logger.info('Password updated successfully', { userId })
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Invalid UUID format
        if (error.code === 'P2023') {
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format: ${userId}`] },
            {
              source: 'PrismaUserWriteRepository.updatePassword',
              metadata: { userId },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', userId, {
            source: 'PrismaUserWriteRepository.updatePassword',
          })
        }
      }

      logger.error('Failed to update password', error)
      throw ErrorFactory.databaseError(
        'update_password',
        'Failed to update password',
        error,
        {
          source: 'PrismaUserWriteRepository.updatePassword',
          metadata: { userId },
        },
      )
    }
  }

  async updateLastLogin(userId: string, loginTime: Date): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: loginTime,
          updatedAt: new Date(),
        },
      })
      logger.debug('Last login updated', { userId })
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Invalid UUID format
        if (error.code === 'P2023') {
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format: ${userId}`] },
            {
              source: 'PrismaUserWriteRepository.updateLastLogin',
              metadata: { userId },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', userId, {
            source: 'PrismaUserWriteRepository.updateLastLogin',
          })
        }
      }

      logger.error('Failed to update last login', error)
      throw ErrorFactory.databaseError(
        'update_last_login',
        'Failed to update last login',
        error,
        {
          source: 'PrismaUserWriteRepository.updateLastLogin',
          metadata: { userId },
        },
      )
    }
  }

  async updateEmailVerification(
    userId: string,
    verified: boolean,
  ): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: verified,
          updatedAt: new Date(),
        },
      })
      logger.info('Email verification updated', { userId, verified })
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Invalid UUID format
        if (error.code === 'P2023') {
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format: ${userId}`] },
            {
              source: 'PrismaUserWriteRepository.updateEmailVerification',
              metadata: { userId },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', userId, {
            source: 'PrismaUserWriteRepository.updateEmailVerification',
          })
        }
      }

      logger.error('Failed to update email verification', error)
      throw ErrorFactory.databaseError(
        'update_email_verification',
        'Failed to update email verification',
        error,
        {
          source: 'PrismaUserWriteRepository.updateEmailVerification',
          metadata: { userId, verified },
        },
      )
    }
  }

  async updatePhoneVerification(
    userId: string,
    verified: boolean,
  ): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          phoneVerified: verified,
          updatedAt: new Date(),
        },
      })
      logger.info('Phone verification updated', { userId, verified })
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Invalid UUID format
        if (error.code === 'P2023') {
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format: ${userId}`] },
            {
              source: 'PrismaUserWriteRepository.updatePhoneVerification',
              metadata: { userId },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', userId, {
            source: 'PrismaUserWriteRepository.updatePhoneVerification',
          })
        }
      }

      logger.error('Failed to update phone verification', error)
      throw ErrorFactory.databaseError(
        'update_phone_verification',
        'Failed to update phone verification',
        error,
        {
          source: 'PrismaUserWriteRepository.updatePhoneVerification',
          metadata: { userId, verified },
        },
      )
    }
  }

  async updateStatus(userId: string, status: UserStatus): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          status,
          updatedAt: new Date(),
        },
      })
      logger.info('User status updated', { userId, status })
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Invalid UUID format
        if (error.code === 'P2023') {
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format: ${userId}`] },
            {
              source: 'PrismaUserWriteRepository.updateStatus',
              metadata: { userId },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', userId, {
            source: 'PrismaUserWriteRepository.updateStatus',
          })
        }
      }

      logger.error('Failed to update user status', error)
      throw ErrorFactory.databaseError(
        'update_status',
        'Failed to update user status',
        error,
        {
          source: 'PrismaUserWriteRepository.updateStatus',
          metadata: { userId, status },
        },
      )
    }
  }

  async softDelete(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      logger.info('User soft deleted', { userId })
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Invalid UUID format
        if (error.code === 'P2023') {
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format: ${userId}`] },
            {
              source: 'PrismaUserWriteRepository.softDelete',
              metadata: { userId },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', userId, {
            source: 'PrismaUserWriteRepository.softDelete',
          })
        }
      }

      logger.error('Failed to soft delete user', error)
      throw ErrorFactory.databaseError(
        'soft_delete_user',
        'Failed to soft delete user',
        error,
        {
          source: 'PrismaUserWriteRepository.softDelete',
          metadata: { userId },
        },
      )
    }
  }

  async restore(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: null,
          updatedAt: new Date(),
        },
      })
      logger.info('User restored', { userId })
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Invalid UUID format
        if (error.code === 'P2023') {
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format: ${userId}`] },
            {
              source: 'PrismaUserWriteRepository.restore',
              metadata: { userId },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', userId, {
            source: 'PrismaUserWriteRepository.restore',
          })
        }
      }

      logger.error('Failed to restore user', error)
      throw ErrorFactory.databaseError(
        'restore_user',
        'Failed to restore user',
        error,
        {
          source: 'PrismaUserWriteRepository.restore',
          metadata: { userId },
        },
      )
    }
  }

  async hardDelete(userId: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id: userId },
      })
      logger.info('User hard deleted', { userId })
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Invalid UUID format
        if (error.code === 'P2023') {
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format: ${userId}`] },
            {
              source: 'PrismaUserWriteRepository.hardDelete',
              metadata: { userId },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', userId, {
            source: 'PrismaUserWriteRepository.hardDelete',
          })
        }
      }

      logger.error('Failed to hard delete user', error)
      throw ErrorFactory.databaseError(
        'hard_delete_user',
        'Failed to hard delete user',
        error,
        {
          source: 'PrismaUserWriteRepository.hardDelete',
          metadata: { userId },
        },
      )
    }
  }

  async emailExists(email: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })

      return user !== null
    } catch (error) {
      logger.error('Failed to check email existence', error)
      throw ErrorFactory.databaseError(
        'check_email_exists',
        'Failed to check email existence',
        error,
        {
          source: 'PrismaUserWriteRepository.emailExists',
          metadata: { email },
        },
      )
    }
  }

  async phoneExists(phoneNumber: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { phoneNumber },
        select: { id: true },
      })

      return user !== null
    } catch (error) {
      logger.error('Failed to check phone existence', error)
      throw ErrorFactory.databaseError(
        'check_phone_exists',
        'Failed to check phone existence',
        error,
        {
          source: 'PrismaUserWriteRepository.phoneExists',
          metadata: { phoneNumber },
        },
      )
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          addresses: true,
          paymentMethods: true,
          customer: true,
          provider: true,
        },
      })

      return user ? UserDocumentMapper.mapDocumentToDomain(user) : null
    } catch (error) {
      logger.error('Failed to find user by email', error)
      throw ErrorFactory.databaseError(
        'find_user_by_email',
        'Failed to find user by email',
        error,
        {
          source: 'PrismaUserWriteRepository.findByEmail',
          metadata: { email },
        },
      )
    }
  }

  async findById(userId: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          addresses: true,
          paymentMethods: true,
          customer: true,
          provider: true,
        },
      })

      return user ? UserDocumentMapper.mapDocumentToDomain(user) : null
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Invalid UUID format
        if (error.code === 'P2023') {
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format: ${userId}`] },
            {
              source: 'PrismaUserWriteRepository.findById',
              metadata: { userId },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }
      }

      logger.error('Failed to find user by ID', error)
      throw ErrorFactory.databaseError(
        'find_user_by_id',
        'Failed to find user by ID',
        error,
        {
          source: 'PrismaUserWriteRepository.findById',
          metadata: { userId },
        },
      )
    }
  }
}
