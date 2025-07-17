import { ConversationController } from '@communication-read/api/controllers/ConversationController.js'
import { GetUserConversationsQueryHandler } from '@communication-read/application/use_cases/queries/GetUserConversationsQueryHandler.js'
import { ConversationReadRepositoryPort } from '@communication-read/domain/ports/ConversationReadRepositoryPort.js'
import { Type } from '@sinclair/typebox'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

export function createConversationReadRouter(
  conversationRepository: ConversationReadRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    const getUserConversationsHandler = new GetUserConversationsQueryHandler(
      conversationRepository,
    )
    const controller = new ConversationController(getUserConversationsHandler)

    fastify.get<{
      Querystring: {
        page?: number
        limit?: number
        include_archived?: boolean
      }
    }>(
      '/',
      {
        schema: {
          querystring: Type.Object({
            page: Type.Optional(Type.Integer({ minimum: 1 })),
            limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
            include_archived: Type.Optional(Type.Boolean()),
          }),
        },
      },
      async (request, reply) => {
        await controller.getUserConversations(request, reply)
      },
    )
  }
}
