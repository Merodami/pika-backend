// src/test/mocks/voucherReadMocks.ts

import { VoucherDomain } from '@pika/sdk'
import { PaginatedResult } from '@pika/types-core'

import { GetVoucherQuery } from '../../read/application/use_cases/queries/GetVoucherQuery.js'
import { VoucherSearchQuery } from '../../read/application/use_cases/queries/VoucherSearchQuery.js'
import { VoucherReadRepositoryPort } from '../../read/domain/port/voucher/VoucherReadRepositoryPort.js'

/**
 * Mock implementation of VoucherReadRepositoryPort for testing
 */
export const mockVoucherReadRepository: VoucherReadRepositoryPort & {
  setItems: (items: VoucherDomain[]) => void
  reset: () => void
  setError: (error: Error | null) => void
  getItems: () => VoucherDomain[]
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

  // Read Repository implementation methods
  async getAllVouchers(
    params: VoucherSearchQuery,
  ): Promise<PaginatedResult<VoucherDomain>> {
    if (this._error) throw this._error

    let results = [...this._items]

    // Handle retailer_id filtering
    if (params.retailerId) {
      results = results.filter((item) => item.retailerId === params.retailerId)
    }

    // Handle category_id filtering
    if (params.categoryId) {
      results = results.filter((item) => item.categoryId === params.categoryId)
    }

    // Handle state filtering
    if (params.state) {
      results = results.filter((item) => item.state === params.state)
    }

    // Handle discount type filtering
    if (params.discountType) {
      results = results.filter(
        (item) => item.discountType === params.discountType,
      )
    }

    // Handle discount range filtering
    if (params.minDiscount !== undefined) {
      results = results.filter(
        (item) => item.discountValue >= params.minDiscount!,
      )
    }
    if (params.maxDiscount !== undefined) {
      results = results.filter(
        (item) => item.discountValue <= params.maxDiscount!,
      )
    }

    // Handle location-based filtering (simplified for testing)
    if (params.latitude && params.longitude && params.radius) {
      // In real implementation, this would use PostGIS
      // For testing, we'll just return all vouchers with locations
      results = results.filter((item) => item.location !== null)
    }

    // Handle sorting
    if (params.sortBy) {
      results.sort((a, b) => {
        const aVal = a[params.sortBy as keyof VoucherDomain]
        const bVal = b[params.sortBy as keyof VoucherDomain]
        const order = params.sortOrder === 'desc' ? -1 : 1

        if (aVal < bVal) return -1 * order
        if (aVal > bVal) return 1 * order

        return 0
      })
    }

    // Handle pagination
    const page = params.page || 1
    const limit = params.limit || 20
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

  async getVoucherById(params: GetVoucherQuery): Promise<VoucherDomain | null> {
    if (this._error) throw this._error

    const voucher = this._items.find((item) => item.id === params.id)

    if (!voucher) return null

    // If includeCodes is false, remove codes from the result
    if (!params.includeCodes && voucher.codes) {
      const { codes: _codes, ...voucherWithoutCodes } = voucher

      return voucherWithoutCodes as VoucherDomain
    }

    return voucher
  },

  async getVouchersByRetailerId(
    retailerId: string,
    params: VoucherSearchQuery,
  ): Promise<PaginatedResult<VoucherDomain>> {
    return this.getAllVouchers({ ...params, retailerId })
  },

  async getVouchersByUserId(
    userId: string,
    params: VoucherSearchQuery,
  ): Promise<PaginatedResult<VoucherDomain>> {
    if (this._error) throw this._error

    // For testing, we'll just filter vouchers that have been claimed/redeemed
    let results = this._items.filter(
      (item) => item.state === 'CLAIMED' || item.state === 'REDEEMED',
    )

    // Apply other filters from params
    if (params.state) {
      results = results.filter((item) => item.state === params.state)
    }

    // Handle pagination
    const page = params.page || 1
    const limit = params.limit || 20
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
}
