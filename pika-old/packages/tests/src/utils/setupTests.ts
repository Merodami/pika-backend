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

// Mock modules that are causing issues
vi.mock('@pika/api', () => ({
  schemas: {
    UserProfileSchema: {},
    ServiceSchema: {},
    PaymentMethodSchema: {},
    CategorySchema: {},
    LocationSchema: {},
  },
}))

// Mock Redis module with Cache decorator
vi.mock('@pika/redis', () => {
  return {
    MemoryCacheService: class MemoryCacheService {
      constructor() {}
      connect() {
        return Promise.resolve()
      }
      disconnect() {
        return Promise.resolve()
      }
      get() {
        return Promise.resolve(null)
      }
      set() {
        return Promise.resolve(true)
      }
      delete() {
        return Promise.resolve(true)
      }
      clear() {
        return Promise.resolve()
      }
      checkHealth() {
        return Promise.resolve({ status: 'healthy' })
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
      const language = req.language || 'en'

      return `${method}:${path}?${query}:${language}`
    },
  }
})

// Mock shared module
vi.mock('@pika/shared', () => {
  return {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    },
    createErrorHandler: () => (err: Error, req: any, reply: any) => {
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
        const err = new Error('Validation error')

        ;(err as any).errors = errors
        ;(err as any).status = 400
        ;(err as any).options = options

        return err
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
