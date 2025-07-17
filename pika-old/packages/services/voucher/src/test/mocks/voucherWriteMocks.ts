// src/test/mocks/voucherWriteMocks.ts

import { VoucherDomain } from '@pika/sdk'
import { get, nth } from 'lodash-es'
import { v4 as uuid } from 'uuid'

import {
  VoucherCreateDTO,
  VoucherUpdateDTO,
} from '../../write/domain/dtos/VoucherDTO.js'
import { Voucher } from '../../write/domain/entities/Voucher.js'
import { VoucherWriteRepositoryPort } from '../../write/domain/port/voucher/VoucherWriteRepositoryPort.js'

/**
 * Mock implementation of VoucherWriteRepositoryPort for testing
 */
export const mockVoucherWriteRepository: VoucherWriteRepositoryPort & {
  setItems: (items: VoucherDomain[]) => void
  reset: () => void
  setError: (error: Error | null) => void
  getItems: () => VoucherDomain[]
  findById: (id: string) => Promise<VoucherDomain | null>
} = {
  // Internal state for the mock
  _items: [] as VoucherDomain[],
  _error: null as Error | null,

  // Methods to control mock behavior
  setItems(items: VoucherDomain[]) {
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

    const voucher = this._items.find((item) => item.id === id)

    return voucher || null
  },

  // Write Repository implementation methods
  async createVoucher(data: VoucherCreateDTO): Promise<Voucher> {
    if (this._error) throw this._error

    const voucherId = uuid()
    const now = new Date()

    const newVoucherData: VoucherDomain = {
      id: voucherId,
      retailerId: data.retailerId,
      categoryId: data.categoryId,
      state: 'NEW',
      title: data.title,
      description: data.description,
      terms: data.terms,
      discountType: data.discountType,
      discountValue: data.discountValue,
      currency: data.currency,
      location: data.location,
      imageUrl: data.imageUrl || null,
      validFrom: data.validFrom,
      expiresAt: data.expiresAt,
      maxRedemptions: data.maxRedemptions || null,
      maxRedemptionsPerUser: data.maxRedemptionsPerUser || 1,
      currentRedemptions: 0,
      metadata: data.metadata || {},
      createdAt: now,
      updatedAt: now,
      codes: [
        {
          id: uuid(),
          voucherId: voucherId,
          code: 'TEST1234',
          type: 'SHORT',
          isActive: true,
          metadata: {},
        },
        {
          id: uuid(),
          voucherId: voucherId,
          code: 'jwt-token-here',
          type: 'QR',
          isActive: true,
          metadata: {},
        },
      ],
    }

    this._items.push(newVoucherData)

    // Return domain entity
    return Voucher.create(newVoucherData, voucherId)
  },

  async updateVoucher(id: string, data: VoucherUpdateDTO): Promise<Voucher> {
    if (this._error) throw this._error

    const index = this._items.findIndex((item) => item.id === id)

    if (index === -1) {
      throw new Error(`Voucher with id "${id}" not found`)
    }

    const voucherToUpdate = { ...get(this._items, `[${index}]`, {}) }

    const updatedVoucherData = {
      ...voucherToUpdate,
      ...data,
      updatedAt: new Date(),
    }

    // Create a new array with the updated item
    this._items = [
      ...this._items.slice(0, index),
      updatedVoucherData,
      ...this._items.slice(index + 1),
    ]

    return Voucher.create(updatedVoucherData, id)
  },

  async publishVoucher(id: string): Promise<Voucher> {
    if (this._error) throw this._error

    const index = this._items.findIndex((item) => item.id === id)

    if (index === -1) {
      throw new Error(`Voucher with id "${id}" not found`)
    }

    const voucher = nth(this._items, index)

    if (voucher.state !== 'NEW') {
      throw new Error(
        `Voucher is in ${voucher.state} state, must be NEW to publish`,
      )
    }

    const updatedVoucherData = {
      ...voucher,
      state: 'PUBLISHED' as const,
      updatedAt: new Date(),
    }

    this._items = [
      ...this._items.slice(0, index),
      updatedVoucherData,
      ...this._items.slice(index + 1),
    ]

    return Voucher.create(updatedVoucherData, id)
  },

  async expireVoucher(id: string): Promise<Voucher> {
    if (this._error) throw this._error

    const index = this._items.findIndex((item) => item.id === id)

    if (index === -1) {
      throw new Error(`Voucher with id "${id}" not found`)
    }

    const voucher = nth(this._items, index)

    if (voucher.state === 'EXPIRED') {
      // Already expired, just return it
      return Voucher.create(voucher, id)
    }

    const updatedVoucherData = {
      ...voucher,
      state: 'EXPIRED' as const,
      updatedAt: new Date(),
    }

    this._items = [
      ...this._items.slice(0, index),
      updatedVoucherData,
      ...this._items.slice(index + 1),
    ]

    return Voucher.create(updatedVoucherData, id)
  },

  async redeemVoucher(
    id: string,
    userId: string,
    codeUsed: string,
  ): Promise<Voucher> {
    if (this._error) throw this._error

    const index = this._items.findIndex((item) => item.id === id)

    if (index === -1) {
      throw new Error(`Voucher with id "${id}" not found`)
    }

    const voucher = nth(this._items, index)

    // Check if voucher is published
    if (voucher.state !== 'PUBLISHED') {
      throw new Error(
        `Voucher is in ${voucher.state} state, must be PUBLISHED to redeem`,
      )
    }

    // Check if voucher is expired
    if (new Date() > new Date(voucher.expiresAt)) {
      throw new Error('This voucher has expired and cannot be redeemed')
    }

    // Check if voucher has reached max redemptions
    if (
      voucher.maxRedemptions &&
      voucher.currentRedemptions >= voucher.maxRedemptions
    ) {
      throw new Error(
        'This voucher has reached its maximum number of redemptions',
      )
    }

    // Validate the code
    const validCode = voucher.codes?.find(
      (c) => c.code === codeUsed && c.isActive,
    )

    if (!validCode) {
      throw new Error('Invalid or inactive voucher code')
    }

    // Update voucher redemption count and state
    const newRedemptionCount = voucher.currentRedemptions + 1
    const shouldMarkAsRedeemed =
      voucher.maxRedemptions && newRedemptionCount >= voucher.maxRedemptions

    const updatedVoucherData = {
      ...voucher,
      currentRedemptions: newRedemptionCount,
      state: shouldMarkAsRedeemed ? ('REDEEMED' as const) : voucher.state,
      updatedAt: new Date(),
    }

    this._items = [
      ...this._items.slice(0, index),
      updatedVoucherData,
      ...this._items.slice(index + 1),
    ]

    return Voucher.create(updatedVoucherData, id)
  },

  async deleteVoucher(id: string): Promise<void> {
    if (this._error) throw this._error

    const index = this._items.findIndex((item) => item.id === id)

    if (index === -1) {
      throw new Error(`Voucher with id "${id}" not found`)
    }

    const voucher = nth(this._items, index)

    // Check if voucher has been redeemed
    if (voucher.currentRedemptions > 0) {
      throw new Error(
        `Cannot delete voucher that has been redeemed ${voucher.currentRedemptions} times`,
      )
    }

    // Using Array methods to avoid direct splice
    this._items = [
      ...this._items.slice(0, index),
      ...this._items.slice(index + 1),
    ]
  },
}
