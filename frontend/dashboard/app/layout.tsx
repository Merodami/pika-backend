import '@ant-design/v5-patch-for-react-19'
import './globals.css'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

import { ApiErrorBoundary } from '@/components/providers/ApiErrorBoundary'

import { QueryProvider } from './providers/QueryProvider'

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
    <html suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
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
      </body>
    </html>
  )
}
