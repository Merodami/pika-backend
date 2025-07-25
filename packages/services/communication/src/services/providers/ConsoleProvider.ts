import { logger } from '@pika/shared'

import type {
  BulkEmailParams,
  BulkEmailResult,
  EmailParams,
  EmailProvider,
  EmailResult,
} from './EmailProvider.js'

/**
 * Console Email Provider for local development
 * Logs emails to console instead of sending them
 */
export class ConsoleProvider implements EmailProvider {
  getProviderName(): string {
    return 'console'
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    const messageId = `console-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    logger.info('📧 EMAIL (Console Provider)', {
      messageId,
      to: params.to,
      from: params.from,
      fromName: params.fromName,
      subject: params.subject,
      replyTo: params.replyTo,
      preview: params.text?.substring(0, 100) || params.html?.substring(0, 100),
    })

    // In development, also log the full email content
    if (process.env.NODE_ENV === 'development') {
      const fromHeader = params.fromName
        ? `${params.fromName} <${params.from}>`
        : params.from

      logger.debug('📧 EMAIL FULL CONTENT (Console Provider)', {
        messageId,
        to: params.to,
        from: fromHeader,
        subject: params.subject,
        replyTo: params.replyTo,
        textContent: params.text,
        htmlContent: params.html,
      })
    }

    return {
      success: true,
      messageId,
      provider: this.getProviderName(),
      status: 'sent',
      metadata: {
        loggedAt: new Date().toISOString(),
      },
    }
  }

  async sendBulkEmail(params: BulkEmailParams): Promise<BulkEmailResult> {
    logger.info('📧 BULK EMAIL (Console Provider)', {
      recipients: params.to.length,
      subject: params.subject,
    })

    const results: Array<{
      success: boolean
      messageId?: string
      error?: string
      metadata?: any
    }> = []

    for (const recipient of params.to) {
      const result = await this.sendEmail({
        to: recipient,
        from: params.from,
        fromName: params.fromName,
        subject: params.subject,
        body: params.body,
        html: params.html,
        text: params.text,
        isHtml: params.isHtml,
      })

      results.push({
        success: result.success,
        messageId: result.messageId,
        metadata: result.metadata,
      })
    }

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return {
      sent: successful,
      failed: failed,
      total: params.to.length,
      results,
      provider: this.getProviderName(),
    }
  }
}
