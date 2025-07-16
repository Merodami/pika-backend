// import { Context } from '../types'
// import { OperationObjectInput } from './createOperation.js'

// export const createXPikaHeaders = (
//   ctx: Context,
//   operation: OperationObjectInput,
//   overridePassAuthorizerHeaders = false,
// ) => {
//   const passAuthorizerHeaders =
//     !!(
//       // We're not stripping headers...
//       (
//         ctx.pikaHeaders !== 'strip' &&
//         // ...and we are using a gateway, so the headers will be passed by
//         // a trusted source (our authorizers).
//         operation.security?.length
//       )
//     ) || overridePassAuthorizerHeaders

//   return ctx.pikaaders === 'dangerous-passthrough'
//     ? // For internal gateway. Let all headers in.
//       {}
//     : {
//         'integration.request.header.x-pikahannel': passAuthorizerHeaders
//           ? 'context.authorizer.channel'
//           : "''",
//         'integration.request.header.x-pikarade-partner': passAuthorizerHeaders
//           ? 'context.authorizer.tradePartner'
//           : "''",
//         'integration.request.header.x-pikaser-permissions':
//           passAuthorizerHeaders
//             ? 'context.authorizer.userPermissions'
//             : ctx.templateName === 'public'
//               ? // Specify a base set of permissions the public gateway users have.
//                 // Every endpoint on that gateway requires auth - even those that are
//                 // explicitly marked as public. All authed users have the same level
//                 // of access. This will be replaced when we have Auth V2.
//                 "'user:read:all'"
//               : // Strip the headers. No permissions passed.
//                 "''",
//         'integration.request.header.x-pikaource': passAuthorizerHeaders
//           ? 'context.authorizer.source'
//           : ctx.templateName === 'public'
//             ? // Pass nothing by default for public API. It defaults
//               // to "b2c" in services, and consumers can pass their own
//               // source if they want to. TODO: This needs replacing once
//               // we have Auth V2.
//               undefined
//             : `'${ctx.templateName}'`,
//         'integration.request.header.x-pikaser-id': passAuthorizerHeaders
//           ? 'context.authorizer.userId'
//           : "''",
//         'integration.request.header.x-pikaser-email': passAuthorizerHeaders
//           ? 'context.authorizer.userEmail'
//           : "''",
//       }
// }
