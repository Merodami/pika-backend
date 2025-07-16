// import { OpenAPIV3 } from 'openapi-types'

// import type {
//   Context,
//   Document,
//   OperationExtensions,
// } from '../types/gateway.js'
// import { createXPikaHeaders } from './createXPikaHeaders.js'

// /**
//  * Adds the default authorizer for the gateway to any endpoints that do not have security enabled.
//  * Can be overridden with the use of `doNotOverrideSecurity` on the endpoint itself.
//  * @param spec API Specification Document
//  * @param ctx Context
//  */
// export const addDefaultSecurity = (spec: Document, ctx: Context): Document => {
//   return {
//     ...spec,
//     paths: Object.fromEntries(
//       Object.entries(spec.paths).map(([path, pathConfig]) => {
//         return [
//           path,
//           Object.fromEntries(
//             Object.entries(pathConfig!).map(
//               ([httpMethod, httpMethodConfig]) => {
//                 const config =
//                   httpMethodConfig as OpenAPIV3.OperationObject<OperationExtensions>

//                 let security = config.security ?? []

//                 if (
//                   !config['x-pika'].doNotOverrideSecurity &&
//                   security.length === 0
//                 ) {
//                   security = [{ [ctx.defaultAuthorizerName]: [] }]
//                 }

//                 return [
//                   httpMethod,
//                   {
//                     ...config,
//                     security,
//                     'x-amazon-apigateway-integration': {
//                       ...config['x-amazon-apigateway-integration'],
//                       requestParameters: {
//                         ...config['x-amazon-apigateway-integration']
//                           ?.requestParameters,
//                         ...createXPikaHeaders(ctx, config, true),
//                       },
//                     },
//                   },
//                 ]
//               },
//             ),
//           ),
//         ]
//       }),
//     ),
//   }
// }
