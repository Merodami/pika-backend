import { describe, expect, it } from 'vitest'

import {
  contextualKeyGenerator,
  extractCacheContext,
  type CacheContext,
} from './contextual-keygen.js'

describe('contextualKeyGenerator', () => {
  describe('basic key generation', () => {
    it('should generate key with search params only', () => {
      const result = contextualKeyGenerator('business', 'getAllBusinesses', [
        { page: 1, limit: 10 },
      ])

      expect(result).toMatch(/^business:getAllBusinesses:[a-f0-9]{12}:default:guest:public:v1$/)
    })

    it('should generate key with search params and language', () => {
      const result = contextualKeyGenerator('business', 'getAllBusinesses', [
        { page: 1, limit: 10 },
        'es',
      ])

      expect(result).toMatch(/^business:getAllBusinesses:[a-f0-9]{12}:es:guest:public:v1$/)
    })

    it('should generate key with all contextual parameters', () => {
      const result = contextualKeyGenerator('business', 'getAllBusinesses', [
        { page: 1, limit: 10 },
        'es',
        'user123',
        'admin',
        'org456',
      ])

      expect(result).toMatch(/^business:getAllBusinesses:[a-f0-9]{12}:es:user:user123:admin:tenant:org456:v1$/)
    })

    it('should handle missing search params', () => {
      const result = contextualKeyGenerator('business', 'getAllBusinesses', [
        null,
        'en',
        'user123',
      ])

      expect(result).toBe('business:getAllBusinesses:no-params:en:user:user123:public:v1')
    })

    it('should handle empty search params', () => {
      const result = contextualKeyGenerator('business', 'getAllBusinesses', [
        {},
        'en',
      ])

      expect(result).toMatch(/^business:getAllBusinesses:[a-f0-9]{12}:en:guest:public:v1$/)
    })
  })

  describe('parameter defaults', () => {
    it('should use default language when not provided', () => {
      const result = contextualKeyGenerator('business', 'getBusinessById', [
        { id: '123' },
      ])

      expect(result).toContain(':default:')
    })

    it('should use guest when no userId provided', () => {
      const result = contextualKeyGenerator('business', 'getBusinessById', [
        { id: '123' },
        'es',
      ])

      expect(result).toContain(':guest:')
    })

    it('should use public when no userRole provided', () => {
      const result = contextualKeyGenerator('business', 'getBusinessById', [
        { id: '123' },
        'es',
        'user123',
      ])

      expect(result).toContain(':public:')
    })

    it('should exclude tenantId when not provided', () => {
      const result = contextualKeyGenerator('business', 'getBusinessById', [
        { id: '123' },
        'es',
        'user123',
        'admin',
      ])

      expect(result).not.toContain('tenant:')
      expect(result.endsWith(':v1')).toBe(true)
    })
  })

  describe('hash consistency', () => {
    it('should generate same hash for identical params', () => {
      const params = { page: 1, limit: 10, search: 'test' }
      
      const key1 = contextualKeyGenerator('business', 'getAllBusinesses', [params, 'es'])
      const key2 = contextualKeyGenerator('business', 'getAllBusinesses', [params, 'es'])
      
      expect(key1).toBe(key2)
    })

    it('should generate different hashes for different params', () => {
      const params1 = { page: 1, limit: 10 }
      const params2 = { page: 2, limit: 10 }
      
      const key1 = contextualKeyGenerator('business', 'getAllBusinesses', [params1, 'es'])
      const key2 = contextualKeyGenerator('business', 'getAllBusinesses', [params2, 'es'])
      
      expect(key1).not.toBe(key2)
    })

    it('should generate consistent hash regardless of object property order', () => {
      const params1 = { page: 1, limit: 10, search: 'test' }
      const params2 = { limit: 10, search: 'test', page: 1 }
      
      const key1 = contextualKeyGenerator('business', 'getAllBusinesses', [params1, 'es'])
      const key2 = contextualKeyGenerator('business', 'getAllBusinesses', [params2, 'es'])
      
      expect(key1).toBe(key2)
    })
  })

  describe('contextual variations', () => {
    it('should generate different keys for different languages', () => {
      const params = { page: 1 }
      
      const keyEs = contextualKeyGenerator('business', 'getAllBusinesses', [params, 'es'])
      const keyEn = contextualKeyGenerator('business', 'getAllBusinesses', [params, 'en'])
      
      expect(keyEs).not.toBe(keyEn)
      expect(keyEs).toContain(':es:')
      expect(keyEn).toContain(':en:')
    })

    it('should generate different keys for different users', () => {
      const params = { page: 1 }
      
      const key1 = contextualKeyGenerator('business', 'getAllBusinesses', [params, 'es', 'user123'])
      const key2 = contextualKeyGenerator('business', 'getAllBusinesses', [params, 'es', 'user456'])
      
      expect(key1).not.toBe(key2)
      expect(key1).toContain(':user:user123:')
      expect(key2).toContain(':user:user456:')
    })

    it('should generate different keys for different roles', () => {
      const params = { page: 1 }
      
      const keyAdmin = contextualKeyGenerator('business', 'getAllBusinesses', [params, 'es', 'user123', 'admin'])
      const keyCustomer = contextualKeyGenerator('business', 'getAllBusinesses', [params, 'es', 'user123', 'customer'])
      
      expect(keyAdmin).not.toBe(keyCustomer)
      expect(keyAdmin).toContain(':admin:')
      expect(keyCustomer).toContain(':customer:')
    })

    it('should generate different keys for different tenants', () => {
      const params = { page: 1 }
      
      const key1 = contextualKeyGenerator('business', 'getAllBusinesses', [params, 'es', 'user123', 'admin', 'org1'])
      const key2 = contextualKeyGenerator('business', 'getAllBusinesses', [params, 'es', 'user123', 'admin', 'org2'])
      
      expect(key1).not.toBe(key2)
      expect(key1).toContain(':tenant:org1:')
      expect(key2).toContain(':tenant:org2:')
    })
  })

  describe('edge cases', () => {
    it('should handle undefined parameters gracefully', () => {
      const result = contextualKeyGenerator('business', 'getAllBusinesses', [
        undefined,
        undefined,
        undefined,
      ])

      expect(result).toBe('business:getAllBusinesses:no-params:default:guest:public:v1')
    })

    it('should handle null parameters gracefully', () => {
      const result = contextualKeyGenerator('business', 'getAllBusinesses', [
        null,
        null,
        null,
      ])

      expect(result).toBe('business:getAllBusinesses:no-params:default:guest:public:v1')
    })

    it('should handle empty array as args', () => {
      const result = contextualKeyGenerator('business', 'getAllBusinesses', [])

      expect(result).toBe('business:getAllBusinesses:no-params:default:guest:public:v1')
    })

    it('should handle complex nested objects in params', () => {
      const complexParams = {
        filters: {
          category: ['food', 'retail'],
          location: { lat: 40.7128, lng: -74.0060 },
        },
        sort: { field: 'name', order: 'asc' },
      }
      
      const result = contextualKeyGenerator('business', 'getAllBusinesses', [complexParams, 'es'])
      
      expect(result).toMatch(/^business:getAllBusinesses:[a-f0-9]{12}:es:guest:public:v1$/)
    })
  })

  describe('key structure validation', () => {
    it('should always include version at the end', () => {
      const result = contextualKeyGenerator('business', 'getAllBusinesses', [
        { page: 1 },
        'es',
      ])

      expect(result.endsWith(':v1')).toBe(true)
    })

    it('should maintain consistent component count for same parameter patterns', () => {
      const key1 = contextualKeyGenerator('business', 'getAllBusinesses', [{ page: 1 }, 'es'])
      const key2 = contextualKeyGenerator('category', 'getAllCategories', [{ page: 1 }, 'en'])
      
      const components1 = key1.split(':')
      const components2 = key2.split(':')
      
      expect(components1).toHaveLength(components2.length)
    })

    it('should generate shorter keys for simple parameters', () => {
      const simpleKey = contextualKeyGenerator('business', 'getBusinessById', [{ id: '123' }])
      const complexKey = contextualKeyGenerator('business', 'getAllBusinesses', [
        { page: 1, filters: { category: 'food' } },
        'es',
        'user123',
        'admin',
        'org456',
      ])
      
      expect(simpleKey.length).toBeLessThan(complexKey.length)
      expect(simpleKey.length).toBeLessThan(250) // Redis key length limit
      expect(complexKey.length).toBeLessThan(250)
    })
  })
})

describe('extractCacheContext', () => {
  it('should extract all context parameters', () => {
    const args = [
      { page: 1, limit: 10 },
      'es',
      'user123',
      'admin',
      'org456',
    ]
    
    const context = extractCacheContext(args)
    
    expect(context).toEqual({
      searchParams: { page: 1, limit: 10 },
      language: 'es',
      userId: 'user123',
      userRole: 'admin',
      tenantId: 'org456',
    })
  })

  it('should handle partial parameters', () => {
    const args = [{ page: 1 }, 'en']
    
    const context = extractCacheContext(args)
    
    expect(context).toEqual({
      searchParams: { page: 1 },
      language: 'en',
      userId: undefined,
      userRole: undefined,
      tenantId: undefined,
    })
  })

  it('should handle empty args', () => {
    const context = extractCacheContext([])
    
    expect(context).toEqual({
      searchParams: undefined,
      language: undefined,
      userId: undefined,
      userRole: undefined,
      tenantId: undefined,
    })
  })
})