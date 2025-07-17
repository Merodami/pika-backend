import { ConversationType } from '@communication-shared/types/index.js'
import { ConversationController } from '@communication-write/api/controllers/ConversationController.js'
import { CreateConversationCommandHandler } from '@communication-write/application/use_cases/commands/CreateConversationCommandHandler.js'
import { ConversationWriteRepositoryPort } from '@communication-write/domain/ports/ConversationWriteRepositoryPort.js'
import { Type } from '@sinclair/typebox'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'

export function createConversationWriteRouter(
  conversationRepository: ConversationWriteRepositoryPort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    const createConversationHandler = new CreateConversationCommandHandler(
      conversationRepository,
    )
    const controller = new ConversationController(createConversationHandler)

    // Create conversation
    fastify.post<{
      Body: {
        participant_ids: string[]
        type: ConversationType
        title?: string
        metadata?: any
      }
    }>(
      '/',
      {
        schema: {
          body: Type.Object({
            participant_ids: Type.Array(Type.String({ format: 'uuid' }), {
              minItems: 1,
              maxItems: 10,
            }),
            type: Type.Enum(ConversationType),
            title: Type.Optional(Type.String({ minLength: 1 })),
            metadata: Type.Optional(Type.Any()),
          }),
        },
      },
      async (request, reply) => {
        await controller.createConversation(request, reply)
      },
    )
  }
}
