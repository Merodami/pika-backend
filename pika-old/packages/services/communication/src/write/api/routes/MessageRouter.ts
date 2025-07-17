import { MessageType } from '@communication-shared/types/index.js'
import { MessageController } from '@communication-write/api/controllers/MessageController.js'
import { MarkMessagesReadCommandHandler } from '@communication-write/application/use_cases/commands/MarkMessagesReadCommandHandler.js'
import { SendMessageCommandHandler } from '@communication-write/application/use_cases/commands/SendMessageCommandHandler.js'
import { ConversationWriteRepositoryPort } from '@communication-write/domain/ports/ConversationWriteRepositoryPort.js'
import { MessageWriteRepositoryPort } from '@communication-write/domain/ports/MessageWriteRepositoryPort.js'
import { NotificationOrchestrator } from '@communication-write/domain/services/NotificationOrchestrator.js'
import { Type } from '@sinclair/typebox'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

export function createMessageWriteRouter(
  messageRepository: MessageWriteRepositoryPort,
  conversationRepository: ConversationWriteRepositoryPort,
  notificationOrchestrator: NotificationOrchestrator,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    const sendMessageHandler = new SendMessageCommandHandler(
      conversationRepository,
      messageRepository,
      notificationOrchestrator,
    )
    const markMessagesReadHandler = new MarkMessagesReadCommandHandler(
      conversationRepository,
      messageRepository,
    )
    const controller = new MessageController(
      sendMessageHandler,
      markMessagesReadHandler,
    )

    // Send message
    fastify.post<{
      Params: { conversationId: string }
      Body: {
        type: MessageType
        content: string
        metadata?: any
        reply_to_id?: string
      }
    }>(
      '/:conversationId/messages',
      {
        schema: {
          params: Type.Object({
            conversationId: Type.String({ format: 'uuid' }),
          }),
          body: Type.Object({
            type: Type.Enum(MessageType),
            content: Type.String({ minLength: 1 }),
            metadata: Type.Optional(Type.Any()),
            reply_to_id: Type.Optional(Type.String({ format: 'uuid' })),
          }),
        },
      },
      async (request, reply) => {
        await controller.sendMessage(request, reply)
      },
    )

    // Mark messages as read
    fastify.post<{
      Params: { conversationId: string }
      Body: { message_ids: string[] }
    }>(
      '/:conversationId/messages/read',
      {
        schema: {
          params: Type.Object({
            conversationId: Type.String({ format: 'uuid' }),
          }),
          body: Type.Object({
            message_ids: Type.Array(Type.String({ format: 'uuid' })),
          }),
        },
      },
      async (request, reply) => {
        await controller.markAsRead(request, reply)
      },
    )
  }
}
