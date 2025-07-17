import { MarkAllNotificationsReadCommandHandler } from '@communication-write/application/use_cases/commands/MarkAllNotificationsReadCommandHandler.js'
import { MarkBatchNotificationsReadCommandHandler } from '@communication-write/application/use_cases/commands/MarkBatchNotificationsReadCommandHandler.js'
import { MarkNotificationReadCommandHandler } from '@communication-write/application/use_cases/commands/MarkNotificationReadCommandHandler.js'
import { PublishBatchNotificationCommandHandler } from '@communication-write/application/use_cases/commands/PublishBatchNotificationCommandHandler.js'
import { PublishNotificationCommandHandler } from '@communication-write/application/use_cases/commands/PublishNotificationCommandHandler.js'
import { RequestContext } from '@pika/http'
import { ErrorFactory } from '@pika/shared'
import { FastifyReply, FastifyRequest } from 'fastify'

export class NotificationController {
  constructor(
    private readonly publishNotificationHandler: PublishNotificationCommandHandler,
    private readonly publishBatchNotificationHandler: PublishBatchNotificationCommandHandler,
    private readonly markNotificationReadHandler: MarkNotificationReadCommandHandler,
    private readonly markAllNotificationsReadHandler: MarkAllNotificationsReadCommandHandler,
    private readonly markBatchNotificationsReadHandler: MarkBatchNotificationsReadCommandHandler,
  ) {}

  async publish(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const context = RequestContext.fromHeaders(request)
      const body = request.body as any

      const result = await this.publishNotificationHandler.execute({
        userId: body.user_id || context.userId,
        type: body.type,
        title: body.title,
        body: body.body,
        icon: body.icon,
        entityRef: body.entity_ref,
        expiresAt: body.expires_at ? new Date(body.expires_at) : undefined,
      })

      reply.status(201).send({
        success: result.success,
        notification_id: result.notificationId,
        error: result.error,
      })
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to publish notification', {
        source: 'NotificationController.publishNotification',
      })
    }
  }

  async publishBatch(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const body = request.body as any

      const notifications = body.notifications.map((notif: any) => ({
        userId: notif.user_id,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        icon: notif.icon,
        entityRef: notif.entity_ref,
        expiresAt: notif.expires_at ? new Date(notif.expires_at) : undefined,
      }))

      const result = await this.publishBatchNotificationHandler.execute({
        notifications,
      })

      reply.status(201).send({
        success: result.success,
        count: result.count,
        error: result.error,
      })
    } catch (error) {
      throw ErrorFactory.fromError(
        error,
        'Failed to publish batch notifications',
        {
          source: 'NotificationController.publishBatch',
        },
      )
    }
  }

  async markAsRead(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const context = RequestContext.fromHeaders(request)
      const { notificationId } = request.params as { notificationId: string }

      const result = await this.markNotificationReadHandler.execute({
        notificationId,
        userId: context.userId,
      })

      reply.status(200).send({
        success: result.success,
        error: result.error,
      })
    } catch (error) {
      throw ErrorFactory.fromError(
        error,
        'Failed to mark notification as read',
        {
          source: 'NotificationController.markAsRead',
        },
      )
    }
  }

  async markAllAsRead(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const context = RequestContext.fromHeaders(request)

      const result = await this.markAllNotificationsReadHandler.execute({
        userId: context.userId,
      })

      reply.status(200).send({
        success: result.success,
        count: result.count,
        error: result.error,
      })
    } catch (error) {
      throw ErrorFactory.fromError(
        error,
        'Failed to mark all notifications as read',
        {
          source: 'NotificationController.markAllAsRead',
        },
      )
    }
  }

  async markBatchAsRead(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const context = RequestContext.fromHeaders(request)
      const body = request.body as any

      const result = await this.markBatchNotificationsReadHandler.execute({
        notificationIds: body.notification_ids,
        userId: context.userId,
      })

      reply.status(200).send({
        success: result.success,
        count: result.count,
        error: result.error,
      })
    } catch (error) {
      throw ErrorFactory.fromError(
        error,
        'Failed to mark batch notifications as read',
        {
          source: 'NotificationController.markBatchAsRead',
        },
      )
    }
  }
}
