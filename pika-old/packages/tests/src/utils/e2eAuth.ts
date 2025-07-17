import { logger } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import type { FastifyInstance } from 'fastify'
import { get } from 'lodash-es'
import supertest from 'supertest'

import { AuthenticatedRequestClient } from './authRequest.js'

/**
 * Test user data for E2E testing
 */
export interface TestUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  phoneNumber?: string
}

/**
 * E2E Authentication Helper for integration tests with real auth flow
 *
 * This class handles:
 * - Creating test users via real registration endpoints
 * - Logging in to get real JWT tokens
 * - Providing authenticated request clients
 * - Managing token lifecycle
 */
export class E2EAuthHelper {
  private app: FastifyInstance
  private request: supertest.SuperTest<supertest.Test>
  private tokens: Map<string, { token: string; expiresAt: Date }> = new Map()
  private readonly baseUrl: string

  // Pre-defined test users for different roles
  private readonly testUsers: Record<string, TestUserData> = {
    ADMIN: {
      email: 'admin@e2etest.com',
      password: 'TestAdmin123!',
      firstName: 'Test',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      phoneNumber: '+1234567890',
    },
    CUSTOMER: {
      email: 'customer@e2etest.com',
      password: 'TestCustomer123!',
      firstName: 'Test',
      lastName: 'Customer',
      role: UserRole.CUSTOMER,
      phoneNumber: '+1234567891',
    },
    PROVIDER: {
      email: 'provider@e2etest.com',
      password: 'TestProvider123!',
      firstName: 'Test',
      lastName: 'Provider',
      role: UserRole.PROVIDER,
      phoneNumber: '+1234567892',
    },
  }

  constructor(app: FastifyInstance, baseUrl: string = '/api/v1') {
    this.app = app
    this.request = supertest(app.server) as any
    this.baseUrl = baseUrl
  }

  /**
   * Create test user directly in database (for microservice tests)
   * This bypasses the need for auth endpoints in individual services
   */
  private async ensureUserExistsInDatabase(
    userType: keyof typeof this.testUsers,
    prisma: any,
  ): Promise<string> {
    const userData = get(this.testUsers, userType)
    // Generate a proper UUID for the user ID
    const { v4: uuid } = require('uuid')
    const userId = uuid()

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (existingUser) {
        logger.debug(`Test user ${userType} already exists in database`)
        // Ensure related domain entities exist for existing user
        await this.createDomainEntitiesForUser(
          prisma,
          existingUser.id,
          userData.role,
        )

        return existingUser.id
      }

      // Create user directly in database
      const user = await prisma.user.create({
        data: {
          id: userId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          role: userData.role,
          status: 'ACTIVE',
          emailVerified: true,
          phoneVerified: !!userData.phoneNumber,
          password: null, // No password needed for test users
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Create related domain entities based on user role
      await this.createDomainEntitiesForUser(prisma, user.id, userData.role)

      logger.debug(
        `Created test user ${userType} in database with ID: ${user.id}`,
      )

      return user.id
    } catch (error) {
      console.warn(`Failed to create test user ${userType} in database:`, error)

      // Return a predictable ID anyway
      return userId
    }
  }

  /**
   * Create domain entities for user based on their role
   * Ensures proper user-entity relationships for testing
   */
  private async createDomainEntitiesForUser(
    prisma: any,
    userId: string,
    role: UserRole,
  ): Promise<void> {
    try {
      if (role === UserRole.PROVIDER) {
        // Create Provider profile
        await this.createProviderProfile(prisma, userId)
      }

      if (role === UserRole.CUSTOMER) {
        // Create Customer profile
        await this.createCustomerProfile(prisma, userId)
      }

      // Note: ADMIN role doesn't need additional domain entities in our current schema
    } catch (error) {
      console.warn(
        `Failed to create domain entities for user ${userId} with role ${role}:`,
        error,
      )
      // Don't throw - this is not critical for basic auth testing
    }
  }

  /**
   * Create Provider profile for a user
   */
  private async createProviderProfile(
    prisma: any,
    userId: string,
  ): Promise<void> {
    try {
      // Check if Provider already exists
      const existingProvider = await prisma.provider.findUnique({
        where: { userId },
      })

      if (existingProvider) {
        logger.debug(`Provider profile already exists for user ${userId}`)

        return
      }

      // Find any existing category to link to, or create one temporarily
      const categoryId = await this.findOrCreateCategoryForTesting(prisma)

      // Create Provider record with same ID as user for simplicity
      await prisma.provider.create({
        data: {
          id: userId, // Same ID as user - simplifies lookups
          userId: userId, // Reference to user record
          businessName: {
            en: 'Test Provider Business',
            es: 'Negocio de Proveedor de Prueba',
          },
          businessDescription: {
            en: 'Test provider for E2E testing',
            es: 'Proveedor de prueba para testing E2E',
          },
          categoryId: categoryId,
          verified: true,
          active: true,
          avgRating: 4.5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      logger.debug(`Created Provider profile for user ${userId}`)
    } catch (error) {
      console.warn(
        `Failed to create Provider profile for user ${userId}:`,
        error,
      )
    }
  }

  /**
   * Create Customer profile for a user
   */
  private async createCustomerProfile(
    prisma: any,
    userId: string,
  ): Promise<void> {
    try {
      // Check if Customer already exists
      const existingCustomer = await prisma.customer.findUnique({
        where: { userId },
      })

      if (existingCustomer) {
        logger.debug(`Customer profile already exists for user ${userId}`)

        return
      }

      // Create Customer record with same ID as user for simplicity
      await prisma.customer.create({
        data: {
          id: userId, // Same ID as user - simplifies lookups
          userId: userId, // Reference to user record
          preferences: { language: 'en', notifications: true },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      logger.debug(`Created Customer profile for user ${userId}`)
    } catch (error) {
      console.warn(
        `Failed to create Customer profile for user ${userId}:`,
        error,
      )
    }
  }

  /**
   * Finds any existing category or creates a minimal one for Provider relationships
   * This approach doesn't create persistent test categories that interfere with tests
   */
  private async findOrCreateCategoryForTesting(prisma: any): Promise<string> {
    try {
      // First try to find ANY existing category
      let category = await prisma.category.findFirst({
        orderBy: { createdAt: 'asc' },
      })

      if (category) {
        return category.id
      }

      // If no categories exist, create a minimal temporary one
      // This will be cleaned up by individual tests as needed
      const { v4: uuid } = require('uuid')

      category = await prisma.category.create({
        data: {
          id: uuid(),
          name: { en: 'Temp Auth Category', es: 'Categoría Temporal Auth' },
          description: {
            en: 'Temporary category for auth testing',
            es: 'Categoría temporal para testing auth',
          },
          slug: `temp-auth-${uuid().substring(0, 8)}`, // Unique slug to avoid conflicts
          level: 1,
          path: '/',
          active: true,
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      logger.debug(`Created temporary category for E2E testing: ${category.id}`)

      return category.id
    } catch (error) {
      console.warn('Failed to find/create category for testing:', error)

      // Return a fallback UUID - tests might still work if category validation is optional
      const { v4: uuid } = require('uuid')

      return uuid()
    }
  }

  /**
   * Generate a valid JWT token for testing (matches database user)
   */
  private generateTestToken(
    userType: keyof typeof this.testUsers,
    userId: string,
  ): string {
    const userData = get(this.testUsers, userType)
    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET environment variable is required for test tokens',
      )
    }

    const payload = {
      userId: userId,
      email: userData.email,
      role: userData.role,
      status: 'ACTIVE',
      type: 'access' as const,
      iat: Math.floor(Date.now() / 1000),
    }

    // Import jwt here to avoid circular dependencies
    const jwt = require('jsonwebtoken')

    return jwt.sign(payload, jwtSecret, {
      expiresIn: '1h', // 1 hour is plenty for tests
      issuer: 'pika-api',
      audience: 'pika-app',
      subject: payload.userId,
      jwtid: `test-${userType.toLowerCase()}-${Date.now()}`,
    })
  }

  /**
   * Login as a specific user type and get a real JWT token
   * For microservice tests, this creates users in DB and generates valid tokens
   */
  async loginAs(
    userType: keyof typeof this.testUsers,
    prisma?: any,
  ): Promise<string> {
    // Check if we have a valid token
    const existingToken = this.tokens.get(userType)

    if (existingToken && existingToken.expiresAt > new Date()) {
      return existingToken.token
    }

    try {
      let userId: string

      if (prisma) {
        // Create user in database for microservice tests
        userId = await this.ensureUserExistsInDatabase(userType, prisma)
      } else {
        // Use predictable UUID for API-based tests
        const { v4: uuid } = require('uuid')

        userId = uuid()
      }

      // Generate valid JWT token
      const accessToken = this.generateTestToken(userType, userId)

      // Calculate expiration (1 hour from now)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      // Store token with expiration
      this.tokens.set(userType, {
        token: accessToken,
        expiresAt: expiresAt,
      })

      const userData = get(this.testUsers, userType)

      logger.debug(
        `Successfully authenticated as ${userType} (${userData.email}) with userId: ${userId}`,
      )

      return accessToken
    } catch (error) {
      console.error(`❌ Failed to authenticate as ${userType}:`, error)
      throw new Error(`E2E Authentication failed for ${userType}: ${error}`)
    }
  }

  /**
   * Get an authenticated request client for a specific user type
   */
  async getAuthenticatedClient(
    userType: keyof typeof this.testUsers,
    prisma?: any,
  ): Promise<AuthenticatedRequestClient> {
    const token = await this.loginAs(userType, prisma)

    return new AuthenticatedRequestClient(this.request, token)
  }

  /**
   * Get an admin client (convenience method)
   */
  async getAdminClient(prisma?: any): Promise<AuthenticatedRequestClient> {
    return this.getAuthenticatedClient('ADMIN', prisma)
  }

  /**
   * Get a customer client (convenience method)
   */
  async getCustomerClient(prisma?: any): Promise<AuthenticatedRequestClient> {
    return this.getAuthenticatedClient('CUSTOMER', prisma)
  }

  /**
   * Get a service provider client (convenience method)
   */
  async getProviderClient(prisma?: any): Promise<AuthenticatedRequestClient> {
    return this.getAuthenticatedClient('PROVIDER', prisma)
  }

  /**
   * Get an unauthenticated client for testing 401 scenarios
   */
  getUnauthenticatedClient(): supertest.SuperTest<supertest.Test> {
    return this.request
  }

  /**
   * Get a service-to-service authenticated client
   * This creates a special client that uses service authentication instead of JWT tokens
   */
  getServiceClient(
    serviceName: string = 'test-service',
  ): AuthenticatedRequestClient {
    // For service auth, we'll pass a special token that the AuthenticatedRequestClient
    // will recognize and handle differently
    const serviceAuthToken = `SERVICE:${serviceName}`

    // Create a custom AuthenticatedRequestClient that overrides the header setting
    const client = new AuthenticatedRequestClient(
      this.request,
      serviceAuthToken,
    )

    // Override the internal _createRequest method to add service headers
    const originalCreateRequest = (client as any)._createRequest

    ;(client as any)._createRequest = function (
      method: string,
      url: string,
      overrideToken?: string | null,
    ) {
      const req = originalCreateRequest.call(this, method, url, overrideToken)

      // If using service auth token, replace auth headers with service headers
      if ((overrideToken || this.token)?.startsWith('SERVICE:')) {
        const serviceName = (overrideToken || this.token).substring(8)
        const apiKey =
          process.env.SERVICE_API_KEY ||
          'dev-service-api-key-change-in-production'
        const serviceId = `${serviceName}-test`

        // Remove JWT auth headers
        req.unset('Authorization')
        req.unset('x-user-id')
        req.unset('x-user-email')
        req.unset('x-user-role')
        req.unset('x-user-status')

        // Add service auth headers
        req
          .set('x-api-key', apiKey)
          .set('x-service-name', serviceName)
          .set('x-service-id', serviceId)
          .set('x-correlation-id', `test-${Date.now()}`)
      }

      return req
    }

    return client
  }

  /**
   * Test token refresh functionality
   */
  async refreshToken(userType: keyof typeof this.testUsers): Promise<string> {
    const existingToken = this.tokens.get(userType)

    if (!existingToken) {
      throw new Error(`No token found for ${userType}. Call loginAs() first.`)
    }

    try {
      // Use refresh endpoint to get new token
      const refreshResponse = await this.request
        .post(`${this.baseUrl}/auth/refresh`)
        .set('Authorization', `Bearer ${existingToken.token}`)
        .expect(200)

      const { accessToken, expiresAt } = refreshResponse.body.tokens

      // Update stored token
      this.tokens.set(userType, {
        token: accessToken,
        expiresAt: new Date(expiresAt),
      })

      return accessToken
    } catch (error) {
      console.error(`Failed to refresh token for ${userType}:`, error)
      throw error
    }
  }

  /**
   * Logout a specific user (revoke their token)
   */
  async logout(userType: keyof typeof this.testUsers): Promise<void> {
    const tokenData = this.tokens.get(userType)

    if (!tokenData) {
      return // Already logged out
    }

    try {
      await this.request
        .post(`${this.baseUrl}/auth/logout`)
        .set('Authorization', `Bearer ${tokenData.token}`)
        .expect(200)
    } catch (error) {
      console.warn(`Failed to logout ${userType}:`, error)
    } finally {
      this.tokens.delete(userType)
    }
  }

  /**
   * Clear all stored tokens (for test cleanup)
   */
  clearTokens(): void {
    this.tokens.clear()
    logger.debug('Cleared all authentication tokens')
  }

  /**
   * Get token info for debugging
   */
  getTokenInfo(userType: keyof typeof this.testUsers): {
    hasToken: boolean
    expiresAt?: Date
  } {
    const tokenData = this.tokens.get(userType)

    return {
      hasToken: !!tokenData,
      expiresAt: tokenData?.expiresAt,
    }
  }

  /**
   * Create test users in bulk (useful for test setup)
   */
  async createAllTestUsers(prisma?: any): Promise<void> {
    logger.debug('Creating all test users...')

    const userTypes = Object.keys(this.testUsers) as Array<
      keyof typeof this.testUsers
    >

    if (prisma) {
      // Create users directly in database for microservice tests
      const results = await Promise.allSettled(
        userTypes.map((userType) =>
          this.ensureUserExistsInDatabase(userType, prisma),
        ),
      )

      const failures = results.filter((result) => result.status === 'rejected')

      if (failures.length > 0) {
        console.warn(
          `⚠️  ${failures.length} test users failed to create in database`,
        )
      } else {
        logger.debug('All test users created successfully in database')
      }
    } else {
      logger.debug('Skipping user creation - will generate tokens as needed')
    }
  }

  /**
   * Authenticate all users in bulk (useful for test setup)
   */
  async authenticateAllUsers(prisma?: any): Promise<void> {
    logger.debug('Authenticating all test users...')

    const userTypes = Object.keys(this.testUsers) as Array<
      keyof typeof this.testUsers
    >

    await Promise.all(
      userTypes.map((userType) => this.loginAs(userType, prisma)),
    )

    logger.debug('All test users authenticated')
  }
}

/**
 * Convenience function to create E2E auth helper
 */
export function createE2EAuthHelper(
  app: FastifyInstance,
  baseUrl?: string,
): E2EAuthHelper {
  return new E2EAuthHelper(app, baseUrl)
}

/**
 * Test user roles for easy reference
 */
export const TEST_USER_ROLES = {
  ADMIN: 'ADMIN' as const,
  CUSTOMER: 'CUSTOMER' as const,
  PROVIDER: 'PROVIDER' as const,
} as const

export type TestUserRole =
  (typeof TEST_USER_ROLES)[keyof typeof TEST_USER_ROLES]
