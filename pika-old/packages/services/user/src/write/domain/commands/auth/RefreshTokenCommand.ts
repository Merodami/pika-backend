export interface RefreshTokenCommand {
  refreshToken: string

  // Security metadata
  ipAddress?: string
  userAgent?: string
}

export interface RefreshTokenResponse {
  tokens: {
    accessToken: string
    refreshToken: string
    expiresAt: Date
    refreshExpiresAt: Date
  }
  user: {
    id: string
    email: string
    role: string
  }
}
