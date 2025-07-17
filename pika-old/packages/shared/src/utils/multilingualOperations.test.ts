import { type MultilingualContent } from '@pika/types-core'
import { describe, expect, it } from 'vitest'

import {
  areMultilingualContentsEqual,
  cleanMultilingualContent,
  createMultilingualUpdate,
  createUniformMultilingualContent,
  extractLanguages,
  fillMissingLanguages,
  getAvailableLanguages,
  hasMultilingualContent,
  isMultilingualContent,
  mergeMultilingualContent,
  normalizeMultilingualText,
  summarizeMultilingualContent,
  transformMultilingualContent,
} from './multilingualOperations.js'

describe('multilingualOperations', () => {
  describe('mergeMultilingualContent', () => {
    it('should merge update into existing content', () => {
      const existing: MultilingualContent = {
        en: 'Hello',
        es: 'Hola',
        gn: 'Maitei',
      }
      const update = {
        en: 'Hi',
        gn: 'Maitei',
      }

      const result = mergeMultilingualContent(existing, update)

      expect(result).toEqual({
        en: 'Hi',
        es: 'Hola',
        gn: 'Maitei',
      })
    })

    it('should handle null existing content', () => {
      const update = {
        en: 'Hello',
        es: 'Hola',
        gn: '',
      }

      const result = mergeMultilingualContent(null, update)

      expect(result).toEqual(update)
    })

    it('should handle null update', () => {
      const existing: MultilingualContent = {
        en: 'Hello',
        es: 'Hola',
        gn: '',
      }

      const result = mergeMultilingualContent(existing, null)

      expect(result).toEqual(existing)
    })

    it('should ensure English exists when creating new', () => {
      const update = {
        es: 'Hola',
      }

      const result = mergeMultilingualContent(null, update)

      expect(result).toEqual({
        en: '',
        es: 'Hola',
      })
    })

    it('should remove empty values when removeEmpty is true', () => {
      const existing: MultilingualContent = {
        en: 'Hello',
        es: 'Hola',
        gn: 'Maitei',
      }
      const update = {
        es: '',
        gn: '  ',
      }

      const result = mergeMultilingualContent(existing, update, {
        removeEmpty: true,
      })

      expect(result).toEqual({
        en: 'Hello',
      })
    })

    it('should preserve null when preserveNull is true', () => {
      const existing: MultilingualContent = {
        en: 'Hello',
        es: 'Hola',
        gn: 'Maitei',
      }
      const update: Partial<MultilingualContent> = {
        es: null as any,
        gn: undefined,
      }

      const result = mergeMultilingualContent(existing, update, {
        preserveNull: true,
      })

      expect(result).toEqual({
        en: 'Hello',
        gn: 'Maitei',
      })
      expect('es' in result).toBe(false)
    })

    it('should validate result when validate is true', () => {
      const existing: MultilingualContent = {
        en: 'Hello',
        es: '',
        gn: '',
      }
      const update = {
        en: 'H', // Too short - validation only fails on required field (en)
      }

      expect(() =>
        mergeMultilingualContent(existing, update, {
          validate: true,
          validationConfig: { minLength: 3 },
        }),
      ).toThrow()
    })
  })

  describe('createMultilingualUpdate', () => {
    it('should detect changes between current and desired', () => {
      const current: MultilingualContent = {
        en: 'Hello',
        es: 'Hola',
        gn: '',
      }
      const desired: MultilingualContent = {
        en: 'Hi',
        es: 'Hola',
        gn: 'Maitei',
      }

      const update = createMultilingualUpdate(current, desired)

      expect(update).toEqual({
        en: 'Hi',
        gn: 'Maitei',
      })
    })

    it('should detect removed languages', () => {
      const current: MultilingualContent = {
        en: 'Hello',
        es: 'Hola',
        gn: 'Maitei',
      }
      const desired: MultilingualContent = {
        en: 'Hello',
        es: '',
        gn: '',
      }

      const update = createMultilingualUpdate(current, desired)

      expect(update).toEqual({
        es: '',
        gn: '',
      })
    })

    it('should return null when no changes', () => {
      const current: MultilingualContent = {
        en: 'Hello',
        es: 'Hola',
        gn: '',
      }

      const update = createMultilingualUpdate(current, current)

      expect(update).toBeNull()
    })
  })

  describe('cleanMultilingualContent', () => {
    it('should remove empty values', () => {
      const content: MultilingualContent = {
        en: 'Hello',
        es: '',
        gn: '  ',
      }

      const cleaned = cleanMultilingualContent(content)

      expect(cleaned).toEqual({
        en: 'Hello',
      })
    })

    it('should preserve empty English when preserveEnglish is true', () => {
      const content: MultilingualContent = {
        en: '',
        es: 'Hola',
        gn: '',
      }

      const cleaned = cleanMultilingualContent(content, true)

      expect(cleaned).toEqual({
        en: '',
        es: 'Hola',
      })
    })

    it('should remove empty English when preserveEnglish is false', () => {
      const content: MultilingualContent = {
        en: '',
        es: 'Hola',
        gn: '',
      }

      const cleaned = cleanMultilingualContent(content, false)

      expect(cleaned).toEqual({
        es: 'Hola',
      })
    })
  })

  describe('hasMultilingualContent', () => {
    it('should return true when content exists', () => {
      expect(hasMultilingualContent({ en: 'Hello', es: 'Hola', gn: '' })).toBe(
        true,
      )
      expect(hasMultilingualContent({ en: 'Hello', es: '', gn: '' })).toBe(true)
    })

    it('should return false when no content', () => {
      expect(hasMultilingualContent(null)).toBe(false)
      expect(hasMultilingualContent(undefined)).toBe(false)
      expect(hasMultilingualContent({ en: '', es: '  ', gn: '' })).toBe(false)
    })
  })

  describe('getAvailableLanguages', () => {
    it('should return languages with content', () => {
      const content: MultilingualContent = {
        en: 'Hello',
        es: '',
        gn: 'Maitei',
      }

      expect(getAvailableLanguages(content)).toEqual(['en', 'gn'])
    })

    it('should include empty when includeEmpty is true', () => {
      const content: MultilingualContent = {
        en: 'Hello',
        es: '',
        gn: 'Maitei',
      }

      expect(getAvailableLanguages(content, true)).toEqual(['en', 'es', 'gn'])
    })

    it('should handle null content', () => {
      expect(getAvailableLanguages(null)).toEqual([])
    })
  })

  describe('areMultilingualContentsEqual', () => {
    it('should return true for equal contents', () => {
      const a: MultilingualContent = { en: 'Hello', es: 'Hola', gn: '' }
      const b: MultilingualContent = { en: 'Hello', es: 'Hola', gn: '' }

      expect(areMultilingualContentsEqual(a, b)).toBe(true)
    })

    it('should return false for different contents', () => {
      const a: MultilingualContent = { en: 'Hello', es: 'Hola', gn: '' }
      const b: MultilingualContent = { en: 'Hi', es: 'Hola', gn: '' }

      expect(areMultilingualContentsEqual(a, b)).toBe(false)
    })

    it('should ignore empty values when ignoreEmpty is true', () => {
      const a: MultilingualContent = { en: 'Hello', es: 'Hola', gn: '' }
      const b: MultilingualContent = { en: 'Hello', es: 'Hola', gn: '' }

      expect(areMultilingualContentsEqual(a, b, true)).toBe(true)
    })

    it('should handle null values', () => {
      expect(areMultilingualContentsEqual(null, null)).toBe(true)
      expect(
        areMultilingualContentsEqual(null, { en: 'Hello', es: '', gn: '' }),
      ).toBe(false)
    })
  })

  describe('extractLanguages', () => {
    it('should extract specified languages', () => {
      const content: MultilingualContent = {
        en: 'Hello',
        es: 'Hola',
        gn: 'Maitei',
      }

      const extracted = extractLanguages(content, ['en', 'gn'])

      expect(extracted).toEqual({
        en: 'Hello',
        gn: 'Maitei',
      })
    })
  })

  describe('fillMissingLanguages', () => {
    it('should fill missing languages with default string', () => {
      const content: MultilingualContent = {
        en: 'Hello',
        es: '',
        gn: '',
      }

      const filled = fillMissingLanguages(content, ['en', 'es', 'gn'], 'N/A')

      expect(filled).toEqual({
        en: 'Hello',
        es: 'N/A',
        gn: 'N/A',
      })
    })

    it('should fill from source content', () => {
      const content: MultilingualContent = {
        en: 'Hello',
        es: '',
        gn: '',
      }
      const source: MultilingualContent = {
        en: 'Default EN',
        es: 'Default ES',
        gn: 'Default GN',
      }

      const filled = fillMissingLanguages(content, ['en', 'es', 'gn'], source)

      expect(filled).toEqual({
        en: 'Hello',
        es: 'Default ES',
        gn: 'Default GN',
      })
    })
  })

  describe('transformMultilingualContent', () => {
    it('should transform all values', () => {
      const content: MultilingualContent = {
        en: 'hello',
        es: 'hola',
        gn: '',
      }

      const transformed = transformMultilingualContent(content, (value) =>
        value.toUpperCase(),
      )

      expect(transformed).toEqual({
        en: 'HELLO',
        es: 'HOLA',
        gn: '',
      })
    })

    it('should pass language code to transformer', () => {
      const content: MultilingualContent = {
        en: 'test',
        es: 'test',
        gn: 'test',
      }

      const transformed = transformMultilingualContent(
        content,
        (value, lang) => `${lang}:${value}`,
      )

      expect(transformed).toEqual({
        en: 'en:test',
        es: 'es:test',
        gn: 'gn:test',
      })
    })
  })

  describe('createUniformMultilingualContent', () => {
    it('should create content with same value for all languages', () => {
      const content = createUniformMultilingualContent('Hello', ['en', 'es'])

      expect(content).toEqual({
        en: 'Hello',
        es: 'Hello',
      })
    })
  })

  describe('isMultilingualContent', () => {
    it('should return true for valid content', () => {
      expect(isMultilingualContent({ en: 'Hello', es: '', gn: '' })).toBe(true)
      expect(isMultilingualContent({ en: 'Hello', es: 'Hola', gn: '' })).toBe(
        true,
      )
    })

    it('should return false for invalid content', () => {
      expect(isMultilingualContent(null)).toBe(false)
      expect(isMultilingualContent('string')).toBe(false)
      expect(isMultilingualContent({ es: 'Hola' })).toBe(false) // Missing English
      expect(isMultilingualContent({ en: 123, es: '', gn: '' } as any)).toBe(
        false,
      ) // Wrong type
    })
  })

  describe('summarizeMultilingualContent', () => {
    it('should create summary of content', () => {
      const content: MultilingualContent = {
        en: 'This is a very long English text that should be truncated',
        es: 'Este es un texto muy largo en español que debe ser truncado',
        gn: '',
      }

      const summary = summarizeMultilingualContent(content, 15)

      expect(summary).toBe('{en:"This is a ve...", es:"Este es un t..."}')
    })

    it('should handle empty content', () => {
      expect(summarizeMultilingualContent(null)).toBe('[empty]')
      expect(summarizeMultilingualContent({ en: '', es: '', gn: '' })).toBe(
        '[no content]',
      )
    })
  })

  describe('normalizeMultilingualText', () => {
    it('should normalize and fill missing languages', () => {
      const content = {
        en: 'Hello',
      }

      const normalized = normalizeMultilingualText(content, 'field')

      expect(normalized).toHaveProperty('en', 'Hello')
      expect(normalized).toHaveProperty('es', '')
      expect(normalized).toHaveProperty('gn', '')
    })

    it('should return undefined for invalid content', () => {
      expect(normalizeMultilingualText(null, 'field')).toBeUndefined()
      expect(normalizeMultilingualText(undefined, 'field')).toBeUndefined()
    })
  })
})
