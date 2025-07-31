import { useQueryClient } from '@tanstack/react-query'
import { isEmpty, isNil, omitBy } from 'lodash-es'

import { adminAdapter } from '@/lib/api/adminAdapter'
import { businessAdapter } from '@/lib/api/businessAdapter'
import type {
  AdminBusinessListResponse,
  AdminBusinessQueryParams,
  AdminBusinessResponse,
  CreateBusinessRequest,
  PatchBusinessVerificationRequest,
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
    queryFn: () => businessAdapter.admin.list(cleaned || {}),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch a single business by ID
 * Note: Currently uses list endpoint with filtering since single business endpoint doesn't exist
 */
export function useBusiness(id: string, options?: { enabled?: boolean }) {
  return useApiQuery<AdminBusinessResponse>({
    queryKey: queryKeys.businesses.detail(id),
    queryFn: () => adminAdapter.businesses.get({ id }),
    enabled: options?.enabled ?? !!id,
  })
}

/**
 * Hook to create a new business
 */
export function useCreateBusiness() {
  const queryClient = useQueryClient()

  return useApiMutation<AdminBusinessResponse, Error, CreateBusinessRequest>({
    mutationFn: (data) => businessAdapter.admin.create({ requestBody: data }),
    successMessage: 'Business created successfully',
    onSuccess: () => {
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
    mutationFn: ({ id, data }) =>
      businessAdapter.admin.update({ id, requestBody: data }),
    successMessage: 'Business updated successfully',
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.businesses.lists(),
      })
    },
  })
}

/**
 * Hook to verify a business
 */
export function useVerifyBusiness() {
  const queryClient = useQueryClient()

  return useApiMutation<
    void,
    Error,
    { id: string } & PatchBusinessVerificationRequest
  >({
    mutationFn: ({ id, verified }) =>
      businessAdapter.admin.verify({ id, requestBody: { verified } }),
    successMessage: 'Business verification status updated',
    onSuccess: () => {
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
        ? businessAdapter.admin.activate({ id })
        : businessAdapter.admin.deactivate({ id }),
    successMessage: 'Business status updated successfully',
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
    mutationFn: (id) => businessAdapter.admin.delete({ id }),
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
    queryFn: () => adminAdapter.businesses.get({ id }),
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
    mutationFn: (data: any) =>
      businessAdapter.admin.bulkUpdate({ requestBody: data }),
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
