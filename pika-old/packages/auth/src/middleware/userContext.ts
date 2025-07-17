import {
  ApplicationError,
  AuthenticatedUser,
  ErrorSeverity,
  logger,
  NotAuthenticatedError,
  RequestContextStore,
  UserContext,
} from '@pika/shared'
import { PrismaClient } from '@prisma/client'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { getJwtVerifier } from '../utils/jwtVerifier.js'

/**
 * Get local user profile by the identity provider's user ID
 *
 * @param prisma PrismaClient instance
 * @param identityProviderId The user ID from the identity provider (e.g., Cognito sub)
 * @param provider The identity provider name (e.g., 'cognito')
 * @returns The user profile if found
 */
export async function getLocalUserProfileByIdentity(
  prisma: PrismaClient,
  identityProviderId: string,
  provider: string = 'cognito',
) {
  // First try to find the user via the identity record
  try {
    // In production the model should be accessible, but in development we can use a different approach
    // We'll use direct SQL query to access the auth.user_identities table
    const result = await prisma.$queryRaw`
      SELECT u.* 
      FROM auth.user_identities ui
      JOIN users.users u ON ui.user_id = u.id
      WHERE ui.provider = ${provider} AND ui.provider_id = ${identityProviderId}
      LIMIT 1
    `

    // Check if we got a user
    const users = result as any[]

    if (users && users.length > 0) {
      return users[0]
    }
  } catch (error) {
    logger.warn(
      `Error finding user identity: ${error instanceof Error ? error.message : String(error)}`,
    )
    // Continue to fallback method
  }

  // If no identity record exists, we can try a direct lookup by ID
  // (for backward compatibility or if the ID happens to match)
  return prisma.user.findFirst({ where: { id: identityProviderId } })
}

/**
 * Get local user profile by Cognito ID (legacy method for backward compatibility)
 */
export async function getLocalUserProfileByCognitoId(
  prisma: PrismaClient,
  cognitoId: string,
) {
  return getLocalUserProfileByIdentity(prisma, cognitoId, 'cognito')
}

/**
 * Map user roles to permissions (placeholder for actual implementation)
 */
export function mapRolesToPermissions(roles: string[]): string[] {
  // This would be implemented based on your permissions scheme
  // For now, we'll return an empty array
  const permissions: string[] = []

  // Use the roles parameter in logs to avoid lint warnings
  logger.debug('Mapping roles to permissions (not yet implemented)', { roles })

  // Example mapping logic (commented out)
  // if (roles.includes('admin')) {
  //   permissions.push('order:read', 'order:write', 'ticket:read', 'ticket:write');
  // } else if (roles.includes('provider')) {
  //   permissions.push('order:read', 'ticket:read');
  // }

  return permissions
}

/**
 * Fastify plugin that resolves the authenticated user context and
 * stores it into the current AsyncLocalStorage context.
 */
export default async function userContextPlugin(fastify: FastifyInstance) {
  const prisma = new PrismaClient()

  fastify.decorate('prisma', prisma)

  fastify.addHook(
    'preHandler',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      let userContext: UserContext = { authenticatedUser: null }

      const token = request.headers.authorization

      if (token) {
        try {
          const jwtVerifier = await getJwtVerifier()

          if (!jwtVerifier) {
            throw new ApplicationError(
              'JWT verifier not available or misconfigured',
              {
                code: 'JWT_VERIFIER_NOT_AVAILABLE',
                httpStatus: 500,
                source: 'auth_middleware',
                severity: ErrorSeverity.ERROR,
              },
            )
          }

          const payload = await jwtVerifier.verify(token.replace('Bearer ', ''))
          const user = await getLocalUserProfileByIdentity(
            prisma,
            payload.sub,
            'cognito',
          )

          if (user) {
            const permissions = mapRolesToPermissions(
              user.roles?.split(',') ?? [],
            )

            const authenticatedUser: AuthenticatedUser = {
              id: user.id, // Use our database ID, not the Cognito ID
              email: user.email ?? null,
              fullName: `${user.firstName} ${user.lastName}`.trim() || null,
              permissions: [...permissions, 'order:read', 'ticket:read'],
              roles: user.roles?.split(',') ?? [],
              type: user.role ?? null,
            }

            userContext = { authenticatedUser }

            // Update the last login time
            if (user) {
              await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
              })
            }
          } else {
            logger.warn(`User not found for identity ${payload.sub}`)
            // We might want to auto-provision a user here in some cases
          }
        } catch (error) {
          logger.error('Authentication error:', error)
          throw new NotAuthenticatedError(
            'Invalid or expired authentication token',
            {
              source: 'auth_middleware',
              metadata: {
                error: error instanceof Error ? error.message : String(error),
              },
            },
          )
        }
      }

      // Handle x-pika-user-permissions override for internal services
      const permsHeader = request.headers['x-pika-user-permissions']

      if (!userContext.authenticatedUser && permsHeader) {
        userContext = {
          authenticatedUser: {
            id: null,
            email: null,
            fullName: null,
            permissions: String(permsHeader).split(','),
            roles: [],
            type: null,
          },
        }
      }

      // Patch current AsyncLocalStorage with the enriched user context
      const existingCtx = RequestContextStore.get()
      const enrichedCtx = {
        ...existingCtx,
        userContext,
      }

      RequestContextStore.run(enrichedCtx, () => {})
    },
  )

  // Cleanup hook
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
}
