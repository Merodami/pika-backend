import { TSchema } from '@sinclair/typebox'
import type { OpenAPIV3 } from 'openapi-types'

/**
 * Registry for managing TypeBox schemas and generating OpenAPI specifications
 */
class SchemaRegistry {
  private schemas = new Map<string, TSchema>()
  private responses = new Map<string, OpenAPIV3.ResponseObject>()
  private parameters = new Map<string, OpenAPIV3.ParameterObject>()
  /**
   * Register a schema with the registry
   */
  register<T extends TSchema>(name: string, schema: T): T {
    if (!this.schemas.has(name)) {
      this.schemas.set(name, schema)
    }

    return schema
  }

  /**
   * Register a response object under components.responses
   */
  registerResponse(
    name: string,
    response: OpenAPIV3.ResponseObject,
  ): OpenAPIV3.ResponseObject {
    if (!this.responses.has(name)) {
      this.responses.set(name, response)
    }

    return response
  }

  /**
   * Register a parameter with the registry
   */
  registerParameter(
    name: string,
    parameter: OpenAPIV3.ParameterObject,
  ): OpenAPIV3.ParameterObject {
    if (!this.parameters.has(name)) {
      this.parameters.set(name, parameter)
    }

    return parameter
  }

  /**
   * Get a schema by name
   */
  get<T extends TSchema>(name: string): T {
    const schema = this.schemas.get(name)

    if (!schema) {
      throw new Error(`Schema "${name}" not found in registry`)
    }

    return schema as T
  }

  /**
   * Create a reference to a schema
   */
  ref(name: string): OpenAPIV3.ReferenceObject {
    return { $ref: `#/components/schemas/${name}` }
  }

  /**
   * Create a reference to a response
   */
  refResponse(name: string): OpenAPIV3.ReferenceObject {
    return { $ref: `#/components/responses/${name}` }
  }

  /**
   * Create a reference to a parameter
   */
  refParameter(name: string): OpenAPIV3.ReferenceObject {
    return { $ref: `#/components/parameters/${name}` }
  }

  /**
   * Check if a schema exists
   */
  has(name: string): boolean {
    return this.schemas.has(name)
  }

  /**
   * Get all schema names
   */
  getSchemaNames(): string[] {
    return Array.from(this.schemas.keys())
  }

  /**
   * Generate OpenAPI components (schemas, responses, parameters)
   */
  generateComponents(): OpenAPIV3.ComponentsObject {
    const schemas: Record<
      string,
      OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
    > = {}

    this.schemas.forEach((schema, name) => {
      Object.assign(schemas, { [name]: this.toOpenAPISchema(schema) })
    })

    const responses: Record<string, OpenAPIV3.ResponseObject> = {}

    this.responses.forEach((resp, name) => {
      Object.assign(responses, { [name]: resp })
    })

    const parameters: Record<string, OpenAPIV3.ParameterObject> = {}

    this.parameters.forEach((param, name) => {
      Object.assign(parameters, { [name]: param })
    })

    return { schemas, responses, parameters }
  }

  /**
   * Convert TypeBox schema to OpenAPI schema
   */
  private toOpenAPISchema(
    schema: TSchema,
  ): OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject {
    const jsonSchema = JSON.parse(JSON.stringify(schema))
    const cleanSchema = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj

      // Collapse anyOf with only const literals into a proper enum
      if (
        Array.isArray(obj.anyOf) &&
        obj.anyOf.every((v: any) => v.const !== undefined)
      ) {
        const enumVals = obj.anyOf.map((v: any) => v.const)
        const type = typeof enumVals[0] === 'number' ? 'number' : 'string'

        return { type, enum: enumVals }
      }

      if (Array.isArray(obj)) {
        return obj.map(cleanSchema)
      }

      const cleaned: any = {}

      for (const [key, value] of Object.entries(obj)) {
        // Strip TypeBox metadata
        if (['$schema', 'kind', 'modifier'].includes(key)) continue

        if (['anyOf', 'allOf', 'oneOf', 'enum'].includes(key)) {
          Object.assign(cleaned, { [key]: (value as any[]).map(cleanSchema) })
        } else if (typeof value === 'object' && value !== null) {
          Object.assign(cleaned, { [key]: cleanSchema(value) })
        } else {
          Object.assign(cleaned, { [key]: value })
        }
      }

      return cleaned
    }

    return cleanSchema(jsonSchema)
  }
}

// Export a singleton instance
export const registry = new SchemaRegistry()
