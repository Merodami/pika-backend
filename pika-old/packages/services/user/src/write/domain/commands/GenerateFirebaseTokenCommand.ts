/**
 * Generate Firebase Token Command
 *
 * Command to generate a Firebase custom token for real-time features
 */
export interface GenerateFirebaseTokenCommand {
  /**
   * User ID from the validated JWT token
   */
  userId: string

  /**
   * Purpose of the Firebase token
   * @default 'real-time'
   */
  purpose?: 'messaging' | 'notifications' | 'real-time'

  /**
   * Token expiration in seconds (5min - 1hour)
   * @default 3600
   */
  expiresIn?: number

  /**
   * Request metadata for logging and audit
   */
  metadata?: {
    requestId?: string
    userAgent?: string
    ipAddress?: string
  }
}

/**
 * Firebase Token Response
 */
export interface FirebaseTokenResponse {
  /**
   * Firebase custom token
   */
  customToken: string

  /**
   * Token expiration timestamp
   */
  expiresAt: string

  /**
   * Custom claims included in the token
   */
  claims: {
    userId: string
    role: string
    purpose: string
  }
}
