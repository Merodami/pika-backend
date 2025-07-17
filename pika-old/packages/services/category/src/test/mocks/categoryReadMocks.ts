// src/test/mocks/categoryReadMocks.ts

import { Category } from '@pika/sdk'

import { CategoryReadRepositoryPort } from '../../read/domain/port/category/CategoryReadRepositoryPort.js'

/**
 * Mock implementation of CategoryReadRepositoryPort for testing
 */
export const mockCategoryReadRepository: CategoryReadRepositoryPort & {
  setItems: (items: Category[]) => void
  reset: () => void
  setError: (error: Error | null) => void
  getItems: () => Category[]
} = {
  // Internal state for the mock
  _items: [] as Category[],
  _error: null as Error | null,

  // Methods to control mock behavior
  setItems(items: Category[]) {
    this._items = [...items]
  },

  getItems() {
    return [...this._items]
  },

  reset() {
    this._items = []
    this._error = null
  },

  setError(error: Error | null) {
    this._error = error
  },

  // Read Repository implementation methods
  async findAll(options?: any) {
    if (this._error) throw this._error

    let results = [...this._items]

    // Handle parent_id filtering
    if (options?.parentId !== undefined) {
      results = results.filter((item) => item.parent_id === options.parentId)
    }

    // Handle level filtering
    if (options?.level !== undefined) {
      results = results.filter((item) => item.level === options.level)
    }

    // Handle active filtering
    if (options?.active !== undefined) {
      results = results.filter((item) => item.active === options.active)
    }

    // Handle pagination
    const page = options?.page || 1
    const limit = options?.limit || results.length
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    const paginatedResults = results.slice(startIndex, endIndex)

    return {
      data: paginatedResults,
      pagination: {
        total: results.length,
        page,
        limit,
        pages: Math.ceil(results.length / limit),
        has_next: endIndex < results.length,
        has_prev: startIndex > 0,
      },
    }
  },

  async findById(id: string, includeChildren = false) {
    if (this._error) throw this._error

    const category = this._items.find((item) => item.id === id)

    if (!category) return null

    if (includeChildren) {
      const children = this._items.filter((item) => item.parent_id === id)

      return { ...category, children }
    }

    return category
  },
}
