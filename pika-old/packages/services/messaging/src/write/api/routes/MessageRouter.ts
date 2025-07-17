import { schemas } from '@pika/api'
import { Type } from '@sinclair/typebox'
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify'

import { MarkMessagesReadCommandHandler } from '../../application/use_cases/commands/MarkMessagesReadCommandHandler.js'
import { SendMessageCommandHandler } from '../../application/use_cases/commands/SendMessageCommandHandler.js'
import { ConversationRepositoryPort } from '../../domain/ports/ConversationRepositoryPort.js'
import { MessageRepositoryPort } from '../../domain/ports/MessageRepositoryPort.js'
import { NotificationServicePort } from '../../domain/ports/NotificationServicePort.js'
import { MessageController } from '../controllers/MessageController.js'

export function createMessageWriteRouter(
  conversationRepository: ConversationRepositoryPort,
  messageRepository: MessageRepositoryPort,
  notificationService: NotificationServicePort,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    const sendHandler = new SendMessageCommandHandler(
      conversationRepository,
      messageRepository,
      notificationService,
    )
    const markReadHandler = new MarkMessagesReadCommandHandler(
      conversationRepository,
      messageRepository,
    )

    const controller = new MessageController(sendHandler, markReadHandler)

    fastify.post<{
      Params: { conversationId: string }
      Body: schemas.SendMessageRequest
    }>(
      '/:conversationId/messages',
      {
        schema: {
          params: Type.Object({
            conversationId: Type.String({ format: 'uuid' }),
          }),
          body: schemas.SendMessageRequestSchema,
        },
      },
      async (
        request: FastifyRequest<{
          Params: { conversationId: string }
          Body: schemas.SendMessageRequest
        }>,
        reply,
      ) => {
        const result = await controller.send(request)

        return reply.code(201).send(result)
      },
    )

    fastify.patch<{
      Params: { conversationId: string }
      Body: schemas.MarkMessagesReadRequest
    }>(
      '/:conversationId/read',
      {
        schema: {
          params: Type.Object({
            conversationId: Type.String({ format: 'uuid' }),
          }),
          body: schemas.MarkMessagesReadRequestSchema,
        },
      },
      async (
        request: FastifyRequest<{
          Params: { conversationId: string }
          Body: schemas.MarkMessagesReadRequest
        }>,
        reply,
      ) => {
        const result = await controller.markAsRead(request)

        return reply.code(200).send(result)
      },
    )
  }
}
