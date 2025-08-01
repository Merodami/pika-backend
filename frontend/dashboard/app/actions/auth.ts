'use server'

import { authPublic } from '@merodami/pika-api'
import { redirect } from 'next/navigation'
import type { z } from 'zod'

import { clearTokens, setTokens } from '@/app/_services/authService'
import { AuthenticationService } from '@/lib/api/generated'

// Server action for login
export async function login(data: z.infer<typeof authPublic.TokenRequest>) {
  try {
    // Type guard to ensure it's a password grant
    if (data.grantType !== 'password') {
      throw new Error('Invalid grant type')
    }

    const response = await AuthenticationService.authToken({
      requestBody: data,
    })

    console.log('Login response:', {
      hasAccessToken: !!response.accessToken,
      hasRefreshToken: !!response.refreshToken,
    })

    if (response.accessToken && response.refreshToken) {
      await setTokens(response.accessToken, response.refreshToken)
      console.log('Tokens set successfully')
      return { success: true }
    }

    throw new Error('Invalid response from server')
  } catch (error) {
    console.error('Login error:', error)
    return {
      error: error instanceof Error ? error.message : 'Login failed',
    }
  }
}

// Server action for registration
export async function register(
  data: z.infer<typeof authPublic.RegisterRequest>
) {
  try {
    await AuthenticationService.authRegister({
      requestBody: data,
    })

    // Registration successful - return success flag
    return { success: true }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Registration failed',
    }
  }
}

// Server action for logout
export async function logout() {
  await clearTokens()
  redirect('/login')
}
