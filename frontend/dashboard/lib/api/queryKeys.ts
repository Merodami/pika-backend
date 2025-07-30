// Query keys factory for React Query
// Provides type-safe, consistent query key generation

export const queryKeys = {
  all: ['api'] as const,

  // Voucher query keys
  vouchers: {
    all: () => [...queryKeys.all, 'vouchers'] as const,
    lists: () => [...queryKeys.vouchers.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.vouchers.lists(), filters] as const,
    details: () => [...queryKeys.vouchers.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.vouchers.details(), id] as const,
    // analytics: (id: string) => [...queryKeys.vouchers.all(), 'analytics', id] as const, // Unused: no references in hooks
    // codes: (id: string) => [...queryKeys.vouchers.all(), 'codes', id] as const, // Unused: no references in hooks
    // stats: (businessId: string) => [...queryKeys.vouchers.all(), 'stats', businessId] as const, // Unused: no references in hooks
  },

  // Business query keys
  businesses: {
    all: () => [...queryKeys.all, 'businesses'] as const,
    lists: () => [...queryKeys.businesses.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.businesses.lists(), filters] as const,
    detail: (id: string) =>
      [...queryKeys.businesses.all(), 'detail', id] as const,
    // profile: () => [...queryKeys.businesses.all(), 'profile'] as const, // Unused
    stats: (id: string) =>
      [...queryKeys.businesses.all(), 'stats', id] as const,
    // reviews: (id: string) => [...queryKeys.businesses.all(), 'reviews', id] as const, // Unused
  },

  // User query keys
  users: {
    all: () => [...queryKeys.all, 'users'] as const,
    lists: () => [...queryKeys.users.all(), 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), filters] as const,
    me: () => [...queryKeys.users.all(), 'me'] as const,
    detail: (id: string) => [...queryKeys.users.all(), id] as const,
    // stats: (ids: string[]) => [...queryKeys.users.all(), 'stats', ids] as const, // Unused
  },

  // UNUSED QUERY KEYS - Commented out during cleanup, can be restored if needed
  //
  // // Category query keys
  // categories: {
  //   all: () => [...queryKeys.all, 'categories'] as const,
  //   lists: () => [...queryKeys.categories.all(), 'list'] as const,
  //   list: (filters?: Record<string, any>) =>
  //     [...queryKeys.categories.lists(), filters] as const,
  //   detail: (id: string) => [...queryKeys.categories.all(), id] as const,
  // },

  // // Payment query keys
  // payments: {
  //   all: () => [...queryKeys.all, 'payments'] as const,
  //   lists: () => [...queryKeys.payments.all(), 'list'] as const,
  //   list: (filters?: Record<string, any>) =>
  //     [...queryKeys.payments.lists(), filters] as const,
  //   detail: (id: string) => [...queryKeys.payments.all(), id] as const,
  //   subscriptions: () =>
  //     [...queryKeys.payments.all(), 'subscriptions'] as const,
  //   subscription: (id: string) =>
  //     [...queryKeys.payments.all(), 'subscription', id] as const,
  // },

  // // Session query keys
  // sessions: {
  //   all: () => [...queryKeys.all, 'sessions'] as const,
  //   lists: () => [...queryKeys.sessions.all(), 'list'] as const,
  //   list: (filters?: Record<string, any>) =>
  //     [...queryKeys.sessions.lists(), filters] as const,
  //   detail: (id: string) => [...queryKeys.sessions.all(), id] as const,
  //   userStats: (userIds: string[]) =>
  //     [...queryKeys.sessions.all(), 'userStats', userIds] as const,
  //   gymStats: (gymId: string) =>
  //     [...queryKeys.sessions.all(), 'gymStats', gymId] as const,
  // },

  // // Communication query keys
  // communications: {
  //   all: () => [...queryKeys.all, 'communications'] as const,
  //   notifications: () =>
  //     [...queryKeys.communications.all(), 'notifications'] as const,
  //   emails: () => [...queryKeys.communications.all(), 'emails'] as const,
  //   sms: () => [...queryKeys.communications.all(), 'sms'] as const,
  // },

  // // Analytics query keys
  // analytics: {
  //   all: () => [...queryKeys.all, 'analytics'] as const,
  //   dashboard: () => [...queryKeys.analytics.all(), 'dashboard'] as const,
  //   overview: (period: string) =>
  //     [...queryKeys.analytics.all(), 'overview', period] as const,
  //   revenue: (period: string) =>
  //     [...queryKeys.analytics.all(), 'revenue', period] as const,
  //   users: (period: string) =>
  //     [...queryKeys.analytics.all(), 'users', period] as const,
  // },

  // // Auth query keys
  // auth: {
  //   all: () => [...queryKeys.all, 'auth'] as const,
  //   me: () => [...queryKeys.auth.all(), 'me'] as const,
  //   permissions: () => [...queryKeys.auth.all(), 'permissions'] as const,
  //   tokens: () => [...queryKeys.auth.all(), 'tokens'] as const,
  // },
} as const

export type QueryKeys = typeof queryKeys
