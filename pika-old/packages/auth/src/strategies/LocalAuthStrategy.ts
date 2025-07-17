import { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import { UserRole, UserStatus } from '@pika/types-core'

import { JwtTokenService } from '../services/JwtTokenService.js'
import { PasswordSecurityService } from '../services/PasswordSecurityService.js'
import {
  AuthResult,
  AuthStrategy,
  LoginCredentials,
  RefreshResult,
  RegistrationData,
} from './AuthStrategy.js'

// User service interface (dependency injection)
export interface UserService {
  findByEmail(email: string): Promise<UserServiceUser | null>
  createUser(data: CreateUserData): Promise<UserServiceUser>
  updateLastLogin(userId: string, loginTime: Date): Promise<void>
  emailExists(email: string): Promise<boolean>
  phoneExists(phoneNumber: string): Promise<boolean>
}

export interface UserServiceUser {
  id: string
  email: string
  password?: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  createdAt: Date
  lastLoginAt?: Date
  isActive(): boolean
}

export interface CreateUserData {
  email: string
  password?: string
  firstName: string
  lastName: string
  phoneNumber?: string
  role: UserRole
  avatarUrl?: string
}

/**
 * Local Authentication Strategy
 * Handles traditional username/password authentication
 * Part of @pika/auth package for proper separation of concerns
 */
export class LocalAuthStrategy implements AuthStrategy {
  readonly name = 'local'

  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordSecurityService,
    private readonly tokenService: JwtTokenService,
  ) {}

  /**
   * Authenticate user with email/password
   */
  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    const startTime = Date.now()

    try {
      // 1. Validate credentials format
      this.validateLoginCredentials(credentials)

      // 2. Find user by email
      const user = await this.userService.findByEmail(
        credentials.email.toLowerCase().trim(),
      )

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password',
        }
      }

      // 3. Check if user is active
      if (!user.isActive()) {
        return {
          success: false,
          error: 'Account is inactive. Please contact support.',
        }
      }

      // 4. Verify password
      if (!user.password) {
        return {
          success: false,
          error: 'Password authentication not available for this account',
        }
      }

      const isPasswordValid = await this.passwordService.verifyPassword(
        credentials.password,
        user.password,
      )

      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid email or password',
        }
      }

      // 5. Update last login time
      await this.userService.updateLastLogin(user.id, new Date())

      // 6. Generate tokens
      const tokens = await this.tokenService.generateTokens(user)

      // 7. Return successful authentication
      logger.info('Local authentication successful', {
        component: 'auth-strategy',
        operation: 'authenticate',
        userId: user.id,
        emailDomain: credentials.email?.split('@')?.[1] || 'unknown',
        duration: Date.now() - startTime,
        source: credentials.source,
      })

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLoginAt: new Date(),
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          refreshExpiresAt: tokens.refreshExpiresAt,
        },
      }
    } catch (error) {
      logger.error('Local authentication failed', error as Error, {
        component: 'auth-strategy',
        operation: 'authenticate',
        emailDomain: credentials.email?.split('@')?.[1] || 'unknown',
        duration: Date.now() - startTime,
      })

      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      }
    }
  }

  /**
   * Register a new user with local authentication
   */
  async register(data: RegistrationData): Promise<AuthResult> {
    const startTime = Date.now()

    try {
      // 1. Validate registration data
      await this.validateRegistrationData(data)

      // 2. Check if user already exists
      const emailExists = await this.userService.emailExists(
        data.email.toLowerCase().trim(),
      )

      if (emailExists) {
        return {
          success: false,
          error: 'Email already registered',
        }
      }

      // Check phone uniqueness if provided
      if (data.phoneNumber) {
        const phoneExists = await this.userService.phoneExists(
          data.phoneNumber.trim(),
        )

        if (phoneExists) {
          return {
            success: false,
            error: 'Phone number already registered',
          }
        }
      }

      // 3. Hash password
      const hashedPassword = await this.passwordService.hashPassword(
        data.password,
      )

      // 4. Create user
      const user = await this.userService.createUser({
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phoneNumber: data.phoneNumber?.trim(),
        role: data.role,
        avatarUrl: data.avatarUrl,
      })

      // 5. Generate tokens
      const tokens = await this.tokenService.generateTokens(user)

      // 6. Return successful registration
      logger.info('Local registration successful', {
        component: 'auth-strategy',
        operation: 'register',
        userId: user.id,
        emailDomain: data.email?.split('@')?.[1] || 'unknown',
        role: data.role,
        duration: Date.now() - startTime,
        source: data.source,
      })

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          refreshExpiresAt: tokens.refreshExpiresAt,
        },
      }
    } catch (error) {
      logger.error('Local registration failed', error as Error, {
        component: 'auth-strategy',
        operation: 'register',
        emailDomain: data.email?.split('@')?.[1] || 'unknown',
        duration: Date.now() - startTime,
      })

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Registration failed. Please try again.',
      }
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    try {
      const result = await this.tokenService.refreshAccessToken(refreshToken)

      // For simplicity, return the same refresh token
      // In production, you might want to rotate refresh tokens
      return {
        success: true,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: refreshToken,
          expiresAt: result.expiresAt,
          refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      }
    }
  }

  /**
   * Logout user and invalidate tokens
   */
  async logout(userId: string, token?: string): Promise<void> {
    try {
      if (token) {
        await this.tokenService.revokeToken(token)
      }
      // Could also implement logout tracking/auditing here
    } catch (error) {
      logger.error('Logout failed', error as Error, {
        component: 'auth-strategy',
        operation: 'logout',
        userId,
      })
      // Don't throw - logout should always succeed from user perspective
    }
  }

  /**
   * Check if strategy supports given credentials
   */
  supports(credentials: any): boolean {
    return !!(credentials.email && credentials.password)
  }

  /**
   * Validate login credentials
   */
  private validateLoginCredentials(credentials: LoginCredentials): void {
    const errors: string[] = []

    if (!credentials.email || !this.isValidEmail(credentials.email)) {
      errors.push('Valid email is required')
    }

    if (!credentials.password || credentials.password.length === 0) {
      errors.push('Password is required')
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }
  }

  /**
   * Validate registration data
   */
  private async validateRegistrationData(
    data: RegistrationData,
  ): Promise<void> {
    const errors: string[] = []

    // Email validation
    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Valid email is required')
    }

    // Password validation using password service
    if (!data.password) {
      errors.push('Password is required')
    } else {
      const passwordValidation = this.passwordService.validatePasswordStrength(
        data.password,
      )

      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors)
      }
    }

    // Name validation
    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push('First name is required')
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push('Last name is required')
    }

    // Role validation
    if (!data.role || !['CUSTOMER', 'PROVIDER', 'ADMIN'].includes(data.role)) {
      errors.push('Valid user role is required')
    }

    // Phone number validation (if provided)
    if (data.phoneNumber && !this.isValidPhoneNumber(data.phoneNumber)) {
      errors.push('Invalid phone number format')
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }
  }

  /**
   * Email validation using RFC 5322 standard
   */
  private isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false

    // Trim whitespace for validation
    const trimmedEmail = email.trim()
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

    return emailRegex.test(trimmedEmail)
  }

  /**
   * Phone number validation (basic international format)
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')

    // Check if it's between 7 and 15 digits (international standard)
    return cleanPhone.length >= 7 && cleanPhone.length <= 15
  }
}

/**
 * Factory function to create LocalAuthStrategy with Redis-enhanced JWT service
 */
export function createLocalAuthStrategy(
  userService: UserService,
  cacheService?: ICacheService,
): LocalAuthStrategy {
  const passwordService = new PasswordSecurityService()

  // Get JWT configuration from environment
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required')
  }

  const tokenService = new JwtTokenService(
    jwtSecret,
    process.env.JWT_ACCESS_EXPIRY || '15m',
    process.env.JWT_REFRESH_EXPIRY || '7d',
    'pika-api',
    'pika-app',
    cacheService,
  )

  return new LocalAuthStrategy(userService, passwordService, tokenService)
}
