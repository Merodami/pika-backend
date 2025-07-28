import 'server-only'

import { cookies } from 'next/headers'
import { cache } from 'react'

import { UsersService } from '@/lib/api/generated'

// Types
export type UserRole = 'CUSTOMER' | 'BUSINESS' | 'ADMIN'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

// Constants
const ACCESS_TOKEN_COOKIE = 'pika-access-token'
const REFRESH_TOKEN_COOKIE = 'pika-refresh-token'

// Cache the current user for the duration of the request
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const token = await getAccessToken()

    if (!token) return null

    const response = await UsersService.getUsersProfile()

    return {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role as UserRole,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    }
  } catch (error) {
    console.error('Failed to get current user:', error)

    return null
  }
})

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()

  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies()

  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null
}

export async function setTokens(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()

  // Set secure, httpOnly cookies
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  })

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

export async function clearTokens() {
  const cookieStore = await cookies()

  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
}

// Protect server actions and pages
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function requireRole(role: UserRole | UserRole[]) {
  const user = await requireAuth()
  const roles = Array.isArray(role) ? role : [role]

  if (!roles.includes(user.role)) {
    throw new Error('Forbidden')
  }

  return user
}

export async function requireBusiness() {
  const user = await requireAuth()

  if (user.role !== 'BUSINESS') {
    throw new Error('Business access required')
  }

  // Business ID will need to be fetched separately from the business service
  return user
}

export async function requireAdmin() {
  return requireRole('ADMIN')
}
