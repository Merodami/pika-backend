import { UserServiceClientAdapter } from '@auth-service/adapters/UserServiceClientAdapter.js'
import {
  createFirebaseAuthStrategy,
  FirebaseAuthStrategy,
  FirebaseCredentials,
  FirebaseIdentityProvider,
  FirebaseIdentityProviderFactory,
  JwtTokenService,
} from '@pika/auth'
import {
  isFirebaseConfigured,
  JWT_ACCESS_EXPIRY,
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_PRIVATE_KEY,
  JWT_PUBLIC_KEY,
  JWT_REFRESH_EXPIRY,
  JWT_SECRET,
} from '@pika/environment'
import { type ICacheService } from '@pika/redis'
import {
  BusinessServiceClient,
  CommunicationServiceClient,
  ErrorFactory,
  logger,
  UserServiceClient,
} from '@pika/shared'
import { SocialProvider } from '@pika/types'

export interface ISocialAuthService {
  socialLogin(data: SocialLoginInput): Promise<SocialLoginResult>
  linkAccount(data: LinkAccountInput): Promise<LinkAccountResult>
  unlinkAccount(data: UnlinkAccountInput): Promise<UnlinkAccountResult>
  getLinkedAccounts(userId: string): Promise<GetLinkedAccountsResult>
}

export interface SocialLoginInput {
  provider: string
  idToken: string
  accessToken?: string
  deviceInfo?: any
  marketingConsent?: boolean
}

export interface SocialLoginResult {
  user: any
  accessToken: string
  refreshToken: string
  isNewUser: boolean
  linkedAccounts?: SocialProvider[]
}

export interface LinkAccountInput {
  userId: string
  provider: string
  idToken: string
  replace?: boolean
}

export interface LinkAccountResult {
  success: boolean
  message: string
  linkedAccounts: SocialProvider[]
}

export interface UnlinkAccountInput {
  userId: string
  provider: string
}

export interface UnlinkAccountResult {
  success: boolean
  message: string
  linkedAccounts: SocialProvider[]
}

export interface GetLinkedAccountsResult {
  linkedAccounts: Array<{
    provider: string
    email?: string
    displayName?: string
    photoUrl?: string
    linkedAt: Date
  }>
}

/**
 * Social Authentication Service
 * Handles Firebase-based social login operations
 */
export class SocialAuthService implements ISocialAuthService {
  private firebaseProvider: FirebaseIdentityProvider | null = null
  private firebaseAuthStrategy: FirebaseAuthStrategy | null = null
  private userServiceAdapter: UserServiceClientAdapter
  private jwtTokenService: JwtTokenService

  constructor(
    private readonly cacheService: ICacheService,
    private readonly userServiceClient: UserServiceClient,
    private readonly communicationClient?: CommunicationServiceClient,
    private readonly businessServiceClient?: BusinessServiceClient,
  ) {
    // Create adapter to connect user service client with auth strategy
    this.userServiceAdapter = new UserServiceClientAdapter(
      userServiceClient,
      businessServiceClient,
    )

    // Create JWT token service
    this.jwtTokenService = new JwtTokenService(
      JWT_SECRET,
      JWT_ACCESS_EXPIRY,
      JWT_REFRESH_EXPIRY,
      JWT_ISSUER,
      JWT_AUDIENCE,
      this.cacheService,
      JWT_ALGORITHM as any,
      JWT_PRIVATE_KEY,
      JWT_PUBLIC_KEY,
    )

    // Initialize Firebase if configured
    this.initializeFirebase()
  }

  private async initializeFirebase(): Promise<void> {
    if (!isFirebaseConfigured()) {
      logger.warn(
        'Firebase is not configured. Social login will not be available.',
      )

      return
    }

    try {
      // Create Firebase identity provider
      const factory = new FirebaseIdentityProviderFactory()

      this.firebaseProvider = (await factory.createProvider({
        type: 'firebase',
        enabled: true,
      })) as FirebaseIdentityProvider

      // Create Firebase auth strategy
      this.firebaseAuthStrategy = createFirebaseAuthStrategy(
        this.firebaseProvider,
        this.userServiceAdapter,
        this.jwtTokenService,
        this.communicationClient,
      )

      logger.info('Firebase social authentication initialized successfully')
    } catch (error) {
      logger.error(
        'Failed to initialize Firebase authentication',
        error as Error,
      )
    }
  }

  /**
   * Authenticate user via social provider
   */
  async socialLogin(data: SocialLoginInput): Promise<SocialLoginResult> {
    if (!this.firebaseAuthStrategy) {
      throw ErrorFactory.serviceUnavailable('Social login is not available')
    }

    // Prepare Firebase credentials
    const credentials: FirebaseCredentials = {
      idToken: data.idToken,
      provider: data.provider,
      deviceInfo: data.deviceInfo,
    }

    // Authenticate using Firebase strategy
    const result = await this.firebaseAuthStrategy.authenticate(credentials)

    if (!result.success || !result.user || !result.tokens) {
      throw ErrorFactory.unauthorized(
        result.error || 'Social authentication failed',
      )
    }

    // Get full user object from user service
    const user = await this.userServiceClient.getUserByEmail(result.user.email)

    if (!user) {
      throw ErrorFactory.serviceUnavailable('Failed to retrieve user data')
    }

    // Check if this is a new user
    const isNewUser = this.isRecentlyCreated(user.createdAt)

    // Get linked accounts for the user
    const linkedAccounts = await this.getUserLinkedProviders(user.id)

    // Update marketing consent if provided
    if (data.marketingConsent !== undefined && isNewUser) {
      await this.updateMarketingConsent(user.id, data.marketingConsent)
    }

    return {
      user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      isNewUser,
      linkedAccounts,
    }
  }

  /**
   * Link a social account to existing user
   */
  async linkAccount(data: LinkAccountInput): Promise<LinkAccountResult> {
    if (!this.firebaseProvider) {
      throw ErrorFactory.serviceUnavailable(
        'Social account linking is not available',
      )
    }

    try {
      // Verify the Firebase ID token
      const tokenPayload = await this.firebaseProvider.verifyToken(data.idToken)

      // Get Firebase user profile
      const firebaseUser = await this.firebaseProvider.getUserProfile(
        tokenPayload.sub,
      )

      // Check if this account is already linked to another user
      const existingUser = await this.findUserByFirebaseUid(tokenPayload.sub)

      if (existingUser && existingUser.id !== data.userId) {
        return {
          success: false,
          message: 'This social account is already linked to another user',
          linkedAccounts: await this.getUserLinkedProviders(data.userId),
        }
      }

      // Link the account
      await this.linkFirebaseAccount(
        data.userId,
        tokenPayload.sub,
        data.provider,
        firebaseUser,
        data.replace,
      )

      // Get updated linked accounts
      const linkedAccounts = await this.getUserLinkedProviders(data.userId)

      return {
        success: true,
        message: `${data.provider} account linked successfully`,
        linkedAccounts,
      }
    } catch (error) {
      logger.error('Failed to link social account', error as Error)

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to link account',
        linkedAccounts: await this.getUserLinkedProviders(data.userId),
      }
    }
  }

  /**
   * Unlink a social account from user
   */
  async unlinkAccount(data: UnlinkAccountInput): Promise<UnlinkAccountResult> {
    try {
      // Get current linked accounts
      const linkedAccounts = await this.getUserLinkedProviders(data.userId)

      // Check if user has at least one other authentication method
      if (linkedAccounts.length <= 1) {
        const hasPassword = await this.userHasPassword(data.userId)

        if (!hasPassword) {
          return {
            success: false,
            message:
              'Cannot unlink the only authentication method. Please set a password first.',
            linkedAccounts,
          }
        }
      }

      // Unlink the account
      await this.unlinkSocialProvider(data.userId, data.provider)

      // Get updated linked accounts
      const updatedAccounts = await this.getUserLinkedProviders(data.userId)

      return {
        success: true,
        message: `${data.provider} account unlinked successfully`,
        linkedAccounts: updatedAccounts,
      }
    } catch (error) {
      logger.error('Failed to unlink social account', error as Error)

      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to unlink account',
        linkedAccounts: await this.getUserLinkedProviders(data.userId),
      }
    }
  }

  /**
   * Get all linked social accounts for a user
   */
  async getLinkedAccounts(userId: string): Promise<GetLinkedAccountsResult> {
    try {
      // This would need to be implemented in UserService
      const getLinkedAccounts = (this.userServiceClient as any)
        .getLinkedSocialAccounts

      if (typeof getLinkedAccounts === 'function') {
        const accounts = await getLinkedAccounts.call(
          this.userServiceClient,
          userId,
        )

        return {
          linkedAccounts: accounts.map((account: any) => ({
            provider: account.provider,
            email: account.email,
            displayName: account.displayName,
            photoUrl: account.photoUrl,
            linkedAt: account.linkedAt,
          })),
        }
      }

      // Fallback if method doesn't exist
      return { linkedAccounts: [] }
    } catch (error) {
      logger.error('Failed to get linked accounts', error as Error)

      return { linkedAccounts: [] }
    }
  }

  /**
   * Helper: Check if user was recently created (within last 5 minutes)
   */
  private isRecentlyCreated(createdAt: Date | string): boolean {
    const created = new Date(createdAt)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    return created > fiveMinutesAgo
  }

  /**
   * Helper: Get user's linked social providers
   */
  private async getUserLinkedProviders(
    userId: string,
  ): Promise<SocialProvider[]> {
    try {
      const getUserProviders = (this.userServiceClient as any)
        .getUserLinkedProviders

      if (typeof getUserProviders === 'function') {
        return await getUserProviders.call(this.userServiceClient, userId)
      }

      return []
    } catch {
      return []
    }
  }

  /**
   * Helper: Update user's marketing consent
   */
  private async updateMarketingConsent(
    userId: string,
    consent: boolean,
  ): Promise<void> {
    try {
      const updateConsent = (this.userServiceClient as any)
        .updateMarketingConsent

      if (typeof updateConsent === 'function') {
        await updateConsent.call(this.userServiceClient, userId, consent)
      }
    } catch (error) {
      logger.error('Failed to update marketing consent', error as Error)
    }
  }

  /**
   * Helper: Find user by Firebase UID
   */
  private async findUserByFirebaseUid(firebaseUid: string): Promise<any> {
    try {
      const findByFirebaseUid = (this.userServiceClient as any)
        .findByFirebaseUid

      if (typeof findByFirebaseUid === 'function') {
        return await findByFirebaseUid.call(this.userServiceClient, firebaseUid)
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Helper: Link Firebase account to user
   */
  private async linkFirebaseAccount(
    userId: string,
    firebaseUid: string,
    provider: string,
    firebaseUser: any,
    replace?: boolean,
  ): Promise<void> {
    const linkAccount = (this.userServiceClient as any).linkSocialAccount

    if (typeof linkAccount === 'function') {
      await linkAccount.call(this.userServiceClient, {
        userId,
        firebaseUid,
        provider,
        providerId: firebaseUser.uid,
        providerData: {
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        },
        replace,
      })
    }
  }

  /**
   * Helper: Unlink social provider from user
   */
  private async unlinkSocialProvider(
    userId: string,
    provider: string,
  ): Promise<void> {
    const unlinkProvider = (this.userServiceClient as any).unlinkSocialProvider

    if (typeof unlinkProvider === 'function') {
      await unlinkProvider.call(this.userServiceClient, userId, provider)
    }
  }

  /**
   * Helper: Check if user has a password set
   */
  private async userHasPassword(userId: string): Promise<boolean> {
    try {
      const user = await this.userServiceClient.getUser(userId)

      return !!(user as any).password
    } catch {
      return false
    }
  }
}
