import {
  OpenApiGeneratorV31,
  OpenAPIRegistry,
  RouteConfig,
} from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

/**
 * Simplified registry for Zod schemas and OpenAPI documentation
 */

export interface SimpleRegistryOptions {
  title: string
  version: string
  description?: string
  servers?: Array<{ url: string; description?: string }>
}

export class SimpleZodRegistry {
  private registry: OpenAPIRegistry
  private schemas: Map<string, z.ZodTypeAny>
  private options: SimpleRegistryOptions

  constructor(options: SimpleRegistryOptions) {
    this.registry = new OpenAPIRegistry()
    this.schemas = new Map()
    this.options = options
  }

  /**
   * Register a schema
   */
  registerSchema<T extends z.ZodTypeAny>(name: string, schema: T): T {
    this.schemas.set(name, schema)
    this.registry.register(name, schema)

    return schema
  }

  /**
   * Register a route
   */
  registerRoute(config: RouteConfig): void {
    this.registry.registerPath(config)
  }

  /**
   * Get a schema
   */
  getSchema(name: string): z.ZodTypeAny | undefined {
    return this.schemas.get(name)
  }

  /**
   * Generate OpenAPI document
   */
  generateDocument(): any {
    const generator = new OpenApiGeneratorV31(this.registry.definitions)

    return generator.generateDocument({
      openapi: '3.1.0',
      info: {
        title: this.options.title,
        version: this.options.version,
        description: this.options.description,
      },
      servers: this.options.servers,
    })
  }
}

/**
 * Create a simple registry
 */
export function createSimpleRegistry(
  options: SimpleRegistryOptions,
): SimpleZodRegistry {
  return new SimpleZodRegistry(options)
}
