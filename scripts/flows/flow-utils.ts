/**
 * Shared utilities for flow test scripts
 * Provides common logging, API client, and helper functions
 */

import axios, { AxiosError, AxiosInstance } from 'axios'
import { performance } from 'perf_hooks'

// Configuration
export const API_GATEWAY_URL =
  process.env.API_GATEWAY_BASE_URL || 'http://127.0.0.1:5500'
export const API_BASE_URL = `${API_GATEWAY_URL}/api/v1`

// Colors for console output
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

// Logging functions
export function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

export function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green)
}

export function logError(message: string) {
  log(`❌ ${message}`, colors.red)
}

export function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue)
}

export function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow)
}

export function logStep(step: number, message: string) {
  log(`\n${colors.bright}Step ${step}: ${message}${colors.reset}`, colors.cyan)
}

export function logSection(title: string) {
  log(`\n${'='.repeat(50)}`, colors.dim)
  log(title, colors.bright + colors.blue)
  log('='.repeat(50), colors.dim)
}

export function logRequest(method: string, url: string, data?: any) {
  log(`\n🔄 ${method} ${url}`, colors.yellow)
  if (data) {
    log(`Request body: ${JSON.stringify(data, null, 2)}`, colors.dim)
  }
}

export function logResponse(status: number, data: any) {
  const statusColor = status >= 200 && status < 300 ? colors.green : colors.red

  log(`Response ${status}:`, statusColor)

  // Truncate long responses
  const responseStr = JSON.stringify(data, null, 2)

  if (responseStr.length > 1000) {
    log(responseStr.substring(0, 1000) + '... (truncated)', colors.dim)
  } else {
    log(responseStr, colors.dim)
  }
}

// Create axios instance with interceptors
export function createApiClient(baseURL: string = API_BASE_URL): AxiosInstance {
  const api = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      const startTime = performance.now()

      config.metadata = { startTime }

      logRequest(
        config.method?.toUpperCase() || 'GET',
        config.url || '',
        config.data,
      )

      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  // Response interceptor
  api.interceptors.response.use(
    (response) => {
      const endTime = performance.now()
      const duration = endTime - response.config.metadata?.startTime

      logResponse(response.status, response.data)
      log(`⏱️  Duration: ${duration.toFixed(2)}ms`, colors.dim)

      return response
    },
    (error: AxiosError) => {
      const endTime = performance.now()
      const duration = endTime - error.config?.metadata?.startTime

      if (error.response) {
        logResponse(error.response.status, error.response.data)
      } else {
        logError(`Request failed: ${error.message}`)
      }

      if (duration) {
        log(`⏱️  Duration: ${duration.toFixed(2)}ms`, colors.dim)
      }

      return Promise.reject(error)
    },
  )

  return api
}

// Authentication helper
export async function authenticateUser(
  api: AxiosInstance,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  logInfo(`Authenticating as ${email}`)

  const response = await api.post('/auth/token', {
    grantType: 'password',
    username: email,
    password,
  })

  const { accessToken, refreshToken } = response.data

  if (!accessToken) {
    throw new Error('Failed to get access token')
  }

  // Set authorization header
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

  logSuccess(`Authenticated successfully`)

  return { accessToken, refreshToken }
}

// Test data generators
export function generateRandomEmail(): string {
  const randomId = Math.random().toString(36).substring(7)

  return `test-${randomId}@example.com`
}

export function generateRandomPhone(): string {
  return `+1555${Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, '0')}`
}

// Flow execution helpers
export interface FlowOptions {
  title: string
  cleanup?: () => Promise<void>
}

export async function executeFlow(
  flowFn: () => Promise<void>,
  options: FlowOptions,
): Promise<void> {
  logSection(`🚀 Starting ${options.title}`)

  try {
    await flowFn()

    if (options.cleanup) {
      logSection('🧹 Running cleanup')
      await options.cleanup()
    }

    logSection(`✅ ${options.title} Completed Successfully!`)
  } catch (error) {
    logSection(`❌ ${options.title} Failed!`)

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError

      if (axiosError.response) {
        logError(`Error Status: ${axiosError.response.status}`)
        logError(
          `Error Data: ${JSON.stringify(axiosError.response.data, null, 2)}`,
        )
      } else if (axiosError.request) {
        logError('No response received from server')
      } else {
        logError(`Error: ${axiosError.message}`)
      }
    } else {
      logError(`Unexpected error: ${error}`)
    }

    process.exit(1)
  }
}

// Delay helper for rate limiting
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Test data
export const TEST_USERS = {
  admin: {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
  },
  customer: {
    email: 'customer@example.com',
    password: 'CustomerPassword123!',
  },
  business: {
    email: 'business@example.com',
    password: 'BusinessPassword123!',
  },
  unverified: {
    email: 'unverified@example.com',
    password: 'UnverifiedPassword123!',
  },
}

// Summary helpers
export interface TestResult {
  name: string
  success: boolean
  message?: string
}

export function printTestSummary(results: TestResult[]) {
  logSection('📊 Test Summary')

  const passed = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  results.forEach((result) => {
    if (result.success) {
      logSuccess(`${result.name}: ${result.message || 'Passed'}`)
    } else {
      logError(`${result.name}: ${result.message || 'Failed'}`)
    }
  })

  log('')
  log(`Total: ${results.length} tests`, colors.bright)
  log(`Passed: ${passed}`, colors.green)
  log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.green)

  if (failed > 0) {
    process.exit(1)
  }
}

// Type definitions for metadata
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number
    }
  }
}
