/**
 * Type extensions for Fastify
 *
 * This file collects all interface extensions in one place to
 * avoid shadowing issues with multiple declarations.
 */
import { RequestContext } from '@pika/shared'
import { PaginatedQuery } from '@pika/types-core'

declare module 'fastify' {
  // Only extend the interface once, collecting all properties here
  interface FastifyRequest {
    // From pagination hook
    pagination: PaginatedQuery

    // From request context plugin
    requestContext: RequestContext

    // From auth middleware - enhanced with additional properties
    user?: {
      id: string
      email: string
      role: string
      type: string
      permissions?: string[]
      sessionId?: string
      issuedAt?: Date
      expiresAt?: Date
    }

    // From auth middleware - correlation ID for request tracing
    correlationId?: string

    // From @fastify/accepts plugin
    accepts(): {
      charset(charsets: string[]): string | false
      charsets(): string[]
      encoding(encodings: string[]): string | false
      encodings(): string[]
      language(languages: string[]): string | false
      languages(): string[]
      type(types: string[]): string | false
      types(): string[]
    }
  }

  // Add methods to FastifyInstance
  interface FastifyInstance {
    // No custom instance methods
  }
}
