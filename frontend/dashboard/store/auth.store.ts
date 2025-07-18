import type { Login } from '@pika/sdk'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { api } from '@/lib/api/client'
import {
  clearTokens,
  getStoredUser,
  setStoredUser,
  setTokens,
} from '@/lib/auth/tokens'

export type UserRole = 'CUSTOMER' | 'BUSINESS' | 'ADMIN'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  businessId?: string // For BUSINESS role
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

// Convert UserProfile to User interface
function mapUserDtoToUser(dto: any): User {
  return {
    id: dto.id,
    email: dto.email,
    name:
      dto.first_name && dto.last_name
        ? `${dto.first_name} ${dto.last_name}`
        : dto.email,
    role: dto.role as UserRole,
    businessId: dto.business_id || undefined,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: getStoredUser(),
      isAuthenticated: !!getStoredUser(),
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const loginRequest: Login = { email, password }
          const response = await api.auth.loginUser({
            requestBody: loginRequest,
          })

          // Store tokens
          if (response.tokens?.access_token && response.tokens?.refresh_token) {
            setTokens(
              response.tokens.access_token,
              response.tokens.refresh_token
            )
          }

          // Use user from login response
          const user = mapUserDtoToUser(response.user)

          setStoredUser(user)

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({
            error: error?.body?.message || error?.message || 'Login failed',
            isLoading: false,
            isAuthenticated: false,
            user: null,
          })
          throw error
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null })

        try {
          // Split name into first and last name
          const nameParts = name.split(' ')
          const firstName = nameParts[0] || name
          const lastName = nameParts.slice(1).join(' ') || ''

          const registerRequest = {
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            role: 'CUSTOMER' as const,
          }
          const response = await api.auth.registerUser({
            requestBody: registerRequest,
          })

          // Store tokens
          if (response.tokens?.access_token && response.tokens?.refresh_token) {
            setTokens(
              response.tokens.access_token,
              response.tokens.refresh_token
            )
          }

          // Use user from registration response
          const user = mapUserDtoToUser(response.user)

          setStoredUser(user)

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({
            error:
              error?.body?.message || error?.message || 'Registration failed',
            isLoading: false,
          })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })

        try {
          // SDK doesn't have logout endpoint, just clear tokens
          // await api.auth.logout();
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout API call failed:', error)
        }

        clearTokens()
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })

        // Redirect to login
        window.location.href = '/login'
      },

      checkAuth: async () => {
        const currentUser = get().user

        if (!currentUser) {
          set({ isAuthenticated: false })

          return
        }

        try {
          // Verify token is still valid by fetching user profile
          const userResponse = await api.users.getCurrentUser()
          const user = mapUserDtoToUser(userResponse)

          setStoredUser(user)
          set({ user, isAuthenticated: true })
        } catch {
          // Token is invalid
          clearTokens()
          set({ user: null, isAuthenticated: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'pika-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
