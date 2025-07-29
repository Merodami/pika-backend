import { getTranslations } from 'next-intl/server'

import type { User as UserType } from '@/app/_services/authService'
import { NotificationDropdown } from '@/components/features/notificationDropdown'
import { UserMenu } from '@/components/features/userMenu'
import { LanguageSwitcher } from '@/components/ui/languageSwitcher'
import { ThemeToggle } from '@/components/ui/themeToggle'
import type { Locale } from '@/i18n/config'

interface DashboardHeaderProps {
  user: UserType
  locale: Locale
}

export async function DashboardHeader({ user, locale }: DashboardHeaderProps) {
  const t = await getTranslations({ locale })

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left section - Logo/Brand */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {t('navigation.dashboard')}
          </h1>
        </div>

        {/* Right section - User controls */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
