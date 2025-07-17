// Import the shared type definitions
import '../../../types/fastify.js'

import {
  RequestContext,
  RequestContextStore,
  RequestIdSource,
  UserContext,
} from '@pika/shared'
import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from 'fastify'
import fp from 'fastify-plugin'
import { v4 as uuidv4 } from 'uuid'

// Internal symbol key for storing the context on each request
const kRequestContext = Symbol('requestContext')

/**
 * Options for the request context plugin.
 * Allows an optional function to resolve user context per request.
 */
export interface RequestContextPluginOptions {
  getUserContext?: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => UserContext | undefined
}

/**
 * Core plugin implementation for enriching each Fastify request with
 * a typed RequestContext object, and storing it in AsyncLocalStorage.
 */
const pluginFn: FastifyPluginAsync<RequestContextPluginOptions> = async (
  fastify: FastifyInstance,
  opts,
) => {
  // Decorate the request object with a getter/setter for requestContext.
  // This satisfies Fastify’s requirement for reference-type decorators.
  fastify.decorateRequest('requestContext', {
    getter(this: FastifyRequest): RequestContext {
      const ctx = Reflect.get(this, kRequestContext)

      if (!ctx) {
        throw new Error('requestContext has not been initialized')
      }

      return ctx as RequestContext
    },
    setter(this: FastifyRequest, ctx: RequestContext) {
      Object.defineProperty(this, kRequestContext, {
        value: ctx,
        writable: false,
        configurable: false,
      })
    },
  })

  // onRequest hook runs at the very start of the request lifecycle
  fastify.addHook('onRequest', (request, reply, done) => {
    // Resolve optional authenticated user context
    const userContext = opts.getUserContext?.(request, reply)

    // Determine or generate a request ID
    let requestIdSource: RequestIdSource = RequestIdSource.HEADER
    let requestId = (request.headers['x-pika-request-id'] as string) || ''

    if (!requestId) {
      requestId = uuidv4()
      requestIdSource = RequestIdSource.SELF_GENERATED
    }

    // Preserve any upstream original request ID
    const originalRequestId =
      (request.headers['x-pika-original-request-id'] as string) || requestId

    // Optional logical source header
    const source = request.headers['x-pika-source'] as string | undefined

    // Build the RequestContext object
    const context: RequestContext = {
      ip: request.ip || request.socket?.remoteAddress || 'unknown',
      url: request.raw.url ?? request.url,
      method: request.method,
      headers: Object.fromEntries(
        Object.entries(request.headers).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(',') : String(value),
        ]),
      ),
      requestId,
      requestIdSource,
      originalRequestId,
      source,
      userContext,
    }

    // Run under AsyncLocalStorage so that downstream code can access the context
    RequestContextStore.run(context, () => {
      request.requestContext = context
      // Attach a child logger with the request ID and source
      request.log = request.log.child({ requestId, source })
      done()
    })
  })
}

/**
 * Register the plugin with fastify-plugin to preserve the async signature.
 */
export const requestContextPlugin = fp(pluginFn, {
  name: 'request-context-plugin',
})

// Type declarations are moved to a centralized types/fastify.ts file
