/**
 * Firebase Service Constants
 *
 * Centralized constants for Firebase authentication service configuration
 */

export const FIREBASE_CONSTANTS = {
  // Token expiration times
  TOKEN_EXPIRY_SECONDS: 3600, // 1 hour

  // Default project settings
  DEFAULT_PROJECT_ID: 'pika-demo',

  // Provider identifiers
  PROVIDERS: {
    GOOGLE: 'google.com',
    FACEBOOK: 'facebook.com',
    APPLE: 'apple.com',
  } as const,

  // Firebase URL patterns
  SECURE_TOKEN_ISSUER: (projectId: string) =>
    `https://securetoken.google.com/${projectId}`,

  // Error codes
  ERROR_CODES: {
    ID_TOKEN_EXPIRED: 'auth/id-token-expired',
    ID_TOKEN_REVOKED: 'auth/id-token-revoked',
    INVALID_ID_TOKEN: 'auth/invalid-id-token',
    USER_NOT_FOUND: 'auth/user-not-found',
  } as const,

  // Standard JWT claims to exclude from custom claims
  STANDARD_JWT_CLAIMS: new Set([
    'iss',
    'aud',
    'auth_time',
    'user_id',
    'sub',
    'iat',
    'exp',
    'email',
    'email_verified',
    'phone_number',
    'name',
    'picture',
    'firebase',
    'uid',
  ]),
} as const

export type FirebaseProvider =
  (typeof FIREBASE_CONSTANTS.PROVIDERS)[keyof typeof FIREBASE_CONSTANTS.PROVIDERS]
