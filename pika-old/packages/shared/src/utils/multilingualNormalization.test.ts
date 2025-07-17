import { describe, expect, it } from 'vitest'

import {
  normalizeMultilingualContent,
  normalizeMultilingualFields,
} from './multilingualNormalization.js'

describe('normalizeMultilingualContent', () => {
  it('should fill missing languages with empty strings', () => {
    const input = { en: 'Hello' }
    const result = normalizeMultilingualContent(input)

    expect(result).toEqual({
      en: 'Hello',
      es: '',
      gn: '',
    })
  })

  it('should preserve all provided languages', () => {
    const input = {
      en: 'Hello',
      es: 'Hola',
      gn: 'Maitei',
    }
    const result = normalizeMultilingualContent(input)

    expect(result).toEqual({
      en: 'Hello',
      es: 'Hola',
      gn: 'Maitei',
    })
  })

  it('should handle partial language updates', () => {
    const input = { es: 'Hola' }
    const result = normalizeMultilingualContent(input)

    expect(result).toEqual({
      en: '',
      es: 'Hola',
      gn: '',
    })
  })

  it('should handle null input', () => {
    const result = normalizeMultilingualContent(null)

    expect(result).toEqual({
      en: '',
      es: '',
      gn: '',
    })
  })

  it('should handle undefined input', () => {
    const result = normalizeMultilingualContent(undefined)

    expect(result).toEqual({
      en: '',
      es: '',
      gn: '',
    })
  })

  it('should handle empty object', () => {
    const result = normalizeMultilingualContent({})

    expect(result).toEqual({
      en: '',
      es: '',
      gn: '',
    })
  })

  it('should handle null values for specific languages', () => {
    const input = {
      en: 'Hello',
      es: null,
      gn: undefined,
    } as any
    const result = normalizeMultilingualContent(input)

    expect(result).toEqual({
      en: 'Hello',
      es: '',
      gn: '',
    })
  })

  it('should ignore extra languages not in SUPPORTED_LANGUAGES', () => {
    const input = {
      en: 'Hello',
      es: 'Hola',
      gn: 'Maitei',
      pt: 'Olá', // Extra language
    } as any
    const result = normalizeMultilingualContent(input)

    expect(result).toEqual({
      en: 'Hello',
      es: 'Hola',
      gn: 'Maitei',
      // pt is not included
    })
  })

  it('should handle empty strings as valid values', () => {
    const input = {
      en: '',
      es: 'Hola',
      gn: '',
    }
    const result = normalizeMultilingualContent(input)

    expect(result).toEqual({
      en: '',
      es: 'Hola',
      gn: '',
    })
  })
})

describe('normalizeMultilingualFields', () => {
  it('should normalize multiple multilingual fields in an object', () => {
    const input = {
      id: '123',
      businessName: { en: 'My Business' },
      businessDescription: { es: 'Mi descripción' },
      categoryId: '456',
    }

    const result = normalizeMultilingualFields(input, [
      'businessName',
      'businessDescription',
    ])

    expect(result).toEqual({
      id: '123',
      businessName: {
        en: 'My Business',
        es: '',
        gn: '',
      },
      businessDescription: {
        en: '',
        es: 'Mi descripción',
        gn: '',
      },
      categoryId: '456',
    })
  })

  it('should handle missing fields gracefully', () => {
    const input = {
      id: '123',
      businessName: { en: 'My Business' },
      // businessDescription is missing
      categoryId: '456',
    }

    const result = normalizeMultilingualFields(input, [
      'businessName',
      'businessDescription' as any,
    ])

    expect(result).toEqual({
      id: '123',
      businessName: {
        en: 'My Business',
        es: '',
        gn: '',
      },
      // businessDescription remains undefined
      categoryId: '456',
    })
  })

  it('should not modify non-multilingual fields', () => {
    const input = {
      id: '123',
      name: { en: 'Product' },
      price: 100,
      active: true,
      tags: ['tag1', 'tag2'],
    }

    const result = normalizeMultilingualFields(input, ['name'])

    expect(result).toEqual({
      id: '123',
      name: {
        en: 'Product',
        es: '',
        gn: '',
      },
      price: 100,
      active: true,
      tags: ['tag1', 'tag2'],
    })
  })

  it('should handle empty field list', () => {
    const input = {
      id: '123',
      name: { en: 'Product' },
      description: { es: 'Descripción' },
    }

    const result = normalizeMultilingualFields(input, [])

    expect(result).toEqual(input) // No changes
  })

  it('should create a new object without modifying the original', () => {
    const input = {
      id: '123',
      name: { en: 'Product' },
    }

    const result = normalizeMultilingualFields(input, ['name'])

    // Original should not be modified
    expect(input.name).toEqual({ en: 'Product' })

    // Result should have normalized fields
    expect(result.name).toEqual({
      en: 'Product',
      es: '',
      gn: '',
    })

    // Should be different objects
    expect(result).not.toBe(input)
    expect(result.name).not.toBe(input.name)
  })
})
