import {
  GetUserConversationsQuery,
  GetUserConversationsQueryHandler,
} from '@communication-read/application/use_cases/queries/GetUserConversationsQueryHandler.js'
import { RequestContext } from '@pika/http'
import { logger } from '@pika/shared'
import { FastifyReply, FastifyRequest } from 'fastify'

export class ConversationController {
  constructor(
    private readonly getUserConversationsHandler: GetUserConversationsQueryHandler,
  ) {}

  async getUserConversations(
    request: FastifyRequest<{
      Querystring: {
        page?: number
        limit?: number
        include_archived?: boolean
      }
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const context = RequestContext.fromHeaders(request)

      const query: GetUserConversationsQuery = {
        userId: context.userId,
        page: request.query.page || 1,
        limit: request.query.limit || 10,
        includeArchived: request.query.include_archived || false,
      }

      const result = await this.getUserConversationsHandler.execute(query)

      reply.status(200).send(result)
    } catch (error) {
      logger.error('Failed to get user conversations', { error: error.message })

      if (
        error.name?.includes('ValidationError') ||
        error.message?.includes('Validation')
      ) {
        reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        })

        return
      }

      if (
        error.name?.includes('UnauthorizedError') ||
        error.message?.includes('Authentication required')
      ) {
        reply.status(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: error.message,
          },
        })

        return
      }

      reply.status(500).send({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get conversations',
        },
      })
    }
  }
}
