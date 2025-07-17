import { GetMessagesQueryHandler } from '@communication-read/application/use_cases/queries/GetMessagesQueryHandler.js'
import { RequestContext } from '@pika/http'
import { ErrorFactory } from '@pika/shared'
import { FastifyReply, FastifyRequest } from 'fastify'

export class MessageController {
  constructor(private readonly getMessagesHandler: GetMessagesQueryHandler) {}

  async getMessages(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const context = RequestContext.fromHeaders(request)
      const { conversationId } = request.params as { conversationId: string }
      const query = request.query as any

      const result = await this.getMessagesHandler.execute({
        conversationId,
        userId: context.userId,
        limit: query.limit ? parseInt(query.limit) : undefined,
        before: query.before,
        after: query.after,
        includeDeleted: query.include_deleted === 'true',
      })

      reply.status(200).send({
        messages: result.messages.map((msg) => ({
          id: msg.id,
          conversation_id: msg.conversationId,
          sender_id: msg.senderId,
          sender_type: msg.senderType,
          type: msg.type,
          content: msg.content,
          metadata: msg.metadata,
          status: msg.status,
          reply_to: msg.replyTo,
          edit_history: msg.editHistory,
          deleted_at: msg.deletedAt,
          created_at: msg.createdAt,
          updated_at: msg.updatedAt,
        })),
        has_more: result.hasMore,
        cursor: result.cursor,
        unread_count: result.unreadCount,
      })
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to get messages', {
        source: 'MessageController.getMessages',
      })
    }
  }
}
