import { describe, expect, it } from 'vitest'

import {
  createSortValidator,
  DEFAULT_SORT_DIRECTION,
  isValidSortField,
  normalizeApiSortParams,
  parseSortString,
  toPrismaSort,
  toSqlOrderByClause,
} from './sorting.js'

describe('Sorting Utilities', () => {
  describe('parseSortString', () => {
    it('should return empty object for undefined input', () => {
      expect(parseSortString(undefined)).toEqual({})
    })

    it('should return empty object for null input', () => {
      expect(parseSortString(null)).toEqual({})
    })

    it('should parse field only as field with default direction', () => {
      expect(parseSortString('created_at')).toEqual({
        sortBy: 'created_at',
        sortOrder: DEFAULT_SORT_DIRECTION,
      })
    })

    it('should parse field:asc correctly', () => {
      expect(parseSortString('created_at:asc')).toEqual({
        sortBy: 'created_at',
        sortOrder: 'asc',
      })
    })

    it('should parse field:desc correctly', () => {
      expect(parseSortString('created_at:desc')).toEqual({
        sortBy: 'created_at',
        sortOrder: 'desc',
      })
    })

    it('should handle invalid direction by defaulting to asc', () => {
      expect(parseSortString('created_at:invalid')).toEqual({
        sortBy: 'created_at',
        sortOrder: 'asc',
      })
    })
  })

  describe('normalizeApiSortParams', () => {
    it('should return empty object for empty input', () => {
      expect(normalizeApiSortParams({})).toEqual({})
    })

    it('should parse sort parameter if provided', () => {
      expect(normalizeApiSortParams({ sort: 'created_at:desc' })).toEqual({
        sortBy: 'created_at',
        sortOrder: 'desc',
      })
    })

    it('should use sort_by and sort_order when provided', () => {
      expect(
        normalizeApiSortParams({
          sort_by: 'updated_at',
          sort_order: 'asc',
        }),
      ).toEqual({
        sortBy: 'updatedAt',
        sortOrder: 'asc',
      })
    })

    it('should prioritize sort_by and sort_order over sort', () => {
      expect(
        normalizeApiSortParams({
          sort: 'created_at:desc',
          sort_by: 'updated_at',
          sort_order: 'asc',
        }),
      ).toEqual({
        sortBy: 'updatedAt',
        sortOrder: 'asc',
      })
    })

    it('should allow partial override of sort', () => {
      expect(
        normalizeApiSortParams({
          sort: 'created_at:desc',
          sort_by: 'updated_at',
        }),
      ).toEqual({
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      })
    })
  })

  describe('toPrismaSort', () => {
    it('should return empty object when no sort params', () => {
      expect(toPrismaSort({})).toEqual({})
    })

    it('should use default values when no sort params', () => {
      expect(toPrismaSort({}, 'createdAt', 'desc')).toEqual({
        createdAt: 'desc',
      })
    })

    it('should create proper Prisma sort object', () => {
      expect(toPrismaSort({ sortBy: 'updatedAt', sortOrder: 'asc' })).toEqual({
        updatedAt: 'asc',
      })
    })
  })

  describe('toSqlOrderByClause', () => {
    it('should return empty string when no sort params', () => {
      expect(toSqlOrderByClause({})).toBe('')
    })

    it('should use default values when no sort params', () => {
      expect(toSqlOrderByClause({}, 'createdAt', 'desc')).toBe(
        'ORDER BY created_at DESC',
      )
    })

    it('should create proper SQL ORDER BY clause', () => {
      expect(
        toSqlOrderByClause({ sortBy: 'updatedAt', sortOrder: 'asc' }),
      ).toBe('ORDER BY updated_at ASC')
    })
  })

  describe('isValidSortField', () => {
    it('should return false for empty input', () => {
      expect(isValidSortField()).toBe(false)
    })

    it('should return false if allowedFields is empty', () => {
      expect(isValidSortField('name', [])).toBe(false)
    })

    it('should return true for valid field', () => {
      expect(isValidSortField('name', ['name', 'createdAt'])).toBe(true)
    })

    it('should return false for invalid field', () => {
      expect(isValidSortField('invalid', ['name', 'createdAt'])).toBe(false)
    })
  })

  describe('createSortValidator', () => {
    const validator = createSortValidator(['name', 'created_at'])

    it('should validate sort parameter correctly', () => {
      expect(validator({ sort: 'name:asc' })).toBe(true)
      expect(validator({ sort: 'invalid:asc' })).toBe(false)
    })

    it('should validate sort_by parameter correctly', () => {
      expect(validator({ sort_by: 'name' })).toBe(true)
      expect(validator({ sort_by: 'invalid' })).toBe(false)
    })

    it('should handle empty parameters', () => {
      expect(validator({})).toBe(false)
    })
  })
})
