'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App, ConfigProvider, Layout } from 'antd'
import { useEffect } from 'react'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Header } from '@/components/layouts/header'
import { Sidebar } from '@/components/layouts/sidebar'
import { NotificationBusiness } from '@/components/businesses/notification-business'
import { useFirebaseNotifications } from '@/hooks/firebase/use-firebase-notifications'
import { useOnline } from '@/hooks/use-online'
import { useSessionTimeout } from '@/hooks/use-session-timeout'
import { useAuthStore } from '@/store/auth.store'

const { Content } = Layout

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Ant Design theme configuration
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 8,
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#e6f7ff',
      itemSelectedColor: '#1890ff',
    },
  },
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  // Session timeout management
  useSessionTimeout({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000, // 5 minute warning
  })

  // Online/offline detection
  const isOnline = useOnline()

  // Firebase real-time notifications
  useFirebaseNotifications()

  return (
    <>
      <Layout className="min-h-screen">
        <Sidebar />
        <Layout>
          <Header />
          <Content className="bg-gray-50">
            {!isOnline && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-center text-sm text-yellow-800">
                You are currently offline. Some features may be limited.
              </div>
            )}
            <div className="p-6">{children}</div>
          </Content>
        </Layout>
      </Layout>

      <NotificationBusiness />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'text-sm',
        }}
      />

      {/* {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )} */}
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <App>
          <ProtectedRoute allowedRoles={['BUSINESS', 'ADMIN']}>
            <DashboardContent>{children}</DashboardContent>
          </ProtectedRoute>
        </App>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
