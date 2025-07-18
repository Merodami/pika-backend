import Cookies from 'js-cookie'

const TOKEN_KEY = 'pika_token'
const REFRESH_TOKEN_KEY = 'pika_refresh_token'
const USER_KEY = 'pika_user'

// Token management
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null

  return Cookies.get(TOKEN_KEY) || null
}

// Alias for backward compatibility
export const getAuthToken = getAccessToken

export function setAccessToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7, // 7 days
    secure: process?.env?.NODE_ENV === 'production',
    sameSite: 'strict',
  })
}

// Alias for backward compatibility
export const setAuthToken = setAccessToken

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null

  return Cookies.get(REFRESH_TOKEN_KEY) || null
}

export function setRefreshToken(token: string): void {
  Cookies.set(REFRESH_TOKEN_KEY, token, {
    expires: 30, // 30 days
    secure: process?.env?.NODE_ENV === 'production',
    sameSite: 'strict',
  })
}

export function clearTokens(): void {
  Cookies.remove(TOKEN_KEY)
  Cookies.remove(REFRESH_TOKEN_KEY)
  Cookies.remove(USER_KEY)
}

// Alias for backward compatibility
export const clearAuth = clearTokens

// User management
export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null

  const userStr = Cookies.get(USER_KEY)

  return userStr ? JSON.parse(userStr) : null
}

export function setStoredUser(user: any): void {
  Cookies.set(USER_KEY, JSON.stringify(user), {
    expires: 7,
    secure: process?.env?.NODE_ENV === 'production',
    sameSite: 'strict',
  })
}

// Helper function to set both tokens
export function setTokens(accessToken: string, refreshToken: string): void {
  setAccessToken(accessToken)
  setRefreshToken(refreshToken)
}

// Token refresh logic - kept for backward compatibility but not used with SDK
export async function refreshAuthToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()

  if (!refreshToken) return null

  try {
    const response = await fetch(
      `${process?.env?.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1'}/auth/refresh`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }
    )

    if (response.ok) {
      const data = await response.json()

      setAccessToken(data.token)
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken)
      }

      return data.token
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
  }

  return null
}

// JWT decode (without external library)
export function decodeToken(token: string): any | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => {
          const hex = c.charCodeAt(0).toString(16)

          return '%' + ('00' + hex).slice(-2)
        })
        .join('')
    )

    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)

  if (!decoded || !decoded.exp) return true

  const currentTime = Date.now() / 1000

  return decoded.exp < currentTime
}
