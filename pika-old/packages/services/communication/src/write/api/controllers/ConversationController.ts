import { CreateConversationCommandHandler } from '@communication-write/application/use_cases/commands/CreateConversationCommandHandler.js'
import { ErrorFactory } from '@pika/shared'
import { FastifyReply, FastifyRequest } from 'fastify'

export class ConversationController {
  constructor(
    private readonly createConversationHandler: CreateConversationCommandHandler,
  ) {}

  async createConversation(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const body = request.body as any

      const result = await this.createConversationHandler.execute({
        participantIds: body.participant_ids,
        participantTypes: body.participant_types,
        context: body.context,
      })

      reply.status(201).send({
        id: result.conversationId,
      })
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to create conversation', {
        source: 'ConversationController.createConversation',
      })
    }
  }
}
