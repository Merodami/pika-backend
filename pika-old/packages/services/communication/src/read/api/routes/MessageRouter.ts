import { MessageController } from '@communication-read/api/controllers/MessageController.js'
import { GetMessagesQueryHandler } from '@communication-read/application/use_cases/queries/GetMessagesQueryHandler.js'
import { ConversationReadRepositoryPort } from '@communication-read/domain/ports/ConversationReadRepositoryPort.js'
import { MessageReadRepositoryPort } from '@communication-read/domain/ports/MessageReadRepositoryPort.js'
import { Type } from '@sinclair/typebox'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

export function createMessageReadRouter(
  messageRepository: MessageReadRepositoryPort,
  conversationRepository: ConversationReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    const getMessagesHandler = new GetMessagesQueryHandler(
      messageRepository,
      conversationRepository,
    )
    const controller = new MessageController(getMessagesHandler)

    fastify.get<{
      Params: { conversationId: string }
      Querystring: {
        limit?: number
        before?: string
        after?: string
        include_deleted?: string
      }
    }>(
      '/:conversationId/messages',
      {
        schema: {
          params: Type.Object({
            conversationId: Type.String({ format: 'uuid' }),
          }),
          querystring: Type.Object({
            limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
            before: Type.Optional(Type.String()),
            after: Type.Optional(Type.String()),
            include_deleted: Type.Optional(Type.String()),
          }),
        },
      },
      async (request, reply) => {
        await controller.getMessages(request, reply)
      },
    )
  }
}
