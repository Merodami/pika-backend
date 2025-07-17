import { logger } from '@pika/shared'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { camelCase, isArray, isObject, set, transform } from 'lodash-es'

/**
 * Options for the property name transformer hook
 */
export interface PropertyTransformerOptions {
  /**
   * Enable verbose logging for debugging purposes
   * Default: false
   */
  debug?: boolean
}

/**
 * Recursively transforms object keys from snake_case to camelCase
 * Handles nested objects and arrays
 */
function deepSnakeToCamelCase(obj: any): any {
  if (!isObject(obj)) {
    return obj
  }

  if (isArray(obj)) {
    return obj.map(deepSnakeToCamelCase)
  }

  return transform(
    obj,
    (result: any, value, key: string) => {
      const camelKey = camelCase(key)

      set(
        result,
        camelKey,
        isObject(value) ? deepSnakeToCamelCase(value) : value,
      )
    },
    {},
  )
}

/**
 * Fastify plugin that transforms request body property names from snake_case to camelCase
 * Can be registered globally or for specific routes
 */
export const propertyTransformerHook = fp<PropertyTransformerOptions>(
  function propertyTransformerHookPlugin(
    fastify: FastifyInstance,
    options: PropertyTransformerOptions,
    done,
  ) {
    const { debug = false } = options || {}

    // Add a hook that runs after body parsing and validation but before handler execution
    fastify.addHook('preHandler', (request, reply, hookDone) => {
      if (request.body && typeof request.body === 'object') {
        if (debug) {
          logger.debug('Original request body:', request.body)
        }

        // Transform request body from snake_case to camelCase
        request.body = deepSnakeToCamelCase(request.body)

        if (debug) {
          logger.debug('Transformed request body:', request.body)
        }
      }

      hookDone()
    })

    done()
  },
)

/**
 * Transforms a single object from snake_case to camelCase
 * Utility for manual transformation where needed
 */
export function transformSnakeToCamelCase<T>(data: any): T {
  return deepSnakeToCamelCase(data) as T
}
