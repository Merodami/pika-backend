// import { TSchema, Type } from '@sinclair/typebox'
// import { camelCase, upperFirst } from 'lodash'

// import { Context, PathItemObject } from '../types'
// import { createOperation } from './createOperation'
// import { createResponses } from './createResponses'

// /**
//  * Create CRUD endpoints for a given resource.
//  *
//  * This abstracts away all of the product service's boilerplate, which include different
//  * endpoints for public and admin use, publishing, revisions, etc.
//  *
//  * Teh key thing is it points to the "public" Product Service endpoints, not the more
//  * detailed "admin" equivalents.
//  *
//  * If you set `autoPublish` to `true` on the entity, and don't need to surface details about
//  * revisioning and publishing, you can use this function to create a simplified CRUD API.
//  */
// export function createSimplifiedCRUDEndpoints({
//   productServiceSlug,
//   name,
//   namePlural,
//   tag,
//   schema,
// }: {
//   productServiceSlug: string
//   tag: string
//   name: string
//   namePlural: string
//   schema: TSchema
// }) {
//   const namePascalCase = upperFirst(camelCase(name))
//   const namePluralPascalCase = upperFirst(camelCase(namePlural))

//   const rootEndpoints = (ctx: Context): PathItemObject => ({
//     get: createOperation(ctx, {
//       operationId: `list${namePluralPascalCase}`,
//       summary: `List ${namePlural}`,
//       description: `Get a list of all ${namePlural}.`,
//       responses: createResponses({ 200: Type.Array(schema) }),
//       security: [{ [ctx.defaultAuthorizerName]: [] }],
//       tags: [tag],
//       'x-amazon-apigateway-request-validator': 'all',
//       'x-pika': {
//         target: {
//           type: 'service',
//           id: 'product',
//           path: `/public/${productServiceSlug}`,
//           method: 'GET',
//         },
//         permissions: [`${productServiceSlug}:read`],
//       },
//     }),
//     post: createOperation(ctx, {
//       operationId: `create${namePascalCase}`,
//       summary: `Create ${name}`,
//       description: `Create a new ${name}.`,
//       requestBody: {
//         required: true,
//         content: { 'application/json': { schema: schema as any } },
//       },
//       responses: createResponses({ 200: schema }),
//       security: [{ [ctx.defaultAuthorizerName]: [] }],
//       tags: [tag],
//       'x-amazon-apigateway-request-validator': 'all',
//       'x-pika': {
//         target: {
//           type: 'service',
//           id: 'product',
//           path: `/public/${productServiceSlug}`,
//           method: 'POST',
//         },
//         permissions: [`${productServiceSlug}:create`],
//       },
//     }),
//   })

//   const idEndpoints = (ctx: Context): PathItemObject => ({
//     get: createOperation(ctx, {
//       operationId: `get${namePascalCase}`,
//       summary: `Get ${name}`,
//       description: `Get a ${name} by its ID.`,
//       parameters: [
//         { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
//       ],
//       responses: createResponses({ 200: schema }),
//       security: [{ [ctx.defaultAuthorizerName]: [] }],
//       tags: [tag],
//       'x-amazon-apigateway-request-validator': 'all',
//       'x-pika': {
//         target: {
//           type: 'service',
//           id: 'product',
//           path: `/public/${productServiceSlug}/{id}`,
//           method: 'GET',
//         },
//         permissions: [`${productServiceSlug}:read`],
//       },
//     }),
//     put: createOperation(ctx, {
//       operationId: `update${namePascalCase}`,
//       summary: `Update ${name}`,
//       description: `Update a ${name} by its ID.`,
//       parameters: [
//         { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
//       ],
//       requestBody: {
//         required: true,
//         content: { 'application/json': { schema: schema as any } },
//       },
//       responses: createResponses({ 200: schema }),
//       security: [{ [ctx.defaultAuthorizerName]: [] }],
//       tags: [tag],
//       'x-amazon-apigateway-request-validator': 'all',
//       'x-pika': {
//         target: {
//           type: 'service',
//           id: 'product',
//           path: `/public/${productServiceSlug}/{id}`,
//           method: 'PUT',
//         },
//         permissions: [`${productServiceSlug}:update`],
//       },
//     }),
//     delete: createOperation(ctx, {
//       operationId: `delete${namePascalCase}`,
//       summary: `Delete ${name}`,
//       description: `Soft delete a ${name} by its ID.`,
//       parameters: [
//         { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
//       ],
//       responses: createResponses({ 200: schema }),
//       security: [{ [ctx.defaultAuthorizerName]: [] }],
//       tags: [tag],
//       'x-amazon-apigateway-request-validator': 'all',
//       'x-pika': {
//         target: {
//           type: 'service',
//           id: 'product',
//           path: `/public/${productServiceSlug}/{id}`,
//           method: 'DELETE',
//         },
//         permissions: [`${productServiceSlug}:delete`],
//       },
//     }),
//   })

//   return {
//     rootEndpoints,
//     idEndpoints,
//   }
// }
