export interface LoginUserCommand {
  email: string
  password: string

  // Security and tracking metadata
  ipAddress?: string
  userAgent?: string
  rememberMe?: boolean
  source?: 'web' | 'mobile' | 'api'
}

export interface LoginUserResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    emailVerified: boolean
    lastLoginAt: Date
  }
  tokens: {
    accessToken: string
    refreshToken: string
    expiresAt: Date
    refreshExpiresAt: Date
  }
}
