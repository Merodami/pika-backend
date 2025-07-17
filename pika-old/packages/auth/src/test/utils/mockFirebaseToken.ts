/**
 * Mock Firebase Token Utilities for Testing
 *
 * Provides utilities for creating mock Firebase ID tokens for testing purposes.
 * These utilities are only intended for use in test environments with Firebase emulator.
 */

export interface MockFirebaseUser {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  emailVerified: boolean
}

export interface MockTokenPayload {
  iss: string
  aud: string
  auth_time: number
  user_id: string
  sub: string
  iat: number
  exp: number
  email: string
  email_verified: boolean
  name?: string
  picture?: string
  firebase: {
    identities: {
      'google.com': string[]
      email: string[]
    }
    sign_in_provider: string
  }
  uid: string
}

/**
 * Creates a mock Firebase ID token for testing purposes
 *
 * @param user - Mock user data
 * @param provider - Authentication provider (default: 'google.com')
 * @param projectId - Firebase project ID (default: from env or 'pika-test')
 * @returns Mock Firebase ID token string
 */
export function createMockFirebaseIdToken(
  user: MockFirebaseUser,
  provider: string = 'google.com',
  projectId?: string,
): string {
  const now = Math.floor(Date.now() / 1000)
  const project = projectId || process.env.FIREBASE_PROJECT_ID || 'pika-test'

  const payload: MockTokenPayload = {
    iss: `https://securetoken.google.com/${project}`,
    aud: project,
    auth_time: now,
    user_id: user.uid,
    sub: user.uid,
    iat: now,
    exp: now + 3600, // 1 hour expiry
    email: user.email,
    email_verified: user.emailVerified,
    name: user.displayName,
    picture: user.photoURL,
    firebase: {
      identities: {
        'google.com': [user.uid],
        email: [user.email],
      },
      sign_in_provider: provider,
    },
    uid: user.uid,
  }

  // Create JWT structure with no signature (alg: 'none') for testing
  const header = { alg: 'none', typ: 'JWT' }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
    'base64url',
  )
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  )

  return `${encodedHeader}.${encodedPayload}.`
}

/**
 * Creates a mock Firebase user object for testing
 *
 * @param overrides - Optional overrides for default user properties
 * @returns Mock Firebase user object
 */
export function createMockFirebaseUser(
  overrides: Partial<MockFirebaseUser> = {},
): MockFirebaseUser {
  return {
    uid: 'test-firebase-uid-123',
    email: 'firebase-test@example.com',
    displayName: 'Firebase Test User',
    photoURL: 'https://example.com/photo.jpg',
    emailVerified: true,
    ...overrides,
  }
}
