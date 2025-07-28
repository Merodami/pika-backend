import { getTranslations } from 'next-intl/server'
import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Settings,
  Store,
  Users,
  Calendar,
  MessageSquare,
} from 'lucide-react'

import { BusinessSidebarClient } from './businessSidebarClient'
import type { User } from '@/app/_services/auth.service'
import type { Locale } from '@/i18n/config'

interface BusinessSidebarProps {
  user: User
  locale: Locale
}

export async function BusinessSidebar({ user, locale }: BusinessSidebarProps) {
  const t = await getTranslations({ locale, namespace: 'navigation' })

  const navItems = [
    {
      label: t('dashboard'),
      href: `/${locale}/business`,
      icon: LayoutDashboard,
    },
    {
      label: t('myBusiness'),
      href: `/${locale}/business/profile`,
      icon: Store,
    },
    {
      label: t('vouchers'),
      href: `/${locale}/business/vouchers`,
      icon: Ticket,
    },
    {
      label: t('customers'),
      href: `/${locale}/business/customers`,
      icon: Users,
    },
    {
      label: t('bookings'),
      href: `/${locale}/business/bookings`,
      icon: Calendar,
    },
    {
      label: t('analytics'),
      href: `/${locale}/business/analytics`,
      icon: BarChart3,
    },
    {
      label: t('messages'),
      href: `/${locale}/business/messages`,
      icon: MessageSquare,
    },
    {
      label: t('settings'),
      href: `/${locale}/business/settings`,
      icon: Settings,
    },
  ]

  return <BusinessSidebarClient navItems={navItems} />
}