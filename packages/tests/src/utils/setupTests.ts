// packages/tests/src/utils/setupTests.ts
import { vi } from 'vitest'

// Configure Testcontainers to clean up automatically
process.env.TESTCONTAINERS_RYUK_DISABLED = 'false'
process.env.TESTCONTAINERS_RYUK_CONTAINER_PRIVILEGED = 'true'

// Ensure process doesn't exit too quickly in tests
process.on('exit', () => {
  // Give Docker connections time to close
  process.nextTick(() => {})
})

// Handle unhandled rejections in tests more gracefully
process.on('unhandledRejection', (reason, promise) => {
  // Ignore SSH2 crypto errors in test environment
  if (reason && reason.toString().includes('ssh2')) {
    console.warn('Ignoring SSH2 error in test environment:', reason)

    return
  }
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Mock Redis module with Cache decorator
vi.mock('@pika/redis', async () => {
  // Create a simple in-memory cache for tests
  const cache = new Map()

  return {
    MemoryCacheService: class MemoryCacheService {
      constructor() {}
      connect() {
        return Promise.resolve()
      }
      disconnect() {
        return Promise.resolve()
      }
      get(key: string) {
        return Promise.resolve(cache.get(key) || null)
      }
      set(key: string, value: any) {
        cache.set(key, value)

        return Promise.resolve(true)
      }
      setNX(key: string, value: any) {
        if (cache.has(key)) {
          return Promise.resolve(false)
        }

        return this.set(key, value)
      }
      exists(key: string) {
        return Promise.resolve(cache.has(key))
      }
      getTTL(key: string) {
        // Simplified TTL for tests - return -1 if exists without TTL
        return Promise.resolve(cache.has(key) ? -1 : -2)
      }
      updateTTL(key: string) {
        return Promise.resolve(cache.has(key))
      }
      delete(key: string) {
        return Promise.resolve(cache.delete(key))
      }
      del(key: string) {
        return Promise.resolve(cache.delete(key))
      }
      delPattern(pattern: string) {
        let count = 0

        // Convert wildcard pattern to regex safely
        const escapedPattern = pattern
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
          .replace(/\\\*/g, '.*') // Replace escaped * with .*

        // eslint-disable-next-line security/detect-non-literal-regexp
        const regex = new RegExp(`^${escapedPattern}$`)

        for (const key of cache.keys()) {
          if (regex.test(key)) {
            cache.delete(key)
            count++
          }
        }

        return Promise.resolve(count)
      }
      clearAll() {
        cache.clear()

        return Promise.resolve()
      }
      checkHealth() {
        return Promise.resolve({
          status: 'healthy' as const,
          details: {},
        })
      }
    },
    RedisService: vi.fn(),
    setCacheService: vi.fn(),
    // Add Cache decorator
    Cache: () => {
      return function (
        _target: any,
        _propertyKey: string,
        descriptor: PropertyDescriptor,
      ) {
        // Return original method
        return descriptor
      }
    },
    // Add httpRequestKeyGenerator function
    httpRequestKeyGenerator: (req: any) => {
      const path = req.url || ''
      const method = req.method || 'GET'
      const query = req.query ? new URLSearchParams(req.query).toString() : ''

      return `${method}:${path}?${query}`
    },
  }
})

// Mock HTTP middleware module
vi.mock('@pika/http', async () => {
  return {
    requireAuth: () => (req: any, res: any, next: any) => next(),
    requireBusinessRole: () => (req: any, res: any, next: any) => next(),
    requireAdmin: () => (req: any, res: any, next: any) => next(),
    requireInternalAuth: () => (req: any, res: any, next: any) => next(),
    requireServiceAuth: () => (req: any, res: any, next: any) => next(),
    allowServiceOrUserAuth: () => (req: any, res: any, next: any) => next(),
    requirePermissions: () => (req: any, res: any, next: any) => {
      // For tests, just pass through - auth is tested separately
      next()
    },
    validateBody: () => (req: any, res: any, next: any) => next(),
    validateParams: () => (req: any, res: any, next: any) => next(),
    validateQuery: () => (req: any, res: any, next: any) => next(),
    getValidatedQuery: (req: any) => req.query || {},
    getValidatedBody: (req: any) => req.body || {},
    getValidatedParams: (req: any) => req.params || {},
    getRequestLanguage: () => 'en',
    paginatedResponse: (result: any, mapper?: any) => {
      if (mapper && result.data) {
        return {
          ...result,
          data: result.data.map(mapper),
        }
      }

      return result
    },
    createMulterMiddleware: () => {
      // Return a multer-like object with single, array, etc. methods
      const middleware = (req: any, res: any, next: any) => {
        req.file = req.body?.file || undefined
        req.files = req.body?.files || []
        next()
      }

      return {
        single: () => middleware,
        array: () => middleware,
        fields: () => middleware,
        none: () => middleware,
        any: () => middleware,
      }
    },
    createExpressServer: vi.fn().mockResolvedValue({
      use: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      listen: vi.fn(),
      locals: {},
    }),
    errorMiddleware: vi.fn(),
    RequestContext: class MockRequestContext {
      constructor(public data: any) {}
      static getContext: () => any = () => ({
        userId: 'test-user',
        role: 'MEMBER',
      })
    },
  }
})

// Mock translation module
vi.mock('@pika/translation', () => ({
  TranslationClient: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue('mocked-translation'),
    getBulk: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue(undefined),
    getUserLanguage: vi.fn().mockResolvedValue('en'),
    setUserLanguage: vi.fn().mockResolvedValue(undefined),
  })),
}))

// Mock shared module
vi.mock('@pika/shared', async () => {
  // Create a BaseError class for the mock
  class BaseError extends Error {
    context: any

    constructor(message: string, context: any = {}) {
      super(message)
      this.name = 'BaseError'
      this.context = context
    }

    getHttpStatus() {
      return this.context.httpStatus || 500
    }

    toResponseObject() {
      return {
        error: {
          code: this.context.code || 'ERROR',
          message: this.message,
          domain: this.context.domain || 'unknown',
          timestamp: new Date().toISOString(),
        },
      }
    }
  }

  class NotAuthenticatedError extends BaseError {
    constructor(
      message: string = 'Authentication required',
      context: any = {},
    ) {
      super(message, { ...context, httpStatus: 401, code: 'NOT_AUTHENTICATED' })
      this.name = 'NotAuthenticatedError'
    }
  }

  class ValidationError extends BaseError {
    validationErrors: Record<string, string[]>

    constructor(validationErrors: Record<string, string[]>, context: any = {}) {
      const errorCount = Object.values(validationErrors).flat().length
      const message = `Validation failed with ${errorCount} error${errorCount === 1 ? '' : 's'}`

      super(message, {
        ...context,
        httpStatus: 400,
        code: 'VALIDATION_ERROR',
        domain: 'validation',
      })

      this.name = 'ValidationError'
      this.validationErrors = validationErrors
    }

    toResponseObject() {
      const baseResponse = super.toResponseObject()

      return {
        ...baseResponse,
        error: {
          ...baseResponse.error,
          validationErrors: this.validationErrors,
        },
      }
    }
  }

  // Mock BaseServiceClient class
  class BaseServiceClient {
    constructor() {
      // Mock constructor
    }

    protected async get(): Promise<any> {
      // Mock GET request
      return Promise.resolve({ data: 'mock data' })
    }

    protected async post(): Promise<any> {
      // Mock POST request
      return Promise.resolve({ data: 'mock data' })
    }

    protected async put(): Promise<any> {
      // Mock PUT request
      return Promise.resolve({ data: 'mock data' })
    }

    protected async delete(): Promise<any> {
      // Mock DELETE request
      return Promise.resolve({ data: 'mock data' })
    }
  }

  return {
    BaseError,
    NotAuthenticatedError,
    ValidationError,
    BaseServiceClient,
    RequestIdSource: {
      GENERATED: 'generated',
      CLIENT: 'client',
    },
    RequestContext: class RequestContext {
      constructor(public data: any) {}
    },
    RequestContextStore: {
      getStore: () => null,
      run: (context: any, callback: () => any) => callback(),
    },
    UserContext: class UserContext {
      constructor(public data: any) {}
    },
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    },
    createErrorHandler: () => (err: any, req: any, reply: any) => {
      // If it's a BaseError instance, use its getHttpStatus method
      if (err.getHttpStatus && typeof err.getHttpStatus === 'function') {
        const status = err.getHttpStatus()
        const responseObject = err.toResponseObject
          ? err.toResponseObject(false)
          : {
              error: {
                code: err.context?.code || 'ERROR',
                message: err.message,
              },
            }

        reply.status(status).send({
          status_code: status,
          ...responseObject,
        })

        return
      }

      // Default handling for non-BaseError errors
      reply.status(500).send({ error: 'test_error', message: err.message })
    },
    createFileStorage: () => ({
      uploadFile: async () => ({ url: 'https://example.com/test-image.jpg' }),
      deleteFile: async () => true,
    }),
    FileStoragePort: vi.fn(),
    // Add ErrorFactory to the mock
    ErrorFactory: {
      databaseError: (
        code: string,
        message: string,
        error: Error,
        options?: any,
      ) => {
        const err = new Error(message)

        ;(err as any).code = code
        ;(err as any).originalError = error
        ;(err as any).options = options

        return err
      },
      resourceNotFound: (resource: string, id: string, options?: any) => {
        const err = new Error(`${resource} with id ${id} not found`)

        ;(err as any).status = 404
        ;(err as any).options = options

        return err
      },
      validationError: (errors: any, options?: any) => {
        return new ValidationError(errors, options)
      },
      fromError: (error: Error, _message?: string) => {
        return error
      },
      notImplemented: (message: string, options?: any) => {
        const err = new Error(message)

        ;(err as any).code = 'NOT_IMPLEMENTED'
        ;(err as any).status = 501
        ;(err as any).options = options

        return err
      },
      externalServiceError: (
        serviceName: string,
        details: string,
        originalError?: any,
        context?: any,
      ) => {
        const err = new Error(
          `External service error: ${serviceName} - ${details}`,
        )

        ;(err as any).serviceName = serviceName
        ;(err as any).details = details
        ;(err as any).originalError = originalError
        ;(err as any).context = context
        ;(err as any).status = 503

        return err
      },
      serviceUnavailable: (service: string, reason?: string, context?: any) => {
        const err = new Error(`Service unavailable: ${service}`)

        ;(err as any).service = service
        ;(err as any).reason = reason
        ;(err as any).context = context
        ;(err as any).status = 503

        return err
      },
      resourceConflict: (resource: string, field: string, context?: any) => {
        const err = new Error(`Resource conflict: ${resource} - ${field}`)

        ;(err as any).resource = resource
        ;(err as any).field = field
        ;(err as any).context = context
        ;(err as any).status = 409

        return err
      },
      unauthorized: (message: string, context?: any) => {
        const err = new Error(message)

        ;(err as any).status = 401
        ;(err as any).context = context

        return err
      },
      forbidden: (message: string, context?: any) => {
        const err = new Error(message)

        ;(err as any).status = 403
        ;(err as any).context = context

        return err
      },
      businessRuleViolation: (code: string, message: string, context?: any) => {
        const err = new Error(message)

        ;(err as any).code = code
        ;(err as any).status = 400
        ;(err as any).context = context

        return err
      },
      badRequest: (message: string, options?: any) => {
        const err = new Error(message)

        ;(err as any).status = options?.httpStatus || 400
        ;(err as any).options = options

        return err
      },
    },
    ErrorSeverity: {
      INFO: 'INFO',
      WARNING: 'WARNING',
      ERROR: 'ERROR',
      CRITICAL: 'CRITICAL',
    },
    // Add system health check function
    createSystemHealthCheck: () => {
      return async () => {
        // Mock always returns healthy for tests
        return true
      }
    },
  }
})
