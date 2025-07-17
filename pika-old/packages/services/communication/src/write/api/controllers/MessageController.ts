import { MarkMessagesReadCommandHandler } from '@communication-write/application/use_cases/commands/MarkMessagesReadCommandHandler.js'
import { SendMessageCommandHandler } from '@communication-write/application/use_cases/commands/SendMessageCommandHandler.js'
import { RequestContext } from '@pika/http'
import { ErrorFactory } from '@pika/shared'
import { FastifyReply, FastifyRequest } from 'fastify'

export class MessageController {
  constructor(
    private readonly sendMessageHandler: SendMessageCommandHandler,
    private readonly markMessagesReadHandler: MarkMessagesReadCommandHandler,
  ) {}

  async sendMessage(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const context = RequestContext.fromHeaders(request)
      const body = request.body as any
      const { conversationId } = request.params as { conversationId: string }

      // Map role to sender type
      const senderType = RequestContext.isProvider(context)
        ? 'PROVIDER'
        : 'CUSTOMER'

      const result = await this.sendMessageHandler.execute({
        conversationId,
        senderId: context.userId,
        senderType,
        type: body.type,
        content: body.content,
        metadata: body.metadata,
        replyToId: body.reply_to_id,
      })

      reply.status(201).send({
        message_id: result.messageId,
      })
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to send message', {
        source: 'MessageController.sendMessage',
      })
    }
  }

  async markAsRead(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const context = RequestContext.fromHeaders(request)
      const body = request.body as any
      const { conversationId } = request.params as { conversationId: string }

      await this.markMessagesReadHandler.execute({
        conversationId,
        userId: context.userId,
        messageIds: body.message_ids || [],
      })

      reply.status(200).send({ success: true })
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to mark messages as read', {
        source: 'MessageController.markAsRead',
      })
    }
  }
}
