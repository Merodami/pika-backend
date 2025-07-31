'use client'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import { Toaster } from 'sonner'

import { ApiErrorBoundary } from '@/components/providers/ApiErrorBoundary'

import { QueryProvider } from './providers/QueryProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
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
  )
}
