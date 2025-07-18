import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api/client'

import { useAuthStore } from './auth.store'

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  api: {
    auth: {
      loginUser: vi.fn(),
      registerUser: vi.fn(),
      logoutUser: vi.fn(),
    },
    users: {
      getCurrentUser: vi.fn(),
    },
    businesses: {
      getProfile: vi.fn(),
    },
  },
}))

// Mock auth tokens module
vi.mock('@/lib/auth/tokens', () => ({
  setTokens: vi.fn(),
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
  clearTokens: vi.fn(),
  clearAuth: vi.fn(),
  setStoredUser: vi.fn(),
  getStoredUser: vi.fn(() => null),
}))

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })

    // Clear all mocks
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      email_verified: true,
      first_name: 'Test',
      last_name: 'User',
      phone_verified: false,
      role: 'BUSINESS' as const,
      status: 'ACTIVE' as const,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    }

    // Remove unused variable

    vi.mocked(api.auth.loginUser).mockResolvedValueOnce({
      user: mockUser,
      tokens: {
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
      },
    })

    const { result } = renderHook(() => useAuthStore())

    await act(async () => {
      await result.current.login('test@example.com', 'password123')
    })

    expect(result.current.user).toEqual({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'BUSINESS',
      businessId: undefined,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle login error', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    }

    vi.mocked(api.auth.loginUser).mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useAuthStore())

    // Use try-catch to ensure state updates complete
    try {
      await act(async () => {
        await result.current.login('test@example.com', 'wrong-password')
      })
    } catch {
      // Expected error, continue with assertions
    }

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Invalid credentials')
  })

  it('should clear error', () => {
    const { result } = renderHook(() => useAuthStore())

    // Set an error first
    act(() => {
      useAuthStore.setState({ error: 'Test error' })
    })

    expect(result.current.error).toBe('Test error')

    // Clear the error
    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })
})
