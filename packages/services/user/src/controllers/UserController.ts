import type {
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AdminUserQueryParams,
  BanUserRequest,
  EmailParam,
  SubTokenParam,
  UnbanUserRequest,
  UpdateUserStatusRequest,
  UserIdParam,
} from '@pika/api/admin'
import type {
  GetUserByIdQuery,
  RegisterRequest,
  UpdateProfileRequest,
} from '@pika/api/public'
import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import { getValidatedQuery, RequestContext } from '@pika/http'
import { adaptMulterFile } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { UserMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'
import { get } from 'lodash-es'

import type { IUserService } from '../services/UserService.js'

/**
 * Handles user management operations
 */
export class UserController {
  constructor(private readonly userService: IUserService) {
    // Bind methods to preserve 'this' context
    this.getAllUsers = this.getAllUsers.bind(this)
    this.getUserById = this.getUserById.bind(this)
    this.getUserByEmail = this.getUserByEmail.bind(this)
    this.getUserBySubToken = this.getUserBySubToken.bind(this)
    this.createUser = this.createUser.bind(this)
    this.createAdminUser = this.createAdminUser.bind(this)
    this.updateUser = this.updateUser.bind(this)
    this.deleteUser = this.deleteUser.bind(this)
    this.updateUserStatus = this.updateUserStatus.bind(this)
    this.banUser = this.banUser.bind(this)
    this.unbanUser = this.unbanUser.bind(this)
    this.uploadAvatar = this.uploadAvatar.bind(this)
    this.getUserFriends = this.getUserFriends.bind(this)
    this.getMe = this.getMe.bind(this)
    this.updateMe = this.updateMe.bind(this)
  }

  /**
   * GET /users
   * Get all users with filters and pagination
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'users',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<AdminUserQueryParams>(req)

      // Map API query to service params
      const params = {
        email: query.email,
        role: query.role,
        status: query.status,
        search: query.search,
        page: query.page,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: this.mapSortField(query.sortBy),
        sortOrder: query.sortOrder?.toLowerCase() as 'asc' | 'desc' | undefined,
        // Additional admin search params
        emailVerified: query.emailVerified,
        phoneVerified: query.phoneVerified,
        identityVerified: query.identityVerified,
        registeredFrom: query.registeredFrom,
        registeredTo: query.registeredTo,
        lastLoginFrom: query.lastLoginFrom,
        lastLoginTo: query.lastLoginTo,
        minSpent: query.minSpent,
        maxSpent: query.maxSpent,
        hasReports: query.hasReports,
        flags: query.flags,
      }

      const result = await this.userService.getAllUsers(params)

      // Convert to DTOs
      res.json({
        data: result.data.map((user: any) => UserMapper.toDTO(user)),
        pagination: result.pagination,
      })
    } catch (error) {
      console.log('[USER_CONTROLLER] Caught error in getAllUsers:', {
        name: (error as any).name,
        message: (error as any).message,
        code: (error as any).code,
        isBaseError: error instanceof ErrorFactory.constructor,
      })
      next(error)
    }
  }

  /**
   * GET /users/:user_id
   * Get user by ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'user',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserById(
    req: Request<UserIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const query = getValidatedQuery<GetUserByIdQuery>(req)
      const { includeProfessional, includeParq, includeFriends } = query

      const user = await this.userService.getUserById(userId, {
        includeProfessional: includeProfessional,
        includeParq: includeParq,
        includeFriends: includeFriends,
      })

      res.json(UserMapper.toDTO(user))
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /users/email/:email
   * Get user by email address
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'user:email',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserByEmail(
    req: Request<EmailParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = req.params

      const user = await this.userService.getUserByEmail(email)

      res.json(UserMapper.toDTO(user))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /users
   * Create new user
   */
  async createUser(
    req: Request<{}, {}, RegisterRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.body

      const user = await this.userService.createUser(data)

      const dto = UserMapper.toDTO(user)

      res.status(201).json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /users (admin)
   * Create new user via admin interface
   */
  async createAdminUser(
    req: Request<{}, {}, AdminCreateUserRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.body

      const user = await this.userService.createAdminUser(data)

      const dto = UserMapper.toDTO(user)

      res.status(201).json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /users/:user_id
   * Update user information
   */
  async updateUser(
    req: Request<UserIdParam, {}, AdminUpdateUserRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const data = req.body

      const user = await this.userService.updateUser(userId, data)

      res.json(UserMapper.toDTO(user))
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /users/:user_id
   * Delete user account
   */
  async deleteUser(
    req: Request<UserIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params

      await this.userService.deleteUser(userId)

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /users/:user_id/avatar
   * Upload user avatar image
   */
  async uploadAvatar(
    req: Request<UserIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const context = RequestContext.getContext(req)
      const authenticatedUserId = context.userId

      // Authorization check: Users can only upload their own avatars (unless admin)
      if (authenticatedUserId !== userId && context.role !== 'ADMIN') {
        throw ErrorFactory.forbidden('You can only upload your own avatar')
      }

      // Get the uploaded file from Multer
      const file = req.file

      if (!file) {
        throw ErrorFactory.badRequest('No file uploaded')
      }

      // Adapt the multer file to our FileUpload format
      const adaptedFile = adaptMulterFile(file)

      const url = await this.userService.uploadUserAvatar(userId, adaptedFile)

      res.json({ avatarUrl: url })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /users/sub/:sub_token
   * Get user by subscription token
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'user:subtoken',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserBySubToken(
    req: Request<SubTokenParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { subToken } = req.params
      const user = await this.userService.getUserBySubToken(subToken)

      res.json(UserMapper.toDTO(user))
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /users/:user_id/status
   * Update user account status
   */
  async updateUserStatus(
    req: Request<UserIdParam, {}, UpdateUserStatusRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const { status } = req.body
      const user = await this.userService.updateUserStatus(userId, status)

      res.json(UserMapper.toDTO(user))
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /users/:user_id/ban
   * Ban user account
   */
  async banUser(
    req: Request<UserIdParam, {}, BanUserRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      // TODO: Update service method to accept reason, duration, and notifyUser from req.body
      const user = await this.userService.banUser(userId)

      res.json(UserMapper.toDTO(user))
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /users/:user_id/unban
   * Unban user account
   */
  async unbanUser(
    req: Request<UserIdParam, {}, UnbanUserRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      // TODO: Update service method to accept reason and notifyUser from req.body
      const user = await this.userService.unbanUser(userId)

      res.json(UserMapper.toDTO(user))
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /users/:user_id/friends
   * Get user's friends list
   */
  async getUserFriends(
    req: Request<UserIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const friends = await this.userService.getUserFriends(userId)

      res.json({ guests: friends })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /users/me
   * Get current authenticated user profile
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      const user = await this.userService.getUserById(userId)

      res.json(UserMapper.toDTO(user))
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /users/me
   * Update current authenticated user profile
   */
  async updateMe(
    req: Request<{}, {}, UpdateProfileRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      const user = await this.userService.updateUser(userId, req.body)

      res.json(UserMapper.toDTO(user))
    } catch (error) {
      next(error)
    }
  }

  /**
   * Map API field names to database field names
   */
  private mapSortField(apiField?: string): string | undefined {
    if (!apiField) return undefined

    const fieldMap: Record<string, string> = {
      EMAIL: 'email',
      CREATED_AT: 'createdAt',
      LAST_LOGIN_AT: 'lastLoginAt',
      TOTAL_SPENT: 'totalSpent',
    }

    return get(fieldMap, apiField, apiField.toLowerCase())
  }
}
