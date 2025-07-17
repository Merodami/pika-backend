import {
  FIREBASE_AUTH_EMULATOR_HOST,
  FIREBASE_PROJECT_ID,
  GOOGLE_APPLICATION_CREDENTIALS,
  NODE_ENV,
} from '@pika/environment'
import { logger } from '@pika/shared'
import admin from 'firebase-admin'
import { set } from 'lodash-es'

import { FIREBASE_CONSTANTS } from './constants.js'

// Result interfaces
export interface FirebaseTokenVerificationResult {
  success: boolean
  claims?: FirebaseUserClaims
  error?: string
}

export interface FirebaseCustomTokenResult {
  success: boolean
  token?: string
  error?: string
}

export interface FirebaseUserResult {
  success: boolean
  user?: FirebaseUserRecord
  error?: string
}

export interface FirebaseOperationResult {
  success: boolean
  error?: string
}

// Domain interfaces
export interface FirebaseAuthPort {
  verifyIdToken(idToken: string): Promise<FirebaseTokenVerificationResult>
  createCustomToken(
    uid: string,
    claims?: Record<string, any>,
  ): Promise<FirebaseCustomTokenResult>
  getUserByUid(uid: string): Promise<FirebaseUserResult>
  updateUser(
    uid: string,
    properties: UpdateUserProperties,
  ): Promise<FirebaseUserResult>
  deleteUser(uid: string): Promise<FirebaseOperationResult>
}

// Value objects
export interface FirebaseUserClaims {
  uid: string
  email?: string
  emailVerified: boolean
  phoneNumber?: string
  name?: string
  picture?: string
  provider: string
  authTime: number
  issuedAt: number
  expiresAt: number
  audience: string
  issuer: string
  subject: string
  signInProvider: string
  customClaims?: Record<string, any>
}

export interface FirebaseUserRecord {
  uid: string
  email?: string
  emailVerified: boolean
  phoneNumber?: string
  displayName?: string
  photoURL?: string
  disabled: boolean
  metadata: {
    creationTime: string
    lastSignInTime?: string
    lastRefreshTime?: string
  }
  providerData: Array<{
    uid: string
    email?: string
    phoneNumber?: string
    displayName?: string
    photoURL?: string
    providerId: string
  }>
  customClaims?: Record<string, any>
}

export interface UpdateUserProperties {
  email?: string
  emailVerified?: boolean
  phoneNumber?: string
  displayName?: string
  photoURL?: string
  disabled?: boolean
  customClaims?: Record<string, any>
}

// Error helper functions
function getFirebaseErrorMessage(error: any): string {
  return error?.message || 'Unknown Firebase error'
}

// Note: This function is currently unused but kept for potential future use
function _getFirebaseErrorCode(error: any): string {
  return error?.code || 'unknown_firebase_error'
}

/**
 * Firebase Authentication Service
 *
 * Provides Firebase authentication operations including token verification,
 * user management, and custom token creation. Supports both production
 * and emulator environments for testing.
 *
 * Features:
 * - ID token verification with fallback for emulator testing
 * - User management operations (create, read, update, delete)
 * - Custom token generation for server-to-client authentication
 * - Comprehensive error handling with specific error codes
 * - Singleton pattern for consistent Firebase Admin SDK usage
 */
export class FirebaseAuthService implements FirebaseAuthPort {
  private static instance: FirebaseAuthService
  private auth!: admin.auth.Auth
  private isInitialized = false

  private constructor() {
    this.initializeAuth()
  }

  static getInstance(): FirebaseAuthService {
    if (!FirebaseAuthService.instance) {
      FirebaseAuthService.instance = new FirebaseAuthService()
    }

    return FirebaseAuthService.instance
  }

  private initializeAuth(): void {
    try {
      // Check if Firebase Admin is already initialized
      if (admin.apps.length === 0) {
        // Initialize with environment variables or service account
        if (GOOGLE_APPLICATION_CREDENTIALS) {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          })
        } else {
          // Use emulator in development
          const useEmulator =
            NODE_ENV === 'development' || FIREBASE_AUTH_EMULATOR_HOST

          admin.initializeApp({
            projectId:
              FIREBASE_PROJECT_ID || FIREBASE_CONSTANTS.DEFAULT_PROJECT_ID,
          })

          if (useEmulator) {
            process.env.FIREBASE_AUTH_EMULATOR_HOST =
              FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'
          }
        }
      }

      this.auth = admin.auth()
      this.isInitialized = true
      logger.info('Firebase Auth service initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Firebase Auth service', { error })
      throw new Error('Firebase Auth initialization failed')
    }
  }

  async verifyIdToken(
    idToken: string,
  ): Promise<FirebaseTokenVerificationResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Firebase Auth service is unavailable',
      }
    }

    try {
      logger.debug('Verifying Firebase ID token', {
        tokenLength: idToken.length,
      })

      // In emulator mode, custom tokens can be verified differently
      let decodedToken: admin.auth.DecodedIdToken

      if (FIREBASE_AUTH_EMULATOR_HOST) {
        // For emulator testing, try standard verification first, then fallback to mock parsing
        try {
          decodedToken = await this.auth.verifyIdToken(idToken, false)
        } catch (verificationError) {
          logger.debug(
            'Standard verification failed in emulator, attempting mock token parsing',
          )
          // If it's a mock token format for testing, extract the payload manually
          try {
            const payload = JSON.parse(
              Buffer.from(idToken.split('.')[1], 'base64').toString(),
            )

            if (payload.uid) {
              // For emulator testing, try to get user info from Firebase
              let userRecord: admin.auth.UserRecord | null = null

              try {
                userRecord = await this.auth.getUser(payload.uid)
              } catch {
                // User might not exist in emulator, use payload data
              }

              // Create a mock decoded token structure for emulator testing
              decodedToken = {
                uid: payload.uid,
                sub: payload.uid,
                aud: FIREBASE_PROJECT_ID || 'pika-test',
                iss: `https://securetoken.google.com/${FIREBASE_PROJECT_ID || 'pika-test'}`,
                auth_time: payload.iat || Math.floor(Date.now() / 1000),
                iat: payload.iat || Math.floor(Date.now() / 1000),
                exp: payload.exp || Math.floor(Date.now() / 1000) + 3600,
                email: userRecord?.email || `${payload.uid}@example.com`,
                email_verified: userRecord?.emailVerified ?? true,
                name: userRecord?.displayName || 'Test User',
                picture: userRecord?.photoURL,
                firebase: {
                  identities: {
                    'google.com': [payload.uid],
                    email: [userRecord?.email || `${payload.uid}@example.com`],
                  },
                  sign_in_provider: payload.claims?.provider || 'google.com',
                },
              } as admin.auth.DecodedIdToken
            } else {
              throw verificationError
            }
          } catch (parseError) {
            logger.warn('Failed to parse mock token in emulator mode', {
              error:
                parseError instanceof Error
                  ? parseError.message
                  : 'Unknown error',
            })
            throw verificationError
          }
        }
      } else {
        decodedToken = await this.auth.verifyIdToken(idToken, true)
      }

      const claims: FirebaseUserClaims = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified ?? false,
        phoneNumber: decodedToken.phone_number,
        name: decodedToken.name,
        picture: decodedToken.picture,
        provider: decodedToken.firebase?.identities
          ? Object.keys(decodedToken.firebase.identities)[0]
          : 'unknown',
        authTime: decodedToken.auth_time,
        issuedAt: decodedToken.iat,
        expiresAt: decodedToken.exp,
        audience: decodedToken.aud,
        issuer: decodedToken.iss,
        subject: decodedToken.sub,
        signInProvider: decodedToken.firebase?.sign_in_provider ?? 'unknown',
        customClaims: this.extractCustomClaims(decodedToken),
      }

      logger.info('Successfully verified Firebase ID token', {
        uid: claims.uid,
        provider: claims.provider,
        email: claims.email,
      })

      return {
        success: true,
        claims,
      }
    } catch (error: any) {
      logger.warn('Failed to verify Firebase ID token', {
        error: error?.message || error,
      })

      let errorMessage = 'Failed to verify Firebase ID token'

      if (error?.code) {
        switch (error.code) {
          case FIREBASE_CONSTANTS.ERROR_CODES.ID_TOKEN_EXPIRED:
            errorMessage = 'Firebase ID token has expired'
            break
          case FIREBASE_CONSTANTS.ERROR_CODES.ID_TOKEN_REVOKED:
            errorMessage = 'Firebase ID token has been revoked'
            break
          case FIREBASE_CONSTANTS.ERROR_CODES.INVALID_ID_TOKEN:
            errorMessage = 'Invalid Firebase ID token'
            break
          default:
            errorMessage = getFirebaseErrorMessage(error)
        }
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  async createCustomToken(
    uid: string,
    claims?: Record<string, any>,
  ): Promise<FirebaseCustomTokenResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Firebase Auth service is unavailable',
      }
    }

    try {
      logger.debug('Creating custom token for Firebase user', {
        uid,
        hasCustomClaims: !!claims,
      })

      const customToken = await this.auth.createCustomToken(uid, claims)

      logger.info('Successfully created custom token for Firebase user', {
        uid,
      })

      return {
        success: true,
        token: customToken,
      }
    } catch (error: any) {
      logger.error('Failed to create custom token', { uid, error })

      return {
        success: false,
        error: `Failed to create custom token: ${getFirebaseErrorMessage(error)}`,
      }
    }
  }

  async getUserByUid(uid: string): Promise<FirebaseUserResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Firebase Auth service is unavailable',
      }
    }

    try {
      logger.debug('Fetching Firebase user by UID', { uid })

      const userRecord = await this.auth.getUser(uid)

      const user: FirebaseUserRecord = {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        phoneNumber: userRecord.phoneNumber,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        disabled: userRecord.disabled,
        metadata: {
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
          lastRefreshTime: (userRecord.metadata as any).lastRefreshTime,
        },
        providerData: userRecord.providerData as any,
        customClaims: userRecord.customClaims,
      }

      logger.info('Successfully fetched Firebase user', {
        uid,
        email: user.email,
      })

      return {
        success: true,
        user,
      }
    } catch (error: any) {
      logger.warn('Failed to fetch Firebase user', { uid, error })

      let errorMessage = 'Failed to fetch user'

      if (error?.code === FIREBASE_CONSTANTS.ERROR_CODES.USER_NOT_FOUND) {
        errorMessage = `Firebase user with UID ${uid} not found`
      } else {
        errorMessage = getFirebaseErrorMessage(error)
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  async updateUser(
    uid: string,
    properties: UpdateUserProperties,
  ): Promise<FirebaseUserResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Firebase Auth service is unavailable',
      }
    }

    try {
      logger.debug('Updating Firebase user', {
        uid,
        properties: Object.keys(properties),
      })

      const userRecord = await this.auth.updateUser(uid, properties)

      const user: FirebaseUserRecord = {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        phoneNumber: userRecord.phoneNumber,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        disabled: userRecord.disabled,
        metadata: {
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
          lastRefreshTime: (userRecord.metadata as any).lastRefreshTime,
        },
        providerData: userRecord.providerData as any,
        customClaims: userRecord.customClaims,
      }

      logger.info('Successfully updated Firebase user', { uid })

      return {
        success: true,
        user,
      }
    } catch (error: any) {
      logger.error('Failed to update Firebase user', { uid, error })

      let errorMessage = 'Failed to update user'

      if (error?.code === 'auth/user-not-found') {
        errorMessage = `Firebase user with UID ${uid} not found`
      } else {
        errorMessage = getFirebaseErrorMessage(error)
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  async deleteUser(uid: string): Promise<FirebaseOperationResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        error: 'Firebase Auth service is unavailable',
      }
    }

    try {
      logger.debug('Deleting Firebase user', { uid })

      await this.auth.deleteUser(uid)

      logger.info('Successfully deleted Firebase user', { uid })

      return {
        success: true,
      }
    } catch (error: any) {
      logger.error('Failed to delete Firebase user', { uid, error })

      let errorMessage = 'Failed to delete user'

      if (error?.code === 'auth/user-not-found') {
        errorMessage = `Firebase user with UID ${uid} not found`
      } else {
        errorMessage = getFirebaseErrorMessage(error)
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  private extractCustomClaims(
    decodedToken: admin.auth.DecodedIdToken,
  ): Record<string, any> | undefined {
    // Extract custom claims (any claims that aren't standard Firebase claims)

    const customClaims: Record<string, any> = {}

    let hasCustomClaims = false

    for (const [key, value] of Object.entries(decodedToken)) {
      if (!FIREBASE_CONSTANTS.STANDARD_JWT_CLAIMS.has(key)) {
        set(customClaims, key, value)
        hasCustomClaims = true
      }
    }

    return hasCustomClaims ? customClaims : undefined
  }
}
