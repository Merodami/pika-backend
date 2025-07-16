export interface EmailProvider {
  sendEmail(params: EmailParams): Promise<EmailResult>
  sendBulkEmail(params: BulkEmailParams): Promise<BulkEmailResult>
  getProviderName(): string
  isAvailable(): Promise<boolean>
}

export interface EmailParams {
  to: string
  from: {
    email: string
    name?: string
  }
  fromName?: string
  subject: string
  body: string
  text?: string
  html?: string
  isHtml?: boolean
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface BulkEmailParams {
  to: string[]
  recipients?: string[]
  from: {
    email: string
    name?: string
  }
  fromName?: string
  subject: string
  body: string
  text?: string
  html?: string
  isHtml?: boolean
  replyTo?: string
  templateVariables?: Record<string, any>[]
}

export interface EmailResult {
  success: boolean
  messageId?: string
  provider: string
  status: 'sent' | 'queued' | 'failed'
  error?: string
  metadata?: any
}

export interface BulkEmailResult {
  sent: number
  failed: number
  total: number
  results: Array<{
    success: boolean
    messageId?: string
    error?: string
    metadata?: any
  }>
  provider: string
}
