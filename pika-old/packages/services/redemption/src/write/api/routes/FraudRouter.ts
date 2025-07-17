import { schemas } from '@pika/api'
import { propertyTransformerHook } from '@pika/http'
import type { ReviewFraudCaseCommandHandler } from '@redemption-write/application/use_cases/commands/index.js'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'

import { FraudController } from '../controllers/fraud/FraudController.js'

/**
 * Creates a Fastify router for fraud write endpoints
 *
 * @param reviewFraudCaseHandler - Command handler for reviewing fraud cases
 * @returns Fastify plugin for fraud write routes
 */
export function createFraudWriteRouter(
  reviewFraudCaseHandler: ReviewFraudCaseCommandHandler,
): FastifyPluginAsync {
  return async (fastify: FastifyInstance) => {
    // Initialize controller with the handler
    const controller = new FraudController(reviewFraudCaseHandler)

    // Register property name transformer hook (snake_case to camelCase)
    // This runs after schema validation but before request handlers
    fastify.register(propertyTransformerHook, {
      debug: process.env.NODE_ENV === 'development',
    })

    // PUT /fraud/cases/:id/review - Review fraud case
    fastify.put<{
      Params: { id: string }
      Body: schemas.ReviewFraudCaseDTO
    }>(
      '/cases/:id/review',
      {
        schema: {
          params: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
            },
            required: ['id'],
          },
          body: schemas.ReviewFraudCaseDTOSchema,
        },
      },
      async (request, reply) => {
        await controller.reviewFraudCase(request, reply)
      },
    )
  }
}
