'use client'

import { Select } from 'antd'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTransition } from 'react'

import { locales, localeConfig, type Locale } from '@/i18n/config'
import { useAppStore } from '@/store/app.store'

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()
  const [isPending, startTransition] = useTransition()
  const { setLanguageSwitching, setLocale } = useAppStore()

  const handleLanguageChange = (newLocale: string) => {
    // Save any active form data before switching
    const activeForm = document.querySelector('form[data-form-id]')
    if (activeForm) {
      const formId = activeForm.getAttribute('data-form-id')
      const formData = new FormData(activeForm as HTMLFormElement)
      const data = Object.fromEntries(formData)

      // Save to Zustand store
      if (formId) {
        useAppStore.getState().saveFormDraft(formId, data)
      }
    }

    // Set switching state for loading UI
    setLanguageSwitching(true)

    // Perform soft navigation with Next.js transitions
    startTransition(() => {
      // Replace current locale in path with new locale
      const newPath = pathname.replace(/^\/[^/]+/, `/${newLocale}`)

      // Save locale preference to Zustand (persisted to localStorage)
      setLocale(newLocale as Locale)

      // Navigate to new locale path
      router.push(newPath)

      // Update user preference in backend (if logged in)
      // In modern architecture, we should use the auth store for token
      const token =
        sessionStorage.getItem('pika-access-token') ||
        localStorage.getItem('pika-access-token')

      if (token) {
        // Fire and forget - don't block navigation
        fetch('/api/user/language', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'x-user-language': newLocale,
          },
          body: JSON.stringify({ language: newLocale }),
        }).catch(console.error)
      }
    })
  }

  // Prepare options
  const options = locales.map((locale) => {
    const config = localeConfig[locale]
    return {
      value: locale,
      label: (
        <span className="flex items-center gap-2">
          <span className="text-lg">{config.flag}</span>
          <span>{config.name}</span>
        </span>
      ),
    }
  })

  return (
    <Select
      value={currentLocale}
      onChange={handleLanguageChange}
      loading={isPending}
      options={options}
      className="min-w-[150px]"
      disabled={isPending}
      suffixIcon={
        isPending ? <span className="animate-spin">⟳</span> : undefined
      }
    />
  )
}
