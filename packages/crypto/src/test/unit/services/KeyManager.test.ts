import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { KeyManager } from '../../../services/KeyManager.js'

describe('KeyManager', () => {
  let keyManager: KeyManager
  let originalEnv: NodeJS.ProcessEnv

  // Sample test keys (generated for testing only)
  const TEST_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC6VLY4uQpYPvz8
vUBx7sxAvJREk8Y2nlFPeQw2GRVTJaiNFYWFf7GxYxXlruLBYKDXTwzNzJFxJJcL
R3XPamvvcTBLZGJ8TxlK9DvI8UucGvHj0tMtnPssVBp5v2NdZvF5HSzpLqYIWdRj
1/9tWaEr8dQx8bUiqS0nXJHvL7agAoNCx0L2RnlZneqPx6IbKlJf7kPCBPE4M5mJ
8nJ3qLobdlKJnmNqo/VnNxCNxdWMQGUUmITYvnppMb5D6bJhtGaU/RG8V8fAmaro
YR41xOBQCLOs7VLYbvPDkhmQnNj9bfsqKCKGrwPI8UjVCAbqPwNq2OvCqA9qJASl
+cmDZ4YzAgMBAAECggEBAK3+dB6j5XkXTGvnqJcL3cIde4gRaBiJdKPh6ySUm0vT
0mVmC+bpJJO0NmGEjJBaWmZo7pJqiFMJjE0e/C/bQNPxqGLCdaYZn1TG7h7g/Av2
IqmOQP7J0Jr6d3YbuG1V2Gyjp9KC1bAQcmK5WGaKneE4HNcPhuB7xfnf8PGnmNGN
h6t6gUmCj1B1Un1naQpQD5L3TmS0WYHwwp9RQ8pRAhLxKN9Nw6mWDJJIwX5Gn0Oz
0b8r3kbYnEFrhWnFOqpE+4t5xaYM6B+B0b9BjxQkYH0R0EGIvC3dCCvmJ7J3XrGT
6FzFp5QJH7sdcTTMf+DJ2JkeYQJH0jogxtLhjtAH7wECgYEA6ilL8ZTjwSXH9p9O
s5FeCW1LTMVJ17c8nj1sIfAIEqb8K/xqWRJlzE7A0pxZPmPx6mJB+PwMAWJOP7op
xAB2EColQO8aLIXMHl7FK3h5r6x8VTFdMxQt7bIU+qjmFEcA1ByQRqfVZmDjmLwb
k8aE3TnGfD+3K2Cpy0x9O8g+WxMCgYEAy8N+p7vfPRz8TYqshqq0Xm3nCYz3xJDt
xkR7XVMJUAQcGS4ttLMqoBThHc4xLUIGmbR9T6bP32VkczT3DJ/bxH9F/xom/JAN
zbbr8EYPELxl2NpLQ/xKBPQtH8bgvqNpB6C3zJaLEBvLQxR7jeEsgCCOEShqerJz
Hl2DnQJUacECgYATNgl5y4qIPx5udmLLKP4HdfKGQM7kE8XK6xvLa2h9pAQkCj/x
PnBON4I5u1F1kjPSsZhoVINEcSNqRH2PsgGEvETB7HZXKB9PnnJYqywHP2ZHJSfT
9uYTmiCTBLLmcMDbMmGmSaLCqQp/JqsXIlGvCNjASalIcZ/nUMxptsW6MQKBgEUm
WL8t8vLg0xuPuCBK0ZhHqWJrXXL3L3kPlFTjCGLNJfSL4PnfQjh5pFkrXGkJMGHP
iBPLHXAj2xKtG/dZrJOBPrbwlEY3oL0xJE8Q8UvLvAg8bH2n4z0Y+7jQGKGHz+kN
7pQyUZRhLGxK9NynE4cE3iVdjdBqwbYHWLcPRGSBAoGAdrW1BMZwLQfqLrwF/dVn
gFHPDk7P7vblmLY5+FhKbxGP8KPRaNnIFYu6J7pV3yY2gv1N2vLnQDPqPL3r5+Bv
H8aIJ1LqJDXN3MvPBmN8CfVQ7A9lqdgPuM3cKRLQFnm9XYvR3xUJscci1VY3qFHN
L9pqGvYxOKeR1VZFJNk3cX4=
-----END PRIVATE KEY-----`

  const TEST_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAulS2OLkKWD78/L1Ace7M
QLyURJPGNp5RT3kMNhkVUyWojRWFhX+xsWMV5a7iwWCg108MzcyRcSSXC0d1z2pr
73EwS2RifE8ZSvQ7yPFLnBrx49LTLZz7LFQaeb9jXWbxeR0s6S6mCFnUY9f/bVmh
K/HUMfG1IqktJ1yR7y+2oAKDQsdC9kZ5WZ3qj8eiGypSX+5DwgTxODOZifJyd6i6
G3ZSiZ5jaqP1ZzcQjcXVjEBlFJiE2L56aTG+Q+myYbRmlP0RvFfHwJmq6GEeNcTg
UAizrO1S2G7zw5IZkJzY/W37Kigihq8DyPFI1QgG6j8DatjrwqgPaiQEpfnJg2eG
MwIDAQAB
-----END PUBLIC KEY-----`

  const TEST_PRIVATE_KEY_BASE64 =
    Buffer.from(TEST_PRIVATE_KEY_PEM).toString('base64')
  const TEST_PUBLIC_KEY_BASE64 =
    Buffer.from(TEST_PUBLIC_KEY_PEM).toString('base64')

  const TEST_PRIVATE_KEY_ESCAPED = TEST_PRIVATE_KEY_PEM.replace(/\n/g, '\\n')
  const TEST_PUBLIC_KEY_ESCAPED = TEST_PUBLIC_KEY_PEM.replace(/\n/g, '\\n')

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }

    // Get fresh instance
    keyManager = KeyManager.getInstance()
    keyManager.clear()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv

    // Clear the singleton
    keyManager.clear()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = KeyManager.getInstance()
      const instance2 = KeyManager.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe('initialize', () => {
    it('should initialize successfully with RS256 keys in PEM format', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_PEM
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM

      await keyManager.initialize()

      expect(keyManager.isInitialized()).toBe(true)

      const stats = keyManager.getStats()

      expect(stats.keysLoaded).toBe(4) // Now stores both PEM and KeyLike formats
      expect(stats.keys).toContain('jwt.private')
      expect(stats.keys).toContain('jwt.public')
      expect(stats.keys).toContain('jwt.private.pem')
      expect(stats.keys).toContain('jwt.public.pem')
    })

    it('should initialize successfully with RS256 keys in base64 format', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_BASE64
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_BASE64

      await keyManager.initialize()

      expect(keyManager.isInitialized()).toBe(true)

      const stats = keyManager.getStats()

      expect(stats.keysLoaded).toBe(4) // Now stores both PEM and KeyLike formats
    })

    it('should initialize successfully with RS256 keys with escaped newlines', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_ESCAPED
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_ESCAPED

      await keyManager.initialize()

      expect(keyManager.isInitialized()).toBe(true)

      const stats = keyManager.getStats()

      expect(stats.keysLoaded).toBe(4) // Now stores both PEM and KeyLike formats
    })

    it('should throw error when non-RS256 algorithm is used', async () => {
      process.env.JWT_ALGORITHM = 'HS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_PEM
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM

      await expect(keyManager.initialize()).rejects.toThrow(
        'Unsupported JWT algorithm: HS256. Only RS256 is supported.',
      )
    })

    it('should throw error when RS256 keys are missing', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      delete process.env.JWT_PRIVATE_KEY
      delete process.env.JWT_PUBLIC_KEY
      // No keys set

      await expect(keyManager.initialize()).rejects.toThrow(
        'JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are required for RS256',
      )
    })

    it('should not reinitialize if already initialized', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_PEM
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM

      await keyManager.initialize()

      const stats1 = keyManager.getStats()

      // Try to initialize again
      await keyManager.initialize()

      const stats2 = keyManager.getStats()

      expect(stats1).toEqual(stats2)
    })

    it('should load voucher JWT keys when available', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_PEM
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM
      process.env.VOUCHER_JWT_ALGORITHM = 'RS256'
      process.env.VOUCHER_JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_BASE64
      process.env.VOUCHER_JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_BASE64

      await keyManager.initialize()

      const stats = keyManager.getStats()

      expect(stats.keysLoaded).toBe(8) // 4 JWT keys + 4 voucher keys (PEM and KeyLike)
      expect(stats.keys).toContain('voucher.jwt.private')
      expect(stats.keys).toContain('voucher.jwt.public')
      expect(stats.keys).toContain('voucher.jwt.private.pem')
      expect(stats.keys).toContain('voucher.jwt.public.pem')
    })

    it('should continue without voucher keys if not configured', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_PEM
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM
      // No voucher keys

      await keyManager.initialize()

      expect(keyManager.isInitialized()).toBe(true)

      const stats = keyManager.getStats()

      expect(stats.keysLoaded).toBe(4) // JWT keys in both formats, no voucher keys
    })
  })

  describe('getJWTPrivateKeyPEM', () => {
    it('should return private key PEM for RS256', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_PEM
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM

      await keyManager.initialize()

      const key = keyManager.getJWTPrivateKeyPEM()

      expect(key).toBeDefined()
      expect(typeof key).toBe('string')
      expect(key).toContain('BEGIN')
      expect(key).toContain('END')
    })

    it('should throw error if not initialized', () => {
      expect(() => keyManager.getJWTPrivateKeyPEM()).toThrow(
        'JWT private key (PEM) not initialized. Call initialize() first.',
      )
    })
  })

  describe('getJWTPublicKeyPEM', () => {
    it('should return public key PEM for RS256', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_PEM
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM

      await keyManager.initialize()

      const key = keyManager.getJWTPublicKeyPEM()

      expect(key).toBeDefined()
      expect(typeof key).toBe('string')
      expect(key).toContain('BEGIN')
      expect(key).toContain('END')
    })

    it('should throw error if not initialized', () => {
      expect(() => keyManager.getJWTPublicKeyPEM()).toThrow(
        'JWT public key (PEM) not initialized. Call initialize() first.',
      )
    })
  })

  describe('getVoucherJWTPEMKeys', () => {
    it('should return voucher PEM keys when configured', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_PEM
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM
      process.env.VOUCHER_JWT_ALGORITHM = 'RS256'
      process.env.VOUCHER_JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_BASE64
      process.env.VOUCHER_JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_BASE64

      await keyManager.initialize()

      const privateKey = keyManager.getVoucherJWTPrivateKeyPEM()
      const publicKey = keyManager.getVoucherJWTPublicKeyPEM()

      expect(privateKey).toBeDefined()
      expect(publicKey).toBeDefined()
      expect(privateKey).toContain('BEGIN')
      expect(publicKey).toContain('BEGIN')
    })

    it('should return undefined when not configured', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_PEM
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM

      await keyManager.initialize()

      const privateKey = keyManager.getVoucherJWTPrivateKeyPEM()
      const publicKey = keyManager.getVoucherJWTPublicKeyPEM()

      expect(privateKey).toBeUndefined()
      expect(publicKey).toBeUndefined()
    })
  })

  describe('clear', () => {
    it('should clear all cached keys', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_PEM
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM

      await keyManager.initialize()
      expect(keyManager.isInitialized()).toBe(true)

      keyManager.clear()

      expect(keyManager.isInitialized()).toBe(false)

      const stats = keyManager.getStats()

      expect(stats.keysLoaded).toBe(0)
      expect(stats.keys).toHaveLength(0)
    })
  })

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_PEM
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM

      const statsBefore = keyManager.getStats()

      expect(statsBefore.initialized).toBe(false)
      expect(statsBefore.keysLoaded).toBe(0)

      await keyManager.initialize()

      const statsAfter = keyManager.getStats()

      expect(statsAfter.initialized).toBe(true)
      expect(statsAfter.keysLoaded).toBe(4) // Now stores both PEM and KeyLike formats
      expect(statsAfter.keys).toEqual([
        'jwt.private.pem',
        'jwt.public.pem',
        'jwt.private',
        'jwt.public',
      ])
    })
  })

  describe('error handling', () => {
    it('should throw meaningful error for invalid private key', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = 'invalid-key-data'
      process.env.JWT_PUBLIC_KEY = TEST_PUBLIC_KEY_PEM

      await expect(keyManager.initialize()).rejects.toThrow(
        /Failed to import PRIVATE key/,
      )
    })

    it('should throw meaningful error for invalid public key', async () => {
      process.env.JWT_ALGORITHM = 'RS256'
      process.env.JWT_PRIVATE_KEY = TEST_PRIVATE_KEY_PEM
      process.env.JWT_PUBLIC_KEY = 'invalid-key-data'

      await expect(keyManager.initialize()).rejects.toThrow(
        /Failed to import PUBLIC key/,
      )
    })
  })
})
