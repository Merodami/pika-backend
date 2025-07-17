import { vi } from 'vitest'

// Set test environment
process.env.NODE_ENV = 'test'
process.env.LOG_LEVEL = 'error'

// Mock logger to reduce noise in tests
vi.mock('@pika/shared', async () => {
  const actual =
    await vi.importActual<typeof import('@pika/shared')>('@pika/shared')

  return {
    ...actual,
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  }
})

// Mock Redis/Cache in unit tests
vi.mock('@pika/redis', () => ({
  Cache: () => {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor,
    ) {
      // Return original method unchanged - cache disabled in tests
      return descriptor
    }
  },
  RedisService: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    keys: vi.fn(),
    flushdb: vi.fn(),
    quit: vi.fn(),
    healthCheck: vi.fn().mockResolvedValue({ isHealthy: true }),
  })),
  MemoryCacheService: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    keys: vi.fn(),
    flushdb: vi.fn(),
    quit: vi.fn(),
    healthCheck: vi.fn().mockResolvedValue({ isHealthy: true }),
  })),
}))

// Global test timeout
vi.setConfig({ testTimeout: 30000 })
