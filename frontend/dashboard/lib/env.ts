import { z } from 'zod'

const envSchema = z.object({
  // Public environment variables
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_API_GATEWAY_URL: z.string().url(),
  NEXT_PUBLIC_ENV: z.enum(['development', 'staging', 'production']),

  // Features
  NEXT_PUBLIC_ENABLE_OFFLINE: z.coerce.boolean().default(true),
  NEXT_PUBLIC_ENABLE_PWA: z.coerce.boolean().default(false),
})

// Validate environment variables with safe access
const parseEnv = () => {
  // Safe access to process.env with fallbacks
  const safeProcess = typeof process !== 'undefined' ? process : { env: {} }
  const safeEnv: Record<string, string | undefined> = safeProcess.env || {}

  try {
    return envSchema.parse({
      NEXT_PUBLIC_API_URL:
        safeEnv.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1',
      NEXT_PUBLIC_API_GATEWAY_URL:
        safeEnv.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:9000',
      NEXT_PUBLIC_ENV: safeEnv.NEXT_PUBLIC_ENV || 'development',
      NEXT_PUBLIC_ENABLE_OFFLINE: safeEnv.NEXT_PUBLIC_ENABLE_OFFLINE,
      NEXT_PUBLIC_ENABLE_PWA: safeEnv.NEXT_PUBLIC_ENABLE_PWA,
    })
  } catch (error) {
    console.error('Environment validation failed:', error)

    // Return safe defaults instead of throwing during build
    return {
      NEXT_PUBLIC_API_URL: 'http://localhost:9000/api/v1',
      NEXT_PUBLIC_API_GATEWAY_URL: 'http://localhost:9000',
      NEXT_PUBLIC_ENV: 'development' as const,
      NEXT_PUBLIC_ENABLE_OFFLINE: true,
      NEXT_PUBLIC_ENABLE_PWA: false,
    }
  }
}

export const env = parseEnv()
