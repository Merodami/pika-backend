// import {
//   CognitoIdentityProviderClient,
//   paginateListUserPoolClients,
// } from '@aws-sdk/client-cognito-identity-provider'
// import { createCacheWrap } from '@ticknovate/cache'

// const cacheWrap = createCacheWrap(__filename)

// const client = new CognitoIdentityProviderClient({
//   region: process.env.AWS_REGION,
// })

// export const getCognitoAppClientIds = cacheWrap({
//   cacheDuration: 'PT1H',
//   cacheKey: 'getCognitoAppClientIds',
//   async fn(userPoolId: string) {
//     const paginatorConfig = {
//       client,
//       pagesize: 60, // Max
//     }
//     const paginator = paginateListUserPoolClients(paginatorConfig, {
//       UserPoolId: userPoolId,
//     })

//     const appClientIds: string[] = []
//     for await (const page of paginator) {
//       if (page.UserPoolClients)
//         appClientIds.push(
//           ...page.UserPoolClients.map((appClient) => appClient.ClientId!),
//         )
//     }
//     return appClientIds
//   },
// })
