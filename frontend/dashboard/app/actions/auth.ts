'use server'

import { redirect } from 'next/navigation'
import { AuthenticationService } from '@/lib/api/generated'
import { setTokens, clearTokens } from '@/app/_services/authService'
import type { z } from 'zod'
import { authPublic } from '@pika/api'

// Server action for login
export async function login(data: z.infer<typeof authPublic.TokenRequest>) {
  try {
    // Type guard to ensure it's a password grant
    if (data.grantType !== 'password') {
      throw new Error('Invalid grant type')
    }

    const response = await AuthenticationService.postAuthToken({
      requestBody: data,
    })

    if (response.accessToken && response.refreshToken) {
      await setTokens(response.accessToken, response.refreshToken)
      redirect('/dashboard')
    }

    throw new Error('Invalid response from server')
  } catch (error) {
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
    await AuthenticationService.postAuthRegister({
      requestBody: data,
    })

    // Registration returns RegisterResponse, not tokens
    // User needs to login after registration
    redirect('/login')
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
