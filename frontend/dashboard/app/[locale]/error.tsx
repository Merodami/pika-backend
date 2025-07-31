'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations('error')

  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Error digest:', error.digest)
  }, [error])

  // Check if this is a Next.js redirect error
  if (
    error.message === 'NEXT_REDIRECT' ||
    error.message?.includes('NEXT_REDIRECT')
  ) {
    console.log(
      'NEXT_REDIRECT error detected, this should be handled by Next.js internally'
    )
    // Don't render error UI for redirect errors
    return null
  }

  // Check for NEXT_NOT_FOUND errors
  if (
    error.message === 'NEXT_NOT_FOUND' ||
    error.message?.includes('NEXT_NOT_FOUND')
  ) {
    console.log('NEXT_NOT_FOUND error detected')
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          {t('title')}
        </h2>
        <p className="text-gray-600 mb-8">{t('message')}</p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {t('tryAgain')}
          </button>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {t('goHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
