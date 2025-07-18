import { userAdmin, userPublic } from '@pika/api'
import { adaptMulterFile, RequestContext } from '@pika/http'
import { ErrorFactory } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

import type { IUserService } from '../services/UserService.js'

/**
 * Handles admin user management operations
 */
export class AdminUserController {
  constructor(private readonly userService: IUserService) {
    // Bind methods to preserve 'this' context
    this.verifyUser = this.verifyUser.bind(this)
    this.resendVerification = this.resendVerification.bind(this)
    this.uploadUserAvatar = this.uploadUserAvatar.bind(this)
    this.getMyProfile = this.getMyProfile.bind(this)
    this.updateMyProfile = this.updateMyProfile.bind(this)
    this.getUserVerificationStatus = this.getUserVerificationStatus.bind(this)
  }

  /**
   * POST /admin/users/verify
   * Admin verifies any user account (email, phone, or account confirmation)
   */
  async verifyUser(
    req: Request<{}, {}, userPublic.UnifiedVerificationRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const verificationRequest = req.body

      // Ensure userId is provided for admin verification
      if (!verificationRequest.userId) {
        throw ErrorFactory.badRequest(
          'userId is required for admin verification',
        )
      }

      const user = await this.userService.verify(verificationRequest)

      // Map to admin detail response format
      const adminResponse: userAdmin.AdminUserDetailResponse = {
        id: user.id as any,
        email: user.email as any,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || undefined,
        dateOfBirth: user.dateOfBirth
          ? user.dateOfBirth.toISOString()
          : undefined,
        avatarUrl: user.avatarUrl || undefined,
        status: user.status as any,
        role: user.role as any,
        flags: [],
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        identityVerified: false,
        verificationDate:
          user.emailVerified && user.updatedAt ? user.updatedAt : undefined,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt : undefined,
        lastActivityAt: user.lastLoginAt ? user.lastLoginAt : undefined,
        loginCount: 0,
        ipAddress: undefined,
        userAgent: undefined,
        stats: {
          totalBookings: 0,
          creditsBalance: 0,
          friendsCount: 0,
          followersCount: 0,
          reportsCount: 0,
        },
        adminNotes: undefined,
        suspensionReason: undefined,
        suspendedAt: undefined,
        suspendedBy: undefined,
        description: undefined,
        specialties: undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }

      res.json({
        success: true,
        message: `User ${user.email} verified successfully`,
        user: adminResponse,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/users/resend-verification
   * Admin resends verification (email or phone) for any user
   */
  async resendVerification(
    req: Request<{}, {}, userPublic.UnifiedResendVerificationRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const resendRequest = req.body

      // Ensure userId is provided for admin resend
      if (!resendRequest.userId) {
        throw ErrorFactory.badRequest(
          'userId is required for admin resend verification',
        )
      }

      await this.userService.resendVerification(resendRequest)

      res.json({
        success: true,
        message: `Verification resent successfully`,
      })
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

      res.json({ avatarUrl: url })
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

      // Map user to admin detail response format
      const adminResponse: userAdmin.AdminUserDetailResponse = {
        id: user.id as any,
        email: user.email as any,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || undefined,
        dateOfBirth: user.dateOfBirth
          ? user.dateOfBirth.toISOString()
          : undefined,
        avatarUrl: user.avatarUrl || undefined,
        status: user.status as any, // Status enum mapping
        role: user.role as any, // Role enum mapping
        flags: [], // TODO: Implement flags if needed
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        identityVerified: false, // TODO: Implement identity verification
        verificationDate:
          user.emailVerified && user.updatedAt ? user.updatedAt : undefined,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt : undefined,
        lastActivityAt: user.lastLoginAt ? user.lastLoginAt : undefined,
        loginCount: 0, // TODO: Implement login count tracking
        ipAddress: undefined, // TODO: Track IP addresses if needed
        userAgent: undefined, // TODO: Track user agents if needed
        stats: {
          totalBookings: 0, // TODO: Implement booking stats
          creditsBalance: 0, // TODO: Implement credits
          friendsCount: 0,
          followersCount: 0, // TODO: Implement followers
          reportsCount: 0, // TODO: Implement reports
        },
        adminNotes: undefined, // TODO: Implement admin notes
        suspensionReason: undefined,
        suspendedAt: undefined,
        suspendedBy: undefined,
        description: undefined,
        specialties: undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }

      res.json(adminResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /admin/users/me
   * Update current admin user profile
   */
  async updateMyProfile(
    req: Request<{}, {}, userAdmin.UpdateAdminProfileRequest>,
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

      // Return updated profile in same format as getMyProfile
      const adminResponse: userAdmin.AdminUserDetailResponse = {
        id: updatedUser.id as any,
        email: updatedUser.email as any,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber || undefined,
        dateOfBirth: updatedUser.dateOfBirth
          ? updatedUser.dateOfBirth.toISOString()
          : undefined,
        avatarUrl: updatedUser.avatarUrl || undefined,
        status: updatedUser.status as any,
        role: updatedUser.role as any,
        flags: [],
        emailVerified: updatedUser.emailVerified,
        phoneVerified: updatedUser.phoneVerified,
        identityVerified: false,
        verificationDate:
          updatedUser.emailVerified && updatedUser.updatedAt
            ? updatedUser.updatedAt
            : undefined,
        lastLoginAt: updatedUser.lastLoginAt
          ? updatedUser.lastLoginAt
          : undefined,
        lastActivityAt: updatedUser.lastLoginAt
          ? updatedUser.lastLoginAt
          : undefined,
        loginCount: 0,
        ipAddress: undefined,
        userAgent: undefined,
        stats: {
          totalBookings: 0,
          creditsBalance: 0,
          friendsCount: 0, // friends feature removed
          followersCount: 0,
          reportsCount: 0,
        },
        adminNotes: updateData.adminNotes,
        suspensionReason: undefined,
        suspendedAt: undefined,
        suspendedBy: undefined,
        description: undefined, // professional feature removed
        specialties: undefined, // professional feature removed
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      }

      res.json(adminResponse)
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
    res: Response<userAdmin.UserVerificationStatusResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      const user = await this.userService.getUserById(id)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', id)
      }

      const verificationStatus: userAdmin.UserVerificationStatusResponse = {
        userId: user.id as any,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        identityVerified: false, // TODO: Implement identity verification
        verificationDate:
          user.emailVerified && user.updatedAt ? user.updatedAt : undefined,
      }

      res.json(verificationStatus)
    } catch (error) {
      next(error)
    }
  }
}
