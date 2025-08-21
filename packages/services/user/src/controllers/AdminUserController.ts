import { userAdmin, userPublic } from '@pika/api'
import {
  adaptMulterFile,
  getValidatedQuery,
  RequestContext,
  validateResponse,
} from '@pika/http'
import { UserMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import { VerificationType } from '@pika/types'
import type {
  IUserService,
  ResendRequest,
  VerificationRequest,
} from '@user/services/UserService.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles admin user management operations
 */
export class AdminUserController {
  constructor(private readonly userService: IUserService) {
    // Bind methods to preserve 'this' context
    this.getAllUsers = this.getAllUsers.bind(this)
    this.getUserByEmail = this.getUserByEmail.bind(this)
    this.createUser = this.createUser.bind(this)
    this.updateUser = this.updateUser.bind(this)
    this.updateUserStatus = this.updateUserStatus.bind(this)
    this.banUser = this.banUser.bind(this)
    this.unbanUser = this.unbanUser.bind(this)
    this.verifyUser = this.verifyUser.bind(this)
    this.resendVerification = this.resendVerification.bind(this)
    this.uploadUserAvatar = this.uploadUserAvatar.bind(this)
    this.getMyProfile = this.getMyProfile.bind(this)
    this.updateMyProfile = this.updateMyProfile.bind(this)
    this.getUserVerificationStatus = this.getUserVerificationStatus.bind(this)
    this.getUserById = this.getUserById.bind(this)
    this.deleteUser = this.deleteUser.bind(this)
  }

  /**
   * GET /admin/users
   * List all users with filters
   */
  async getAllUsers(
    req: Request,
    res: Response<userAdmin.AdminUserListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<userAdmin.AdminUserQueryParams>(req)

      // Use validated query params directly
      const result = await this.userService.getAllUsers(query)

      // Convert to admin DTOs
      const adminResult: userAdmin.AdminUserListResponse = {
        data: result.data.map(UserMapper.toAdminDTO),
        pagination: result.pagination,
      }

      const validatedResponse = validateResponse(
        userAdmin.AdminUserListResponse,
        adminResult,
        'AdminUserController.getAllUsers',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/users/email/:email
   * Get user by email address
   */
  async getUserByEmail(
    req: Request<userAdmin.EmailParam>,
    res: Response<userAdmin.AdminUserDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = req.params

      const user = await this.userService.getUserByEmail(email)

      const adminDto = UserMapper.toAdminDTO(user)
      const validatedResponse = validateResponse(
        userAdmin.AdminUserDetailResponse,
        adminDto,
        'AdminUserController.getUserByEmail',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/users
   * Create new user
   */
  async createUser(
    req: Request<{}, {}, userAdmin.AdminCreateUserRequest>,
    res: Response<userAdmin.AdminUserDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.body

      const user = await this.userService.createAdminUser(data)

      const adminDto = UserMapper.toAdminDTO(user)
      const validatedResponse = validateResponse(
        userAdmin.AdminUserDetailResponse,
        adminDto,
        'AdminUserController.createUser',
      )

      res.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /admin/users/:id
   * Update user information
   */
  async updateUser(
    req: Request<userAdmin.UserIdParam, {}, userAdmin.AdminUpdateUserRequest>,
    res: Response<userAdmin.AdminUserDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const data = req.body

      const user = await this.userService.updateUser(userId, data)

      const adminDto = UserMapper.toAdminDTO(user)
      const validatedResponse = validateResponse(
        userAdmin.AdminUserDetailResponse,
        adminDto,
        'AdminUserController.updateUser',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/users/:id/status
   * Update user account status
   */
  async updateUserStatus(
    req: Request<
      userAdmin.UserIdParam,
      {},
      userAdmin.AdminUpdateUserStatusRequest
    >,
    res: Response<userAdmin.AdminUserDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const { status, reason, duration, notifyUser } = req.body

      // Update user status
      const user = await this.userService.updateUser(userId, { status })

      // TODO: Handle suspension duration if status is SUSPENDED
      // TODO: Send notification if notifyUser is true
      // TODO: Log admin action with reason

      const adminDto = UserMapper.toAdminDTO(user)
      const validatedResponse = validateResponse(
        userAdmin.AdminUserDetailResponse,
        adminDto,
        'AdminUserController.updateUserStatus',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/users/:id/ban
   * Ban user account
   */
  async banUser(
    req: Request<userAdmin.UserIdParam, {}, userAdmin.AdminBanUserRequest>,
    res: Response<void>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const { reason, duration, notifyUser } = req.body

      await this.userService.banUser(userId, { reason, duration, notifyUser })

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/users/:id/unban
   * Unban user account
   */
  async unbanUser(
    req: Request<userAdmin.UserIdParam, {}, userAdmin.AdminUnbanUserRequest>,
    res: Response<void>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const { reason, notifyUser } = req.body

      await this.userService.unbanUser(userId, { reason, notifyUser })

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/users/verify
   * Admin verifies any user account (email, phone, or account confirmation)
   */
  async verifyUser(
    req: Request<{}, {}, userAdmin.AdminVerificationRequest>,
    res: Response<void>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminRequest = req.body

      // Ensure userId is provided for admin verification
      if (!adminRequest.userId) {
        throw ErrorFactory.badRequest(
          'userId is required for admin verification',
        )
      }

      // Map admin request to service request with proper enum
      const verificationRequest: VerificationRequest = {
        type: adminRequest.type as VerificationType,
        token: adminRequest.token,
        code: adminRequest.code,
        userId: adminRequest.userId,
        email: adminRequest.email,
        phoneNumber: adminRequest.phoneNumber,
      }

      await this.userService.verify(verificationRequest)

      // No content response - verification operations don't need response body
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/users/resend-verification
   * Admin resends verification (email or phone) for any user
   */
  async resendVerification(
    req: Request<{}, {}, userAdmin.AdminResendVerificationRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminRequest = req.body

      // Ensure userId is provided for admin resend
      if (!adminRequest.userId) {
        throw ErrorFactory.badRequest(
          'userId is required for admin resend verification',
        )
      }

      // Map admin request to service request with proper enum
      const resendRequest: ResendRequest = {
        type: adminRequest.type as Exclude<
          VerificationType,
          VerificationType.ACCOUNT_CONFIRMATION
        >,
        userId: adminRequest.userId,
        email: adminRequest.email,
        phoneNumber: adminRequest.phoneNumber,
      }

      await this.userService.resendVerification(resendRequest)

      const response = {
        success: true,
        message: `Verification resent successfully`,
      }
      const validatedResponse = validateResponse(
        userAdmin.AdminResendVerificationResponse,
        response,
        'AdminUserController.resendVerification',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/users/:id/avatar
   * Admin uploads avatar for any user
   */
  async uploadUserAvatar(
    req: Request<userAdmin.UserIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params

      // Get the uploaded file from Multer
      const file = req.file

      if (!file) {
        throw ErrorFactory.badRequest('No file uploaded')
      }

      // Adapt the multer file to our FileUpload format
      const adaptedFile = adaptMulterFile(file)

      const url = await this.userService.uploadUserAvatar(userId, adaptedFile)

      const response = { avatarUrl: url }
      const validatedResponse = validateResponse(
        userPublic.UploadAvatarResponse,
        response,
        'AdminUserController.uploadUserAvatar',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/users/:id
   * Get user by ID with admin details
   */
  async getUserById(
    req: Request<userAdmin.UserIdParam>,
    res: Response<userAdmin.AdminUserDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params

      const user = await this.userService.getUserById(userId)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', userId)
      }

      // Use toAdminDTO which returns data in the format expected by the schema
      const adminResponse = UserMapper.toAdminDTO(user)

      const validatedResponse = validateResponse(
        userAdmin.AdminUserDetailResponse,
        adminResponse,
        'AdminUserController.getUserById',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/users/me
   * Get current admin user profile
   */
  async getMyProfile(
    req: Request,
    res: Response<userAdmin.AdminUserDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User ID not found in context')
      }

      const user = await this.userService.getUserById(userId)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', userId)
      }

      // Use toAdminDTO which returns data in the format expected by the schema
      const adminResponse = UserMapper.toAdminDTO(user)

      const validatedResponse = validateResponse(
        userAdmin.AdminUserDetailResponse,
        adminResponse,
        'AdminUserController.getMyProfile',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /admin/users/me
   * Update current admin user profile
   */
  async updateMyProfile(
    req: Request<{}, {}, userAdmin.AdminUpdateProfileRequest>,
    res: Response<userAdmin.AdminUserDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized('User ID not found in context')
      }

      const updateData = req.body

      // Update user profile
      const updatedUser = await this.userService.updateUser(userId, {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phoneNumber: updateData.phoneNumber,
        dateOfBirth: updateData.dateOfBirth,
        avatarUrl: updateData.avatarUrl,
      })

      // TODO: Handle adminNotes update separately if needed

      // Use toAdminDTO which returns data in the format expected by the schema
      const adminResponse = UserMapper.toAdminDTO(updatedUser)

      const validatedResponse = validateResponse(
        userAdmin.AdminUserDetailResponse,
        adminResponse,
        'AdminUserController.getMyProfile',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/users/:id/verification-status
   * Get user verification status
   */
  async getUserVerificationStatus(
    req: Request<userAdmin.UserIdParam>,
    res: Response<userAdmin.AdminUserVerificationStatusResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      const user = await this.userService.getUserById(id)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', id)
      }

      // Use toAdminDTO to get proper types
      const dto = UserMapper.toAdminDTO(user)

      const verificationStatus: userAdmin.AdminUserVerificationStatusResponse =
        {
          userId: dto.id,
          emailVerified: dto.emailVerified,
          phoneVerified: dto.phoneVerified,
          verificationDate:
            dto.emailVerified && dto.updatedAt ? dto.updatedAt : undefined,
        }

      const validatedResponse = validateResponse(
        userAdmin.AdminUserVerificationStatusResponse,
        verificationStatus,
        'AdminUserController.getUserVerificationStatus',
      )

      res.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/users/:id
   * Delete user by ID (soft delete)
   */
  async deleteUser(
    req: Request<userAdmin.UserIdParam>,
    res: Response<void>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params

      await this.userService.deleteUser(userId)

      // No content response
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}
