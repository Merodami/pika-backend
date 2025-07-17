'use client'

import {
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Avatar, Badge, Button, Dropdown, Layout, Space } from 'antd'

import { useAuthStore } from '@/store/auth.store'
import { useNotificationStore } from '@/store/notifications.store'

const { Header: AntHeader } = Layout

export function Header() {
  const { user, logout } = useAuthStore()
  const { notifications } = useNotificationStore()

  const unreadCount = notifications.length

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => {
        // Navigate to profile
      },
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => {
        // Navigate to settings
      },
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ]

  return (
    <AntHeader className="bg-white px-6 shadow-sm flex items-center justify-between">
      <div className="flex items-center">
        <h2 className="text-lg font-medium text-gray-800">
          Welcome back, {user?.name || 'User'}
        </h2>
      </div>

      <Space size="large">
        <Badge count={unreadCount} offset={[-2, 2]}>
          <Button
            type="text"
            icon={<BellOutlined />}
            className="text-gray-600"
            size="large"
          />
        </Badge>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space className="cursor-pointer">
            <Avatar
              size="default"
              icon={<UserOutlined />}
              className="bg-primary"
            />
            <span className="text-gray-700">{user?.name}</span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}
