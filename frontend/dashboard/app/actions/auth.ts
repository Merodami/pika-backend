'use server'

import { redirect } from 'next/navigation'
import { AuthenticationService } from '@/lib/api/generated'
import { setTokens, clearTokens } from '@/app/_services/auth.service'
import type { z } from 'zod'
import { authPublic } from '@pika/api'

// Server action for login
export async function login(data: z.infer<typeof authPublic.TokenRequest>) {
  try {
    const response = await AuthenticationService.postAuthToken({
      requestBody: {
        grantType: 'password',
        username: data.username,
        password: data.password,
      },
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
export async function register(data: z.infer<typeof authPublic.RegisterRequest>) {
  try {
    const response = await AuthenticationService.postAuthRegister({
      requestBody: data,
    })

    if (response.tokens?.accessToken && response.tokens?.refreshToken) {
      await setTokens(response.tokens.accessToken, response.tokens.refreshToken)
      redirect('/dashboard')
    }

    throw new Error('Invalid response from server')
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