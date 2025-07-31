// Icons are imported in the client component
import { getTranslations } from 'next-intl/server'

import type { User } from '@/app/_services/authService'
import type { Locale } from '@/i18n/config'

import { AdminSidebarClient } from './adminSidebarClient'

interface AdminSidebarProps {
  user: User
  locale: Locale
}

export async function AdminSidebar({ locale }: AdminSidebarProps) {
  const t = await getTranslations({ locale, namespace: 'navigation' })

  // Prepare translated nav items
  const navItems = [
    {
      label: t('dashboard'),
      href: `/${locale}/admin`,
      icon: 'LayoutDashboard',
    },
    {
      label: t('users'),
      href: `/${locale}/admin/users`,
      icon: 'Users',
    },
    {
      label: t('businesses'),
      href: `/${locale}/admin/businesses`,
      icon: 'Building2',
    },
    {
      label: t('vouchers'),
      href: `/${locale}/admin/vouchers`,
      icon: 'Ticket',
    },
    {
      label: t('voucherBooks'),
      href: `/${locale}/admin/voucher-books`,
      icon: 'BookOpen',
    },
    {
      label: t('analytics'),
      href: `/${locale}/admin/analytics`,
      icon: 'BarChart3',
    },
    {
      label: t('payments'),
      href: `/${locale}/admin/payments`,
      icon: 'CreditCard',
    },
    {
      label: t('support'),
      href: `/${locale}/admin/support`,
      icon: 'MessageSquare',
    },
    {
      label: t('reports'),
      href: `/${locale}/admin/reports`,
      icon: 'FileText',
    },
    {
      label: t('settings'),
      href: `/${locale}/admin/settings`,
      icon: 'Settings',
    },
  ]

  return <AdminSidebarClient navItems={navItems} />
}
