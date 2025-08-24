/**
 * Cache key constants for auth service
 * Pattern: service:entity[-modifier]:identifier
 */
export const CACHE_KEYS = {
  USER_INFO: {
    BY_ID: 'service:user-info',
    BY_TOKEN: 'service:user-info:token',
  },
  TOKEN: {
    INTROSPECTION: 'service:token:introspect',
    BLACKLIST: 'service:token:blacklist',
  },
  VERIFICATION: {
    EMAIL_TOKEN: 'service:verification:email',
    PASSWORD_RESET: 'service:verification:password-reset',
  },
  SESSION: {
    BY_USER: 'service:session:user',
    BY_TOKEN: 'service:session:token',
  },
} as const

export const generateCacheKey = {
  userInfoById: (userId: string) => `${CACHE_KEYS.USER_INFO.BY_ID}:${userId}`,
  tokenIntrospection: (token: string) =>
    `${CACHE_KEYS.TOKEN.INTROSPECTION}:${token}`,
  userSession: (userId: string) => `${CACHE_KEYS.SESSION.BY_USER}:${userId}`,
}
