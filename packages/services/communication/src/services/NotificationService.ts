import type { ICacheService } from '@pika/redis'
import { Cache } from '@pika/redis'
import type {
  CreateNotificationDTO,
  NotificationDomain,
  UpdateNotificationDTO,
} from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'

import type {
  INotificationRepository,
  NotificationSearchParams,
} from '../repositories/NotificationRepository.js'
import type { IEmailService } from './EmailService.js'

export interface INotificationService {
  createNotification(data: CreateNotificationDTO): Promise<NotificationDomain>
  getNotificationById(id: string, userId?: string): Promise<NotificationDomain>
  getUserNotifications(
    userId: string,
    params: NotificationSearchParams,
  ): Promise<PaginatedResult<NotificationDomain>>
  updateNotification(
    id: string,
    data: UpdateNotificationDTO,
    userId?: string,
  ): Promise<NotificationDomain>
  markAsRead(id: string, userId?: string): Promise<NotificationDomain>
  markAllAsRead(userId: string): Promise<void>
  deleteNotification(id: string, userId?: string): Promise<void>
  createGlobalNotification(
    data: CreateNotificationDTO,
  ): Promise<NotificationDomain>
  notifyUsersByEmail(
    emails: string[],
    notification: CreateNotificationDTO,
  ): Promise<void>
}

export class NotificationService implements INotificationService {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly emailService: IEmailService,
    private readonly cache: ICacheService,
  ) {}

  async createNotification(
    data: CreateNotificationDTO,
  ): Promise<NotificationDomain> {
    logger.info('Creating notification', {
      userId: data.userId,
      subToken: data.subToken,
      type: data.type,
    })

    // Validate that either userId or subToken is provided
    if (!data.userId && !data.subToken && !data.isGlobal) {
      throw ErrorFactory.businessRuleViolation(
        'Invalid notification target',
        'Either userId, subToken, or isGlobal must be provided',
      )
    }

    const notification = await this.notificationRepository.create({
      userId: data.userId || '',
      type: data.type || 'in_app',
      title: data.title || '',
      description: data.description,
      metadata: data.metadata,
    })

    // Clear cache for user notifications
    if (data.subToken) {
      await this.clearUserNotificationCache(data.subToken)
    }

    return notification
  }

  async getNotificationById(
    id: string,
    subToken?: string,
  ): Promise<NotificationDomain> {
    const notification = await this.notificationRepository.findById(id)

    if (!notification) {
      throw ErrorFactory.resourceNotFound('Notification', id)
    }

    // Check access permissions if subToken provided
    if (
      subToken &&
      notification.subToken !== subToken &&
      !notification.global
    ) {
      throw ErrorFactory.forbidden('Access denied to this notification')
    }

    return notification
  }

  @Cache({
    ttl: 60, // 1 minute cache for notifications
    prefix: 'user-notifications',
  })
  async getUserNotifications(
    subToken: string,
    params: NotificationSearchParams,
  ): Promise<PaginatedResult<NotificationDomain>> {
    return this.notificationRepository.findByUser(subToken, params)
  }

  async updateNotification(
    id: string,
    data: UpdateNotificationDTO,
    subToken?: string,
  ): Promise<NotificationDomain> {
    // Get notification to check permissions
    const notification = await this.getNotificationById(id, subToken)

    const updated = await this.notificationRepository.update(id, {
      isRead: data.isRead,
      metadata: data.metadata,
    })

    // Clear cache
    if (notification.subToken) {
      await this.clearUserNotificationCache(notification.subToken)
    }

    return updated
  }

  async markAsRead(id: string, subToken?: string): Promise<NotificationDomain> {
    // Get notification to check permissions
    const notification = await this.getNotificationById(id, subToken)

    const updated = await this.notificationRepository.markAsRead(id)

    // Clear cache
    if (notification.subToken) {
      await this.clearUserNotificationCache(notification.subToken)
    }

    return updated
  }

  async markAllAsRead(subToken: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(subToken)

    // Clear cache
    await this.clearUserNotificationCache(subToken)
  }

  async deleteNotification(id: string, subToken?: string): Promise<void> {
    // Get notification to check permissions
    const notification = await this.getNotificationById(id, subToken)

    await this.notificationRepository.delete(id)

    // Clear cache
    if (notification.subToken) {
      await this.clearUserNotificationCache(notification.subToken)
    }
  }

  async createGlobalNotification(
    data: CreateNotificationDTO,
  ): Promise<NotificationDomain> {
    logger.info('Creating global notification', {
      type: data.type,
      title: data.title,
    })

    return this.notificationRepository.create({
      userId: '',
      type: data.type || 'in_app',
      title: data.title || '',
      description: data.description,
      metadata: data.metadata,
    })
  }

  async notifyUsersByEmail(
    emails: string[],
    notification: CreateNotificationDTO,
  ): Promise<void> {
    logger.info('Notifying users by email', {
      emailCount: emails.length,
      type: notification.type,
    })

    // Process each email
    for (const email of emails) {
      try {
        // Check if user exists
        const user = await this.notificationRepository.findUserByEmail(email)

        if (user) {
          // User exists, create in-app notification
          await this.createNotification({
            ...notification,
            userId: user.id,
          })
        } else {
          // User doesn't exist, send email notification
          if (notification.type === 'session_invitation') {
            // Send session invitation email
            await this.emailService.sendEmail({
              to: email,
              subject:
                notification.title || 'You have been invited to a session',
              templateId: 'session-invitation',
              templateParams: {
                description: notification.description,
                ...notification.metadata,
              },
            })
          } else {
            // Send general notification email
            await this.emailService.sendEmail({
              to: email,
              subject: notification.title || 'Notification from Pika',
              body: notification.description,
              templateParams: notification.metadata,
            })
          }
        }
      } catch (error) {
        logger.error(`Failed to notify user ${email}`, error)
        // Continue with other notifications
      }
    }
  }

  private async clearUserNotificationCache(subToken: string): Promise<void> {
    try {
      // Clear all cached entries for this user's notifications
      const pattern = `user-notifications:${subToken}:*`

      await this.cache.delPattern(pattern)
    } catch (error) {
      logger.error('Failed to clear notification cache', error)
    }
  }
}
