export interface PushNotificationPayload {
  title: string
  body: string
  data?: Record<string, string>
  badge?: number
  sound?: string
  icon?: string
  clickAction?: string
}

export interface PushNotificationResult {
  successCount: number
  failureCount: number
  failedTokens: string[]
}
