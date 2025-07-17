// src/test/mocks/adminWriteMocks.ts

import { Admin } from '@pika/sdk'
import { get } from 'lodash-es'
import { v4 as uuid } from 'uuid'

import { AdminWriteRepositoryPort } from '../../write/domain/port/admin/AdminWriteRepositoryPort.js'

/**
 * Mock implementation of AdminWriteRepositoryPort for testing
 */
export const mockAdminWriteRepository: AdminWriteRepositoryPort & {
  setItems: (items: Admin[]) => void
  reset: () => void
  setError: (error: Error | null) => void
  getItems: () => Admin[]
  findById: (id: string) => Promise<Admin | null>
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

  // Helper method for tests
  async findById(id: string) {
    if (this._error) throw this._error

    const admin = this._items.find((item) => item.id === id)

    return admin || null
  },

  // Write Repository implementation methods
  async create(data: Partial<Admin>) {
    if (this._error) throw this._error

    // Check for duplicate email
    if (data.email && this._items.some((item) => item.email === data.email)) {
      throw new Error(`Admin with email "${data.email}" already exists`)
    }

    // Check for duplicate user_id
    if (
      data.user_id &&
      this._items.some((item) => item.user_id === data.user_id)
    ) {
      throw new Error(`Admin with user_id "${data.user_id}" already exists`)
    }

    const newAdmin: Admin = {
      id: data.id || uuid(),
      user_id: data.user_id || uuid(),
      email: data.email || `admin-${uuid().substring(0, 8)}@example.com`,
      first_name: data.first_name || 'Default',
      last_name: data.last_name || 'Admin',
      role: data.role || 'ADMIN',
      permissions: data.permissions || ['MANAGE_PROVIDERS'],
      status: data.status || 'ACTIVE',
      last_login_at: data.last_login_at,
      metadata: data.metadata || {},
      profile_data: {
        bio: data.profile_data?.bio || {
          en: 'Default bio',
          es: 'Biografía predeterminada',
          gn: '',
        },
        phone: data.profile_data?.phone || null,
        timezone: data.profile_data?.timezone || 'UTC',
        language: data.profile_data?.language || 'en',
        avatar_url: data.profile_data?.avatar_url || null,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      full_name: `${data.first_name || 'Default'} ${data.last_name || 'Admin'}`,
    }

    this._items.push(newAdmin)

    return newAdmin
  },

  async update(id: string, data: Partial<Admin>) {
    if (this._error) throw this._error

    const index = this._items.findIndex((item) => item.id === id)

    if (index === -1) return null

    // Check for duplicate email if email is being updated
    if (
      data.email &&
      this._items.some((item) => item.email === data.email && item.id !== id)
    ) {
      throw new Error(`Admin with email "${data.email}" already exists`)
    }

    // Check for duplicate user_id if user_id is being updated
    if (
      data.user_id &&
      this._items.some(
        (item) => item.user_id === data.user_id && item.id !== id,
      )
    ) {
      throw new Error(`Admin with user_id "${data.user_id}" already exists`)
    }

    // Safe access with get from lodash
    const adminToUpdate = { ...get(this._items, index, {}) }

    // Handle nested profile_data updates
    let updatedProfileData = adminToUpdate.profile_data

    if (data.profile_data) {
      updatedProfileData = {
        ...adminToUpdate.profile_data,
        ...data.profile_data,
        // Handle nested bio updates
        bio: data.profile_data.bio
          ? { ...adminToUpdate.profile_data.bio, ...data.profile_data.bio }
          : adminToUpdate.profile_data.bio,
      }
    }

    const updatedAdmin = {
      ...adminToUpdate,
      ...data,
      profile_data: updatedProfileData,
      full_name: `${data.first_name || adminToUpdate.first_name} ${data.last_name || adminToUpdate.last_name}`,
      updated_at: new Date().toISOString(),
    }

    // Create a new array with the updated item
    this._items = [
      ...this._items.slice(0, index),
      updatedAdmin,
      ...this._items.slice(index + 1),
    ]

    return updatedAdmin
  },

  async delete(id: string) {
    if (this._error) throw this._error

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
