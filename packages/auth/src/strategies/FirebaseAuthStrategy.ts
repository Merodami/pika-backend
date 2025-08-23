import { CommunicationServiceClient, logger } from '@pika/shared'
import { UserRole, EmailTemplateKey } from '@pika/types'

import {
  FirebaseIdentityProvider,
  getProviderFromToken,
} from '../infrastructure/providers/FirebaseIdentityProvider.js'
import { JwtTokenService } from '../services/JwtTokenService.js'
import { AuthResult, AuthStrategy, RefreshResult, LoginCredentials, ExternalAuthCredentials } from './AuthStrategy.js'
import {
  CreateUserData,
  UserService,
  UserServiceUser,
} from './LocalAuthStrategy.js'

/**
 * Firebase credentials for authentication
 */
export interface FirebaseCredentials {
  idToken: string
  provider?: string // Optional provider hint
  deviceInfo?: {
    deviceId?: string
    deviceName?: string
    deviceType?: string
    fcmToken?: string
  }
}

/**
 * Firebase Authentication Strategy
 * Handles authentication via Firebase ID tokens from social providers
 */
export class FirebaseAuthStrategy implements AuthStrategy {
  readonly name = 'firebase'

  constructor(
    private readonly firebaseProvider: FirebaseIdentityProvider,
    private readonly userService: UserService,
    private readonly tokenService: JwtTokenService,
    private readonly communicationClient?: CommunicationServiceClient,
  ) {}

  /**
   * Authenticate user with Firebase ID token
   */
  async authenticate(credentials: LoginCredentials | ExternalAuthCredentials | FirebaseCredentials): Promise<AuthResult> {
    // Type guard to ensure we have Firebase credentials
    if (!('idToken' in credentials)) {
      throw new Error('FirebaseAuthStrategy requires Firebase credentials with idToken')
    }
    
    const firebaseCredentials = credentials as FirebaseCredentials
    const startTime = Date.now()

    logger.info('FirebaseAuthStrategy.authenticate called', {
      hasIdToken: !!firebaseCredentials.idToken,
      provider: firebaseCredentials.provider,
      hasDeviceInfo: !!firebaseCredentials.deviceInfo,
    })

    try {
      // 1. Verify Firebase ID token
      const tokenPayload = await this.firebaseProvider.verifyToken(
        firebaseCredentials.idToken,
      )

      logger.info('Firebase token verified', {
        uid: tokenPayload.sub,
        email: tokenPayload.email,
        provider: getProviderFromToken(tokenPayload),
        emailVerified: tokenPayload.email_verified,
      })

      // 2. Get Firebase user profile for additional details
      const firebaseUser = await this.firebaseProvider.getUserProfile(
        tokenPayload.sub,
      )

      // 3. Find user in our database by Firebase UID
      let user = await this.findUserByFirebaseUid(tokenPayload.sub)

      if (!user && tokenPayload.email) {
        // Try to find by email (for account linking scenarios)
        user = await this.userService.findByEmail(tokenPayload.email)

        if (user) {
          // Link Firebase account to existing user
          await this.linkFirebaseAccount(
            user.id,
            tokenPayload.sub,
            firebaseUser,
          )
        }
      }

      if (!user) {
        // Create new user from Firebase profile
        user = await this.createUserFromFirebase(tokenPayload.sub, firebaseUser)
      }

      // 4. Check if user is active
      if (!user.isActive()) {
        return {
          success: false,
          error: 'Account is inactive. Please contact support.',
          errorCode: 'AUTH_USER_INACTIVE',
        }
      }

      // 5. Update last login and device info
      await this.userService.updateLastLogin(user.id, new Date())

      if (firebaseCredentials.deviceInfo) {
        await this.updateDeviceInfo(user.id, firebaseCredentials.deviceInfo)
      }

      // 6. Check for business-specific data if needed
      let enrichedUser = user as any

      if (
        user.role === UserRole.BUSINESS &&
        this.userService.hasActiveBusinesses
      ) {
        const hasActiveBusinesses = await this.userService.hasActiveBusinesses(
          user.id,
        )

        enrichedUser = {
          ...user,
          hasActiveBusinesses,
        }
      }

      // 7. Generate our JWT tokens
      const tokens = await this.tokenService.generateTokens(enrichedUser)

      logger.info('Firebase authentication successful', {
        component: 'firebase-auth-strategy',
        operation: 'authenticate',
        userId: user.id,
        provider: getProviderFromToken(tokenPayload),
        duration: Date.now() - startTime,
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
      logger.error('Firebase authentication failed', error as Error, {
        component: 'firebase-auth-strategy',
        operation: 'authenticate',
        duration: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        errorCode: 'AUTH_FIREBASE_ERROR',
      }
    }
  }

  /**
   * Find user by Firebase UID
   */
  private async findUserByFirebaseUid(
    firebaseUid: string,
  ): Promise<UserServiceUser | null> {
    // This would need to be implemented in UserService
    // For now, we'll use a type assertion
    const findByFirebaseUid = (this.userService as any).findByFirebaseUid

    if (typeof findByFirebaseUid === 'function') {
      return findByFirebaseUid.call(this.userService, firebaseUid)
    }

    return null
  }

  /**
   * Create user from Firebase profile
   */
  private async createUserFromFirebase(
    firebaseUid: string,
    firebaseUser: any, // admin.auth.UserRecord
  ): Promise<UserServiceUser> {
    // Extract user data from Firebase profile
    const userData: CreateUserData = {
      email: firebaseUser.email!,
      firstName: this.extractFirstName(firebaseUser),
      lastName: this.extractLastName(firebaseUser),
      phoneNumber: firebaseUser.phoneNumber,
      role: UserRole.CUSTOMER, // Default role for social login
      acceptTerms: true, // Assumed accepted via social provider
      marketingConsent: false, // Default to false, can be updated later
      avatarUrl: firebaseUser.photoURL,
    }

    // Create user in our database
    const user = await this.userService.createUser(userData)

    // Create user identity record
    await this.createUserIdentity(user.id, firebaseUid, firebaseUser)

    // Mark email as verified if Firebase says so
    if (firebaseUser.emailVerified && !user.emailVerified) {
      await this.userService.verifyEmail(user.id)
    }

    // Send welcome email for new social login users
    if (this.communicationClient && firebaseUser.email) {
      try {
        await this.communicationClient.sendEmail({
          to: firebaseUser.email,
          templateId: EmailTemplateKey.WELCOME_SOCIAL,
          templateParams: {
            firstName: userData.firstName,
            provider: this.getProviderName(firebaseUser),
          },
        })
      } catch (error) {
        logger.error('Failed to send welcome email', error as Error)
      }
    }

    return user
  }

  /**
   * Link Firebase account to existing user
   */
  private async linkFirebaseAccount(
    userId: string,
    firebaseUid: string,
    firebaseUser: any,
  ): Promise<void> {
    await this.createUserIdentity(userId, firebaseUid, firebaseUser)

    logger.info('Linked Firebase account to existing user', {
      userId,
      firebaseUid,
      provider: this.getProviderName(firebaseUser),
    })
  }

  /**
   * Create user identity record
   */
  private async createUserIdentity(
    userId: string,
    firebaseUid: string,
    firebaseUser: any,
  ): Promise<void> {
    // This would need to be implemented in UserService
    const createUserIdentity = (this.userService as any).createUserIdentity

    if (typeof createUserIdentity === 'function') {
      const provider = this.getProviderName(firebaseUser)
      const providerId = this.getProviderId(firebaseUser)

      await createUserIdentity.call(this.userService, {
        userId,
        provider,
        providerId,
        firebaseUid,
        providerData: {
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          phoneNumber: firebaseUser.phoneNumber,
        },
        isEmailVerified: firebaseUser.emailVerified,
        isPhoneVerified: !!firebaseUser.phoneNumber,
      })
    }
  }

  /**
   * Update device information
   */
  private async updateDeviceInfo(
    userId: string,
    deviceInfo: any,
  ): Promise<void> {
    // This would need to be implemented in UserService
    const updateDeviceInfo = (this.userService as any).updateDeviceInfo

    if (typeof updateDeviceInfo === 'function') {
      await updateDeviceInfo.call(this.userService, userId, deviceInfo)
    }
  }

  /**
   * Extract first name from Firebase user
   */
  private extractFirstName(firebaseUser: any): string {
    if (firebaseUser.displayName) {
      const parts = firebaseUser.displayName.split(' ')

      return parts[0] || 'User'
    }

    if (firebaseUser.email) {
      const emailParts = firebaseUser.email.split('@')
      const namePart = emailParts[0]

      return namePart.charAt(0).toUpperCase() + namePart.slice(1)
    }

    return 'User'
  }

  /**
   * Extract last name from Firebase user
   */
  private extractLastName(firebaseUser: any): string {
    if (firebaseUser.displayName) {
      const parts = firebaseUser.displayName.split(' ')

      return parts.slice(1).join(' ') || ''
    }

    return ''
  }

  /**
   * Get provider name from Firebase user
   */
  private getProviderName(firebaseUser: any): string {
    if (firebaseUser.providerData && firebaseUser.providerData.length > 0) {
      const providerInfo = firebaseUser.providerData[0]
      const providerMap: { [key: string]: string } = {
        'google.com': 'google',
        'facebook.com': 'facebook',
        'apple.com': 'apple',
        password: 'email',
      }

      return providerMap[providerInfo.providerId] || providerInfo.providerId
    }

    return 'firebase'
  }

  /**
   * Get provider-specific user ID
   */
  private getProviderId(firebaseUser: any): string {
    if (firebaseUser.providerData && firebaseUser.providerData.length > 0) {
      return firebaseUser.providerData[0].uid || firebaseUser.uid
    }

    return firebaseUser.uid
  }

  /**
   * Refresh token is handled by regular JWT service
   */
  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    try {
      const result = await this.tokenService.refreshAccessToken(refreshToken)

      return {
        success: true,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: refreshToken,
          expiresAt: result.expiresAt,
          refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

      // Optionally revoke Firebase refresh tokens
      // This would sign out the user from all devices
      // await this.firebaseProvider.revokeRefreshTokens(userId)

      logger.info('User logged out', { userId })
    } catch (error) {
      logger.error('Logout failed', error as Error, { userId })
    }
  }

  /**
   * Check if strategy supports given credentials
   */
  supports(credentials: unknown): boolean {
    return !!(
      credentials &&
      typeof credentials === 'object' &&
      'idToken' in credentials
    )
  }

  /**
   * Register is not supported for Firebase strategy
   * Users are created automatically on first social login
   */
  async register(): Promise<AuthResult> {
    return {
      success: false,
      error:
        'Registration not supported for social login. Please use the login flow instead.',
      errorCode: 'AUTH_NOT_SUPPORTED',
    }
  }
}

/**
 * Factory function to create FirebaseAuthStrategy
 */
export function createFirebaseAuthStrategy(
  firebaseProvider: FirebaseIdentityProvider,
  userService: UserService,
  tokenService: JwtTokenService,
  communicationClient?: CommunicationServiceClient,
): FirebaseAuthStrategy {
  return new FirebaseAuthStrategy(
    firebaseProvider,
    userService,
    tokenService,
    communicationClient,
  )
}
