import { voucherPublic } from '@pika/api'
import { VoucherState, VoucherDiscountType } from '@pika/types'
import { describe, it, expect } from 'vitest'
import { VoucherResponseBuilder } from '../../builders/VoucherResponseBuilder.js'
import type { VoucherDomain } from '@pika/sdk'

describe('VoucherResponseBuilder', () => {
  const builder = new VoucherResponseBuilder()

  const mockVoucherDomain: VoucherDomain = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    businessId: '123e4567-e89b-12d3-a456-426614174001',
    categoryId: '123e4567-e89b-12d3-a456-426614174002',
    state: VoucherState.published,
    title: 'Test Voucher',
    description: 'Test Description',
    terms: 'Test Terms',
    discountType: VoucherDiscountType.percentage,
    discountValue: 20,
    currency: 'USD',
    location: null,
    imageUrl: 'https://example.com/image.jpg',
    validFrom: new Date('2024-01-01'),
    expiresAt: new Date('2024-12-31'),
    maxRedemptions: 100,
    maxRedemptionsPerUser: 1,
    currentRedemptions: 10,
    metadata: { test: 'data' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    codes: [
      {
        id: 'code-123',
        code: 'TEST123',
        type: 'static',
        isActive: true,
        metadata: null
      }
    ]
  }

  describe('build', () => {
    it('should build a valid voucher response', () => {
      const response = builder.build(mockVoucherDomain)

      expect(response.id).toBe(mockVoucherDomain.id)
      expect(response.businessId).toBe(mockVoucherDomain.businessId)
      expect(response.categoryId).toBe(mockVoucherDomain.categoryId)
      expect(response.state).toBe(VoucherState.published)
      expect(response.title).toBe('Test Voucher')
      expect(response.discountValue).toBe(20)
      expect(response.codes).toHaveLength(1)
      expect(response.codes![0].code).toBe('TEST123')
    })

    it('should format dates to ISO strings', () => {
      const response = builder.build(mockVoucherDomain)

      expect(response.validFrom).toBe('2024-01-01T00:00:00.000Z')
      expect(response.expiresAt).toBe('2024-12-31T00:00:00.000Z')
      expect(response.createdAt).toBe('2024-01-01T00:00:00.000Z')
      expect(response.updatedAt).toBe('2024-01-01T00:00:00.000Z')
    })

    it('should handle null values correctly', () => {
      const voucherWithNulls: VoucherDomain = {
        ...mockVoucherDomain,
        location: null,
        imageUrl: null,
        maxRedemptions: null,
        metadata: null,
        codes: undefined
      }

      const response = builder.build(voucherWithNulls)

      expect(response.location).toBeUndefined()
      expect(response.imageUrl).toBeUndefined()
      expect(response.maxRedemptions).toBeUndefined()
      expect(response.metadata).toBeUndefined()
      expect(response.codes).toBeUndefined()
    })

    it('should validate response against schema', () => {
      const response = builder.build(mockVoucherDomain)
      
      // This should not throw
      const validated = voucherPublic.VoucherResponse.parse(response)
      expect(validated).toBeDefined()
    })

    it('should throw validation error for invalid data', () => {
      const invalidVoucher: VoucherDomain = {
        ...mockVoucherDomain,
        id: 'not-a-uuid', // Invalid UUID
      }

      expect(() => builder.build(invalidVoucher)).toThrow()
    })
  })

  describe('buildList', () => {
    it('should build a valid list response', () => {
      const vouchers = [mockVoucherDomain]
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      }

      const response = builder.buildList(vouchers, pagination)

      expect(response.data).toHaveLength(1)
      expect(response.data[0].id).toBe(mockVoucherDomain.id)
      expect(response.pagination.page).toBe(1)
      expect(response.pagination.total).toBe(1)
    })

    it('should validate list response against schema', () => {
      const vouchers = [mockVoucherDomain]
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1
      }

      const response = builder.buildList(vouchers, pagination)
      
      // This should not throw
      const validated = voucherPublic.VoucherListResponse.parse(response)
      expect(validated).toBeDefined()
    })
  })
})