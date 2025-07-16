import type {
    CreateEmailVerificationTokenRequest,
    CreatePasswordResetTokenRequest,
    CreateUserRequest,
    EmailParam,
    PhoneParam,
    UpdateLastLoginRequest,
    UpdatePasswordRequest,
    UserIdParam,
    ValidateEmailVerificationTokenRequest,
    ValidatePasswordResetTokenRequest,
    VerifyEmailRequest,
} from '@pika/api/internal'
import { ErrorFactory } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

import type { IInternalUserService } from '../services/InternalUserService.js'

/**
 * Handles internal user operations for service-to-service communication
 */
export class InternalUserController {
  constructor(private readonly internalUserService: IInternalUserService) {
    // Bind methods to preserve 'this' context
    this.getUserAuthDataByEmail = this.getUserAuthDataByEmail.bind(this)
    this.getUserAuthData = this.getUserAuthData.bind(this)
    this.createUser = this.createUser.bind(this)
    this.updateLastLogin = this.updateLastLogin.bind(this)
    this.checkEmailExists = this.checkEmailExists.bind(this)
    this.checkPhoneExists = this.checkPhoneExists.bind(this)
    this.updatePassword = this.updatePassword.bind(this)
    this.verifyEmail = this.verifyEmail.bind(this)
    this.createPasswordResetToken = this.createPasswordResetToken.bind(this)
    this.validatePasswordResetToken = this.validatePasswordResetToken.bind(this)
    this.invalidatePasswordResetToken =
      this.invalidatePasswordResetToken.bind(this)
    this.createEmailVerificationToken =
      this.createEmailVerificationToken.bind(this)
    this.validateEmailVerificationToken =
      this.validateEmailVerificationToken.bind(this)
  }

  /**
   * GET /internal/users/auth/by-email/:email
   * Get user authentication data by email
   */
  async getUserAuthDataByEmail(
    req: Request<EmailParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = req.params
      const user = await this.internalUserService.getUserAuthDataByEmail(email)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', 'User not found')
      }

      res.json(user)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/users/auth/:id
   * Get user authentication data by ID
   */
  async getUserAuthData(
    req: Request<UserIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const user = await this.internalUserService.getUserAuthData(id)

      if (!user) {
        throw ErrorFactory.resourceNotFound('User', 'User not found')
      }

      res.json(user)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users
   * Create new user for registration
   */
  async createUser(
    req: Request<{}, {}, CreateUserRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.body
      const user = await this.internalUserService.createUser(data)

      res.status(201).json(user)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/:id/last-login
   * Update user's last login timestamp
   */
  async updateLastLogin(
    req: Request<UserIdParam, {}, UpdateLastLoginRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      await this.internalUserService.updateLastLogin(id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/users/check-email/:email
   * Check if email already exists
   */
  async checkEmailExists(
    req: Request<EmailParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = req.params
      const exists = await this.internalUserService.checkEmailExists(email)

      res.json({ exists })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/users/check-phone/:phone
   * Check if phone number already exists
   */
  async checkPhoneExists(
    req: Request<PhoneParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { phone } = req.params
      const exists = await this.internalUserService.checkPhoneExists(phone)

      res.json({ exists })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/:id/password
   * Update user's hashed password
   */
  async updatePassword(
    req: Request<UserIdParam, {}, UpdatePasswordRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const { passwordHash } = req.body

      await this.internalUserService.updatePassword(id, passwordHash)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/:id/verify-email
   * Mark user's email as verified
   */
  async verifyEmail(
    req: Request<UserIdParam, {}, VerifyEmailRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      await this.internalUserService.verifyEmail(id)
      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/:id/password-reset-token
   * Create password reset token for user
   */
  async createPasswordResetToken(
    req: Request<UserIdParam, {}, CreatePasswordResetTokenRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const token = await this.internalUserService.createPasswordResetToken(id)

      res.json({ token })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/validate-password-reset-token
   * Validate password reset token and return user ID
   */
  async validatePasswordResetToken(
    req: Request<{}, {}, ValidatePasswordResetTokenRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token } = req.body
      const userId =
        await this.internalUserService.validatePasswordResetToken(token)

      res.json({ userId })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/invalidate-password-reset-token
   * Invalidate password reset token after use
   */
  async invalidatePasswordResetToken(
    req: Request<{}, {}, ValidatePasswordResetTokenRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token } = req.body

      await this.internalUserService.invalidatePasswordResetToken(token)
      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/:id/email-verification-token
   * Create email verification token for user
   */
  async createEmailVerificationToken(
    req: Request<UserIdParam, {}, CreateEmailVerificationTokenRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const token =
        await this.internalUserService.createEmailVerificationToken(id)

      res.json({ token })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/users/validate-email-verification-token
   * Validate email verification token and return user ID
   */
  async validateEmailVerificationToken(
    req: Request<{}, {}, ValidateEmailVerificationTokenRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { token } = req.body
      const userId =
        await this.internalUserService.validateEmailVerificationToken(token)

      res.json({ userId })
    } catch (error) {
      next(error)
    }
  }
}
