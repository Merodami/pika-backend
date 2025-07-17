import { FirebaseAdminClient, logger } from '@pika/shared'

import {
  FirebaseTokenResponse,
  GenerateFirebaseTokenCommand,
} from '../../../domain/commands/GenerateFirebaseTokenCommand.js'

/**
 * Firebase Custom Claims Interface
 */
interface FirebaseCustomClaims {
  userId: string
  role: 'customer' | 'provider' | 'admin'
  purpose: 'messaging' | 'notifications' | 'real-time'
  permissions: string[]
}

/**
 * Generate Firebase Token Command Handler
 *
 * Handles the generation of Firebase custom tokens for authenticated users.
 * This implementation is provider-agnostic and works with any identity provider.
 */
export class GenerateFirebaseTokenCommandHandler {
  constructor(
    private readonly firebaseAdmin: FirebaseAdminClient,
    private readonly loggerInstance = logger,
  ) {}

  async execute(
    command: GenerateFirebaseTokenCommand,
  ): Promise<FirebaseTokenResponse> {
    const startTime = Date.now()

    try {
      // Validate input parameters
      this.validateCommand(command)

      // Determine token expiration (default 1 hour, max 1 hour)
      const expiresIn = Math.min(command.expiresIn || 3600, 3600)
      const issuedAt = Math.floor(Date.now() / 1000)
      const expiresAt = issuedAt + expiresIn
      const expiresAtISO = new Date(expiresAt * 1000).toISOString()

      // Build custom claims (provider-agnostic - uses standardized user data)
      const customClaims = this.buildCustomClaims(command)

      // Debug log the claims being sent to Firebase
      this.loggerInstance.info('Creating Firebase custom token with claims:', {
        userId: command.userId,
        claims: customClaims,
        claimsKeys: Object.keys(customClaims),
      })

      // Generate Firebase custom token with backend user ID as UID
      // This ensures Firebase UID = Backend User ID regardless of identity provider
      const customToken = await this.firebaseAdmin.auth.createCustomToken(
        command.userId, // Use backend user ID as Firebase UID
        customClaims,
      )

      // Log successful token issuance with enhanced metrics
      this.loggerInstance.info('Firebase custom token generated successfully', {
        userId: command.userId,
        purpose: command.purpose || 'real-time',
        role: customClaims.role,
        permissions: customClaims.permissions,
        expiresAt: expiresAtISO,
        expiresIn,
        requestId: command.metadata?.requestId,
        processingTime: Date.now() - startTime,
        userAgent: command.metadata?.userAgent,
        ipAddress: command.metadata?.ipAddress,
        // Add metrics for monitoring
        metrics: {
          tokenGenerationDuration: Date.now() - startTime,
          tokenSize: customToken.length,
          claimsCount: Object.keys(customClaims).length,
        },
      })

      return {
        customToken,
        expiresAt: expiresAtISO,
        claims: {
          userId: command.userId,
          role: customClaims.role,
          purpose: customClaims.purpose,
        },
      }
    } catch (error) {
      // Log error with enhanced context for debugging
      this.loggerInstance.error('Failed to generate Firebase custom token', {
        userId: command.userId,
        purpose: command.purpose || 'real-time',
        expiresIn: command.expiresIn,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        requestId: command.metadata?.requestId,
        processingTime: Date.now() - startTime,
        userAgent: command.metadata?.userAgent,
        ipAddress: command.metadata?.ipAddress,
        // Add debugging context
        context: {
          commandValid: !!command.userId,
          firebaseAdminAvailable: !!this.firebaseAdmin,
          attemptedRole: this.determineUserRole(command.userId),
        },
      })

      // Re-throw with appropriate error type
      if (error instanceof Error && error.message.includes('invalid-uid')) {
        throw new Error('Invalid user ID format for Firebase token generation')
      }

      throw new Error('Failed to generate Firebase custom token')
    }
  }

  /**
   * Validate command parameters
   */
  private validateCommand(command: GenerateFirebaseTokenCommand): void {
    if (!command.userId) {
      throw new Error('User ID is required')
    }

    if (command.userId.length === 0 || command.userId.length > 128) {
      throw new Error('User ID must be between 1 and 128 characters')
    }

    if (
      command.expiresIn &&
      (command.expiresIn < 300 || command.expiresIn > 3600)
    ) {
      throw new Error('Token expiration must be between 5 minutes and 1 hour')
    }

    const validPurposes = ['messaging', 'notifications', 'real-time']

    if (command.purpose && !validPurposes.includes(command.purpose)) {
      throw new Error(
        `Invalid purpose. Must be one of: ${validPurposes.join(', ')}`,
      )
    }
  }

  /**
   * Build custom claims for the Firebase token
   * This is provider-agnostic and works with any identity provider
   */
  private buildCustomClaims(
    command: GenerateFirebaseTokenCommand,
  ): FirebaseCustomClaims {
    // Default role determination logic
    // In a real implementation, you might fetch this from your user service
    const role = this.determineUserRole(command.userId)

    // Default permissions based on purpose
    const permissions = this.determinePermissions(
      command.purpose || 'real-time',
      role,
    )

    return {
      userId: command.userId,
      role,
      purpose: command.purpose || 'real-time',
      permissions,
    }
  }

  /**
   * Determine user role (simplified logic for now)
   * In production, this should query your user service
   */
  private determineUserRole(userId: string): 'customer' | 'provider' | 'admin' {
    // Simplified logic - in production, fetch from user service
    if (userId === 'internal' || userId.startsWith('admin')) {
      return 'admin'
    }

    // Default to customer for now
    // TODO: Integrate with user service to get actual role
    return 'customer'
  }

  /**
   * Determine permissions based on purpose and role
   */
  private determinePermissions(
    purpose: string,
    role: 'customer' | 'provider' | 'admin',
  ): string[] {
    const basePermissions: string[] = []

    // Add permissions based on purpose
    switch (purpose) {
      case 'messaging':
        basePermissions.push(
          'read:conversations',
          'write:messages',
          'read:messages',
        )
        break
      case 'notifications':
        basePermissions.push('read:notifications', 'update:notifications')
        break
      case 'real-time':
        basePermissions.push(
          'read:conversations',
          'write:messages',
          'read:messages',
          'read:notifications',
          'update:notifications',
        )
        break
    }

    // Add role-specific permissions
    if (role === 'admin') {
      basePermissions.push('admin:all')
    } else if (role === 'provider') {
      basePermissions.push('provider:services')
    }

    return basePermissions
  }
}
