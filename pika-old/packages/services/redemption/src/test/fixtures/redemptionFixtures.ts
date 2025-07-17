import { randomUUID } from 'crypto'

import type { RedemptionView } from '../../read/domain/entities/RedemptionView.js'
import type { Redemption } from '../../write/domain/entities/Redemption.js'
import type { VoucherDomain } from '../../write/infrastructure/services/VoucherServiceClient.js'

/**
 * Test fixtures for redemption tests
 */

export const mockVoucher: VoucherDomain = {
  id: 'voucher-123',
  providerId: 'provider-123',
  categoryId: 'category-123',
  state: 'PUBLISHED',
  title: { en: 'Test Voucher', es: 'Cupón de Prueba', gn: 'Test Voucher' },
  description: {
    en: 'Test Description',
    es: 'Descripción de Prueba',
    gn: 'Test Description',
  },
  terms: { en: 'Test Terms', es: 'Términos de Prueba', gn: 'Test Terms' },
  discountType: 'PERCENTAGE',
  discountValue: 20,
  currency: 'PYG',
  location: null,
  imageUrl: null,
  validFrom: new Date('2024-01-01'),
  expiresAt: new Date('2025-12-31'),
  maxRedemptions: 100,
  maxRedemptionsPerUser: 1,
  currentRedemptions: 10,
  metadata: {},
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockExpiredVoucher: VoucherDomain = {
  ...mockVoucher,
  id: 'voucher-expired',
  state: 'EXPIRED',
  expiresAt: new Date('2023-12-31'), // Past date
}

export const mockRedemption: Redemption = {
  id: 'redemption-123',
  voucherId: 'voucher-123',
  customerId: 'customer-123',
  providerId: 'provider-123',
  code: 'ABC123',
  redeemedAt: new Date('2024-06-15T10:00:00Z'),
  location: { lat: -25.2637, lng: -57.5759 }, // Asunción coordinates
  offlineRedemption: false,
  syncedAt: new Date('2024-06-15T10:00:00Z'),
  metadata: {},
  createdAt: new Date('2024-06-15T10:00:00Z'),
  updatedAt: new Date('2024-06-15T10:00:00Z'),
}

export const mockRedemptionView: RedemptionView = {
  id: 'redemption-123',
  voucherId: 'voucher-123',
  voucherTitle: {
    en: 'Test Voucher',
    es: 'Cupón de Prueba',
    gn: 'Test Voucher',
  },
  voucherDiscount: '20%',
  customerId: 'customer-123',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  providerId: 'provider-123',
  providerName: 'Test Provider',
  code: 'ABC123',
  redeemedAt: new Date('2024-06-15T10:00:00Z'),
  location: { lat: -25.2637, lng: -57.5759 },
  offlineRedemption: false,
  syncedAt: new Date('2024-06-15T10:00:00Z'),
  createdAt: new Date('2024-06-15T10:00:00Z'),
}

export const mockJWTToken =
  'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2b3VjaGVySWQiOiJ2b3VjaGVyLTEyMyIsImN1c3RvbWVySWQiOiJjdXN0b21lci0xMjMiLCJpYXQiOjE3MTg0NDgwMDAsImV4cCI6MTcxODQ0ODMwMH0.signature'

export const mockShortCode = 'SAVE20PY'

export const createMockRedemption = (
  overrides?: Partial<Redemption>,
): Redemption => ({
  id: randomUUID(),
  voucherId: 'voucher-123',
  customerId: 'customer-123',
  providerId: 'provider-123',
  code: randomUUID().substring(0, 8),
  redeemedAt: new Date(),
  location: { lat: -25.2637, lng: -57.5759 },
  offlineRedemption: false,
  syncedAt: new Date(),
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockVoucher = (
  overrides?: Partial<VoucherDomain>,
): VoucherDomain => ({
  ...mockVoucher,
  id: randomUUID(),
  ...overrides,
})

export const mockRedemptionClaims = {
  voucherId: 'voucher-123',
  customerId: 'customer-123',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
}

export const mockProviderHeaders = {
  'x-provider-id': 'provider-123',
  'x-user-id': 'customer-123',
  'content-type': 'application/json',
}

export const mockOfflineRedemptions = [
  {
    code: 'OFF123',
    redeemedAt: new Date('2024-06-15T10:00:00Z'),
    location: { lat: -25.2637, lng: -57.5759 },
    deviceId: 'device-123',
  },
  {
    code: 'OFF456',
    redeemedAt: new Date('2024-06-15T11:00:00Z'),
    location: { lat: -25.2637, lng: -57.5759 },
    deviceId: 'device-123',
  },
]
