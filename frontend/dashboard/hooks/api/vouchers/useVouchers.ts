import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  cloneDeep,
  debounce,
  isEmpty,
  isNil,
  omitBy,
  throttle,
} from 'lodash-es'
import { useEffect, useMemo, useRef } from 'react'

import { businessAdapter } from '@/lib/api/businessAdapter'
import type {
  AdminVoucherDetailResponse,
  AdminVoucherListResponse,
  AdminVoucherQueryParams,
  BulkVoucherOperationResponse,
  BulkVoucherUpdateRequest,
  CreateVoucherRequest,
  UpdateVoucherRequest,
} from '@/lib/api/generated'
// Using SDK types directly - no adapters needed!
import { queryKeys } from '@/lib/api/queryKeys'

import { useApiMutation } from '../base/useApiMutation'
import { useApiQuery } from '../base/useApiQuery'

/**
 * Clean filters by removing null/undefined/empty values
 */
const cleanFilters = (filters?: AdminVoucherQueryParams) =>
  omitBy(
    filters,
    (value) => isNil(value) || (typeof value === 'string' && isEmpty(value))
  )

/**
 * Hook to fetch vouchers list with filters
 */
export function useVouchers(filters?: AdminVoucherQueryParams) {
  const cleaned = cleanFilters(filters)

  return useApiQuery<AdminVoucherListResponse>({
    queryKey: queryKeys.vouchers.list(cleaned),
    queryFn: () => businessAdapter.vouchers.list(cleaned || {}),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook to fetch a single voucher by ID
 */
export function useVoucher(id: string, options?: { enabled?: boolean }) {
  return useApiQuery<AdminVoucherDetailResponse>({
    queryKey: queryKeys.vouchers.detail(id),
    queryFn: () => businessAdapter.vouchers.get({ id }),
    enabled: options?.enabled ?? !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to create a new voucher
 */
export function useCreateVoucher() {
  const queryClient = useQueryClient()

  return useApiMutation<
    AdminVoucherDetailResponse,
    Error,
    CreateVoucherRequest
  >({
    mutationFn: (data) =>
      businessAdapter.vouchers.create({ requestBody: data }),
    successMessage: 'Voucher created successfully',
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

/**
 * Hook to update a voucher
 */
export function useUpdateVoucher() {
  const queryClient = useQueryClient()

  return useApiMutation<
    AdminVoucherDetailResponse,
    Error,
    { id: string; data: UpdateVoucherRequest },
    { previousVoucher?: AdminVoucherDetailResponse }
  >({
    mutationFn: ({ id, data }) =>
      businessAdapter.vouchers.update({
        id,
        requestBody: data,
      }),
    successMessage: 'Voucher updated successfully',

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.vouchers.detail(id),
      })

      // Snapshot previous value
      const previousVoucher =
        queryClient.getQueryData<AdminVoucherDetailResponse>(
          queryKeys.vouchers.detail(id)
        )

      // Optimistically update
      if (previousVoucher) {
        const updated = cloneDeep(previousVoucher)

        Object.assign(updated, data)
        queryClient.setQueryData(queryKeys.vouchers.detail(id), updated)
      }

      return { previousVoucher }
    },

    // Rollback on error
    onError: (_, { id }, context) => {
      if (context?.previousVoucher) {
        queryClient.setQueryData(
          queryKeys.vouchers.detail(id),
          context.previousVoucher
        )
      }
    },

    // Always refetch after error or success
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.vouchers.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.vouchers.lists(),
      })
    },
  })
}

/**
 * Hook to delete a voucher
 */
export function useDeleteVoucher() {
  const queryClient = useQueryClient()

  return useApiMutation<void, Error, string>({
    mutationFn: (id: string) => businessAdapter.vouchers.delete({ id }),
    successMessage: 'Voucher deleted successfully',

    onMutate: async (id: string) => {
      // Cancel queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.vouchers.lists(),
      })

      // Optimistically remove from lists
      queryClient.setQueriesData<AdminVoucherListResponse>(
        { queryKey: queryKeys.vouchers.lists() },
        (old) => {
          if (!old) return old

          return {
            ...old,
            data: old.data?.filter((v) => v.id !== id) || [],
            pagination: {
              ...old.pagination,
              total: Math.max(0, (old.pagination?.total || 1) - 1),
            },
          }
        }
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

/**
 * Hook for debounced voucher search
 */
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

/**
 * Hook to prefetch voucher details
 */
export function usePrefetchVoucher() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.vouchers.detail(id),
      queryFn: () => businessAdapter.vouchers.get({ id }),
      staleTime: 10 * 1000, // 10 seconds
    })
  }
}

/**
 * Hook for infinite scroll vouchers
 */
export function useInfiniteVouchers(filters?: AdminVoucherQueryParams) {
  const loadMoreRef = useRef<(() => void) | null>(null)

  const query = useInfiniteQuery({
    queryKey: queryKeys.vouchers.list({ ...filters, infinite: true }),
    queryFn: ({ pageParam = 1 }) =>
      businessAdapter.vouchers.list({ ...filters, page: pageParam as number }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasNext
        ? (lastPage.pagination.page || 0) + 1
        : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.pagination?.hasPrev
        ? (firstPage.pagination.page || 0) - 1
        : undefined,
    initialPageParam: 1,
  })

  // Throttle the loadMore function
  loadMoreRef.current = useMemo(
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
    loadMore: loadMoreRef.current,
  }
}

/**
 * Hook to bulk update vouchers (for state changes like publish/suspend)
 */
export function useBulkUpdateVouchers() {
  const queryClient = useQueryClient()

  return useApiMutation<
    BulkVoucherOperationResponse,
    Error,
    BulkVoucherUpdateRequest
  >({
    mutationFn: (data) =>
      businessAdapter.vouchers.bulkUpdate({ requestBody: data }),
    successMessage: (result) =>
      `Successfully updated ${result.successful} voucher${result.successful !== 1 ? 's' : ''}`,

    onSuccess: (_, variables) => {
      // Update individual voucher caches optimistically
      variables.voucherIds.forEach((id) => {
        const cachedVoucher =
          queryClient.getQueryData<AdminVoucherDetailResponse>(
            queryKeys.vouchers.detail(id)
          )

        if (cachedVoucher && variables.updates.state) {
          queryClient.setQueryData(queryKeys.vouchers.detail(id), {
            ...cachedVoucher,
            state: variables.updates.state,
          })
        }
      })

      // Invalidate all voucher lists to refetch with updated data
      queryClient.invalidateQueries({
        queryKey: queryKeys.vouchers.lists(),
      })
    },
  })
}
