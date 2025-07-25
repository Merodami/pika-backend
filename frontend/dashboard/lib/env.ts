import { z } from 'zod'

const envSchema = z.object({
  // Public environment variables
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_API_GATEWAY_URL: z.string().url(),
  NEXT_PUBLIC_ENV: z.enum(['development', 'staging', 'production']),

  // Firebase configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1).optional(),

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
      NEXT_PUBLIC_FIREBASE_API_KEY: safeEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
        safeEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: safeEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
        safeEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
        safeEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: safeEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
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
      NEXT_PUBLIC_FIREBASE_API_KEY: undefined,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: undefined,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: undefined,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: undefined,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: undefined,
      NEXT_PUBLIC_FIREBASE_APP_ID: undefined,
      NEXT_PUBLIC_ENABLE_OFFLINE: true,
      NEXT_PUBLIC_ENABLE_PWA: false,
    }
  }
}

export const env = parseEnv()
