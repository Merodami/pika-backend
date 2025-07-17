import type { VoucherDomain, VoucherStateUpdate } from '@pika/types-core'
import { vi } from 'vitest'

/**
 * Mock implementation of VoucherServiceClient for testing
 */
export class MockVoucherServiceClient {
  getVoucherById = vi
    .fn()
    .mockImplementation(
      async (voucherId: string): Promise<VoucherDomain | null> => {
        // Return a mock voucher for testing
        if (voucherId === 'non-existent') {
          return null
        }

        return {
          id: voucherId,
          providerId: '550e8400-e29b-41d4-a716-446655440002',
          categoryId: '550e8400-e29b-41d4-a716-446655440003',
          title: {
            en: 'Test Voucher',
            es: 'Cupón de Prueba',
          },
          description: {
            en: 'Test Description',
            es: 'Descripción de Prueba',
          },
          terms: {
            en: 'Test Terms',
            es: 'Términos de Prueba',
          },
          discount: 50,
          discountType: 'PERCENTAGE',
          discountValue: 50,
          currency: 'USD',
          location: null,
          imageUrl: null,
          maxRedemptions: 100,
          maxRedemptionsPerUser: 1,
          currentRedemptions: 0,
          validFrom: new Date('2024-01-01'),
          validUntil: new Date('2025-12-31'),
          expiresAt: new Date('2025-12-31'),
          state: 'PUBLISHED',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as VoucherDomain
      },
    )

  getVoucherByCode = vi.fn().mockResolvedValue(null)

  updateVoucherState = vi
    .fn()
    .mockImplementation(
      async (
        voucherId: string,
        update: VoucherStateUpdate,
      ): Promise<VoucherDomain> => {
        // Return updated voucher
        const voucher = await this.getVoucherById(voucherId)

        if (!voucher) {
          throw new Error('Voucher not found')
        }

        return {
          ...voucher,
          state: update.state || voucher.state,
          updatedAt: new Date(),
        }
      },
    )

  incrementRedemptionCount = vi.fn().mockResolvedValue(undefined)
  canRedeem = vi.fn().mockResolvedValue(true)
  voucherExists = vi.fn().mockResolvedValue(true)
}

/**
 * Mock implementation of ProviderServiceClient for testing
 */
export class MockProviderServiceClient {
  getProvider = vi.fn().mockImplementation(async (providerId: string) => {
    return {
      id: providerId,
      businessName: {
        en: 'Test Provider',
        es: 'Proveedor de Prueba',
      },
      email: 'provider@test.com',
      status: 'ACTIVE',
    }
  })

  getProviderByUserId = vi.fn().mockImplementation(async (userId: string) => {
    // For E2E test users, return null if not a provider
    if (userId.includes('customer')) {
      return null
    }

    // For provider users, return a provider that will be matched with test data
    // The actual provider ID will be set by the test when it creates the provider
    return {
      id: 'mock-provider-id', // This will be overridden by specific test mocks
      userId: userId,
      businessName: {
        en: 'Test Provider',
        es: 'Proveedor de Prueba',
      },
      email: 'provider@test.com',
      status: 'ACTIVE',
      active: true,
    }
  })

  providerExists = vi.fn().mockResolvedValue(true)
}

/**
 * Create mock service clients for testing
 */
export function createMockServiceClients() {
  return {
    voucherServiceClient: new MockVoucherServiceClient(),
    providerServiceClient: new MockProviderServiceClient(),
  }
}
