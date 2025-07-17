import { vi } from 'vitest'

/**
 * Mock implementation of ProviderServiceClient for testing
 * Provides consistent provider data for integration tests
 */
export class MockProviderClient {
  getProviderIdByUserId = vi.fn().mockImplementation(async (userId: string) => {
    // In the test database, the provider ID is the same as the user ID
    // This matches the pattern used in seedTestData where id: user.id
    return userId
  })

  getProviderByUserId = vi.fn().mockImplementation(async (userId: string) => {
    return {
      id: userId, // Provider ID is same as user ID in test database
      userId,
      businessName: {
        en: 'Test Provider Business',
        es: 'Negocio de Proveedor de Prueba',
        gn: 'Test Provider Business GN',
      },
      businessDescription: {
        en: 'Test Provider Description',
        es: 'Descripción del Proveedor de Prueba',
        gn: 'Test Provider Description GN',
      },
      categoryId: 'test-category-id',
      verified: true,
      active: true,
      avgRating: 4.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })

  isUserActiveProvider = vi.fn().mockImplementation(async () => {
    // By default, all users are active providers in tests
    return true
  })

  providerExists = vi.fn().mockImplementation(async () => {
    // By default, all provider IDs exist in tests
    return true
  })

  getProvider = vi.fn().mockImplementation(async (providerId: string) => {
    return {
      id: providerId,
      userId: providerId, // In tests, provider ID equals user ID
      businessName: {
        en: 'Test Provider Business',
        es: 'Negocio de Proveedor de Prueba',
        gn: 'Test Provider Business GN',
      },
      businessDescription: {
        en: 'Test Provider Description',
        es: 'Descripción del Proveedor de Prueba',
        gn: 'Test Provider Description GN',
      },
      categoryId: 'test-category-id',
      verified: true,
      active: true,
      avgRating: 4.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  })

  // Method to simulate a user not being a provider
  mockUserNotProvider(userId: string) {
    this.getProviderIdByUserId.mockImplementationOnce(async (id: string) => {
      if (id === userId) return null

      return id
    })
    this.getProviderByUserId.mockImplementationOnce(async (id: string) => {
      if (id === userId) return null

      return {
        id: id,
        userId: id,
        businessName: { en: 'Test Provider Business' },
        businessDescription: { en: 'Test Provider Description' },
        categoryId: 'test-category-id',
        verified: true,
        active: true,
        avgRating: 4.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })
    this.isUserActiveProvider.mockImplementationOnce(async (id: string) => {
      return id !== userId
    })
  }

  // Method to simulate a provider being inactive
  mockInactiveProvider(userId: string) {
    this.isUserActiveProvider.mockImplementationOnce(async (id: string) => {
      return id !== userId
    })
    this.getProviderByUserId.mockImplementationOnce(async (id: string) => {
      if (id === userId) {
        return {
          id: id,
          userId: id,
          businessName: { en: 'Test Provider Business' },
          businessDescription: { en: 'Test Provider Description' },
          categoryId: 'test-category-id',
          verified: true,
          active: false, // Inactive
          avgRating: 4.5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }

      return null
    })
  }

  // Reset all mocks
  reset() {
    this.getProviderIdByUserId.mockClear()
    this.getProviderByUserId.mockClear()
    this.isUserActiveProvider.mockClear()
    this.providerExists.mockClear()
    this.getProvider.mockClear()
  }
}

// Create a singleton instance for easy import
export const mockProviderServiceClient = new MockProviderClient()
