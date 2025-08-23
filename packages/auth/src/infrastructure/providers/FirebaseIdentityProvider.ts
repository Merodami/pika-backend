import {
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_PROJECT_ID,
  isFirebaseConfigured,
} from '@pika/environment'
import { logger } from '@pika/shared'
import admin from 'firebase-admin'

import {
  IdentityProvider,
  IdentityProviderFactory,
  IdentityProviderOptions,
  TokenPayload,
} from '../../domain/interfaces/IdentityProvider.js'

/**
 * Firebase Identity Provider implementation
 * Handles Firebase Authentication token verification and user management
 */
export class FirebaseIdentityProvider implements IdentityProvider {
  private app: admin.app.App | null = null
  private initialized = false

  constructor(private readonly options: IdentityProviderOptions) {}

  getType(): string {
    return 'firebase'
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      const isEmulatorEnv =
        process.env.FIREBASE_AUTH_EMULATOR_HOST ||
        process.env.NODE_ENV === 'test'

      if (isEmulatorEnv) {
        // Initialize for emulator - no credentials needed
        this.app = admin.initializeApp(
          {
            projectId: FIREBASE_PROJECT_ID,
          },
          `auth-provider-${Date.now()}`, // Unique name for each instance
        )

        logger.info('Firebase Identity Provider initialized for emulator', {
          projectId: FIREBASE_PROJECT_ID,
          emulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST,
        })
      } else {
        // Production initialization with proper credentials
        if (!isFirebaseConfigured()) {
          logger.warn(
            'Firebase configuration is incomplete. Firebase authentication will not be available.',
          )

          return
        }

        this.app = admin.initializeApp(
          {
            credential: admin.credential.cert({
              projectId: FIREBASE_PROJECT_ID,
              clientEmail: FIREBASE_CLIENT_EMAIL,
              privateKey: FIREBASE_PRIVATE_KEY,
            }),
            projectId: FIREBASE_PROJECT_ID,
          },
          'auth-provider',
        )

        logger.info('Firebase Identity Provider initialized for production')
      }

      this.initialized = true
    } catch (error) {
      logger.error(
        'Failed to initialize Firebase Identity Provider',
        error as Error,
      )
      throw new Error(
        `Firebase initialization failed: ${(error as Error).message}`,
      )
    }
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    if (!this.app) {
      throw new Error('Firebase Identity Provider not initialized')
    }

    try {
      const isEmulatorEnv =
        process.env.FIREBASE_AUTH_EMULATOR_HOST ||
        process.env.NODE_ENV === 'test'

      if (isEmulatorEnv && this.isUnsignedToken(token)) {
        // For unsigned tokens in emulator environment (industry standard approach)
        logger.debug('Processing unsigned token in emulator environment')

        const decoded = this.decodeUnsignedToken(token)

        // Validate token structure
        if (
          !decoded.sub ||
          !decoded.aud ||
          decoded.aud !== FIREBASE_PROJECT_ID
        ) {
          throw new Error('Invalid token structure or audience')
        }

        // Check expiration
        const now = Math.floor(Date.now() / 1000)

        if (decoded.exp && decoded.exp < now) {
          throw new Error('Token has expired')
        }

        // Create normalized token payload matching Firebase ID token format
        return {
          sub: decoded.sub,
          email: decoded.email || null,
          email_verified: decoded.email_verified || false,
          iss: decoded.iss,
          iat: decoded.iat,
          exp: decoded.exp,
          client_id: decoded.aud,
          firebase: decoded.firebase || {
            identities: {},
            sign_in_provider: 'unknown',
          },
          // Include other unique claims
          name: decoded.name,
          picture: decoded.picture,
          auth_time: decoded.auth_time,
          user_id: decoded.user_id,
        }
      }

      // Standard ID token verification for production/signed tokens
      const decodedToken = await this.app.auth().verifyIdToken(token, true)

      return {
        sub: decodedToken.uid,
        email: decodedToken.email || null,
        email_verified: decodedToken.email_verified,
        iss: decodedToken.iss,
        iat: decodedToken.iat,
        exp: decodedToken.exp,
        client_id: decodedToken.aud,
        // Additional Firebase-specific fields
        firebase: {
          identities: decodedToken.firebase.identities,
          sign_in_provider: decodedToken.firebase.sign_in_provider,
          sign_in_second_factor: decodedToken.firebase.sign_in_second_factor,
          tenant: decodedToken.firebase.tenant,
        },
        // Include other token fields
        name: decodedToken.name,
        picture: decodedToken.picture,
        auth_time: decodedToken.auth_time,
      }
    } catch (error) {
      logger.error('Firebase token verification failed', error as Error)

      if ((error as any).code === 'auth/id-token-expired') {
        throw new Error('Token has expired')
      }

      if ((error as any).code === 'auth/id-token-revoked') {
        throw new Error('Token has been revoked')
      }

      if ((error as any).code === 'auth/argument-error') {
        throw new Error('Invalid token format')
      }

      throw new Error('Token verification failed')
    }
  }

  private isUnsignedToken(token: string): boolean {
    try {
      const parts = token.split('.')

      if (parts.length !== 3) return false

      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString())

      // Check for unsigned token (industry standard for Firebase emulator)
      return header.typ === 'JWT' && header.alg === 'none'
    } catch {
      return false
    }
  }

  private decodeUnsignedToken(token: string): any {
    try {
      const parts = token.split('.')

      if (parts.length !== 3) {
        throw new Error('Invalid token format')
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())

      return payload
    } catch (error) {
      logger.error('Failed to decode unsigned token', error as Error)
      throw new Error('Invalid unsigned token format')
    }
  }

  async isTokenValid(token: string): Promise<boolean> {
    try {
      await this.verifyToken(token)

      return true
    } catch {
      return false
    }
  }

  async getUserProfile(userId: string): Promise<admin.auth.UserRecord> {
    if (!this.app) {
      throw new Error('Firebase Identity Provider not initialized')
    }

    try {
      const userRecord = await this.app.auth().getUser(userId)

      return userRecord
    } catch (error) {
      logger.error('Failed to get Firebase user profile', error as Error)

      if ((error as any).code === 'auth/user-not-found') {
        throw new Error('User not found')
      }

      throw new Error('Failed to retrieve user profile')
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
    if (!this.app) {
      throw new Error('Firebase Identity Provider not initialized')
    }

    try {
      const userRecord = await this.app.auth().getUserByEmail(email)

      return userRecord
    } catch (error) {
      if ((error as any).code === 'auth/user-not-found') {
        return null
      }

      logger.error('Failed to get Firebase user by email', error as Error)
      throw new Error('Failed to retrieve user by email')
    }
  }

  /**
   * Create custom token for a user
   * Useful for server-side authentication flows
   */
  async createCustomToken(userId: string, claims?: object): Promise<string> {
    if (!this.app) {
      throw new Error('Firebase Identity Provider not initialized')
    }

    try {
      const customToken = await this.app
        .auth()
        .createCustomToken(userId, claims)

      return customToken
    } catch (error) {
      logger.error('Failed to create custom token', error as Error)
      throw new Error('Failed to create custom token')
    }
  }

  /**
   * Get Firebase Auth instance
   * Used for advanced operations like creating users with providers
   */
  getAuth(): admin.auth.Auth {
    if (!this.app) {
      throw new Error('Firebase Identity Provider not initialized')
    }
    return this.app.auth()
  }

  /**
   * Revoke refresh tokens for a user
   * Forces re-authentication on all devices
   */
  async revokeRefreshTokens(userId: string): Promise<void> {
    if (!this.app) {
      throw new Error('Firebase Identity Provider not initialized')
    }

    try {
      await this.app.auth().revokeRefreshTokens(userId)
      logger.info(`Revoked refresh tokens for user: ${userId}`)
    } catch (error) {
      logger.error('Failed to revoke refresh tokens', error as Error)
      throw new Error('Failed to revoke user tokens')
    }
  }

  /**
   * Set custom user claims
   * Useful for role-based access control
   */
  async setCustomUserClaims(userId: string, claims: object): Promise<void> {
    if (!this.app) {
      throw new Error('Firebase Identity Provider not initialized')
    }

    try {
      await this.app.auth().setCustomUserClaims(userId, claims)
      logger.info(`Set custom claims for user: ${userId}`)
    } catch (error) {
      logger.error('Failed to set custom user claims', error as Error)
      throw new Error('Failed to set user claims')
    }
  }

  /**
   * Delete a user from Firebase
   */
  async deleteUser(userId: string): Promise<void> {
    if (!this.app) {
      throw new Error('Firebase Identity Provider not initialized')
    }

    try {
      await this.app.auth().deleteUser(userId)
      logger.info(`Deleted Firebase user: ${userId}`)
    } catch (error) {
      logger.error('Failed to delete Firebase user', error as Error)
      throw new Error('Failed to delete user')
    }
  }

  /**
   * List all users (paginated)
   */
  async listUsers(
    maxResults = 1000,
    pageToken?: string,
  ): Promise<admin.auth.ListUsersResult> {
    if (!this.app) {
      throw new Error('Firebase Identity Provider not initialized')
    }

    try {
      const listUsersResult = await this.app
        .auth()
        .listUsers(maxResults, pageToken)

      return listUsersResult
    } catch (error) {
      logger.error('Failed to list Firebase users', error as Error)
      throw new Error('Failed to list users')
    }
  }
}

/**
 * Factory for creating Firebase Identity Provider instances
 */
export class FirebaseIdentityProviderFactory
  implements IdentityProviderFactory
{
  async createProvider(
    options: IdentityProviderOptions,
  ): Promise<IdentityProvider> {
    const provider = new FirebaseIdentityProvider(options)

    await provider.initialize()

    return provider
  }
}

/**
 * Helper function to extract provider from Firebase token
 */
export function getProviderFromToken(tokenPayload: TokenPayload): string {
  const firebase = tokenPayload.firebase as any

  if (firebase?.sign_in_provider) {
    // Map Firebase provider IDs to our standard provider names
    const providerMap: { [key: string]: string } = {
      'google.com': 'google',
      'facebook.com': 'facebook',
      'apple.com': 'apple',
      password: 'email',
      phone: 'phone',
      anonymous: 'anonymous',
      custom: 'custom',
    }

    return providerMap[firebase.sign_in_provider] || firebase.sign_in_provider
  }

  return 'unknown'
}

/**
 * Helper function to check if a token is from a social provider
 */
export function isSocialAuthToken(tokenPayload: TokenPayload): boolean {
  const provider = getProviderFromToken(tokenPayload)

  return ['google', 'facebook', 'apple'].includes(provider)
}
