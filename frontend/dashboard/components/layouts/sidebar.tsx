'use client'

import {
  BarChartOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyOutlined,
  ScanOutlined,
  SettingOutlined,
  TagOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Layout, Menu, Typography } from 'antd'
import { usePathname, useRouter } from 'next/navigation'

import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'

const { Sider } = Layout
const { Title } = Typography

interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  children?: MenuItem[]
  roles?: string[]
}

const menuItems: MenuItem[] = [
  // Business Menu
  {
    key: '/business/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    roles: ['BUSINESS'],
  },
  {
    key: 'vouchers',
    icon: <TagOutlined />,
    label: 'Vouchers',
    roles: ['BUSINESS'],
    children: [
      {
        key: '/business/vouchers',
        icon: <TagOutlined />,
        label: 'View All',
      },
      {
        key: '/business/vouchers/create',
        icon: <TagOutlined />,
        label: 'Create New',
      },
    ],
  },
  {
    key: '/business/redemptions',
    icon: <ScanOutlined />,
    label: 'Redemptions',
    roles: ['BUSINESS'],
  },
  {
    key: '/business/analytics',
    icon: <BarChartOutlined />,
    label: 'Analytics',
    roles: ['BUSINESS'],
  },
  {
    key: '/business/customers',
    icon: <TeamOutlined />,
    label: 'Customers',
    roles: ['BUSINESS'],
  },
  {
    key: '/business/settings',
    icon: <SettingOutlined />,
    label: 'Settings',
    roles: ['BUSINESS'],
  },

  // Admin Menu
  {
    key: '/admin/overview',
    icon: <DashboardOutlined />,
    label: 'Overview',
    roles: ['ADMIN'],
  },
  {
    key: '/admin/users',
    icon: <UserOutlined />,
    label: 'User Management',
    roles: ['ADMIN'],
  },
  {
    key: '/admin/businesses',
    icon: <SafetyOutlined />,
    label: 'Business Management',
    roles: ['ADMIN'],
  },
  {
    key: '/admin/vouchers',
    icon: <TagOutlined />,
    label: 'All Vouchers',
    roles: ['ADMIN'],
  },
  {
    key: '/admin/analytics',
    icon: <BarChartOutlined />,
    label: 'Platform Analytics',
    roles: ['ADMIN'],
  },
  {
    key: '/admin/settings',
    icon: <SettingOutlined />,
    label: 'System Settings',
    roles: ['ADMIN'],
  },
]

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore()

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  )

  const handleMenuClick = (key: string) => {
    router.push(key)
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={sidebarCollapsed}
      className="bg-white shadow-md"
      width={250}
    >
      <div className="flex items-center justify-between p-4">
        {!sidebarCollapsed && (
          <Title level={4} className="m-0">
            Pika Dashboard
          </Title>
        )}
        <button
          onClick={toggleSidebarCollapse}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        items={filteredMenuItems}
        onClick={({ key }) => handleMenuClick(key)}
        className="border-r-0"
      />
    </Sider>
  )
}
