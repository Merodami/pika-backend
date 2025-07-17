import { schemas } from '@pika/api'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'

import { CreateConversationCommandHandler } from '../../application/use_cases/commands/CreateConversationCommandHandler.js'
import { ConversationRepositoryPort } from '../../domain/ports/ConversationRepositoryPort.js'
import { ConversationController } from '../controllers/ConversationController.js'

export function createConversationWriteRouter(
  conversationRepository: ConversationRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    const createHandler = new CreateConversationCommandHandler(
      conversationRepository,
    )
    const controller = new ConversationController(createHandler)

    fastify.post<{
      Body: schemas.CreateConversationRequest
    }>(
      '/',
      {
        schema: {
          body: schemas.CreateConversationRequestSchema,
        },
      },
      async (
        request: FastifyRequest<{
          Body: schemas.CreateConversationRequest
        }>,
        reply,
      ) => {
        const result = await controller.create(request)

        return reply.code(201).send(result)
      },
    )
  }
}
