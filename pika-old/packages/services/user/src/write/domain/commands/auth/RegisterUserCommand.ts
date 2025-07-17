import { UserRole } from '@pika/types-core'

export interface RegisterUserCommand {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  phoneNumber?: string
  avatarUrl?: string

  // Metadata for tracking and auditing
  ipAddress?: string
  userAgent?: string
  source?: 'web' | 'mobile' | 'api'
}

export interface RegisterUserResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
    emailVerified: boolean
    createdAt: Date
  }
  tokens: {
    accessToken: string
    refreshToken: string
    expiresAt: Date
    refreshExpiresAt: Date
  }
}
