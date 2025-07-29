import { useQueryClient } from '@tanstack/react-query'
import { isEmpty, isNil, omitBy } from 'lodash-es'

import { adminAdapter } from '@/lib/api/adminAdapter'
import type {
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AdminUserDetailResponse,
  AdminUserListResponse,
  AdminUserQueryParams,
} from '@/lib/api/generated'
import { queryKeys } from '@/lib/api/queryKeys'

import { useApiMutation } from '../base/useApiMutation'
import { useApiQuery } from '../base/useApiQuery'

/**
 * Clean filters by removing null/undefined/empty values
 */
const cleanFilters = (filters?: AdminUserQueryParams) =>
  omitBy(
    filters,
    (value) => isNil(value) || (typeof value === 'string' && isEmpty(value))
  )

/**
 * Hook to fetch users list with filters
 */
export function useUsers(filters?: AdminUserQueryParams) {
  const cleaned = cleanFilters(filters)

  return useApiQuery<AdminUserListResponse>({
    queryKey: queryKeys.users.list(cleaned),
    queryFn: () => adminAdapter.users.list(cleaned || {}),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(id: string, options?: { enabled?: boolean }) {
  return useApiQuery<AdminUserDetailResponse>({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => adminAdapter.users.get({ id }),
    enabled: options?.enabled ?? !!id,
  })
}

/**
 * Hook to get current user profile
 */
export function useCurrentUser() {
  return useApiQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => adminAdapter.users.getMe(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useApiMutation<AdminUserDetailResponse, Error, AdminCreateUserRequest>(
    {
      mutationFn: (data) => adminAdapter.users.create({ requestBody: data }),
      successMessage: 'User created successfully',
      onSuccess: (data) => {
        // Add to cache
        queryClient.setQueryData(queryKeys.users.detail(data.id), data)

        // Invalidate lists
        queryClient.invalidateQueries({
          queryKey: queryKeys.users.lists(),
        })
      },
    }
  )
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useApiMutation<
    AdminUserDetailResponse,
    Error,
    { id: string; data: AdminUpdateUserRequest }
  >({
    mutationFn: ({ id, data }) =>
      adminAdapter.users.update({ id, requestBody: data }),
    successMessage: 'User updated successfully',
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(queryKeys.users.detail(data.id), data)

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.lists(),
      })
    },
  })
}

/**
 * Hook to verify a user
 */
export function useVerifyUser() {
  const queryClient = useQueryClient()

  return useApiMutation<void, Error, { id: string; verified: boolean }>({
    mutationFn: ({ id }) =>
      adminAdapter.users.verify({
        requestBody: {
          type: 'ACCOUNT_CONFIRMATION',
          userId: id,
        },
      }),
    successMessage: 'User verification status updated',
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.lists(),
      })
    },
  })
}

/**
 * Hook to ban/unban a user
 */
export function useToggleUserBan() {
  const queryClient = useQueryClient()

  return useApiMutation<
    void,
    Error,
    { id: string; banned: boolean; reason?: string }
  >({
    mutationFn: ({ id, banned, reason }) =>
      banned
        ? adminAdapter.users.ban({
            id,
            requestBody: { reason: reason || 'Admin action' },
          })
        : adminAdapter.users.unban({ id }),
    successMessage: 'User ban status updated successfully',
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.lists(),
      })
    },
  })
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useApiMutation<void, Error, string>({
    mutationFn: (id) => adminAdapter.users.delete({ id }),
    successMessage: 'User deleted successfully',
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.users.detail(id),
      })

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.lists(),
      })
    },
  })
}

// Bulk update and stats functionality removed - not available in backend API

/**
 * Hook to resend verification email
 */
export function useResendVerification() {
  return useApiMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: (userId: string) =>
      adminAdapter.users.resendVerification({
        requestBody: {
          type: 'EMAIL',
          userId,
        },
      }),
    successMessage: 'Verification email sent successfully',
  })
}
