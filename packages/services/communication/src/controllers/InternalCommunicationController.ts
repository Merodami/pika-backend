import type {
    SendEmailRequest,
    SendEmailResponse,
    SendSystemNotificationRequest,
    SendSystemNotificationResponse,
    SendTransactionalEmailRequest,
    SendTransactionalEmailResponse,
} from '@pika/api/internal'
import { ErrorFactory, logger } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'
import { set } from 'lodash-es'

import type { EmailService } from '../services/EmailService.js'

/**
 * Controller for internal service-to-service communication
 * Handles email and notification requests from other microservices
 */
export class InternalCommunicationController {
  constructor(private readonly emailService: EmailService) {
    // Bind methods to preserve 'this' context
    this.sendEmail = this.sendEmail.bind(this)
    this.sendTransactionalEmail = this.sendTransactionalEmail.bind(this)
    this.sendSystemNotification = this.sendSystemNotification.bind(this)
  }

  /**
   * Send email via internal API
   * Used by other services to send emails with flexible structure
   */
  async sendEmail(
    request: Request<{}, {}, SendEmailRequest>,
    response: Response<SendEmailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        to,
        subject,
        templateId,
        templateParams,
        body,
        isHtml,
        replyTo,
        cc,
        bcc,
      } = request.body

      // Log service request details
      logger.info('Internal email request', {
        serviceName: request.headers['x-service-name'],
        serviceId: request.headers['x-service-id'],
        to,
        templateId,
        subject,
      })

      // Send email using the EmailService
      const result = await this.emailService.sendEmail({
        to,
        subject,
        templateId,
        templateParams,
        body,
        isHtml,
        replyTo,
        cc,
        bcc,
      })

      const responseData: SendEmailResponse = {
        id: result.id,
        status: result.status,
      }

      response.json(responseData)
    } catch (error) {
      logger.error('Failed to send email', error as Error, {
        serviceName: request.headers['x-service-name'],
        serviceId: request.headers['x-service-id'],
      })
      next(ErrorFactory.fromError(error))
    }
  }

  /**
   * Send transactional email via internal API
   * Used by other services to send template-based transactional emails
   */
  async sendTransactionalEmail(
    request: Request<{}, {}, SendTransactionalEmailRequest>,
    response: Response<SendTransactionalEmailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, templateKey } = request.body

      // Log service request details
      logger.info('Internal transactional email request', {
        serviceName: request.headers['x-service-name'],
        serviceId: request.headers['x-service-id'],
        userId,
        templateKey,
      })

      // TODO: In a full implementation, you would:
      // 1. Fetch user details from user service
      // 2. Load the appropriate template based on templateKey
      // 3. Process the template with variables
      // 4. Send the email

      // For now, we'll return a mock response
      const responseData: SendTransactionalEmailResponse = {
        messageId: `msg-${Date.now()}`,
        status: 'QUEUED',
        scheduledAt: new Date(),
      }

      response.json(responseData)
    } catch (error) {
      logger.error('Failed to send transactional email', error as Error, {
        serviceName: request.headers['x-service-name'],
        serviceId: request.headers['x-service-id'],
      })
      next(ErrorFactory.fromError(error))
    }
  }

  /**
   * Send system notification via internal API
   * Used by other services to create in-app notifications
   */
  async sendSystemNotification(
    request: Request<{}, {}, SendSystemNotificationRequest>,
    response: Response<SendSystemNotificationResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        userIds,
        broadcast,
        title,
        message,
        category,
        priority,
        channels,
        metadata,
      } = request.body

      logger.info('Internal system notification request', {
        serviceName: request.headers['x-service-name'],
        serviceId: request.headers['x-service-id'],
        userIds: userIds?.length,
        broadcast,
        category,
        priority,
      })

      // For now, we'll log the notification request
      // In a full implementation, this would create notification records
      logger.info('System notification would be sent', {
        userIds,
        broadcast,
        title,
        message,
        category,
        priority,
        channels,
        metadata,
      })

      const recipientCount = broadcast ? 100 : userIds?.length || 0
      const responseData: SendSystemNotificationResponse = {
        notificationId: `notification-${Date.now()}`,
        recipientCount,
        channels: (channels || ['IN_APP']).reduce(
          (acc, channel) => {
            set(acc, channel, { sent: recipientCount, failed: 0 })

            return acc
          },
          {} as Record<string, { sent: number; failed: number }>,
        ),
        timestamp: new Date(),
      }

      response.json(responseData)
    } catch (error) {
      logger.error('Failed to send system notification', error as Error, {
        serviceName: request.headers['x-service-name'],
        serviceId: request.headers['x-service-id'],
      })
      next(ErrorFactory.fromError(error))
    }
  }
}
