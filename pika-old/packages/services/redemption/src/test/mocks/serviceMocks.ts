import { vi } from 'vitest'

import type { RedemptionReadRepositoryPort } from '../../read/domain/port/redemption/RedemptionReadRepositoryPort.js'
import type { RedemptionWriteRepositoryPort } from '../../write/domain/port/redemption/RedemptionWriteRepositoryPort.js'
import type { UserServicePort } from '../../write/infrastructure/services/UserServiceClient.js'
import type { VoucherServicePort } from '../../write/infrastructure/services/VoucherServiceClient.js'
import {
  mockRedemption,
  mockRedemptionView,
  mockVoucher,
} from '../fixtures/redemptionFixtures.js'

/**
 * Mock implementations for testing
 */

export const createMockVoucherService = (): VoucherServicePort => ({
  getVoucherById: vi.fn().mockResolvedValue(mockVoucher),
  getVoucherByCode: vi.fn().mockResolvedValue(mockVoucher),
})

export const createMockUserService = (): UserServicePort => ({
  getProviderName: vi.fn().mockResolvedValue('Test Provider'),
})

export const createMockRedemptionWriteRepository =
  (): RedemptionWriteRepositoryPort => ({
    recordRedemption: vi.fn().mockResolvedValue(mockRedemption),
    checkRedemptionExists: vi.fn().mockResolvedValue(false),
    getRedemptionByCode: vi.fn().mockResolvedValue(null),
    countVoucherRedemptions: vi.fn().mockResolvedValue(10),
    countCustomerVoucherRedemptions: vi.fn().mockResolvedValue(0),
    updateRedemptionSyncStatus: vi.fn().mockResolvedValue(undefined),
    batchInsertRedemptions: vi.fn().mockResolvedValue([mockRedemption]),
  })

export const createMockRedemptionReadRepository =
  (): RedemptionReadRepositoryPort => ({
    getRedemptionById: vi.fn().mockResolvedValue(mockRedemptionView),
    getAllRedemptions: vi.fn().mockResolvedValue({
      items: [mockRedemptionView],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    getRedemptionsByProvider: vi.fn().mockResolvedValue({
      items: [mockRedemptionView],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    getRedemptionsByCustomer: vi.fn().mockResolvedValue({
      items: [mockRedemptionView],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    getRedemptionsByVoucher: vi.fn().mockResolvedValue({
      items: [mockRedemptionView],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    getProviderStats: vi.fn().mockResolvedValue({
      totalRedemptions: 100,
      uniqueCustomers: 50,
      averageRedemptionsPerDay: 3.3,
      topVouchers: [
        {
          voucherId: 'voucher-123',
          voucherTitle: 'Test Voucher',
          redemptionCount: 25,
        },
      ],
      redemptionsByHour: {},
      redemptionsByDayOfWeek: {},
    }),
    getVoucherStats: vi.fn().mockResolvedValue({
      totalRedemptions: 25,
      uniqueCustomers: 20,
      averageRedemptionsPerDay: 1.5,
      topVouchers: [
        {
          voucherId: 'voucher-123',
          voucherTitle: 'Test Voucher',
          redemptionCount: 25,
        },
      ],
      redemptionsByHour: {},
      redemptionsByDayOfWeek: {},
    }),
  })

export const createMockJWTService = () => ({
  generateRedemptionToken: vi.fn().mockResolvedValue('mock-jwt-token'),
  verifyRedemptionToken: vi.fn().mockResolvedValue({
    voucherId: 'voucher-123',
    customerId: 'customer-123',
  }),
  verifyOfflineToken: vi.fn().mockResolvedValue({
    valid: true,
    claims: {
      voucherId: 'voucher-123',
      customerId: 'customer-123',
    },
  }),
  decodeToken: vi.fn().mockReturnValue({
    voucherId: 'voucher-123',
    customerId: 'customer-123',
  }),
})

export const createMockShortCodeService = () => ({
  generateShortCode: vi.fn().mockResolvedValue('SAVE20PY'),
  lookupShortCode: vi.fn().mockResolvedValue({
    voucherId: 'voucher-123',
    type: 'dynamic',
    customerId: 'customer-123',
  }),
  invalidateShortCode: vi.fn().mockResolvedValue(undefined),
  generateStaticCode: vi.fn().mockResolvedValue('STATIC20'),
})

export const createMockCacheService = () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(true),
  delete: vi.fn().mockResolvedValue(true),
  del: vi.fn().mockResolvedValue(true),
  exists: vi.fn().mockResolvedValue(false),
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
  getTTL: vi.fn().mockResolvedValue(-1),
  updateTTL: vi.fn().mockResolvedValue(true),
  delPattern: vi.fn().mockResolvedValue(0),
  clearAll: vi.fn().mockResolvedValue(undefined),
})
