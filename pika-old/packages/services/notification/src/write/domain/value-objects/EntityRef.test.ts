import { describe, expect, it } from 'vitest'

import { EntityRef } from './EntityRef.js'

describe('EntityRef', () => {
  describe('create', () => {
    it('should create an EntityRef with valid parameters', () => {
      const entityRef = EntityRef.create({
        entityType: 'voucher',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
      })

      expect(entityRef.entityType).toBe('voucher')
      expect(entityRef.entityId).toBe('123e4567-e89b-12d3-a456-426614174000')
    })

    it('should create EntityRef with different entity types', () => {
      const voucherRef = EntityRef.create({
        entityType: 'voucher',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
      })

      const providerRef = EntityRef.create({
        entityType: 'provider',
        entityId: '123e4567-e89b-12d3-a456-426614174001',
      })

      const userRef = EntityRef.create({
        entityType: 'user',
        entityId: '123e4567-e89b-12d3-a456-426614174002',
      })

      expect(voucherRef.entityType).toBe('voucher')
      expect(providerRef.entityType).toBe('provider')
      expect(userRef.entityType).toBe('user')
    })

    it('should accept any string as entityType', () => {
      const entityRef = EntityRef.create({
        entityType: 'custom-entity-type',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
      })

      expect(entityRef.entityType).toBe('custom-entity-type')
    })

    it('should require entityId to be UUID length (36 characters)', () => {
      expect(() =>
        EntityRef.create({
          entityType: 'voucher',
          entityId: 'custom-id-123',
        }),
      ).toThrow('Invalid EntityRef data')

      // Valid UUID
      const entityRef = EntityRef.create({
        entityType: 'voucher',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
      })

      expect(entityRef.entityId).toBe('123e4567-e89b-12d3-a456-426614174000')
    })
  })

  describe('equals', () => {
    it('should return true for EntityRefs with same values', () => {
      const ref1 = EntityRef.create({
        entityType: 'voucher',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
      })

      const ref2 = EntityRef.create({
        entityType: 'voucher',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
      })

      expect(ref1.equals(ref2)).toBe(true)
    })

    it('should return false for EntityRefs with different entityType', () => {
      const ref1 = EntityRef.create({
        entityType: 'voucher',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
      })

      const ref2 = EntityRef.create({
        entityType: 'service',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
      })

      expect(ref1.equals(ref2)).toBe(false)
    })

    it('should return false for EntityRefs with different entityId', () => {
      const ref1 = EntityRef.create({
        entityType: 'voucher',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
      })

      const ref2 = EntityRef.create({
        entityType: 'voucher',
        entityId: '123e4567-e89b-12d3-a456-426614174001',
      })

      expect(ref1.equals(ref2)).toBe(false)
    })

    it('should return false for EntityRefs with both different values', () => {
      const ref1 = EntityRef.create({
        entityType: 'voucher',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
      })

      const ref2 = EntityRef.create({
        entityType: 'service',
        entityId: '123e4567-e89b-12d3-a456-426614174001',
      })

      expect(ref1.equals(ref2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return formatted string representation', () => {
      const entityRef = EntityRef.create({
        entityType: 'voucher',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
      })

      expect(entityRef.toString()).toBe(
        'voucher:123e4567-e89b-12d3-a456-426614174000',
      )
    })

    it('should work with different entity types', () => {
      const serviceRef = EntityRef.create({
        entityType: 'service',
        entityId: '123e4567-e89b-12d3-a456-426614174001',
      })

      const userRef = EntityRef.create({
        entityType: 'user',
        entityId: '123e4567-e89b-12d3-a456-426614174002',
      })

      expect(serviceRef.toString()).toBe(
        'service:123e4567-e89b-12d3-a456-426614174001',
      )
      expect(userRef.toString()).toBe(
        'user:123e4567-e89b-12d3-a456-426614174002',
      )
    })
  })

  describe('JSON serialization', () => {
    it('should be serializable to JSON string', () => {
      const entityRef = EntityRef.create({
        entityType: 'service',
        entityId: '123e4567-e89b-12d3-a456-426614174003',
      })

      const jsonString = JSON.stringify(entityRef)
      const parsed = JSON.parse(jsonString)

      expect(parsed).toEqual({
        entityType: 'service',
        entityId: '123e4567-e89b-12d3-a456-426614174003',
      })
    })
  })

  describe('validation', () => {
    it('should validate entityType length', () => {
      expect(() =>
        EntityRef.create({
          entityType: '', // Too short
          entityId: '123e4567-e89b-12d3-a456-426614174000',
        }),
      ).toThrow('Invalid EntityRef data')

      expect(() =>
        EntityRef.create({
          entityType: 'a'.repeat(51), // Too long
          entityId: '123e4567-e89b-12d3-a456-426614174000',
        }),
      ).toThrow('Invalid EntityRef data')
    })

    it('should validate entityId length', () => {
      expect(() =>
        EntityRef.create({
          entityType: 'voucher',
          entityId: '123', // Too short
        }),
      ).toThrow('Invalid EntityRef data')

      expect(() =>
        EntityRef.create({
          entityType: 'voucher',
          entityId: '123e4567-e89b-12d3-a456-426614174000-extra', // Too long
        }),
      ).toThrow('Invalid EntityRef data')
    })
  })
})
