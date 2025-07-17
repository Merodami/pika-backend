import { vi } from 'vitest'

/**
 * Mock JWT Service for testing redemption flows
 */
export class MockJWTService {
  private customerId: string = '550e8400-e29b-41d4-a716-446655440001'

  setCustomerId(customerId: string) {
    this.customerId = customerId
  }

  verifyRedemptionToken = vi.fn().mockImplementation(async (token: string) => {
    // Parse mock JWT tokens for testing
    if (token.includes('expired')) {
      throw new Error('Token expired')
    }

    if (token.includes('invalid')) {
      throw new Error('Invalid token')
    }

    // Default mock response with valid UUIDs
    return {
      voucherId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: this.customerId, // Use the actual customer ID
      providerId: '550e8400-e29b-41d4-a716-446655440002',
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
    }
  })

  generateToken = vi.fn().mockResolvedValue('mock-jwt-token')

  verifyToken = vi.fn().mockImplementation(async (token: string) => {
    return this.verifyRedemptionToken(token)
  })
}

/**
 * Mock Short Code Service for testing
 */
export class MockShortCodeService {
  lookupShortCode = vi.fn().mockImplementation(async (code: string) => {
    if (code === 'INVALID') {
      return null
    }

    if (code.startsWith('TEST')) {
      return {
        voucherId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'static',
      }
    }

    return {
      voucherId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'dynamic',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
    }
  })

  generateShortCode = vi.fn().mockResolvedValue('TEST123')

  invalidateShortCode = vi.fn().mockResolvedValue(undefined)
}
