'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { ComponentProps } from 'react'

type LocalizedLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string
}

export function LocalizedLink({ href, ...props }: LocalizedLinkProps) {
  const params = useParams()
  const locale = params?.locale || 'es'

  // If href already includes a locale, use it as-is
  if (href.match(/^\/[a-z]{2}(\/|$)/)) {
    return <Link href={href} {...props} />
  }

  // Otherwise, prepend the current locale
  const localizedHref = `/${locale}${href}`

  return <Link href={localizedHref} {...props} />
}
