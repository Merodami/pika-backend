// src/test/mocks/adminReadMocks.ts

import { Admin } from '@pika/sdk'

import { AdminReadRepositoryPort } from '../../read/domain/port/admin/AdminReadRepositoryPort.js'

/**
 * Mock implementation of AdminReadRepositoryPort for testing
 */
export const mockAdminReadRepository: AdminReadRepositoryPort & {
  setItems: (items: Admin[]) => void
  reset: () => void
  setError: (error: Error | null) => void
  getItems: () => Admin[]
} = {
  // Internal state for the mock
  _items: [] as Admin[],
  _error: null as Error | null,

  // Methods to control mock behavior
  setItems(items: Admin[]) {
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

    // Handle role filtering
    if (options?.role !== undefined) {
      results = results.filter((item) => item.role === options.role)
    }

    // Handle status filtering
    if (options?.status !== undefined) {
      results = results.filter((item) => item.status === options.status)
    }

    // Handle email filtering
    if (options?.email !== undefined) {
      results = results.filter((item) => item.email.includes(options.email))
    }

    // Handle permission filtering
    if (options?.permission !== undefined) {
      results = results.filter((item) =>
        item.permissions.includes(options.permission),
      )
    }

    // Handle sorting
    if (options?.sort) {
      const sortField = options.sort
      const sortOrder = options.sortOrder || 'asc'

      results.sort((a, b) => {
        let aValue = a[sortField as keyof Admin]
        let bValue = b[sortField as keyof Admin]

        // Handle date sorting
        if (
          sortField === 'created_at' ||
          sortField === 'updated_at' ||
          sortField === 'last_login_at'
        ) {
          aValue = new Date(aValue as string).getTime()
          bValue = new Date(bValue as string).getTime()
        }

        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
        }
      })
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

  async findById(id: string) {
    if (this._error) throw this._error

    const admin = this._items.find((item) => item.id === id)

    return admin || null
  },

  async getAdminByUserId(userId: string) {
    if (this._error) throw this._error

    const admin = this._items.find((item) => item.user_id === userId)

    return admin || null
  },

  async isUserAdmin(userId: string) {
    if (this._error) throw this._error

    const admin = this._items.find((item) => item.user_id === userId)

    return !!admin && admin.status === 'ACTIVE'
  },
}
