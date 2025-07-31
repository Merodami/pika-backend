import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'

import { useApiError } from './useApiError'

interface ApiMutationOptions<TData, TError, TVariables, TContext>
  extends Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn'
  > {
  mutationFn: (variables: TVariables) => Promise<TData>
  successMessage?: string | ((data: TData) => string)
  errorMessage?: string
  invalidateQueries?: Array<ReadonlyArray<unknown>>
  showProgress?: boolean
}

/**
 * Base hook for API mutations with built-in error handling and cache invalidation
 */
export function useApiMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(options: ApiMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient()
  const handleError = useApiError()

  return useMutation({
    ...options,
    onMutate: async (variables) => {
      if (options.showProgress) {
        toast.loading('Processing...')
      }

      return options.onMutate?.(variables)
    },

    onSuccess: (data, variables, context) => {
      // Dismiss loading toast
      if (options.showProgress) {
        toast.dismiss()
      }

      // Show success message
      if (options.successMessage) {
        const msg =
          typeof options.successMessage === 'function'
            ? options.successMessage(data)
            : options.successMessage

        toast.success(msg)
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
      // Dismiss loading toast
      if (options.showProgress) {
        toast.dismiss()
      }

      if (options.errorMessage) {
        toast.error(options.errorMessage)
      } else {
        handleError(error)
      }

      options.onError?.(error, variables, context)
    },

    onSettled: (data, error, variables, context) => {
      // Ensure loading toast is dismissed
      if (options.showProgress) {
        toast.dismiss()
      }

      options.onSettled?.(data, error, variables, context)
    },
  })
}
