import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { ICacheService } from '@pika/redis'
import { type UserDomain, UserMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type {
  PaginatedResult,
  PartialUserSettings,
  UserSettings,
} from '@pika/types'
import { createDefaultUserSettings, mergeUserSettings } from '@pika/types'
import { Prisma, PrismaClient } from '@prisma/client'

export interface UserSearchParams {
  email?: string
  firstName?: string
  lastName?: string
  role?: string
  status?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface IUserRepository {
  findAll(params: UserSearchParams): Promise<PaginatedResult<UserDomain>>
  findById(id: string): Promise<UserDomain | null>
  findByEmail(email: string): Promise<UserDomain | null>
  findByPhone(phone: string): Promise<UserDomain | null>
  findBySubToken(subToken: string): Promise<UserDomain | null>
  create(data: any): Promise<UserDomain>
  update(id: string, data: any): Promise<UserDomain>
  delete(id: string): Promise<void>
  updateStatus(id: string, status: string): Promise<UserDomain>

  // Settings methods
  getUserSettings(userId: string): Promise<UserSettings>
  updateUserSettings(
    userId: string,
    settings: UserSettings,
  ): Promise<UserSettings>
  patchUserSettings(
    userId: string,
    settingsUpdate: PartialUserSettings,
  ): Promise<UserSettings>

  // Internal API methods - return raw database data including password
  // TODO: In future, move these to a separate AuthDataRepository
  getRawUserByEmail(email: string): Promise<any | null>
  getRawUserById(id: string): Promise<any | null>
}

export class UserRepository implements IUserRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async findAll(
    params: UserSearchParams = {},
  ): Promise<PaginatedResult<UserDomain>> {
    try {
      const {
        email,
        firstName,
        lastName,
        role,
        status,
        search,
        page = 1,
        limit = PAGINATION_DEFAULT_LIMIT,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = params

      const where: any = {
        deletedAt: null,
      }

      // General search across multiple fields
      if (search) {
        const searchConditions: any[] = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ]

        // Only search by ID if the search string looks like a UUID
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

        if (uuidRegex.test(search)) {
          searchConditions.unshift({ id: { equals: search } }) // UUID exact match
        }

        where.OR = searchConditions
      }

      if (email) {
        where.email = {
          contains: email,
          mode: 'insensitive',
        }
      }

      if (firstName) {
        where.firstName = {
          contains: firstName,
          mode: 'insensitive',
        }
      }

      if (lastName) {
        where.lastName = {
          contains: lastName,
          mode: 'insensitive',
        }
      }

      if (role) {
        where.role = role
      }

      if (status) {
        if (Array.isArray(status)) {
          where.status = { in: status }
        } else {
          where.status = status
        }
      }

      const orderBy = this.buildOrderBy(sortBy, sortOrder)

      const [items, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          // Removed includes for non-existent relations
        }),
        this.prisma.user.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        data: items.map((item) => UserMapper.fromDocument(item)),
        pagination: {
          page: page,
          limit: limit,
          total,
          totalPages: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      logger.error('Failed to find all users', { error, params })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findAll',
          'Failed to retrieve users',
          error,
        )
      }

      throw error
    }
  }

  async findById(id: string): Promise<UserDomain | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      })

      return user ? UserMapper.fromDocument(user) : null
    } catch (error) {
      logger.error('Failed to find user by id', { error, id })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findById',
          'Failed to retrieve user',
          error,
        )
      }

      throw error
    }
  }

  async findByEmail(email: string): Promise<UserDomain | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          deletedAt: null,
        },
        // Removed includes for non-existent relations
      })

      return user ? UserMapper.fromDocument(user) : null
    } catch (error) {
      logger.error('Failed to find user by email', { error, email })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findByEmail',
          'Failed to retrieve user',
          error,
        )
      }

      throw error
    }
  }

  async findByPhone(phone: string): Promise<UserDomain | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          phoneNumber: phone,
          deletedAt: null,
        },
        // Removed includes for non-existent relations
      })

      return user ? UserMapper.fromDocument(user) : null
    } catch (error) {
      logger.error('Failed to find user by phone', { error, phone })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findByPhone',
          'Failed to retrieve user',
          error,
        )
      }

      throw error
    }
  }

  async findBySubToken(subToken: string): Promise<UserDomain | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          identities: {
            firebaseUid: subToken,
          },
          deletedAt: null,
        },
        // Removed includes for non-existent relations
      })

      return user ? UserMapper.fromDocument(user) : null
    } catch (error) {
      logger.error('Failed to find user by sub token', { error, subToken })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'findBySubToken',
          'Failed to retrieve user',
          error,
        )
      }

      throw error
    }
  }

  async create(data: any): Promise<UserDomain> {
    try {
      const {
        password,
        acceptTerms: _acceptTerms,
        marketingConsent: _marketingConsent,
        ...userData
      } = data

      // Convert dateOfBirth to ISO datetime if provided as YYYY-MM-DD
      if (
        userData.dateOfBirth &&
        /^\d{4}-\d{2}-\d{2}$/.test(userData.dateOfBirth)
      ) {
        userData.dateOfBirth = new Date(userData.dateOfBirth).toISOString()
      }

      // Create user (professional profile removed)
      const user = await this.prisma.user.create({
        data: {
          ...userData,
          email: userData.email.toLowerCase(),
          password: password || undefined,
        },
        // Removed includes for non-existent relations
      })

      return UserMapper.fromDocument(user)
    } catch (error) {
      logger.error('Failed to create user', { error, data })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.businessRuleViolation(
            'User with this email already exists',
            'Email must be unique',
          )
        }

        throw ErrorFactory.databaseError(
          'create',
          'Failed to create user',
          error,
        )
      }

      throw error
    }
  }

  async update(id: string, data: any): Promise<UserDomain> {
    try {
      // If email is being updated, convert to lowercase
      if (data.email) {
        data.email = data.email.toLowerCase()
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        // Removed includes for non-existent relations
      })

      return UserMapper.fromDocument(user)
    } catch (error) {
      logger.error('Failed to update user', { error, id, data })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw ErrorFactory.businessRuleViolation(
            'User with this email already exists',
            'Email must be unique',
          )
        }

        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', id)
        }

        throw ErrorFactory.databaseError(
          'update',
          'Failed to update user',
          error,
        )
      }

      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Soft delete by setting deletedAt
      await this.prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      })
    } catch (error) {
      logger.error('Failed to delete user', { error, id })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', id)
        }

        throw ErrorFactory.databaseError(
          'delete',
          'Failed to delete user',
          error,
        )
      }

      throw error
    }
  }

  async updateStatus(id: string, status: string): Promise<UserDomain> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          status: status as any,
          updatedAt: new Date(),
        },
        // Removed includes for non-existent relations
      })

      return UserMapper.fromDocument(user)
    } catch (error) {
      logger.error('Failed to update user status', { error, id, status })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', id)
        }

        throw ErrorFactory.databaseError(
          'updateStatus',
          'Failed to update user status',
          error,
        )
      }

      throw error
    }
  }

  async getRawUserByEmail(email: string): Promise<any | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          deletedAt: null,
        },
      })

      return user
    } catch (error) {
      logger.error('Failed to get raw user by email', { error, email })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'getRawUserByEmail',
          'Failed to retrieve user',
          error,
        )
      }

      throw error
    }
  }

  async getRawUserById(id: string): Promise<any | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      })

      return user
    } catch (error) {
      logger.error('Failed to get raw user by id', { error, id })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'getRawUserById',
          'Failed to retrieve user',
          error,
        )
      }

      throw error
    }
  }

  async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
        },
        select: {
          id: true,
          settings: true,
        },
      })

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', userId)
      }

      // Return default settings if no settings exist
      if (!user.settings) {
        // Check if user is business user to determine default settings
        const userDetails = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
        const isBusinessUser = userDetails?.role === 'business'

        return createDefaultUserSettings(isBusinessUser)
      }

      return user.settings as unknown as UserSettings
    } catch (error) {
      logger.error('Failed to get user settings', { error, userId })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw ErrorFactory.databaseError(
          'getUserSettings',
          'Failed to retrieve user settings',
          error,
        )
      }

      throw error
    }
  }

  async updateUserSettings(
    userId: string,
    settings: UserSettings,
  ): Promise<UserSettings> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          settings: settings as any,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          settings: true,
        },
      })

      return user.settings as unknown as UserSettings
    } catch (error) {
      logger.error('Failed to update user settings', {
        error,
        userId,
        settings,
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', userId)
        }

        throw ErrorFactory.databaseError(
          'updateUserSettings',
          'Failed to update user settings',
          error,
        )
      }

      throw error
    }
  }

  async patchUserSettings(
    userId: string,
    settingsUpdate: PartialUserSettings,
  ): Promise<UserSettings> {
    try {
      // First, get current settings
      const currentSettings = await this.getUserSettings(userId)

      // Deep merge the settings update with current settings
      const mergedSettings = mergeUserSettings(currentSettings, settingsUpdate)

      // Update with merged settings
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          settings: mergedSettings as any,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          settings: true,
        },
      })

      return user.settings as unknown as UserSettings
    } catch (error) {
      logger.error('Failed to patch user settings', {
        error,
        userId,
        settingsUpdate,
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('User', userId)
        }

        throw ErrorFactory.databaseError(
          'patchUserSettings',
          'Failed to patch user settings',
          error,
        )
      }

      throw error
    }
  }

  private buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): any {
    // Handle nested sorting for related fields
    if (sortBy.includes('.')) {
      const [relation, field] = sortBy.split('.')

      return {
        [relation]: {
          [field]: sortOrder,
        },
      }
    }

    return {
      [sortBy]: sortOrder,
    }
  }
}
