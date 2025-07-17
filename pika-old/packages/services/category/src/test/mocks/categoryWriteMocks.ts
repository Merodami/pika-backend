// src/test/mocks/categoryWriteMocks.ts

import { Category } from '@pika/sdk'
import { get } from 'lodash-es'
import { v4 as uuid } from 'uuid'

import { CategoryWriteRepositoryPort } from '../../write/domain/port/category/CategoryWriteRepositoryPort.js'

/**
 * Mock implementation of CategoryWriteRepositoryPort for testing
 */
export const mockCategoryWriteRepository: CategoryWriteRepositoryPort & {
  setItems: (items: Category[]) => void
  reset: () => void
  setError: (error: Error | null) => void
  getItems: () => Category[]
  findById: (id: string, includeChildren?: boolean) => Promise<Category | null>
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

  // Helper method for tests
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

  // Write Repository implementation methods
  async create(data: Partial<Category>) {
    if (this._error) throw this._error

    // Check for duplicate slug
    if (data.slug && this._items.some((item) => item.slug === data.slug)) {
      throw new Error(`Category with slug "${data.slug}" already exists`)
    }

    const newCategory: Category = {
      id: data.id || uuid(),
      name: data.name || { en: 'Default name', es: 'Nombre predeterminado' },
      description: data.description || {
        en: 'Default description',
        es: 'Descripción predeterminada',
      },
      slug: data.slug || `category-${uuid().substring(0, 8)}`,
      icon_url: data.icon_url,
      parent_id: data.parent_id,
      level: data.level || 1,
      path: data.path || '/',
      active: data.active !== undefined ? data.active : true,
      sort_order: data.sort_order || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    this._items.push(newCategory)

    return newCategory
  },

  async update(id: string, data: Partial<Category>) {
    if (this._error) throw this._error

    const index = this._items.findIndex((item) => item.id === id)

    if (index === -1) return null

    // Check for duplicate slug if slug is being updated
    if (
      data.slug &&
      this._items.some((item) => item.slug === data.slug && item.id !== id)
    ) {
      throw new Error(`Category with slug "${data.slug}" already exists`)
    }

    // Safe access with get from lodash
    const categoryToUpdate = { ...get(this._items, index, {}) }

    const updatedCategory = {
      ...categoryToUpdate,
      ...data,
      updated_at: new Date().toISOString(),
    }

    // Create a new array with the updated item
    this._items = [
      ...this._items.slice(0, index),
      updatedCategory,
      ...this._items.slice(index + 1),
    ]

    return updatedCategory
  },

  async delete(id: string) {
    if (this._error) throw this._error

    // Check if category has children
    if (this._items.some((item) => item.parent_id === id)) {
      throw new Error('Cannot delete category with child categories')
    }

    const index = this._items.findIndex((item) => item.id === id)

    if (index === -1) return false

    // Using Array methods to avoid direct splice
    this._items = [
      ...this._items.slice(0, index),
      ...this._items.slice(index + 1),
    ]

    return true
  },
}
