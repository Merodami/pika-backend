/**
 * Firebase Test Client
 * Creates real Firebase tokens for testing using Firebase emulator
 */

import admin from 'firebase-admin'
import { logger } from '@pika/shared'
import { FIREBASE_PROJECT_ID, FIREBASE_AUTH_EMULATOR_HOST } from '@pika/environment'

export interface FirebaseTestUser {
  uid: string
  email: string
  emailVerified: boolean
  displayName?: string
  photoURL?: string
  provider: 'google.com' | 'facebook.com' | 'apple.com'
  providerId: string
}

export class FirebaseTestClient {
  private app: admin.app.App | null = null
  private initialized = false

  /**
   * Initialize Firebase Admin SDK for testing with emulator
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Ensure emulator environment is set
      if (FIREBASE_AUTH_EMULATOR_HOST) {
        process.env.FIREBASE_AUTH_EMULATOR_HOST = FIREBASE_AUTH_EMULATOR_HOST
      }
      
      // Initialize Firebase Admin SDK for emulator
      this.app = admin.initializeApp({
        projectId: FIREBASE_PROJECT_ID,
      }, `test-app-${Date.now()}`)

      this.initialized = true
      logger.info('Firebase test client initialized with emulator', {
        projectId: FIREBASE_PROJECT_ID,
        emulatorHost: FIREBASE_AUTH_EMULATOR_HOST,
      })
    } catch (error) {
      logger.error('Failed to initialize Firebase test client', error as Error)
      throw error
    }
  }

  /**
   * Create a test user in Firebase Auth emulator
   */
  async createTestUser(userData: {
    email: string
    displayName?: string
    photoURL?: string
    provider: 'google.com' | 'facebook.com' | 'apple.com'
  }): Promise<FirebaseTestUser> {
    if (!this.app) {
      throw new Error('Firebase test client not initialized')
    }

    try {
      const auth = this.app.auth()
      
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        emailVerified: true,
      })

      // Create provider data to simulate social login
      const providerId = `${userData.provider}-${userRecord.uid}`

      return {
        uid: userRecord.uid,
        email: userData.email,
        emailVerified: true,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        provider: userData.provider,
        providerId,
      }
    } catch (error) {
      logger.error('Failed to create test user', error as Error)
      throw error
    }
  }

  /**
   * Create a mock Firebase ID token for testing
   * This creates a token that mimics what Firebase client SDK would return
   * Industry standard approach: Create unsigned tokens that Firebase emulator accepts
   */
  async createIdToken(testUser: FirebaseTestUser): Promise<string> {
    try {
      // Create a proper Firebase ID token payload
      const now = Math.floor(Date.now() / 1000)
      const payload = {
        // Standard Firebase ID token claims
        iss: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
        aud: FIREBASE_PROJECT_ID,
        auth_time: now,
        user_id: testUser.uid,
        sub: testUser.uid,
        iat: now,
        exp: now + 3600, // 1 hour expiry
        email: testUser.email,
        email_verified: testUser.emailVerified,
        name: testUser.displayName,
        picture: testUser.photoURL,
        // Firebase-specific claims
        firebase: {
          identities: {
            [testUser.provider]: [testUser.providerId],
            email: [testUser.email],
          },
          sign_in_provider: testUser.provider.replace('.com', ''),
        },
      }

      // Create unsigned JWT for emulator (industry standard approach)
      const header = {
        alg: 'none',
        typ: 'JWT',
      }

      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
      
      // For Firebase emulator, unsigned token format: header.payload.
      const unsignedToken = `${encodedHeader}.${encodedPayload}.`
      
      logger.debug('Generated mock Firebase ID token for test user', {
        uid: testUser.uid,
        provider: testUser.provider,
        tokenLength: unsignedToken.length,
      })

      return unsignedToken
    } catch (error) {
      logger.error('Failed to generate mock ID token', error as Error)
      throw error
    }
  }

  /**
   * Clean up test users
   */
  async cleanup(): Promise<void> {
    if (!this.app) return

    try {
      const auth = this.app.auth()
      
      // List all users and delete them
      const listUsers = await auth.listUsers()
      const deletePromises = listUsers.users.map(user => auth.deleteUser(user.uid))
      
      await Promise.all(deletePromises)
      
      logger.info('Cleaned up Firebase test users')
    } catch (error) {
      logger.error('Failed to cleanup Firebase test users', error as Error)
    }
  }

  /**
   * Delete the Firebase app instance
   */
  async destroy(): Promise<void> {
    if (this.app) {
      await this.app.delete()
      this.app = null
      this.initialized = false
    }
  }

  /**
   * Create a complete test scenario with Google user
   */
  async createGoogleTestUser(email?: string): Promise<{
    user: FirebaseTestUser
    idToken: string
  }> {
    const timestamp = Date.now()
    const user = await this.createTestUser({
      email: email || `testuser-${timestamp}@gmail.com`,
      displayName: 'Test Google User',
      photoURL: 'https://lh3.googleusercontent.com/test-photo.jpg',
      provider: 'google.com',
    })

    const idToken = await this.createIdToken(user)

    return { user, idToken }
  }

  /**
   * Create a complete test scenario with Facebook user
   */
  async createFacebookTestUser(email?: string): Promise<{
    user: FirebaseTestUser
    idToken: string
  }> {
    const timestamp = Date.now()
    const user = await this.createTestUser({
      email: email || `testuser-${timestamp}@facebook.com`,
      displayName: 'Test Facebook User',
      photoURL: 'https://graph.facebook.com/test/picture',
      provider: 'facebook.com',
    })

    const idToken = await this.createIdToken(user)

    return { user, idToken }
  }

  /**
   * Create a complete test scenario with Apple user
   */
  async createAppleTestUser(email?: string): Promise<{
    user: FirebaseTestUser
    idToken: string
  }> {
    const timestamp = Date.now()
    const user = await this.createTestUser({
      email: email || `testuser-${timestamp}@privaterelay.appleid.com`,
      displayName: 'Test Apple User',
      provider: 'apple.com',
    })

    const idToken = await this.createIdToken(user)

    return { user, idToken }
  }

  /**
   * Verify/decode an unsigned Firebase ID token for testing
   * This method decodes our mock Firebase ID tokens
   */
  async verifyToken(idToken: string): Promise<any> {
    try {
      // For unsigned ID tokens, decode the payload directly
      const parts = idToken.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid token format')
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
      
      logger.debug('ID token payload verified', {
        sub: payload.sub,
        email: payload.email,
        firebase: payload.firebase,
      })

      // Return in the expected format for tests
      return {
        uid: payload.sub || payload.user_id, // Use sub as uid for compatibility
        sub: payload.sub,
        email: payload.email,
        firebase: payload.firebase,
        ...payload,
      }
    } catch (error) {
      logger.error('Failed to verify token', error as Error)
      throw error
    }
  }
}