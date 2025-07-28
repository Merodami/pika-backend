import './globals.css'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import { Toaster } from 'sonner'
import { QueryProvider } from './providers/QueryProvider'
import { ApiErrorBoundary } from '@/components/providers/ApiErrorBoundary'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pika Dashboard',
  description: 'Business and Admin Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>
      <QueryProvider>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#1890ff',
                borderRadius: 6,
              },
            }}
          >
            <ApiErrorBoundary>{children}</ApiErrorBoundary>
            <Toaster position="top-right" richColors />
          </ConfigProvider>
        </AntdRegistry>
      </QueryProvider>
    </div>
  )
}
