/**
 * Integration Test Helper
 *
 * Provides standardized setup for integration tests with Express and RBAC support.
 * This helper ensures consistent unmocking, proper Express app creation, and
 * RBAC-aware testing utilities.
 */

import { logger } from '@pika/shared'
import { type ICacheService, MemoryCacheService } from '@pika/redis'
import { type Express } from 'express'
import supertest from 'supertest'
import { vi } from 'vitest'
import { createE2EAuthHelper, type E2EAuthHelper } from './e2eAuth.js'
import {
  createTestDatabase,
  cleanupTestDatabase,
  clearTestDatabase,
  type TestDatabaseResult,
} from './testDatabaseHelper.js'
import { InternalAPITestHelper, type InternalAPIClient } from '../helpers/internal-api.js'

export interface IntegrationTestContext {
  testDb: TestDatabaseResult
  app: Express
  request: supertest.SuperTest<supertest.Test>
  authHelper: E2EAuthHelper
  cacheService: ICacheService
  internalClient: InternalAPIClient
  // Authenticated clients for different roles
  adminClient?: any
  userClient?: any
  businessClient?: any
}

export interface IntegrationTestOptions {
  serviceName: string
  databaseName?: string
  setupAuth?: boolean
  unmockModules?: string[]
  createServerFn: (config: any) => Promise<Express | { app: Express }>
  serverConfig?: Record<string, any>
}

/**
 * Sets up integration test environment with proper unmocking and Express configuration
 * 
 * IMPORTANT: You must call vi.unmock() for required modules BEFORE importing this helper
 * or any modules that depend on the real implementations.
 * 
 * Example:
 * ```typescript
 * import { vi } from 'vitest'
 * 
 * // Unmock FIRST
 * vi.unmock('@pika/http')
 * vi.unmock('@pika/api')
 * vi.unmock('@pika/redis')
 * 
 * // Then import
 * import { setupIntegrationTest } from '@pika/tests'
 * ```
 */
export async function setupIntegrationTest(
  options: IntegrationTestOptions,
): Promise<IntegrationTestContext> {
  const {
    serviceName,
    databaseName = `test_${serviceName}_db`,
    setupAuth = true,
    unmockModules = ['@pika/http', '@pika/api', '@pika/redis'],
    createServerFn,
    serverConfig = {},
  } = options

  logger.debug(`Setting up integration tests for ${serviceName}...`)

  // NOTE: Unmocking must be done BEFORE importing this module
  // We log what should have been unmocked for documentation
  logger.debug(`Expected unmocked modules: ${unmockModules.join(', ')}`)

  // Step 2: Create test database
  const testDb = await createTestDatabase({
    databaseName,
    useInitSql: true,
    startupTimeout: 120000,
  })

  // Update process.env for compatibility
  process.env.DATABASE_URL = testDb.databaseUrl

  // Step 3: Create cache service
  const cacheService = new MemoryCacheService()
  await cacheService.connect()

  // Step 4: Create the service server
  const serverResult = await createServerFn({
    prisma: testDb.prisma,
    cacheService,
    ...serverConfig,
  })

  // Handle both return patterns: Express app directly or { app }
  const app = (serverResult as any).app || (serverResult as Express)

  logger.debug(`${serviceName} server created successfully`)

  // Step 5: Create supertest instance
  const request = supertest(app)

  // Step 6: Create internal API client
  const internalAPIHelper = new InternalAPITestHelper()
  const internalClient = internalAPIHelper.createClient(app)

  // Step 7: Initialize E2E Authentication Helper
  const authHelper = createE2EAuthHelper(app)

  const context: IntegrationTestContext = {
    testDb,
    app,
    request,
    authHelper,
    cacheService,
    internalClient,
  }

  // Step 8: Set up authentication if requested
  if (setupAuth) {
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    context.adminClient = await authHelper.getAdminClient(testDb.prisma)
    context.userClient = await authHelper.getUserClient(testDb.prisma)
    context.businessClient = await authHelper.getBusinessClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')
  }

  return context
}

/**
 * Cleans up integration test resources
 */
export async function cleanupIntegrationTest(
  context: IntegrationTestContext | undefined,
): Promise<void> {
  if (!context) return

  logger.debug('Cleaning up integration test resources...')

  try {
    if (context.cacheService) {
      await context.cacheService.disconnect()
    }
  } catch (error) {
    logger.warn('Error disconnecting cache service:', error)
  }

  if (context.testDb) {
    await cleanupTestDatabase(context.testDb)
  }

  logger.debug('Integration test cleanup complete')
}

/**
 * Clears test data between tests (preserves auth users)
 */
export async function clearTestData(
  context: IntegrationTestContext,
  tablesToClear: string[],
): Promise<void> {
  if (!context.testDb?.prisma) return

  // Clear cache
  await context.cacheService.clearAll()

  // Clear specified tables
  for (const table of tablesToClear) {
    try {
      await (context.testDb.prisma as any)[table].deleteMany({})
      logger.debug(`Cleared ${table} table`)
    } catch (error) {
      logger.warn(`Failed to clear ${table}:`, error)
    }
  }
}

/**
 * RBAC Testing Utilities
 */
export class RBACTestHelper {
  constructor(private context: IntegrationTestContext) {}

  /**
   * Tests that a route requires authentication
   */
  async testRequiresAuth(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    data?: any,
  ): Promise<void> {
    const unauthClient = this.context.authHelper.getUnauthenticatedClient()
    const req = unauthClient[method](url)

    if (data && ['post', 'put', 'patch'].includes(method)) {
      req.send(data)
    }

    await req.expect(401)
  }

  /**
   * Tests that a route requires specific permissions
   */
  async testRequiresPermission(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    data: any,
    options: {
      allowedRoles: string[]
      deniedRoles: string[]
    },
  ): Promise<void> {
    // Test allowed roles
    for (const role of options.allowedRoles) {
      const client = this.getClientForRole(role)
      if (!client) continue

      const req = client[method](url)
      if (data && ['post', 'put', 'patch'].includes(method)) {
        req.send(data)
      }

      await req.expect((res: any) => {
        if (res.status >= 400 && res.status !== 404) {
          throw new Error(`${role} should have access but got ${res.status}`)
        }
      })
    }

    // Test denied roles
    for (const role of options.deniedRoles) {
      const client = this.getClientForRole(role)
      if (!client) continue

      const req = client[method](url)
      if (data && ['post', 'put', 'patch'].includes(method)) {
        req.send(data)
      }

      await req.expect(403) // Forbidden
    }
  }

  private getClientForRole(role: string): any {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return this.context.adminClient
      case 'USER':
      case 'CUSTOMER':
        return this.context.userClient
      case 'BUSINESS':
        return this.context.businessClient
      default:
        return null
    }
  }

  /**
   * Tests ownership-based permissions (e.g., users can only access their own resources)
   */
  async testOwnershipPermission(
    method: 'get' | 'put' | 'patch' | 'delete',
    urlPattern: string,
    ownerId: string,
    otherId: string,
    client: any,
  ): Promise<void> {
    // Should succeed for own resource
    const ownUrl = urlPattern.replace(':id', ownerId)
    await client[method](ownUrl).expect((res: any) => {
      if (res.status >= 400 && res.status !== 404) {
        throw new Error(`User should access own resource but got ${res.status}`)
      }
    })

    // Should fail for other's resource
    const otherUrl = urlPattern.replace(':id', otherId)
    await client[method](otherUrl).expect(403) // Forbidden
  }
}

/**
 * Create RBAC test helper for a test context
 */
export function createRBACTestHelper(
  context: IntegrationTestContext,
): RBACTestHelper {
  return new RBACTestHelper(context)
}
