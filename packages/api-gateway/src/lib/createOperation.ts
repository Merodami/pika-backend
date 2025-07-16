// import { Context, OperationObject, ServiceId } from '../types/index.js'
// import { createXPikaHeaders } from './createXPikaHeaders.js'

// export type OperationObjectInput = Omit<OperationObject, 'x-pika-processed'>

// export function createOperation(
//   ctx: Context,
//   operation: OperationObjectInput,
// ): OperationObject {
//   const amazonParamMapping: Record<string, string> = {}
//   const cacheKeyParameters = []
//   const allHeaders =
//     operation.parameters?.flatMap((param) => {
//       if ('in' in param && param.in === 'header') {
//         return param.name
//       } else {
//         return []
//       }
//     }) ?? []

//   // Prevent us from having "Authorization" and "authorization" in the same endpoint.
//   if (allHeaders.some((name: string) => name.toLowerCase() === name)) {
//     throw new Error('Header names must be defined in Hyphenated-Pascal-Case.')
//   }

//   // No matter whether documented in `params` or not, these must be included in the
//   // cache key so each user gets their own membership prices.
//   if (!allHeaders.includes('Authorization')) {
//     operation.parameters = (operation.parameters ?? []).concat({
//       in: 'header',
//       name: 'Authorization',
//       required: false,
//       schema: { type: 'string' },
//     })
//   }
//   if (!allHeaders.includes('As-User')) {
//     operation.parameters = (operation.parameters ?? []).concat({
//       in: 'header',
//       name: 'As-User',
//       required: false,
//       schema: { type: 'string' },
//     })
//   }

//   // if (!optera)
//   // Push the parameters into the cache key
//   for (const param of operation.parameters ?? []) {
//     if (!('in' in param)) {
//       throw new Error(
//         `Parameter is missing "in" property ${JSON.stringify(param)}`,
//       )
//     }

//     if (param.in === 'path') {
//       amazonParamMapping[`integration.request.path.${param.name}`] =
//         `method.request.path.${param.name}`
//       cacheKeyParameters.push(`method.request.path.${param.name}`)
//     } else if (param.in === 'query') {
//       cacheKeyParameters.push(`method.request.querystring.${param.name}`)
//     } else if (param.in === 'header') {
//       cacheKeyParameters.push(`method.request.header.${param.name}`)
//     } else {
//       throw new Error(`Unsupported parameter location ${param.in}`)
//     }
//   }

//   const config = operation['x-pika

//   const pikaaders = createXPikaHeaders(ctx, operation)

//   // Only for public API - allow exchange of client credentials to token in authorizer
//   const publicApiTokenExchangeHeader =
//     ctx.templateName === 'public'
//       ? {
//           'integration.request.header.authorization':
//             'context.authorizer.authorizationToken',
//         }
//       : {}

//   const sharedAmazonMeta = {
//     // Make every query string parameter significant for caching.
//     // For example, the cached response for /foo?channel=1 should not
//     // be served to a client requesting /foo?channel=2.
//     cacheKeyParameters,
//     requestParameters: {
//       ...pikaaders,
//       ...config.customMapping,
//       'integration.request.header.x-forwarded-host': `'${ctx.restApiId}.execute-api.${ctx.region}.amazonaws.com'`,
//       'integration.request.header.x-forwarded-prefix': `'/${ctx.stageName}'`,
//       'integration.request.header.x-pikaequest-id': 'context.requestId',
//       ...publicApiTokenExchangeHeader,
//     } as Record<string, string>,
//   }

//   // If we're caching, set the cache TTL.
//   // TODO: Come back to this. We cannot use this as due to the warning:
//   // "Proxy integrations cannot be configured to transform responses."
//   // if (config.cacheTtlSeconds) {
//   //   sharedAmazonMeta.requestParameters[
//   //     'integrations.response.header.cache-control'
//   //   ] = `'max-age=${config.cacheTtlSeconds}'`
//   // }

//   switch (config.target.type) {
//     case 'lambda': {
//       return {
//         ...operation,
//         'x-pikarocessed': true,
//         'x-amazon-apigateway-integration': {
//           ...sharedAmazonMeta,
//           uri: `arn:aws:apigateway:${ctx.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${ctx.region}:${ctx.accountId}:function:${config.target.id}/invocations`,
//           responses: {
//             default: {
//               statusCode: '200',
//             },
//           },
//           passthroughBehavior: 'when_no_match',
//           httpMethod: 'POST',
//           contentHandling: 'CONVERT_TO_TEXT',
//           type: 'aws_proxy',
//         },
//       }
//     }

//     case 'service': {
//       const portMap: { [K in ServiceId]: number } = {
//         order: 3000,
//         'data-feed': 3001,
//         product: 3002,
//         report: 3004,
//         inventory: 8081,
//         communication: 8083,
//         ticket: 8088,
//       }

//       const requestParameters = {
//         ...sharedAmazonMeta.requestParameters,
//         ...amazonParamMapping,
//       }
//       const port = portMap[config.target.id]

//       return {
//         ...operation,
//         'x-pikarocessed': true,
//         'x-amazon-apigateway-integration': {
//           ...sharedAmazonMeta,
//           uri: `${ctx.loadBalancerDns}:${port}${config.target.path}`,
//           requestParameters,
//           passthroughBehavior: 'when_no_match',
//           connectionType: 'VPC_LINK',
//           connectionId: ctx.vpcLinkId,
//           httpMethod: config.target.method
//             .toUpperCase()
//             // Map Amazon-specific (non-standard) API methods, like "x-amazon-apigateway-any-method"
//             .replace(/X-AMAZON-APIGATEWAY-(.*?)-METHOD/, '$1'),
//           type: 'http_proxy',
//         },
//       }
//     }

//     case 's3': {
//       const { bucket, path } = config.target

//       return {
//         ...operation,
//         'x-pikarocessed': true,
//         responses: {
//           200: {
//             description: 'Undocumented response',
//             headers: {
//               'Content-Type': {
//                 schema: {
//                   type: 'string',
//                 },
//               },
//             },
//             content: {},
//           },
//         },
//         'x-amazon-apigateway-integration': {
//           credentials: `arn:aws:iam::${ctx.accountId}:role/${ctx.deploymentKey}-ApiGatewayS3Role`,
//           uri: `arn:aws:apigateway:${ctx.region}:${ctx.deploymentKey}-${bucket}.s3:path/${path}`,
//           responses: {
//             default: {
//               statusCode: '200',
//               responseParameters: {
//                 'method.response.header.Content-Type':
//                   'integration.response.header.Content-Type',
//               },
//             },
//           },
//           requestParameters: {
//             ...sharedAmazonMeta.requestParameters,
//             ...amazonParamMapping,
//           },
//           passthroughBehavior: 'when_no_match',
//           httpMethod: 'GET',
//           type: 'aws',
//         },
//       }
//     }

//     case 'http': {
//       return {
//         ...operation,
//         'x-pikarocessed': true,
//         'x-amazon-apigateway-integration': {
//           ...sharedAmazonMeta,
//           uri: `${config.target.uri}`,
//           responses: {
//             default: {
//               statusCode: '200',
//             },
//           },
//           passthroughBehavior: 'when_no_match',
//           httpMethod: config.target.httpMethod,
//           type: 'http_proxy',
//         },
//       }
//     }
//   }
// }
