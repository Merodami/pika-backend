import { ErrorFactory, logger } from '@pika/shared'
import { PrismaClient, User, UserStatus } from '@prisma/client'

import { FirebaseUserClaims } from '../../infrastructure/firebase/FirebaseAuthService.js'
import {
  AuthenticationResult,
  AuthenticationStrategy,
  DeviceInfo,
} from './AuthenticationStrategy.js'

export class GoogleAuthStrategy implements AuthenticationStrategy {
  readonly provider = 'google'

  constructor(private prisma: PrismaClient) {}

  async authenticate(
    claims: FirebaseUserClaims,
    deviceInfo: DeviceInfo,
  ): Promise<AuthenticationResult> {
    logger.info('Authenticating user with Google', {
      email: claims.email,
      firebaseUid: claims.uid,
    })

    try {
      // Start transaction for atomic operations
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Check if user exists by Firebase UID
        const identity = await tx.userIdentity.findUnique({
          where: { firebaseUid: claims.uid },
          include: { user: true },
        })

        let user: User
        let isNewUser = false

        if (identity) {
          // Existing user - update identity
          user = identity.user

          await tx.userIdentity.update({
            where: { id: identity.id },
            data: {
              lastLogin: new Date(),
              lastSignInMethod: this.provider,
              isEmailVerified: claims.emailVerified,
              providerData: {
                email: claims.email,
                name: claims.name,
                picture: claims.picture,
                locale: (claims.customClaims as any)?.locale,
              },
            },
          })
        } else {
          // Check if user exists by email
          const existingUser = await tx.user.findUnique({
            where: { email: claims.email! },
            include: { identities: true },
          })

          if (existingUser) {
            // Link to existing user
            user = existingUser

            // Create new identity for this provider
            await tx.userIdentity.create({
              data: {
                userId: user.id,
                provider: this.provider,
                providerId: claims.uid,
                firebaseUid: claims.uid,
                lastSignInMethod: this.provider,
                isEmailVerified: claims.emailVerified,
                providerData: {
                  email: claims.email,
                  name: claims.name,
                  picture: claims.picture,
                  locale: (claims.customClaims as any)?.locale,
                },
              },
            })
          } else {
            // Create new user
            isNewUser = true

            const names = this.extractNames(claims.name)

            user = await tx.user.create({
              data: {
                email: claims.email!,
                emailVerified: claims.emailVerified,
                firstName: names.firstName,
                lastName: names.lastName,
                avatarUrl: claims.picture,
                role: 'CUSTOMER',
                status: UserStatus.ACTIVE,
                lastLoginAt: new Date(),
              },
            })

            // Create identity
            await tx.userIdentity.create({
              data: {
                userId: user.id,
                provider: this.provider,
                providerId: claims.uid,
                firebaseUid: claims.uid,
                lastSignInMethod: this.provider,
                isEmailVerified: claims.emailVerified,
                providerData: {
                  email: claims.email,
                  name: claims.name,
                  picture: claims.picture,
                  locale: (claims.customClaims as any)?.locale,
                },
              },
            })
          }
        }

        // Check if user is active
        if (user.status !== UserStatus.ACTIVE) {
          throw ErrorFactory.unauthorized('Account is disabled', {
            source: 'GoogleAuthStrategy.authenticate',
            metadata: {
              userId: user.id,
              firebaseUid: claims.uid,
              email: claims.email,
              userStatus: user.status,
            },
          })
        }

        // Track auth method usage
        await tx.userAuthMethod.upsert({
          where: {
            userId_authMethod: {
              userId: user.id,
              authMethod: this.provider,
            },
          },
          create: {
            userId: user.id,
            authMethod: this.provider,
            isVerified: true,
            lastUsedAt: new Date(),
            providerData: {
              email: claims.email,
              name: claims.name,
            },
          },
          update: {
            lastUsedAt: new Date(),
            isVerified: true,
          },
        })

        // Update or create device info
        await tx.userDevice.upsert({
          where: {
            userId_deviceId: {
              userId: user.id,
              deviceId: deviceInfo.deviceId,
            },
          },
          create: {
            userId: user.id,
            deviceId: deviceInfo.deviceId,
            deviceName: deviceInfo.deviceName,
            deviceType: deviceInfo.deviceType,
            fcmToken: deviceInfo.fcmToken,
            lastIpAddress: deviceInfo.ipAddress,
            lastLocation: deviceInfo.location
              ? {
                  lat: deviceInfo.location.lat,
                  lng: deviceInfo.location.lng,
                  city: deviceInfo.location.city,
                  country: deviceInfo.location.country,
                }
              : undefined,
            browserInfo: {
              userAgent: deviceInfo.userAgent,
            },
          },
          update: {
            fcmToken: deviceInfo.fcmToken,
            lastIpAddress: deviceInfo.ipAddress,
            lastActiveAt: new Date(),
            lastLocation: deviceInfo.location
              ? {
                  lat: deviceInfo.location.lat,
                  lng: deviceInfo.location.lng,
                  city: deviceInfo.location.city,
                  country: deviceInfo.location.country,
                }
              : undefined,
          },
        })

        // Log security event
        await tx.securityEvent.create({
          data: {
            userId: user.id,
            eventType: isNewUser ? 'signup_google' : 'login_google',
            eventData: {
              provider: this.provider,
              email: claims.email,
              isNewUser,
            },
            ipAddress: deviceInfo.ipAddress,
            userAgent: deviceInfo.userAgent,
            location: deviceInfo.location
              ? {
                  lat: deviceInfo.location.lat,
                  lng: deviceInfo.location.lng,
                  city: deviceInfo.location.city,
                  country: deviceInfo.location.country,
                }
              : undefined,
            riskScore: 0, // Google auth is trusted
          },
        })

        // Update last login
        await tx.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        // Check if MFA is required
        const mfaSettings = await tx.userMfaSettings.findUnique({
          where: { userId: user.id },
        })

        return {
          user,
          isNewUser,
          requiresAdditionalInfo: !user.phoneNumber && isNewUser,
          requiresMfa: mfaSettings?.isEnabled ?? false,
          authMethod: this.provider,
          firebaseUid: claims.uid,
          provider: this.provider,
          providerData: {
            email: claims.email,
            name: claims.name,
            picture: claims.picture,
          },
        }
      })

      logger.info('Successfully authenticated user with Google', {
        userId: result.user.id,
        isNewUser: result.isNewUser,
      })

      return result
    } catch (error) {
      logger.error('Google authentication failed', { error })
      throw ErrorFactory.fromError(error, 'Google authentication failed', {
        source: 'GoogleAuthStrategy.authenticate',
        metadata: {
          firebaseUid: claims.uid,
          email: claims.email,
          provider: this.provider,
        },
      })
    }
  }

  async linkAccount(userId: string, claims: FirebaseUserClaims): Promise<void> {
    try {
      logger.info('Linking Google account to user', {
        userId,
        email: claims.email,
      })

      await this.prisma.$transaction(async (tx) => {
        // Check if identity already exists
        const existingIdentity = await tx.userIdentity.findFirst({
          where: {
            OR: [
              { firebaseUid: claims.uid },
              { provider: this.provider, providerId: claims.uid },
            ],
          },
        })

        if (existingIdentity) {
          if (existingIdentity.userId === userId) {
            // Already linked to this user
            return
          }
          throw ErrorFactory.resourceConflict(
            'Google account',
            'This Google account is already linked to another user',
            {
              source: 'GoogleAuthStrategy.linkAccount',
              metadata: {
                userId,
                firebaseUid: claims.uid,
                email: claims.email,
                existingUserId: existingIdentity.userId,
              },
            },
          )
        }

        // Create new identity
        await tx.userIdentity.create({
          data: {
            userId,
            provider: this.provider,
            providerId: claims.uid,
            firebaseUid: claims.uid,
            lastSignInMethod: this.provider,
            isEmailVerified: claims.emailVerified,
            providerData: {
              email: claims.email,
              name: claims.name,
              picture: claims.picture,
            },
          },
        })

        // Track auth method
        await tx.userAuthMethod.create({
          data: {
            userId,
            authMethod: this.provider,
            isVerified: true,
            providerData: {
              email: claims.email,
              name: claims.name,
            },
          },
        })

        // Log security event
        await tx.securityEvent.create({
          data: {
            userId,
            eventType: 'link_google_account',
            eventData: {
              provider: this.provider,
              email: claims.email,
            },
            riskScore: 0,
          },
        })
      })

      logger.info('Successfully linked Google account', { userId })
    } catch (error) {
      logger.error('Failed to link Google account', { userId, error })
      throw ErrorFactory.fromError(error, 'Failed to link Google account', {
        source: 'GoogleAuthStrategy.linkAccount',
        metadata: {
          userId,
          firebaseUid: claims.uid,
          email: claims.email,
        },
      })
    }
  }

  async unlinkAccount(userId: string): Promise<void> {
    try {
      logger.info('Unlinking Google account from user', { userId })

      await this.prisma.$transaction(async (tx) => {
        // Delete identity
        const deleted = await tx.userIdentity.deleteMany({
          where: {
            userId,
            provider: this.provider,
          },
        })

        if (deleted.count === 0) {
          throw ErrorFactory.resourceNotFound('Google account', userId, {
            source: 'GoogleAuthStrategy.unlinkAccount',
          })
        }

        // Remove auth method
        await tx.userAuthMethod.deleteMany({
          where: {
            userId,
            authMethod: this.provider,
          },
        })

        // Log security event
        await tx.securityEvent.create({
          data: {
            userId,
            eventType: 'unlink_google_account',
            eventData: {
              provider: this.provider,
            },
            riskScore: 10, // Slightly elevated for account changes
          },
        })
      })

      logger.info('Successfully unlinked Google account', { userId })
    } catch (error) {
      logger.error('Failed to unlink Google account', { userId, error })
      throw ErrorFactory.fromError(error, 'Failed to unlink Google account', {
        source: 'GoogleAuthStrategy.unlinkAccount',
        metadata: {
          userId,
          provider: this.provider,
        },
      })
    }
  }

  private extractNames(fullName?: string): {
    firstName: string
    lastName: string
  } {
    if (!fullName) {
      return { firstName: 'User', lastName: '' }
    }

    const parts = fullName.trim().split(' ')
    const firstName = parts[0] || 'User'
    const lastName = parts.slice(1).join(' ') || ''

    return { firstName, lastName }
  }
}
