import type { CreateUserData, UserService, UserServiceUser } from '@pika/auth'
import { BusinessServiceClient, UserServiceClient } from '@pika/shared'
import { UserRole, UserStatus } from '@pika/types'

/**
 * Adapter that implements UserService interface using UserServiceClient
 * This allows the auth service to use the User service via HTTP instead of direct database access
 */
export class UserServiceClientAdapter implements UserService {
  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly businessServiceClient?: BusinessServiceClient,
  ) {}

  async findByEmail(email: string): Promise<UserServiceUser | null> {
    const user = await this.userServiceClient.getUserAuthDataByEmail(email)

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      password: user.password ?? undefined,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      emailVerified: user.emailVerified,
      createdAt: new Date(user.createdAt),
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined,
      isActive: () => user.status === UserStatus.ACTIVE,
    }
  }

  async createUser(data: CreateUserData): Promise<UserServiceUser> {
    const user = await this.userServiceClient.createUser({
      email: data.email,
      passwordHash: data.password!,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      dateOfBirth: data.dateOfBirth,
      acceptTerms: data.acceptTerms!,
      marketingConsent: data.marketingConsent,
      role: data.role,
      avatarUrl: data.avatarUrl,
    })

    return {
      id: user.id,
      email: user.email,
      password: user.password ?? undefined,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      emailVerified: user.emailVerified,
      createdAt: new Date(user.createdAt),
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined,
      isActive: () => user.status === UserStatus.ACTIVE,
    }
  }

  async updateLastLogin(userId: string, loginTime: Date): Promise<void> {
    await this.userServiceClient.updateLastLogin(userId, {
      lastLoginAt: loginTime.toISOString(),
    })
  }

  async emailExists(email: string): Promise<boolean> {
    return this.userServiceClient.emailExists(email)
  }

  async phoneExists(phoneNumber: string): Promise<boolean> {
    return this.userServiceClient.phoneExists(phoneNumber)
  }

  async findById(userId: string): Promise<UserServiceUser | null> {
    const user = await this.userServiceClient.getUserAuthData(userId)

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      password: user.password ?? undefined,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      status: user.status as UserStatus,
      emailVerified: user.emailVerified,
      createdAt: new Date(user.createdAt),
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined,
      isActive: () => user.status === UserStatus.ACTIVE,
    }
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.userServiceClient.updatePassword({
      userId: userId,
      passwordHash,
    })
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.userServiceClient.verifyEmail({ userId: userId })
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    return this.userServiceClient.createPasswordResetToken(userId)
  }

  async validatePasswordResetToken(token: string): Promise<string | null> {
    return this.userServiceClient.validatePasswordResetToken({ token })
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    await this.userServiceClient.invalidatePasswordResetToken(token)
  }

  async createEmailVerificationToken(userId: string): Promise<string> {
    return this.userServiceClient.createEmailVerificationToken(userId)
  }

  async validateEmailVerificationToken(token: string): Promise<string | null> {
    return this.userServiceClient.validateEmailVerificationToken(token)
  }

  async hasActiveBusinesses(userId: string): Promise<boolean> {
    // If business service client is not available, assume no active businesses
    if (!this.businessServiceClient) {
      return false
    }

    try {
      // Query the business service to check if user has at least one active and approved business
      // We filter for only active and verified (approved) businesses
      const businesses = await this.businessServiceClient.getBusinessesByUserId(
        userId,
        {
          onlyActive: true,
          onlyVerified: true,
          limit: 1, // We only need to know if at least one exists
        },
      )

      // If we get any results, the user has at least one active and approved business
      return businesses.length > 0
    } catch (error) {
      // If there's an error checking businesses, default to false for security
      console.error('Error checking active businesses:', error)

      return false
    }
  }
}
