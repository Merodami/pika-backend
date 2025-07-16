import { JWT_SECRET } from '@pika/environment'
import { UserStatus } from '@pika/types'
import jwt from 'jsonwebtoken'

/**
 * Generate a test access token for integration tests
 */
export function generateAccessToken(
  payload: {
    userId: string
    email: string
    role: string
    type?: string
    status?: UserStatus
  },
  expiresInSeconds: number = 900,
): string {
  const now = Math.floor(Date.now() / 1000)

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
    JWT_SECRET,
    { algorithm: 'HS256' },
  )
}

/**
 * Generate a test refresh token for integration tests
 */
export function generateRefreshToken(
  payload: {
    userId: string
    email: string
    role: string
    status?: UserStatus
  },
  expiresInDays: number = 7,
): string {
  const now = Math.floor(Date.now() / 1000)
  const expiresInSeconds = expiresInDays * 24 * 60 * 60

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
    JWT_SECRET,
    { algorithm: 'HS256' },
  )
}
