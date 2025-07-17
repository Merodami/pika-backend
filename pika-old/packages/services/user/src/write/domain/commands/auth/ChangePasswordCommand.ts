export interface ChangePasswordCommand {
  userId: string
  currentPassword: string
  newPassword: string

  // Security metadata
  ipAddress?: string
  userAgent?: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
  // Optionally invalidate all existing tokens
  shouldReauthenticate?: boolean
}
