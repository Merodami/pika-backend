import { schemas } from '@pika/api'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'

import { GetConversationsQueryHandler } from '../../application/use_cases/queries/GetConversationsQueryHandler.js'
import { ConversationReadRepositoryPort } from '../../domain/ports/ConversationReadRepositoryPort.js'
import { ConversationController } from '../controllers/ConversationController.js'

export function createConversationReadRouter(
  conversationRepository: ConversationReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    const getHandler = new GetConversationsQueryHandler(conversationRepository)
    const controller = new ConversationController(getHandler)

    fastify.get<{
      Querystring: schemas.GetConversationsQuery
    }>(
      '/',
      {
        schema: {
          querystring: schemas.GetConversationsQuerySchema,
        },
      },
      async (
        request: FastifyRequest<{
          Querystring: schemas.GetConversationsQuery
        }>,
        reply,
      ) => {
        const result = await controller.getAll(request)

        return reply.code(200).send(result)
      },
    )
  }
}
