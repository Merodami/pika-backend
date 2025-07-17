// import { TSchema } from '@sinclair/typebox'
// import { mapValues } from 'lodash'
// import { OpenAPIV3 } from 'openapi-types'

// /**
//  * A helper to reduce the boilerplate of creating responses.
//  */
// export function createResponses(
//   responses: Record<number, TSchema>,
// ): OpenAPIV3.ResponsesObject {
//   return mapValues(
//     responses,
//     (schema, key): OpenAPIV3.ResponseObject => ({
//       description: Number(key) >= 400 ? 'Error response' : 'Success response',
//       // Schemas typed as `any` for now. Can't figure out how to type them properly,
//       // and they are valid here, the way we always use them.
//       content: { 'application/json': { schema: schema as any } },
//       // CORS headers
//       headers: {
//         'Access-Control-Allow-Origin': { schema: { type: 'string' } },
//         'Access-Control-Expose-Headers': { schema: { type: 'string' } },
//       },
//     }),
//   )
// }
