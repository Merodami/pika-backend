'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Custom hook for localized navigation
 * Automatically prepends the current locale to navigation paths
 */
export function useLocalizedRouter() {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale || 'es'

  const push = useCallback(
    (href: string) => {
      // If href already includes a locale, use it as-is
      if (href.match(/^\/[a-z]{2}(\/|$)/)) {
        router.push(href)
      } else {
        // Otherwise, prepend the current locale
        router.push(`/${locale}${href}`)
      }
    },
    [router, locale]
  )

  const replace = useCallback(
    (href: string) => {
      if (href.match(/^\/[a-z]{2}(\/|$)/)) {
        router.replace(href)
      } else {
        router.replace(`/${locale}${href}`)
      }
    },
    [router, locale]
  )

  const prefetch = useCallback(
    (href: string) => {
      if (href.match(/^\/[a-z]{2}(\/|$)/)) {
        router.prefetch(href)
      } else {
        router.prefetch(`/${locale}${href}`)
      }
    },
    [router, locale]
  )

  return {
    push,
    replace,
    prefetch,
    back: router.back,
    forward: router.forward,
    refresh: router.refresh,
    locale,
  }
}
