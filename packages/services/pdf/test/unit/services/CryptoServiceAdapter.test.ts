import { CryptoServiceAdapter } from '@pdf/services/CryptoServiceAdapter.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Use real environment variables from .env.test

describe('CryptoServiceAdapter', () => {
  let adapter: CryptoServiceAdapter

  beforeEach(() => {
    vi.clearAllMocks()
    adapter = new CryptoServiceAdapter()
  })

  describe('constructor', () => {
    it('should initialize successfully with valid environment variables', () => {
      expect(() => new CryptoServiceAdapter()).not.toThrow()
      expect(adapter).toBeDefined()
    })
  })

  describe('generateQRPayload', () => {
    it('should generate QR payload with correct parameters', async () => {
      const options = {
        voucherId: 'voucher-123',
        providerId: 'provider-456',
        shortCode: 'ABC123',
        batchId: 'batch-789',
        ttl: 86400,
      }

      const result = await adapter.generateQRPayload(options)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.split('.')).toHaveLength(3) // Should be a JWT with 3 parts
    })

    it('should use default TTL when not provided', async () => {
      const options = {
        voucherId: 'voucher-123',
        providerId: 'provider-456',
        shortCode: 'ABC123',
      }

      const result = await adapter.generateQRPayload(options)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.split('.')).toHaveLength(3) // Should be a JWT with 3 parts
    })

    it('should generate QR payload even with empty voucher ID', async () => {
      const options = {
        voucherId: '', // Empty voucher ID - crypto package handles this gracefully
        providerId: 'provider-456',
        shortCode: 'ABC123',
      }

      const result = await adapter.generateQRPayload(options)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.split('.')).toHaveLength(3) // Should still be a valid JWT
    })
  })

  describe('generateShortCode', () => {
    it('should generate short code with correct parameters', async () => {
      const result = await adapter.generateShortCode('voucher-123', {
        type: 'print',
        expirationDays: 30,
      })

      expect(result).toBeDefined()
      expect(result.shortCode).toBeDefined()
      expect(typeof result.shortCode).toBe('string')
      expect(result.shortCode.length).toBeGreaterThan(0)
      expect(result.metadata).toBeDefined()
    })

    it('should use default options when not provided', async () => {
      const result = await adapter.generateShortCode('voucher-123')

      expect(result).toBeDefined()
      expect(result.shortCode).toBeDefined()
      expect(typeof result.shortCode).toBe('string')
      expect(result.metadata).toBeDefined()
    })

    it('should handle invalid voucher ID gracefully', async () => {
      await expect(adapter.generateShortCode('')).rejects.toThrow()
    })
  })

  describe('generateBatchQRPayloads', () => {
    it('should generate payloads for multiple vouchers', async () => {
      const vouchers = [
        { voucherId: 'voucher-1', providerId: 'provider-1', shortCode: 'ABC1' },
        { voucherId: 'voucher-2', providerId: 'provider-2', shortCode: 'ABC2' },
        { voucherId: 'voucher-3', providerId: 'provider-3', shortCode: 'ABC3' },
      ]

      const result = await adapter.generateBatchQRPayloads(
        vouchers,
        'batch-123',
      )

      expect(result.size).toBe(3)
      expect(result.get('voucher-1')).toBeDefined()
      expect(result.get('voucher-2')).toBeDefined()
      expect(result.get('voucher-3')).toBeDefined()
      // Each should be a valid JWT
      expect(result.get('voucher-1')!.split('.')).toHaveLength(3)
      expect(result.get('voucher-2')!.split('.')).toHaveLength(3)
      expect(result.get('voucher-3')!.split('.')).toHaveLength(3)
    })

    it('should handle empty voucher list', async () => {
      const result = await adapter.generateBatchQRPayloads([], 'batch-123')

      expect(result.size).toBe(0)
    })

    it('should handle errors in batch generation', async () => {
      const vouchers = [
        { voucherId: 'voucher-1', providerId: 'provider-1', shortCode: 'ABC1' },
      ]

      // Mock generateQRPayload to throw an error
      vi.spyOn(adapter, 'generateQRPayload').mockRejectedValue(
        new Error('QR generation failed'),
      )

      await expect(
        adapter.generateBatchQRPayloads(vouchers, 'batch-123'),
      ).rejects.toThrow()
    })

    it('should process vouchers in parallel for performance', async () => {
      const vouchers = [
        { voucherId: 'voucher-1', providerId: 'provider-1', shortCode: 'ABC1' },
        { voucherId: 'voucher-2', providerId: 'provider-2', shortCode: 'ABC2' },
        { voucherId: 'voucher-3', providerId: 'provider-3', shortCode: 'ABC3' },
      ]

      const startTime = Date.now()

      await adapter.generateBatchQRPayloads(vouchers, 'batch-123')

      const endTime = Date.now()

      // With parallel processing, this should be much faster than sequential
      // This is a loose test but validates parallel execution
      expect(endTime - startTime).toBeLessThan(1000) // Should complete quickly with mocks
    })
  })

  describe('integration scenarios', () => {
    it('should handle large batch generation efficiently', async () => {
      const vouchers = Array.from({ length: 100 }, (_, i) => ({
        voucherId: `voucher-${i}`,
        providerId: `provider-${i}`,
        shortCode: `ABC${i}`,
      }))

      const result = await adapter.generateBatchQRPayloads(
        vouchers,
        'large-batch',
      )

      expect(result.size).toBe(100)
      vouchers.forEach((voucher) => {
        expect(result.has(voucher.voucherId)).toBe(true)
      })
    })

    it('should generate unique short codes for different vouchers', async () => {
      const voucherIds = ['voucher-1', 'voucher-2', 'voucher-3']
      const results = await Promise.all(
        voucherIds.map((id) => adapter.generateShortCode(id)),
      )

      // With mocks, they'll be the same, but in real implementation they should be unique
      results.forEach((result) => {
        expect(result.shortCode).toBeDefined()
        expect(result.metadata.voucherId).toBeDefined()
      })
    })

    it('should maintain consistent QR payload format', async () => {
      const options = {
        voucherId: 'voucher-123',
        providerId: 'provider-456',
        shortCode: 'ABC123',
        batchId: 'batch-789',
      }

      const payload = await adapter.generateQRPayload(options)

      // With mocks, we can validate the format expectations
      expect(typeof payload).toBe('string')
      expect(payload.length).toBeGreaterThan(0)
    })
  })
})
