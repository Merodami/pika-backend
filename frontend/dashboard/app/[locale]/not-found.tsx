import Link from 'next/link'
import { useTranslations } from 'next-intl'

// Server component for not-found page
export default function NotFoundPage() {
  const t = useTranslations('notFound')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          {t('title')}
        </h2>
        <p className="text-gray-600 mb-8">{t('message')}</p>
        <Link href="/">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            {t('backHome')}
          </button>
        </Link>
      </div>
    </div>
  )
}
