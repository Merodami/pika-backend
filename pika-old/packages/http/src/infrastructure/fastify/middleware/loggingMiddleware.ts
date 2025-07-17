// import type { RequestHandler } from 'express'

// import logger from './logger.js'
// import { getRequestContext } from './requestContext.js'

// interface LoggingMiddlewareOptions {
//   /**
//    * Function that returns the user context for the request. Gives access to information like the
//    * trade partner ID, which can be used to cache trade partner requests. We need to pass this in as
//    * a dependency in order to avoid circular dependencies between the @pika/shared and the
//    * @pika/auth packages.
//    *
//    * The expected function lives in the `@pika/auth` package and can be passed in like this:
//    *
//    * ```ts
//    * import { UserContext } from '@pika/auth'
//    * import { cacheMiddleware } from '@pika/shared'
//    *
//    * route.get(cacheMiddleware({ cacheTimeMinutes: 10, getUserContext: UserContext.getUserContext }, requestHandler)
//    * ```
//    */
//   getUserContext: () => {
//     authenticatedUser: {
//       id: string | null
//       tradePartnerId: string | null
//       email: string | null
//     } | null
//     impersonatedUser: {
//       id: string | null
//     } | null
//   }
// }

// // TODO: This needs unpicking, as it's not really middleware and can be handles in a less complex way.
// export function loggingMiddleware({
//   getUserContext,
// }: LoggingMiddlewareOptions): RequestHandler {
//   return async function loggingMiddleware(req, res, next) {
//     const { headers, ...ctxToLog } = getRequestContext()
//     const { authenticatedUser, impersonatedUser } = getUserContext()

//     const endpoint = `${req.method} ${req.path}`
//     const startMessage = `Req start: "${endpoint}"`

//     // In local dev, it is pure noise to log all this info. Omit it.
//     if (process.env.NODE_ENV === 'development') {
//       logger.info(startMessage)
//     } else {
//       logger.info(startMessage, {
//         ...ctxToLog,
//         userId: authenticatedUser?.id ?? null,
//         userEmail: authenticatedUser?.email ?? null,
//         userTradePartnerId: authenticatedUser?.tradePartnerId ?? null,
//         impersonatedUserId: impersonatedUser?.id ?? null,
//       })
//     }

//     res.on('finish', () => {
//       const endMessage = `Req end: "${endpoint}" with status code ${res.statusCode}`

//       if (res.statusCode < 500) {
//         logger.info(endMessage)
//       } else {
//         logger.error(endMessage)
//       }
//     })

//     next()
//   }
// }
