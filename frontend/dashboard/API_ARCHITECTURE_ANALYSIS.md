# API Architecture Analysis & Recommendations

## SDK Analysis

### ✅ Good News: SDK Already Uses Axios!

The generated SDK (`lib/api/generated`) is already configured with:

- **Axios** for HTTP requests (not basic fetch)
- **CancelablePromise** for request cancellation
- **Proper error handling** with ApiError class
- **TypeScript types** for all requests/responses
- **Configurable base URL and headers** via OpenAPI object

```typescript
// The SDK uses axios internally:
// lib/api/generated/core/request.ts
export const request = <T>(
  config: OpenAPIConfig,
  options: ApiRequestOptions,
  axiosClient: AxiosInstance = axios
): CancelablePromise<T>
```

## Current Implementation Analysis

### ❌ Critical Issues

1. **API calls directly in components** - No abstraction layer
2. **Type mismatches everywhere** - SDK types don't match UI expectations
3. **No error handling strategy** - Generic messages, no retry logic
4. **No loading states management** - Basic isLoading without context
5. **No request deduplication** - Multiple components fetch same data
6. **No caching strategy** - Data refetched unnecessarily
7. **Auth state not integrated** - Manual token handling

### 🚨 Architecture Problems

```typescript
// CURRENT ANTI-PATTERN - DON'T DO THIS
const { data: vouchersData, isLoading } = useQuery({
  queryKey: [
    'vouchers',
    page,
    pageSize,
    searchTerm,
    statusFilter,
    categoryFilter,
  ],
  queryFn: async () => {
    const params: any = {
      // ❌ Using 'any' type
      page,
      limit: pageSize,
    }
    // ❌ Building params manually
    if (searchTerm) params.search = searchTerm
    if (statusFilter !== 'all') params.status = statusFilter

    const response = await businessAdapter.vouchers.list(params)
    return response.data // ❌ No error handling
  },
})
```

## Modern Architecture Implementation

### 1. Query Keys Factory Pattern

```typescript
// lib/api/queryKeys.ts
export const queryKeys = {
  all: ['api'] as const,

  vouchers: {
    all: () => [...queryKeys.all, 'vouchers'] as const,
    lists: () => [...queryKeys.vouchers.all(), 'list'] as const,
    list: (filters: VoucherFilters) =>
      [...queryKeys.vouchers.lists(), filters] as const,
    details: () => [...queryKeys.vouchers.all(), 'detail'] as const,
    detail: (id: string) => [...queryKeys.vouchers.details(), id] as const,
    analytics: (id: string) =>
      [...queryKeys.vouchers.all(), 'analytics', id] as const,
  },

  businesses: {
    all: () => [...queryKeys.all, 'businesses'] as const,
    lists: () => [...queryKeys.businesses.all(), 'list'] as const,
    list: (filters: BusinessFilters) =>
      [...queryKeys.businesses.lists(), filters] as const,
    detail: (id: string) =>
      [...queryKeys.businesses.all(), 'detail', id] as const,
    profile: () => [...queryKeys.businesses.all(), 'profile'] as const,
  },

  users: {
    all: () => [...queryKeys.all, 'users'] as const,
    me: () => [...queryKeys.users.all(), 'me'] as const,
    detail: (id: string) => [...queryKeys.users.all(), id] as const,
  },
} as const

export type QueryKeys = typeof queryKeys
```

### 2. API Client Configuration

```typescript
// lib/api/client.ts
import { OpenAPI } from './generated'
import { getAccessToken, refreshTokens } from '@/lib/auth/tokens'

// Configure OpenAPI client
OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api/v1'
OpenAPI.TOKEN = async () => {
  const token = getAccessToken()
  if (!token) return undefined

  // TODO: Check token expiry and refresh if needed
  return token
}

OpenAPI.HEADERS = async () => ({
  'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  'X-Request-ID': crypto.randomUUID(),
})

// Request interceptor
OpenAPI.interceptors.request.use(async (config) => {
  // Add correlation ID
  config.headers['X-Correlation-ID'] = crypto.randomUUID()
  return config
})

// Response interceptor for auth
OpenAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.status === 401) {
      // Try to refresh token
      const refreshed = await refreshTokens()
      if (refreshed) {
        // Retry original request
        return OpenAPI.request(error.config)
      }
    }
    throw error
  }
)
```

### 3. Custom Hooks Architecture

```typescript
// hooks/api/base/useApiQuery.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { useApiError } from './useApiError'

export function useApiQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError>
) {
  const handleError = useApiError()

  return useQuery({
    ...options,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) return false
      return failureCount < 3
    },
    onError: (error) => {
      handleError(error)
      options.onError?.(error)
    },
  })
}
```

### 4. Resource-Specific Hooks

```typescript
// hooks/api/vouchers/useVouchers.ts
import { useApiQuery } from '../base/useApiQuery'
import { useApiMutation } from '../base/useApiMutation'
import { queryKeys } from '@/lib/api/queryKeys'
import { businessAdapter } from '@/lib/api/businessAdapter'
import type { VoucherFilters, VoucherListResponse } from '@/lib/api/generated'

export function useVouchers(filters: VoucherFilters = {}) {
  return useApiQuery<VoucherListResponse>({
    queryKey: queryKeys.vouchers.list(filters),
    queryFn: () => businessAdapter.vouchers.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useVoucher(id: string, options?: { enabled?: boolean }) {
  return useApiQuery({
    queryKey: queryKeys.vouchers.detail(id),
    queryFn: () => businessAdapter.vouchers.get(id),
    enabled: options?.enabled ?? !!id,
  })
}

export function useCreateVoucher() {
  const queryClient = useQueryClient()

  return useApiMutation({
    mutationFn: businessAdapter.vouchers.create,
    onSuccess: (data) => {
      // Add to cache immediately
      queryClient.setQueryData(queryKeys.vouchers.detail(data.id), data)

      // Invalidate lists to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.vouchers.lists(),
      })
    },
  })
}

export function useUpdateVoucher() {
  const queryClient = useQueryClient()

  return useApiMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVoucherRequest }) =>
      businessAdapter.vouchers.update(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.vouchers.detail(id),
      })

      // Snapshot previous value
      const previousVoucher = queryClient.getQueryData(
        queryKeys.vouchers.detail(id)
      )

      // Optimistically update
      queryClient.setQueryData(queryKeys.vouchers.detail(id), (old: any) => ({
        ...old,
        ...data,
      }))

      return { previousVoucher }
    },

    // Rollback on error
    onError: (err, { id }, context) => {
      if (context?.previousVoucher) {
        queryClient.setQueryData(
          queryKeys.vouchers.detail(id),
          context.previousVoucher
        )
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.vouchers.detail(id),
      })
    },
  })
}

export function useDeleteVoucher() {
  const queryClient = useQueryClient()

  return useApiMutation({
    mutationFn: businessAdapter.vouchers.delete,

    onMutate: async (id: string) => {
      // Cancel queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.vouchers.lists(),
      })

      // Remove from all list caches
      queryClient.setQueriesData(
        { queryKey: queryKeys.vouchers.lists() },
        (old: any) => ({
          ...old,
          data: old?.data?.filter((v: any) => v.id !== id) || [],
          pagination: {
            ...old?.pagination,
            total: (old?.pagination?.total || 1) - 1,
          },
        })
      )
    },

    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.vouchers.detail(id),
      })

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.vouchers.lists(),
      })
    },
  })
}

// Prefetching hook
export function usePrefetchVoucher() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.vouchers.detail(id),
      queryFn: () => businessAdapter.vouchers.get(id),
      staleTime: 10 * 1000, // 10 seconds
    })
  }
}

// Infinite scroll hook
export function useInfiniteVouchers(filters: VoucherFilters = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.vouchers.list({ ...filters, infinite: true }),
    queryFn: ({ pageParam = 1 }) =>
      businessAdapter.vouchers.list({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
  })
}
```

### 5. Global Error Handling

```typescript
// hooks/api/base/useApiError.ts
import { message, notification } from 'antd'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'

interface ApiError {
  status?: number
  body?: {
    error?: {
      code?: string
      message?: string
      details?: Record<string, any>
    }
  }
}

export function useApiError() {
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)

  return (error: ApiError) => {
    const errorCode = error?.body?.error?.code
    const errorMessage = error?.body?.error?.message || 'An error occurred'
    const status = error?.status

    // Handle specific error codes
    switch (errorCode) {
      case 'UNAUTHORIZED':
      case 'TOKEN_EXPIRED':
        logout()
        router.push('/login')
        message.error('Session expired. Please login again.')
        break

      case 'FORBIDDEN':
        message.error('You do not have permission to perform this action.')
        break

      case 'VALIDATION_ERROR':
        const details = error?.body?.error?.details
        if (details && typeof details === 'object') {
          // Show field-specific errors
          Object.entries(details).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              errors.forEach((err) => {
                notification.error({
                  message: `Validation Error: ${field}`,
                  description: err,
                  placement: 'topRight',
                })
              })
            }
          })
        } else {
          message.error(errorMessage)
        }
        break

      case 'RATE_LIMIT_EXCEEDED':
        message.warning('Too many requests. Please try again later.')
        break

      case 'NOT_FOUND':
        message.error('The requested resource was not found.')
        break

      case 'CONFLICT':
        message.error(
          errorMessage || 'This action conflicts with existing data.'
        )
        break

      case 'INTERNAL_SERVER_ERROR':
        notification.error({
          message: 'Server Error',
          description:
            'Something went wrong on our end. Please try again later.',
          placement: 'topRight',
        })
        break

      default:
        // Handle by status code if no error code
        if (status === 404) {
          message.error('Resource not found.')
        } else if (status === 500) {
          message.error('Server error. Please try again later.')
        } else if (status === 503) {
          message.error('Service temporarily unavailable.')
        } else {
          message.error(errorMessage)
        }
    }
  }
}
```

### 6. Query Client Configuration

```typescript
// app/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.status >= 400 && error?.status < 500) return false
              // Retry up to 3 times for other errors
              return failureCount < 3
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            refetchOnReconnect: 'always',
          },
          mutations: {
            retry: false,
            onError: (error: any) => {
              console.error('Mutation error:', error)
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

### 7. Suspense & Error Boundaries

```typescript
// components/providers/ApiErrorBoundary.tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import { Button, Result } from 'antd'

export function ApiErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <Result
              status="error"
              title="Something went wrong"
              subTitle={error.message}
              extra={
                <Button type="primary" onClick={resetErrorBoundary}>
                  Try again
                </Button>
              }
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

// Usage with Suspense
export function VoucherDetailsPage({ id }: { id: string }) {
  return (
    <ApiErrorBoundary>
      <Suspense fallback={<VoucherDetailsSkeleton />}>
        <VoucherDetails id={id} />
      </Suspense>
    </ApiErrorBoundary>
  )
}

function VoucherDetails({ id }: { id: string }) {
  // This will suspend until data is loaded
  const { data } = useSuspenseQuery({
    queryKey: queryKeys.vouchers.detail(id),
    queryFn: () => businessAdapter.vouchers.get(id),
  })

  return <VoucherCard voucher={data} />
}
```

### 8. Advanced Patterns

```typescript
// hooks/api/base/useApiMutation.ts
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query'
import { useApiError } from './useApiError'
import { message } from 'antd'

interface ApiMutationOptions<TData, TError, TVariables, TContext>
  extends Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn'
  > {
  mutationFn: (variables: TVariables) => Promise<TData>
  successMessage?: string | ((data: TData) => string)
  errorMessage?: string
  invalidateQueries?: Array<unknown[]>
  showProgress?: boolean
}

export function useApiMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(options: ApiMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient()
  const handleError = useApiError()
  const [messageApi, contextHolder] = message.useMessage()

  return useMutation({
    ...options,
    onMutate: async (variables) => {
      if (options.showProgress) {
        messageApi.loading('Processing...')
      }
      return options.onMutate?.(variables)
    },

    onSuccess: (data, variables, context) => {
      if (options.successMessage) {
        const msg =
          typeof options.successMessage === 'function'
            ? options.successMessage(data)
            : options.successMessage
        messageApi.success(msg)
      }

      // Invalidate specified queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey })
        })
      }

      options.onSuccess?.(data, variables, context)
    },

    onError: (error, variables, context) => {
      messageApi.destroy()

      if (options.errorMessage) {
        messageApi.error(options.errorMessage)
      } else {
        handleError(error as any)
      }

      options.onError?.(error, variables, context)
    },
  })
}

// Polling hook
export function usePolling<TData>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: {
    interval?: number
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey,
    queryFn,
    refetchInterval: options?.interval ?? 5000,
    enabled: options?.enabled ?? true,
  })
}

// Background sync
export function useBackgroundSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const sync = () => {
      // Refetch all active queries
      queryClient.refetchQueries({
        type: 'active',
      })
    }

    // Sync on visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) sync()
    })

    // Sync on online
    window.addEventListener('online', sync)

    return () => {
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('online', sync)
    }
  }, [queryClient])
}
```

### 9. Refactored Component Example

```typescript
// app/(dashboard)/business/vouchers/page.tsx
'use client'

import { useState } from 'react'
import { useVouchers, useDeleteVoucher, usePrefetchVoucher } from '@/hooks/api/vouchers'
import { VoucherFilters } from '@/lib/api/generated'
import { VoucherTable } from './components/VoucherTable'

export default function VouchersPage() {
  const [filters, setFilters] = useState<VoucherFilters>({
    page: 1,
    limit: 10,
  })

  // API hooks
  const { data, isLoading, error } = useVouchers(filters)
  const deleteVoucher = useDeleteVoucher()
  const prefetchVoucher = usePrefetchVoucher()

  const handleDelete = (id: string) => {
    deleteVoucher.mutate(id, {
      successMessage: 'Voucher deleted successfully',
    })
  }

  const handleRowHover = (id: string) => {
    // Prefetch on hover for instant navigation
    prefetchVoucher(id)
  }

  const handlePageChange = (page: number, pageSize: number) => {
    setFilters((prev) => ({ ...prev, page, limit: pageSize }))
  }

  return (
    <VoucherTable
      data={data?.data}
      pagination={data?.pagination}
      loading={isLoading}
      onDelete={handleDelete}
      onRowHover={handleRowHover}
      onPageChange={handlePageChange}
      filters={filters}
      onFiltersChange={setFilters}
    />
  )
}
```

## Implementation Steps

1. **Create hooks directory structure**
2. **Implement base hooks (useApiQuery, useApiMutation, useApiError)**
3. **Create resource-specific hooks**
4. **Update components to use hooks**
5. **Add error boundaries and suspense**
6. **Implement prefetching and optimistic updates**
7. **Add background sync and polling where needed**

## Tech Stack Assessment

### ✅ What You're Using Right (Industry Standards)

1. **React 19.1.1** - Latest stable version ✅
2. **Next.js 15.4.4** - Latest App Router with RSC support ✅
3. **TypeScript 5.8.3** - Latest with strict mode ✅
4. **TanStack Query v5** - Industry standard for server state ✅
5. **Axios (in SDK)** - Already using axios, not fetch! ✅
6. **Zustand v5** - Modern, lightweight state management ✅
7. **Zod v4** - Type-safe schema validation ✅
8. **React Hook Form v7** - Best form library ✅
9. **Tailwind CSS v4** - Industry standard CSS framework ✅
10. **date-fns v4** - Modern date library (better than moment.js) ✅

### ❌ Missing Essential Libraries

```bash
# Essential utilities
yarn add lodash-es @types/lodash-es

# Error handling & monitoring
yarn add react-error-boundary @sentry/nextjs

# Dev tools
yarn add -D @tanstack/react-query-devtools @tanstack/eslint-plugin-query

# Performance & Analytics
yarn add web-vitals @vercel/analytics

# Advanced patterns
yarn add ts-pattern superjson decimal.js

# Testing
yarn add -D msw @faker-js/faker

# Caching & offline
yarn add lru-cache idb

# Retry & rate limiting
yarn add p-retry p-limit

# Security
yarn add dompurify @types/dompurify
```

## Enhanced API Configuration

### Configure SDK with Interceptors

```typescript
// lib/api/client.ts
import { OpenAPI } from './generated'
import { getAccessToken, refreshTokens } from '@/lib/auth/tokens'
import axios from 'axios'

// Configure the SDK's OpenAPI settings
OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api/v1'
OpenAPI.WITH_CREDENTIALS = true
OpenAPI.TOKEN = async () => {
  const token = await getAccessToken()
  return token || undefined
}

OpenAPI.HEADERS = async () => ({
  'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  'X-Request-ID': crypto.randomUUID(),
})

// Create custom axios instance with interceptors
export const apiClient = axios.create({
  baseURL: OpenAPI.BASE,
  timeout: 30000,
  withCredentials: true,
})

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await OpenAPI.TOKEN?.()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const customHeaders = await OpenAPI.HEADERS?.()
    Object.assign(config.headers, customHeaders)

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for auth refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response?.status === 401 &&
      error.config &&
      !error.config._retry
    ) {
      error.config._retry = true

      try {
        await refreshTokens()
        return apiClient(error.config)
      } catch (refreshError) {
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Override the SDK to use our configured axios instance
import {
  UserService,
  BusinessService,
  VoucherService,
} from './generated/services'

// Inject our axios instance into services
const injectAxios = (service: any) => {
  Object.keys(service).forEach((method) => {
    const originalMethod = service[method]
    service[method] = (...args: any[]) => {
      // The SDK accepts axios instance as last parameter
      return originalMethod(...args, apiClient)
    }
  })
}

// Apply to all services
;[UserService, BusinessService, VoucherService].forEach(injectAxios)
```

## Modern Hook Patterns with Lodash-es

```typescript
// hooks/api/vouchers/useVouchers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AdminVoucherListResponse,
  AdminVoucherDetailResponse,
  AdminVoucherQueryParams,
  CreateVoucherRequest,
  UpdateVoucherRequest,
} from '@/lib/api/generated'
import { businessAdapter } from '@/lib/api/businessAdapter'
import { queryKeys } from '@/lib/api/queryKeys'
import {
  debounce,
  omitBy,
  isNil,
  isEmpty,
  pick,
  throttle,
  memoize,
  cloneDeep,
} from 'lodash-es'

// Memoized filter cleaning
const cleanFilters = memoize((filters?: AdminVoucherQueryParams) =>
  omitBy(
    filters,
    (value) => isNil(value) || (typeof value === 'string' && isEmpty(value))
  )
)

// Vouchers list with proper typing
export function useVouchers(filters?: AdminVoucherQueryParams) {
  const cleaned = cleanFilters(filters)

  return useQuery<AdminVoucherListResponse, Error>({
    queryKey: queryKeys.vouchers.list(cleaned),
    queryFn: () => businessAdapter.vouchers.list(cleaned),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // Keep previous data while fetching
    placeholderData: (previousData) => previousData,
  })
}

// Optimistic update with lodash deep clone
export function useUpdateVoucher() {
  const queryClient = useQueryClient()

  return useMutation<
    AdminVoucherDetailResponse,
    Error,
    { id: string; data: UpdateVoucherRequest }
  >({
    mutationFn: ({ id, data }) => businessAdapter.vouchers.update(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.vouchers.detail(id),
      })

      const previous = queryClient.getQueryData<AdminVoucherDetailResponse>(
        queryKeys.vouchers.detail(id)
      )

      if (previous) {
        // Deep clone to avoid mutations
        const updated = cloneDeep(previous)
        Object.assign(updated, data)

        queryClient.setQueryData(queryKeys.vouchers.detail(id), updated)
      }

      return { previous }
    },

    onError: (err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.vouchers.detail(id),
          context.previous
        )
      }
    },

    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.vouchers.detail(id),
      })
    },
  })
}

// Debounced search hook
export function useVoucherSearch(delay = 300) {
  const queryClient = useQueryClient()

  const search = useMemo(
    () =>
      debounce((term: string, filters?: AdminVoucherQueryParams) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.vouchers.list({ ...filters, search: term }),
        })
      }, delay),
    [queryClient, delay]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      search.cancel()
    }
  }, [search])

  return search
}

// Infinite scroll with throttled loading
export function useInfiniteVouchers(filters?: AdminVoucherQueryParams) {
  const loadMore = useRef<(() => void) | null>(null)

  const query = useInfiniteQuery({
    queryKey: queryKeys.vouchers.list({ ...filters, infinite: true }),
    queryFn: ({ pageParam = 1 }) =>
      businessAdapter.vouchers.list({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination.hasPrev ? firstPage.pagination.page - 1 : undefined,
  })

  // Throttle the loadMore function
  loadMore.current = useMemo(
    () =>
      throttle(() => {
        if (query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage()
        }
      }, 1000),
    [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]
  )

  return {
    ...query,
    loadMore: loadMore.current,
  }
}
```

## Pattern Matching for Type Safety

```typescript
// lib/utils/apiPatterns.ts
import { match, P } from 'ts-pattern'
import { AxiosError } from 'axios'
import { ApiError } from '@/lib/api/generated'

export function handleApiError(error: unknown): string {
  return match(error)
    .with({ response: { status: 401 } }, () => 'Please log in to continue')
    .with(
      { response: { status: 403 } },
      () => "You don't have permission to do this"
    )
    .with({ response: { status: 404 } }, () => 'Resource not found')
    .with({ response: { status: 422, data: { errors: P.array() } } }, (err) =>
      err.response.data.errors.join(', ')
    )
    .with({ response: { status: 429 } }, (err) => {
      const retryAfter = err.response?.headers?.['retry-after']
      return `Too many requests. Try again in ${retryAfter || 60} seconds`
    })
    .with(
      { response: { status: P.number.between(500, 599) } },
      () => 'Server error. Please try again later'
    )
    .with(
      { code: 'ECONNABORTED' },
      () => 'Request timeout. Check your connection'
    )
    .with({ message: P.string }, (err) => err.message)
    .otherwise(() => 'An unexpected error occurred')
}

// Type-safe API response handling
export function processApiResponse<T>(response: unknown): T {
  return match(response)
    .with(
      { data: P.any, status: P.number.between(200, 299) },
      (res) => res.data as T
    )
    .otherwise(() => {
      throw new Error('Invalid API response')
    })
}
```

## Error Boundaries with Sentry

```typescript
// components/ErrorBoundary.tsx
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import * as Sentry from '@sentry/nextjs'
import { match } from 'ts-pattern'

function ErrorFallback({ error, resetErrorBoundary }: any) {
  const errorMessage = match(error)
    .with(
      { status: 404 },
      () => 'Page not found'
    )
    .with(
      { networkError: true },
      () => 'Network error. Check your connection'
    )
    .otherwise(() => 'Something went wrong')

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">{errorMessage}</h2>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Error boundary:', error, errorInfo)
        Sentry.captureException(error, {
          contexts: { react: { componentStack: errorInfo.componentStack } }
        })
      }}
      onReset={() => {
        // Clear any error state
        queryClient.clear()
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}
```

## Benefits

- ✅ **SDK Already Uses Axios**: No need to replace fetch!
- ✅ **Type Safety**: Full TypeScript support with generated types
- ✅ **Reusability**: Hooks can be used across components
- ✅ **Performance**: Optimistic updates, prefetching, caching
- ✅ **Error Handling**: Centralized with pattern matching
- ✅ **Developer Experience**: Clean API with lodash utilities
- ✅ **Maintainability**: Single source of truth for API logic
- ✅ **Testability**: Hooks can be tested in isolation
- ✅ **Modern Patterns**: Latest React patterns and best practices
