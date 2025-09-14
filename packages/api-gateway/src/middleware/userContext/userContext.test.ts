/**
 * User Context Middleware Tests
 *
 * Tests all strategies and edge cases
 */

import { UserRole, UserStatus } from '@pika/types'
import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getUserContext,
  requireUserContext,
  userContextMiddleware,
  UserContextStrategy,
} from './index.js'

// Mock dependencies
vi.mock('@pika/shared', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  UserServiceClient: vi.fn(() => ({
    getUser: vi.fn(),
  })),
}))

// Helper to create mock request
function createMockRequest(overrides?: any): Partial<Request> {
  return {
    user: {
      id: 'user-123',
      email: 'user@example.com',
      role: 'customer',
      permissions: ['read:profile', 'write:profile'],
    },
    headers: {},
    ip: '127.0.0.1',
    ...overrides,
  }
}

// Helper to create mock response
function createMockResponse(): Partial<Response> {
  const headers: Record<string, string> = {}

  return {
    headersSent: false,
    setHeader: vi.fn(
      (key: string, value: string | number | readonly string[]) => {
        Object.assign(headers, { [key]: String(value) })
      },
    ) as any,
    getHeader: vi.fn((key: string) => {
      const headerKey = key as keyof typeof headers

      return headers[headerKey] ?? undefined
    }),
  }
}

describe('UserContext Middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = createMockRequest()
    res = createMockResponse()
    next = vi.fn()
    vi.clearAllMocks()
  })

  describe('ENRICH Strategy (API Gateway)', () => {
    it('should fetch user context and set headers', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
        status: 'active',
        emailVerified: true,
        phoneVerified: false,
        phoneNumber: '+1234567890',
        preferredLanguage: 'en',
        primaryBusinessId: 'business-456',
        settings: { theme: 'dark' },
      }

      const mockUserService = {
        getUser: vi.fn().mockResolvedValue(mockUser),
      }

      const middleware = userContextMiddleware({
        strategy: UserContextStrategy.ENRICH,
        userServiceClient: mockUserService as any,
      })

      await middleware(req as Request, res as Response, next)

      // Check user service was called
      expect(mockUserService.getUser).toHaveBeenCalledWith('user-123')

      // Check headers were set
      expect(res.setHeader).toHaveBeenCalledWith('x-user-id', 'user-123')
      expect(res.setHeader).toHaveBeenCalledWith('x-user-role', 'customer')
      expect(res.setHeader).toHaveBeenCalledWith(
        'x-user-email',
        'user@example.com',
      )
      expect(res.setHeader).toHaveBeenCalledWith(
        'x-business-id',
        'business-456',
      )
      expect(res.setHeader).toHaveBeenCalledWith('x-user-language', 'en')
      expect(res.setHeader).toHaveBeenCalledWith(
        'x-user-permissions',
        'read:profile,write:profile',
      )

      // Check context was attached
      expect(req.userContext).toBeDefined()
      expect(req.userContext?.userId).toBe('user-123')
      expect(req.userContext?.profile?.firstName).toBe('John')
      expect(req.userContext?.permissions).toEqual([
        'read:profile',
        'write:profile',
      ])

      expect(next).toHaveBeenCalled()
    })

    it('should use cache when available', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
        status: 'active',
        emailVerified: true,
        phoneVerified: false,
      }

      const mockCache = {
        get: vi.fn().mockResolvedValue({
          userId: 'user-123',
          email: 'user@example.com',
          role: 'customer',
          permissions: [],
          profile: mockUser,
        }),
        set: vi.fn(),
      }

      const mockUserService = {
        getUser: vi.fn(),
      }

      const middleware = userContextMiddleware({
        strategy: UserContextStrategy.ENRICH,
        userServiceClient: mockUserService as any,
        cacheService: mockCache as any,
      })

      await middleware(req as Request, res as Response, next)

      // Should use cache, not call user service
      expect(mockCache.get).toHaveBeenCalled()
      expect(mockUserService.getUser).not.toHaveBeenCalled()
      expect(req.userContext).toBeDefined()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('CONSUME Strategy (Microservices)', () => {
    it('should read context from headers', async () => {
      req.headers = {
        'x-user-id': 'user-123',
        'x-user-role': 'business',
        'x-user-email': 'business@example.com',
        'x-user-permissions': 'read:vouchers,write:vouchers',
        'x-business-id': 'business-789',
        'x-user-language': 'es',
        'x-user-status': 'active',
      }

      const middleware = userContextMiddleware({
        strategy: UserContextStrategy.CONSUME,
      })

      await middleware(req as Request, res as Response, next)

      // Check context was parsed from headers
      expect(req.userContext).toBeDefined()
      expect(req.userContext?.userId).toBe('user-123')
      expect(req.userContext?.role).toBe('business')
      expect(req.userContext?.email).toBe('business@example.com')
      // Permissions come from JWT, not headers (we merge them)
      expect(req.userContext?.permissions).toEqual([
        'read:profile',
        'write:profile',
      ])
      expect(req.userContext?.profile?.primaryBusinessId).toBe('business-789')
      expect(req.userContext?.profile?.preferredLanguage).toBe('es')

      // Should NOT set headers (already set by gateway)
      expect(res.setHeader).not.toHaveBeenCalled()

      expect(next).toHaveBeenCalled()
    })

    it('should merge JWT permissions with header context', async () => {
      req.headers = {
        'x-user-id': 'user-123',
        'x-user-role': 'business',
        'x-user-email': 'business@example.com',
        // No permissions in headers
      }

      req.user = {
        id: 'user-123',
        email: 'business@example.com',
        role: UserRole.BUSINESS,
        permissions: ['admin:all'], // JWT has permissions
      }

      const middleware = userContextMiddleware({
        strategy: UserContextStrategy.CONSUME,
      })

      await middleware(req as Request, res as Response, next)

      // Should use JWT permissions
      expect(req.userContext?.permissions).toEqual(['admin:all'])
      expect(next).toHaveBeenCalled()
    })
  })

  describe('DIRECT Strategy (Embedded/Vercel)', () => {
    it('should always fetch from user service', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'admin',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
      }

      const mockUserService = {
        getUser: vi.fn().mockResolvedValue(mockUser),
      }

      // Even with headers, should fetch
      req.headers = {
        'x-user-id': 'different-user',
        'x-user-role': 'customer',
      }

      const middleware = userContextMiddleware({
        strategy: UserContextStrategy.DIRECT,
        userServiceClient: mockUserService as any,
      })

      await middleware(req as Request, res as Response, next)

      // Should fetch, ignoring headers
      expect(mockUserService.getUser).toHaveBeenCalledWith('user-123')
      expect(req.userContext?.userId).toBe('user-123')
      expect(req.userContext?.role).toBe('admin')

      // Should NOT set headers (not needed in embedded mode)
      expect(res.setHeader).not.toHaveBeenCalled()

      expect(next).toHaveBeenCalled()
    })
  })

  describe('HYBRID Strategy', () => {
    it('should use headers when available', async () => {
      req.headers = {
        'x-user-id': 'user-123',
        'x-user-role': 'customer',
        'x-user-email': 'customer@example.com',
      }

      const mockUserService = {
        getUser: vi.fn(),
      }

      const middleware = userContextMiddleware({
        strategy: UserContextStrategy.HYBRID,
        userServiceClient: mockUserService as any,
      })

      await middleware(req as Request, res as Response, next)

      // Should use headers, not fetch
      expect(mockUserService.getUser).not.toHaveBeenCalled()
      expect(req.userContext?.userId).toBe('user-123')
      expect(next).toHaveBeenCalled()
    })

    it('should fetch when headers missing', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        role: 'customer',
        status: 'active',
        emailVerified: true,
        phoneVerified: false,
      }

      const mockUserService = {
        getUser: vi.fn().mockResolvedValue(mockUser),
      }

      // No headers
      req.headers = {}

      const middleware = userContextMiddleware({
        strategy: UserContextStrategy.HYBRID,
        userServiceClient: mockUserService as any,
      })

      await middleware(req as Request, res as Response, next)

      // Should fetch
      expect(mockUserService.getUser).toHaveBeenCalledWith('user-123')
      expect(req.userContext?.profile?.firstName).toBe('Bob')
      expect(next).toHaveBeenCalled()
    })
  })

  describe('TEST Strategy', () => {
    it('should use test data', async () => {
      const testData = {
        userId: 'test-user',
        email: 'test@test.com',
        role: 'admin' as any,
        permissions: ['test:all'],
        profile: {
          firstName: 'Test',
          lastName: 'User',
          status: UserStatus.ACTIVE,
          emailVerified: true,
          phoneVerified: true,
        },
      }

      // No authenticated user needed
      req.user = undefined

      const middleware = userContextMiddleware({
        strategy: UserContextStrategy.TEST,
        testData,
      })

      await middleware(req as Request, res as Response, next)

      expect(req.userContext).toEqual(expect.objectContaining(testData))
      expect(next).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should fallback to JWT on fetch error', async () => {
      const mockUserService = {
        getUser: vi.fn().mockRejectedValue(new Error('Service down')),
      }

      const middleware = userContextMiddleware({
        strategy: UserContextStrategy.ENRICH,
        userServiceClient: mockUserService as any,
        fallbackToJWT: true,
      })

      await middleware(req as Request, res as Response, next)

      // Should have basic context from JWT
      expect(req.userContext).toBeDefined()
      expect(req.userContext?.userId).toBe('user-123')
      expect(req.userContext?.email).toBe('user@example.com')
      expect(req.userContext?.profile).toBeUndefined() // No profile on error

      expect(next).toHaveBeenCalled()
    })

    it('should continue without context if fallback disabled', async () => {
      const mockUserService = {
        getUser: vi.fn().mockRejectedValue(new Error('Service down')),
      }

      const middleware = userContextMiddleware({
        strategy: UserContextStrategy.ENRICH,
        userServiceClient: mockUserService as any,
        fallbackToJWT: false,
      })

      await middleware(req as Request, res as Response, next)

      // Should have no context
      expect(req.userContext).toBeUndefined()
      expect(next).toHaveBeenCalled()
    })

    it('should skip middleware if no user', async () => {
      req.user = undefined

      const mockUserService = {
        getUser: vi.fn(),
      }

      const middleware = userContextMiddleware({
        strategy: UserContextStrategy.ENRICH,
        userServiceClient: mockUserService as any, // Required for ENRICH
      })

      await middleware(req as Request, res as Response, next)

      expect(req.userContext).toBeUndefined()
      expect(mockUserService.getUser).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('Helper Functions', () => {
    it('getUserContext should return context', () => {
      req.userContext = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'customer' as any,
        permissions: [],
      }

      const context = getUserContext(req as Request)

      expect(context).toBe(req.userContext)
    })

    it('requireUserContext should throw if missing', () => {
      req.userContext = undefined

      expect(() => requireUserContext(req as Request)).toThrow(
        'UserContext not available',
      )
    })

    it('requireUserContext should return context if present', () => {
      req.userContext = {
        userId: 'user-123',
        email: 'user@example.com',
        role: 'customer' as any,
        permissions: [],
      }

      const context = requireUserContext(req as Request)

      expect(context).toBe(req.userContext)
    })
  })
})
