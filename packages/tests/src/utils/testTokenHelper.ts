import { keyManager } from '@pika/crypto'
import { JWT_ALGORITHM } from '@pika/environment'
import { UserStatus } from '@pika/types'
import jwt from 'jsonwebtoken'

/**
 * Ensure KeyManager is initialized and get the signing key
 */
async function ensureKeyManagerAndGetSigningKey(): Promise<string> {
  if (!keyManager.isInitialized()) {
    await keyManager.initialize()
  }

  return keyManager.getJWTPrivateKeyPEM()
}

/**
 * Generate a test access token for integration tests
 */
export async function generateAccessToken(
  payload: {
    userId: string
    email: string
    role: string
    type?: string
    status?: UserStatus
  },
  expiresInSeconds: number = 900,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const algorithm = (JWT_ALGORITHM || 'RS256') as jwt.Algorithm
  const signingKey = await ensureKeyManagerAndGetSigningKey()

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      status: payload.status || UserStatus.ACTIVE,
      type: payload.type || 'access',
      iat: now,
      exp: now + expiresInSeconds,
      iss: 'pika-api',
      aud: 'pikapp',
    },
    signingKey,
    { algorithm },
  )
}

/**
 * Generate a test refresh token for integration tests
 */
export async function generateRefreshToken(
  payload: {
    userId: string
    email: string
    role: string
    status?: UserStatus
  },
  expiresInDays: number = 7,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const expiresInSeconds = expiresInDays * 24 * 60 * 60
  const algorithm = (JWT_ALGORITHM || 'RS256') as jwt.Algorithm
  const signingKey = await ensureKeyManagerAndGetSigningKey()

  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      status: payload.status || UserStatus.ACTIVE,
      type: 'refresh',
      iat: now,
      exp: now + expiresInSeconds,
      iss: 'pikapi',
      aud: 'pikapp',
    },
    signingKey,
    { algorithm },
  )
}
