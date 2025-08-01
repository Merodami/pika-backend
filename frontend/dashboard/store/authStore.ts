import { type UserRoleType } from '@merodami/pika-types'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { api } from '@/lib/api/client'

// Simple storage helpers (since we removed lib/auth/tokens.ts)
function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem('pika-user')

  return stored ? JSON.parse(stored) : null
}

function setStoredUser(user: User): void {
  localStorage.setItem('pika-user', JSON.stringify(user))
}

function clearStoredUser(): void {
  localStorage.removeItem('pika-user')
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRoleType
  businessId?: string
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
  register: (email: string, password: string, name: string) => Promise<any>
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
    role: dto.role as UserRoleType,
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
          await api.auth.authToken({
            requestBody: {
              grantType: 'password' as const,
              username: email,
              password: password,
            },
          })

          // Tokens are handled server-side via actions

          // Get user profile after login
          const userResponse = await api.users.getUserProfile()
          const user = mapUserDtoToUser(userResponse)

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

          const response = await api.auth.authRegister({
            requestBody: {
              email,
              password,
              firstName,
              lastName,
              acceptTerms: true,
              marketingConsent: false,
            },
          })

          // Registration successful but no tokens yet
          // User needs to verify email first
          set({
            isLoading: false,
            error: null,
          })

          // Return the response so caller knows what happened
          return response
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

        clearStoredUser()
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      checkAuth: async () => {
        const currentUser = get().user

        if (!currentUser) {
          set({ isAuthenticated: false })

          return
        }

        try {
          // Verify token is still valid by fetching user profile
          const userResponse = await api.users.getUserProfile()
          const user = mapUserDtoToUser(userResponse)

          setStoredUser(user)
          set({ user, isAuthenticated: true })
        } catch {
          // Token is invalid
          clearStoredUser()
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
