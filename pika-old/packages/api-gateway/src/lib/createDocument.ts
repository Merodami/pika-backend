// import { mapValues } from 'lodash'

// import * as examples from '../gateways/components/examples/index.js'
// import * as parameters from '../gateways/components/parameters/index.js'
// import * as responses from '../gateways/components/responses/index.js'
// import * as schemas from '../gateways/components/schemas/index.js'
// import {
//   Context,
//   Document,
//   OperationObject,
//   PathItemObject,
// } from '../types/gateway.js'
// import { dereferenceAll } from './createRef.js'
// import { HTTPMethodLowercase, isValidHttpMethod } from './httpMethods.js'

// type GetDocument = (ctx: Context) => Document

// export function createDocument(getDocumentObject: GetDocument): GetDocument {
//   const getDocument: GetDocument = (ctx): Document => {
//     const documentObject = getDocumentObject(ctx)

//     // Add the "options" methods to each path. This is needed to
//     // populate the right CORS headers.
//     const paths = mapValues(documentObject.paths, (pathObject) =>
//       addOptionsToPath(pathObject!),
//     )

//     return {
//       ...documentObject,
//       paths,
//       components: {
//         ...documentObject.components,
//         parameters: {
//           ...documentObject.components?.parameters,
//           ...dereferenceAll(parameters),
//         },
//         schemas: {
//           ...documentObject.components?.schemas,
//           ...dereferenceAll(schemas),
//         },
//         responses: {
//           ...documentObject.components?.responses,
//           ...dereferenceAll(responses),
//         },
//         examples: {
//           ...documentObject.components?.examples,
//           ...dereferenceAll(examples),
//         },
//       },
//       servers: [
//         {
//           url: `https://${ctx.restApiId}.execute-api.${ctx.region}.amazonaws.com/${ctx.stageName}`,
//         },
//       ],
//       'x-amazon-apigateway-binary-media-types': [
//         'image/jpeg',
//         'image/gif',
//         'image/png',
//         'image/svg+xml',
//         'application/octet-stream',
//         'application/pdf',
//         'multipart/form-data',
//       ],
//       'x-amazon-apigateway-request-validators': {
//         all: { validateRequestParameters: true, validateRequestBody: true },
//         'params-only': {
//           validateRequestParameters: true,
//           validateRequestBody: false,
//         },
//       },
//       'x-amazon-apigateway-gateway-responses': {
//         BAD_REQUEST_BODY: {
//           statusCode: 400,
//           responseParameters: {
//             'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
//           },
//           responseTemplates: {
//             'application/json':
//               '{\n  "message": $context.error.messageString,\n  "validationError": "$context.error.validationErrorString"\n}',
//           },
//         },
//       },
//       // Start compressing responses at 4KB
//       'x-amazon-apigateway-minimum-compression-size': 4000,
//     }
//   }

//   return getDocument
// }

// function addOptionsToPath(pathDef: PathItemObject): PathItemObject {
//   const methods = Object.keys(pathDef)
//     .filter(isValidHttpMethod)
//     .map((method) => method.toUpperCase())

//   if (!methods.length) {
//     throw new Error('No methods defined for path')
//   }

//   const allowMethods = [...methods, 'OPTIONS']
//   const allowOrigins = ['*']
//   const allowHeaders = [
//     'As-User',
//     'Cart-Token',
//     'Market-Token',
//     'Content-Type',
//     'X-Amz-Date',
//     'Authorization',
//     'X-Api-Key',
//     'X-Amz-Security-Token',
//   ]

//   const pathDefMethods = Object.fromEntries(
//     Object.entries(pathDef).filter(([key]) => isValidHttpMethod(key)),
//   ) as Record<HTTPMethodLowercase, OperationObject>

//   const pathParametersSource =
//     pathDef.parameters ?? Object.values(pathDefMethods)[0]?.parameters ?? []

//   const tags = Object.values(pathDefMethods)[0]?.tags

//   return {
//     ...pathDef,
//     options: {
//       // Keep TS happy. We're not doing any logic on "options" requests
//       'x-pika': {} as any,
//       'x-pika-processed': true,
//       parameters: pathParametersSource.filter((param) => {
//         // This should even resolve refs due to the way `createRef`
//         // creates them.
//         return 'in' in param && param.in === 'path'
//       }),
//       tags,
//       responses: {
//         '200': {
//           description: 'Undocumented response',
//           headers: {
//             'Access-Control-Allow-Origin': { schema: { type: 'string' } },
//             'Access-Control-Allow-Methods': { schema: { type: 'string' } },
//             'Access-Control-Allow-Headers': { schema: { type: 'string' } },
//           },
//           content: {
//             'application/json': {
//               schema: {
//                 title: 'Empty response',
//                 type: 'object',
//               },
//             },
//           },
//         },
//       },
//       'x-amazon-apigateway-integration': {
//         responses: {
//           default: {
//             statusCode: '200',
//             responseParameters: {
//               'method.response.header.Access-Control-Allow-Origin': `'${allowOrigins.join(
//                 ',',
//               )}'`,
//               'method.response.header.Access-Control-Allow-Methods': `'${allowMethods.join(
//                 ',',
//               )}'`,
//               'method.response.header.Access-Control-Allow-Headers': `'${allowHeaders.join(
//                 ',',
//               )}'`,
//             },
//           },
//         },
//         requestTemplates: {
//           'application/json': '{"statusCode": 200}',
//         },
//         passthroughBehavior: 'when_no_match',
//         type: 'mock',
//       },
//     },
//   }
// }
