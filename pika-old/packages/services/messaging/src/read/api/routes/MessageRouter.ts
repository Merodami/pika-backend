import { schemas } from '@pika/api'
import { Type } from '@sinclair/typebox'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'

import { GetMessagesQueryHandler } from '../../application/use_cases/queries/GetMessagesQueryHandler.js'
import { ConversationReadRepositoryPort } from '../../domain/ports/ConversationReadRepositoryPort.js'
import { MessageReadRepositoryPort } from '../../domain/ports/MessageReadRepositoryPort.js'
import { MessageController } from '../controllers/MessageController.js'

export function createMessageReadRouter(
  conversationRepository: ConversationReadRepositoryPort,
  messageRepository: MessageReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    const getHandler = new GetMessagesQueryHandler(
      conversationRepository,
      messageRepository,
    )
    const controller = new MessageController(getHandler)

    fastify.get<{
      Params: { conversationId: string }
      Querystring: schemas.GetMessagesQuery
    }>(
      '/:conversationId/messages',
      {
        schema: {
          params: Type.Object({
            conversationId: Type.String({ format: 'uuid' }),
          }),
          querystring: schemas.GetMessagesQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Params: { conversationId: string }
          Querystring: schemas.GetMessagesQuery
        }>,
        reply,
      ) => {
        const result = await controller.getByConversation(request)

        return reply.code(200).send(result)
      },
    )
  }
}
