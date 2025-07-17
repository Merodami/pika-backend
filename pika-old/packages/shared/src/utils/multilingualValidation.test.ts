import { type MultilingualContent } from '@pika/types-core'
import { describe, expect, it } from 'vitest'

import {
  ensureMultilingualContent,
  getLocalizedText,
  type MultilingualFieldConfig,
  validateMultilingualContent,
} from './multilingualValidation.js'

describe('multilingualValidation', () => {
  describe('validateMultilingualContent', () => {
    it('should validate a valid multilingual object with all languages', () => {
      const input = {
        en: 'English text',
        es: 'Texto en español',
        gn: "Ñe'ẽ guaraníme",
      }

      const result = validateMultilingualContent(input, 'testField')

      expect(result).toEqual(input)
    })

    it('should validate a valid multilingual object with only English', () => {
      const input = {
        en: 'English text',
      }

      const result = validateMultilingualContent(input, 'testField')

      expect(result).toEqual(input)
    })

    it('should throw error when value is not an object', () => {
      expect(() => validateMultilingualContent('string', 'testField')).toThrow()
      expect(() => validateMultilingualContent(123, 'testField')).toThrow()
      expect(() => validateMultilingualContent(null, 'testField')).toThrow()
      expect(() =>
        validateMultilingualContent(undefined, 'testField'),
      ).toThrow()
    })

    it('should throw error when English is required but missing', () => {
      const input = {
        es: 'Texto en español',
      }

      expect(() => validateMultilingualContent(input, 'testField')).toThrow()
    })

    it('should not require English when requiredDefault is false', () => {
      const input = {
        es: 'Texto en español',
      }

      const result = validateMultilingualContent(input, 'testField', {
        requiredDefault: false,
      })

      expect(result).toEqual(input)
    })

    it('should trim whitespace when trim is true', () => {
      const input = {
        en: '  English text  ',
        es: '  Texto en español  ',
      }

      const result = validateMultilingualContent(input, 'testField')

      expect(result).toEqual({
        en: 'English text',
        es: 'Texto en español',
      })
    })

    it('should not trim whitespace when trim is false', () => {
      const input = {
        en: '  English text  ',
        es: '  Texto en español  ',
      }

      const result = validateMultilingualContent(input, 'testField', {
        trim: false,
      })

      expect(result).toEqual(input)
    })

    it('should validate minimum length constraints', () => {
      const input = {
        en: 'Hi',
      }

      expect(() =>
        validateMultilingualContent(input, 'testField', { minLength: 5 }),
      ).toThrow()
    })

    it('should validate maximum length constraints', () => {
      const input = {
        en: 'A'.repeat(101),
      }

      expect(() =>
        validateMultilingualContent(input, 'testField', { maxLength: 100 }),
      ).toThrow()
    })

    it('should validate length constraints for all languages', () => {
      const input = {
        en: 'Valid length',
        es: 'A'.repeat(101),
      }

      expect(() =>
        validateMultilingualContent(input, 'testField', { maxLength: 100 }),
      ).toThrow()
    })

    it('should preserve empty strings for optional languages', () => {
      const input = {
        en: 'English text',
        es: '',
        gn: '',
      }

      const result = validateMultilingualContent(input, 'testField')

      expect(result).toEqual(input)
    })

    it('should preserve additional language keys', () => {
      const input = {
        en: 'English text',
        es: 'Texto en español',
        pt: 'Texto em português', // Additional language
      }

      const result = validateMultilingualContent(input, 'testField')

      expect(result).toEqual(input)
    })

    it('should throw error when non-string values are provided', () => {
      const input = {
        en: 'English text',
        es: 123, // Invalid type
      }

      expect(() => validateMultilingualContent(input, 'testField')).toThrow()
    })

    it('should handle complex validation scenarios', () => {
      const config: MultilingualFieldConfig = {
        requiredDefault: true,
        minLength: 10,
        maxLength: 50,
        trim: true,
      }

      const validInput = {
        en: '  Valid English text  ',
        es: 'Texto válido en español',
      }

      const result = validateMultilingualContent(
        validInput,
        'testField',
        config,
      )

      expect(result).toEqual({
        en: 'Valid English text',
        es: 'Texto válido en español',
      })
    })
  })

  describe('ensureMultilingualContent', () => {
    it('should return undefined for null or undefined input', () => {
      expect(ensureMultilingualContent(null, 'testField')).toBeUndefined()
      expect(ensureMultilingualContent(undefined, 'testField')).toBeUndefined()
    })

    it('should validate when value is provided', () => {
      const input = {
        en: 'English text',
      }

      const result = ensureMultilingualContent(input, 'testField')

      expect(result).toEqual(input)
    })

    it('should use provided config', () => {
      const input = {
        es: 'Solo español',
      }

      const result = ensureMultilingualContent(input, 'testField', {
        requiredDefault: false,
      })

      expect(result).toEqual(input)
    })

    it('should throw when validation fails', () => {
      const input = {
        es: 'Solo español',
      }

      expect(() =>
        ensureMultilingualContent(input, 'testField', {
          requiredDefault: true,
        }),
      ).toThrow()
    })
  })

  describe('getLocalizedText', () => {
    const multilingualText: MultilingualContent = {
      en: 'English text',
      es: 'Texto en español',
      gn: "Ñe'ẽ guaraníme",
    }

    it('should return text for requested language', () => {
      expect(getLocalizedText(multilingualText, 'en')).toBe('English text')
      expect(getLocalizedText(multilingualText, 'es')).toBe('Texto en español')
      expect(getLocalizedText(multilingualText, 'gn')).toBe("Ñe'ẽ guaraníme")
    })

    it('should fallback to default language when requested is not available', () => {
      const partialText: MultilingualContent = {
        en: 'English text',
        es: '',
        gn: '',
      }

      expect(getLocalizedText(partialText, 'es')).toBe('English text')
      expect(getLocalizedText(partialText, 'gn')).toBe('English text')
    })

    it('should use custom default language', () => {
      const partialText: MultilingualContent = {
        en: 'English text',
        es: 'Texto en español',
        gn: '',
      }

      // Create a copy without English to test fallback
      const textWithoutEnglish = { ...partialText }

      delete (textWithoutEnglish as any).en

      expect(getLocalizedText(textWithoutEnglish, 'en', 'es')).toBe(
        'Texto en español',
      )
    })

    it('should return empty string for null or undefined', () => {
      expect(getLocalizedText(null)).toBe('')
      expect(getLocalizedText(undefined)).toBe('')
    })

    it('should try other languages when requested and default are not available', () => {
      const partialText: any = {
        gn: "Ñe'ẽ guaraníme",
      }

      expect(getLocalizedText(partialText, 'pt', 'fr')).toBe("Ñe'ẽ guaraníme")
    })

    it('should return empty string when no languages are available', () => {
      const emptyText: any = {}

      expect(getLocalizedText(emptyText)).toBe('')
    })

    it('should use default language when no language is specified', () => {
      expect(getLocalizedText(multilingualText)).toBe('English text')
    })

    it('should handle all supported languages', () => {
      const extendedText: MultilingualContent = {
        en: 'English text',
        es: 'Texto en español',
        gn: "Ñe'ẽ guaraníme",
      }

      expect(getLocalizedText(extendedText, 'gn')).toBe("Ñe'ẽ guaraníme")
    })
  })

  describe('error handling', () => {
    it('should throw ValidationError with proper structure', () => {
      const input = {
        es: 'Solo español',
      }

      try {
        validateMultilingualContent(input, 'businessName')
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.name).toBe('ValidationError')
        expect(error.validationErrors).toHaveProperty('businessName')
        expect(error.context.source).toBe('validateMultilingualContent')
      }
    })

    it('should aggregate multiple validation errors', () => {
      const input = {
        en: 123, // Wrong type
        es: 'A'.repeat(1001), // Too long (default max is 1000)
      }

      try {
        validateMultilingualContent(input, 'description')
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.name).toBe('ValidationError')

        const errors = error.validationErrors.description

        expect(errors).toBeInstanceOf(Array)
        expect(errors.length).toBeGreaterThan(1)
      }
    })
  })
})
