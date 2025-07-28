import { useQueryClient } from '@tanstack/react-query'
import { isEmpty, isNil, omitBy } from 'lodash-es'

import { adminAdapter } from '@/lib/api/adminAdapter'
import type {
  AdminBusinessListResponse,
  AdminBusinessQueryParams,
  AdminBusinessResponse,
  CreateBusinessRequest,
  UpdateBusinessRequest,
} from '@/lib/api/generated'
import { queryKeys } from '@/lib/api/queryKeys'

import { useApiMutation } from '../base/useApiMutation'
import { useApiQuery } from '../base/useApiQuery'

/**
 * Clean filters by removing null/undefined/empty values
 */
const cleanFilters = (filters?: AdminBusinessQueryParams) =>
  omitBy(
    filters,
    (value) => isNil(value) || (typeof value === 'string' && isEmpty(value))
  )

/**
 * Hook to fetch businesses list with filters
 */
export function useBusinesses(filters?: AdminBusinessQueryParams) {
  const cleaned = cleanFilters(filters)

  return useApiQuery<AdminBusinessListResponse>({
    queryKey: queryKeys.businesses.list(cleaned),
    queryFn: () => adminAdapter.businesses.list(cleaned),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch a single business by ID
 */
export function useBusiness(id: string, options?: { enabled?: boolean }) {
  return useApiQuery<AdminBusinessResponse>({
    queryKey: queryKeys.businesses.detail(id),
    queryFn: () => adminAdapter.businesses.get(id),
    enabled: options?.enabled ?? !!id,
  })
}

/**
 * Hook to create a new business
 */
export function useCreateBusiness() {
  const queryClient = useQueryClient()

  return useApiMutation<AdminBusinessResponse, Error, CreateBusinessRequest>({
    mutationFn: adminAdapter.businesses.create,
    successMessage: 'Business created successfully',
    onSuccess: (data) => {
      // Add to cache
      queryClient.setQueryData(queryKeys.businesses.detail(data.id), data)

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.businesses.lists(),
      })
    },
  })
}

/**
 * Hook to update a business
 */
export function useUpdateBusiness() {
  const queryClient = useQueryClient()

  return useApiMutation<
    AdminBusinessResponse,
    Error,
    { id: string; data: UpdateBusinessRequest }
  >({
    mutationFn: ({ id, data }) => adminAdapter.businesses.update(id, data),
    successMessage: 'Business updated successfully',
    invalidateQueries: [queryKeys.businesses.lists()],
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(queryKeys.businesses.detail(data.id), data)
    },
  })
}

/**
 * Hook to verify a business
 */
export function useVerifyBusiness() {
  const queryClient = useQueryClient()

  return useApiMutation<void, Error, { id: string; verified: boolean }>({
    mutationFn: ({ id, verified }) =>
      adminAdapter.businesses.verify(id, verified),
    successMessage: (_, variables) =>
      variables.verified
        ? 'Business verified successfully'
        : 'Business unverified',
    onSuccess: (_, { id }) => {
      // Invalidate the business detail to refetch with new status
      queryClient.invalidateQueries({
        queryKey: queryKeys.businesses.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.businesses.lists(),
      })
    },
  })
}

/**
 * Hook to activate/deactivate a business
 */
export function useToggleBusinessActive() {
  const queryClient = useQueryClient()

  return useApiMutation<void, Error, { id: string; active: boolean }>({
    mutationFn: ({ id, active }) =>
      active
        ? adminAdapter.businesses.activate(id)
        : adminAdapter.businesses.deactivate(id),
    successMessage: (_, variables) =>
      variables.active
        ? 'Business activated successfully'
        : 'Business deactivated',
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.businesses.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.businesses.lists(),
      })
    },
  })
}

/**
 * Hook to delete a business
 */
export function useDeleteBusiness() {
  const queryClient = useQueryClient()

  return useApiMutation<void, Error, string>({
    mutationFn: adminAdapter.businesses.delete,
    successMessage: 'Business deleted successfully',
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.businesses.detail(id),
      })

      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.businesses.lists(),
      })
    },
  })
}

/**
 * Hook to get business statistics
 */
export function useBusinessStats(id: string, options?: { enabled?: boolean }) {
  return useApiQuery({
    queryKey: queryKeys.businesses.stats(id),
    queryFn: () => adminAdapter.businesses.getStats(id),
    enabled: options?.enabled ?? !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Hook to bulk update businesses
 */
export function useBulkUpdateBusinesses() {
  const queryClient = useQueryClient()

  return useApiMutation({
    mutationFn: adminAdapter.businesses.bulkUpdate,
    successMessage: (data: any) =>
      `${data.updated || 0} businesses updated successfully`,
    onSuccess: () => {
      // Invalidate all business queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.businesses.all(),
      })
    },
  })
}
