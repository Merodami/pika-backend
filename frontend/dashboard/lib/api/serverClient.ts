import 'server-only'

import { OpenAPI } from './generated'
import { getAccessToken } from '@/app/_services/authService'

/**
 * Configure the API client for server-side requests
 * This sets up the authentication token from cookies
 */
export async function configureApiClient() {
  const token = await getAccessToken()

  // Configure the OpenAPI client with the token
  OpenAPI.TOKEN = token || undefined
  OpenAPI.BASE =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api/v1'

  return OpenAPI
}

/**
 * Get a configured API client with authentication
 * Use this before making any authenticated API calls
 */
export async function getAuthenticatedApiClient() {
  await configureApiClient()
  return OpenAPI
}
