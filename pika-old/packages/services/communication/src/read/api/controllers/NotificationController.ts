import { GetEntityNotificationsQueryHandler } from '@communication-read/application/use_cases/queries/GetEntityNotificationsQueryHandler.js'
import { GetUserNotificationsQueryHandler } from '@communication-read/application/use_cases/queries/GetUserNotificationsQueryHandler.js'
import { RequestContext } from '@pika/http'
import { ErrorFactory } from '@pika/shared'
import { FastifyReply, FastifyRequest } from 'fastify'

export class NotificationController {
  constructor(
    private readonly getUserNotificationsHandler: GetUserNotificationsQueryHandler,
    private readonly getEntityNotificationsHandler: GetEntityNotificationsQueryHandler,
  ) {}

  async getUserNotifications(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const context = RequestContext.fromHeaders(request)

      const query = request.query as any

      const result = await this.getUserNotificationsHandler.execute({
        userId: context.userId,
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
        unreadOnly: query.unread_only === 'true',
        types: query.types
          ? Array.isArray(query.types)
            ? query.types
            : [query.types]
          : undefined,
      })

      reply.status(200).send({
        notifications: result.notifications.map((notif) => ({
          id: notif.id,
          user_id: notif.userId,
          type: notif.type,
          title: notif.title,
          body: notif.body,
          icon: notif.icon,
          entity_ref: notif.entityRef,
          read: notif.read,
          created_at: notif.createdAt,
          expires_at: notif.expiresAt,
        })),
        total: result.total,
        unread_count: result.unreadCount,
        stats: result.stats,
      })
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to get user notifications', {
        source: 'NotificationController.getUserNotifications',
      })
    }
  }

  async getEntityNotifications(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const { entityType, entityId } = request.params as {
        entityType: string
        entityId: string
      }
      const query = request.query as any

      const result = await this.getEntityNotificationsHandler.execute({
        entityType,
        entityId,
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
      })

      reply.status(200).send({
        notifications: result.notifications.map((notif) => ({
          id: notif.id,
          user_id: notif.userId,
          type: notif.type,
          title: notif.title,
          body: notif.body,
          icon: notif.icon,
          entity_ref: notif.entityRef,
          read: notif.read,
          created_at: notif.createdAt,
          expires_at: notif.expiresAt,
        })),
        total: result.total,
        has_more: result.hasMore,
      })
    } catch (error) {
      throw ErrorFactory.fromError(
        error,
        'Failed to get entity notifications',
        {
          source: 'NotificationController.getEntityNotifications',
        },
      )
    }
  }
}
