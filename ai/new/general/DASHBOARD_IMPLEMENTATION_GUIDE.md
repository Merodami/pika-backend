# Pika Dashboard Implementation Guide

A comprehensive guide for building a modern, performant dashboard for service providers and administrators using Next.js 15, React 19, and TypeScript.

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Implementation Plan](#implementation-plan)
5. [Core Features](#core-features)
6. [Development Workflow](#development-workflow)
7. [Testing Strategy](#testing-strategy)
8. [Deployment](#deployment)

## Overview

The Pika Dashboard is a unified web application serving both service providers (retailers) and platform administrators. It features:

- Role-based access control with shared components (70-80% code reuse)
- Offline-first architecture for unreliable connectivity
- Real-time updates for redemptions and notifications
- Responsive design optimized for desktop with mobile support
- Enterprise-grade security and performance

## Technology Stack

### Core Dependencies

```json
{
  "next": "15.3.3",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "typescript": "5.8.3",
  "zustand": "5.0.5",
  "@tanstack/react-query": "5.3.3",
  "react-hook-form": "7.55.1",
  "antd": "5.23.3",
  "tailwindcss": "3.5.1",
  "@tremor/react": "3.18.5",
  "recharts": "2.15.0",
  "axios": "1.7.9",
  "socket.io-client": "4.8.1",
  "zod": "3.24.1",
  "date-fns": "4.2.0"
}
```

### Development Dependencies

```json
{
  "vitest": "3.2.2",
  "@testing-library/react": "16.1.0",
  "msw": "2.7.0",
  "@playwright/test": "1.49.1",
  "prettier": "3.5.3",
  "eslint": "9.28.0",
  "husky": "9.1.7"
}
```

## Project Structure

```
packages/frontend/dashboard/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Public routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/             # Protected routes
│   │   ├── layout.tsx           # Shared dashboard layout
│   │   ├── provider/            # Service provider views
│   │   │   ├── dashboard/       # Overview page
│   │   │   ├── vouchers/        # Voucher management
│   │   │   ├── redemptions/     # Redemption tracking
│   │   │   ├── analytics/       # Business insights
│   │   │   └── settings/        # Provider settings
│   │   └── admin/               # Admin-only views
│   │       ├── overview/        # Platform metrics
│   │       ├── users/           # User management
│   │       └── providers/       # Provider management
│   └── api/                     # API routes if needed
├── components/                   # Reusable components
│   ├── ui/                      # Base UI components
│   ├── forms/                   # Form components
│   ├── charts/                  # Data visualizations
│   └── features/                # Feature-specific
├── hooks/                       # Custom React hooks
├── lib/                         # Core utilities
│   ├── api/                     # API client setup
│   ├── auth/                    # Auth utilities
│   └── utils/                   # Helper functions
├── services/                    # Service layer
│   ├── api/                     # @pika/sdk wrapper
│   └── websocket/               # Real-time connection
├── store/                       # Zustand stores
│   ├── auth.store.ts
│   ├── ui.store.ts
│   └── notifications.store.ts
├── styles/                      # Global styles
├── types/                       # TypeScript types
└── tests/                       # Test files
```

## Implementation Plan

### Phase 1: Foundation (Week 1) ✅ COMPLETED

#### 1.1 Project Setup ✅

```bash
# Create Next.js project with all flags
cd packages/frontend
npx create-next-app@latest dashboard --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-git --use-yarn --eslint --turbopack

# Install core dependencies (with Firebase instead of Socket.io)
yarn add zustand @tanstack/react-query react-hook-form antd @tremor/react
yarn add axios firebase zod date-fns lodash-es clsx tailwind-merge @hookform/resolvers
yarn add framer-motion lucide-react recharts @radix-ui/react-dialog @radix-ui/react-dropdown-menu
yarn add react-hot-toast js-cookie nanoid

# Install dev dependencies
yarn add -D vitest @testing-library/react @testing-library/user-event happy-dom
yarn add -D @vitejs/plugin-react msw @vitest/coverage-v8 @types/lodash-es
```

#### 1.2 Enhanced TypeScript Configuration ✅

```typescript
// tsconfig.json - Updated with strict rules
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    // ... other configs
  }
}
```

#### 1.3 Project Structure Created ✅

```
packages/frontend/dashboard/
├── lib/
│   ├── api/           # ✅ API client and SDK wrapper
│   ├── auth/          # ✅ Token management and utilities
│   ├── utils/
│   ├── constants/
│   ├── errors/
│   └── validations/
├── components/
│   ├── ui/
│   ├── forms/
│   ├── charts/
│   ├── features/
│   ├── layouts/       # ✅ Sidebar and Header components
│   └── auth/          # ✅ ProtectedRoute component
├── hooks/
│   ├── auth/
│   ├── data/
│   ├── ui/
│   └── utils/
├── services/
│   ├── api/
│   ├── firebase/
│   └── storage/
├── store/             # ✅ Zustand stores implemented
│   ├── auth.store.ts      # ✅ Authentication with persistence
│   ├── ui.store.ts        # ✅ UI state management
│   └── notifications.store.ts  # ✅ Notification system
├── types/
└── tests/
```

#### 1.4 API Client Implementation ✅

**Location**: `lib/api/client.ts`

- ✅ Axios instance with automatic token refresh
- ✅ Request/response interceptors for authentication
- ✅ API wrapper class with organized endpoints:
  - Auth (login, register, refresh, logout)
  - Voucher CRUD operations
  - Provider profile and analytics
  - Admin user and provider management
  - Category and redemption endpoints

#### 1.5 Authentication System ✅

**Location**: `lib/auth/tokens.ts` + `store/auth.store.ts`

- ✅ Secure token management with HTTP-only cookies
- ✅ JWT decode and expiration checking
- ✅ Automatic token refresh logic
- ✅ Zustand auth store with persistence
- ✅ Role-based authentication (SERVICE_PROVIDER, ADMIN, CUSTOMER)

#### 1.6 UI State Management ✅

**Stores Implemented**:

- ✅ `store/ui.store.ts` - Sidebar, modals, theme, loading states
- ✅ `store/notifications.store.ts` - Toast notifications with auto-dismiss
- ✅ Theme management (light/dark/auto) with system preference detection

#### 1.7 Layout Components ✅

**Components Created**:

- ✅ `components/auth/protected-route.tsx` - Role-based access control
- ✅ `components/layouts/sidebar.tsx` - Dynamic menu based on user role
- ✅ `components/layouts/header.tsx` - User profile, notifications, logout

#### 1.8 Environment Configuration ✅

**Location**: `.env.local`

- ✅ API URLs configuration
- ✅ Firebase configuration placeholders
- ✅ Feature flags (offline, PWA)

### Phase 2: Core Features (Week 2-3) 🚧 NEXT STEPS

#### 2.1 Testing Configuration 📋 TODO

**Priority**: Medium

- [ ] Setup Vitest configuration (`vitest.config.ts`)
- [ ] Create test setup file with React Testing Library
- [ ] Configure MSW for API mocking
- [ ] Add coverage reporting
- [ ] Create first test examples

#### 2.2 Authentication Pages 📋 TODO

**Priority**: High

- [ ] Login page with form validation
- [ ] Registration page for service providers
- [ ] Password reset functionality
- [ ] Email verification flow
- [ ] Unauthorized access page

#### 2.3 Firebase Real-time Setup 📋 TODO

**Priority**: High

- [ ] Firebase configuration (`services/firebase/config.ts`)
- [ ] Real-time listeners for voucher updates
- [ ] Notification system integration
- [ ] Offline data synchronization
- [ ] Firebase Auth integration (optional)

#### 2.4 Dashboard Route Structure 📋 TODO

**Priority**: High

- [ ] App router layout (`app/(dashboard)/layout.tsx`)
- [ ] Provider dashboard routes (`app/(dashboard)/provider/`)
- [ ] Admin dashboard routes (`app/(dashboard)/admin/`)
- [ ] Error boundaries and loading states
- [ ] Breadcrumb navigation

#### 2.5 Core UI Components 📋 TODO

**Priority**: Medium

- [ ] Data tables with sorting/filtering
- [ ] Form components with validation
- [ ] Chart components for analytics
- [ ] Modal components
- [ ] Loading skeletons

### Phase 3: Service Provider Features (Week 3-4) 📋 PLANNED

#### 3.1 Voucher Management

- [ ] Voucher list with filters and search
- [ ] Create/edit voucher forms
- [ ] QR code generation and display
- [ ] Bulk operations (activate/deactivate)
- [ ] Voucher analytics and performance

#### 3.2 Redemption Tracking

- [ ] Real-time redemption dashboard
- [ ] QR code scanner integration
- [ ] Redemption history and details
- [ ] Export functionality
- [ ] Offline redemption support

#### 3.3 Analytics Dashboard

- [ ] KPI cards (redemptions, revenue, conversion)
- [ ] Interactive charts with date ranges
- [ ] Customer behavior insights
- [ ] Performance comparisons
- [ ] Data export capabilities

### Phase 4: Admin Features (Week 4) 📋 PLANNED

#### 4.1 User Management

- [ ] User list with role filtering
- [ ] User profile management
- [ ] Role assignment and permissions
- [ ] Account suspension/activation
- [ ] Bulk user operations

#### 4.2 Provider Management

- [ ] Provider verification workflow
- [ ] Provider analytics and metrics
- [ ] Subscription management
- [ ] Support ticket system
- [ ] Provider onboarding flow

## What We've Built So Far ✅

### Core Infrastructure

1. **Next.js 15 Project** with TypeScript, Tailwind CSS, and modern tooling
2. **API Client** with automatic token refresh and organized endpoints
3. **Authentication System** with secure token management and role-based access
4. **State Management** using Zustand for UI, auth, and notifications
5. **Layout Components** with responsive sidebar and header
6. **Project Structure** following clean architecture principles

### Key Features Implemented

- **Role-based Navigation**: Dynamic sidebar menu based on user role
- **Protected Routes**: Automatic redirection for unauthorized access
- **Token Management**: Secure cookie-based storage with refresh logic
- **Notification System**: Toast notifications with auto-dismiss
- **Theme Support**: Light/dark mode with system preference detection
- **Responsive Design**: Mobile-friendly layout components

### Development Setup

- **Environment Configuration**: API URLs and feature flags
- **TypeScript**: Strict configuration with enhanced error checking
- **Dependencies**: Latest stable versions of all packages
- **Firebase Integration**: Prepared for real-time updates instead of Socket.io

## Next Priority Actions 🎯

1. **Setup Testing** - Vitest configuration and first tests
2. **Create Auth Pages** - Login/register with form validation
3. **Setup Firebase** - Real-time listeners and offline sync
4. **Build Route Structure** - Dashboard layouts and navigation
5. **Create Voucher Management** - CRUD operations and forms

The foundation is solid and ready for rapid feature development! 🚀

```typescript
// lib/api/client.ts
import { PikaSDK } from '@pika/sdk'
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api/v1',
  timeout: 30000,
})

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pika_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await refreshToken()
      return apiClient(error.config)
    }
    return Promise.reject(error)
  },
)

export const api = new PikaSDK(apiClient)
```

#### 1.4 Authentication Setup

```typescript
// store/auth.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials) => {
        const response = await api.auth.login(credentials)
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        router.push('/login')
      },

      refresh: async () => {
        const refreshToken = get().refreshToken
        if (!refreshToken) throw new Error('No refresh token')

        const response = await api.auth.refresh({ refreshToken })
        set({ token: response.token })
      },
    }),
    {
      name: 'pika-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)
```

#### 1.5 Layout Components

```tsx
// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layouts/sidebar'
import { Header } from '@/components/layouts/header'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
            <div className="container mx-auto px-6 py-8">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
```

### Phase 2: Core Features (Week 2-3)

#### 2.1 Voucher Management

```tsx
// app/(dashboard)/provider/vouchers/page.tsx
export default function VouchersPage() {
  const { data: vouchers, isLoading } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => api.voucher.getVouchers(),
  })

  return (
    <div>
      <PageHeader
        title="Vouchers"
        actions={
          <Button type="primary" icon={<PlusOutlined />} href="/provider/vouchers/new">
            Create Voucher
          </Button>
        }
      />

      <VoucherTable vouchers={vouchers} loading={isLoading} onEdit={(voucher) => router.push(`/provider/vouchers/${voucher.id}/edit`)} onDelete={(voucher) => deleteVoucher.mutate(voucher.id)} />
    </div>
  )
}

// components/features/voucher-form.tsx
export function VoucherForm({ voucher, onSubmit }: VoucherFormProps) {
  const form = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: voucher || {
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      expiresAt: null,
    },
  })

  return (
    <Form form={form} onFinish={onSubmit}>
      <Form.Item name="title" label="Title" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item name="description" label="Description">
        <TextArea rows={4} />
      </Form.Item>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="discountType" label="Discount Type">
            <Select>
              <Select.Option value="percentage">Percentage</Select.Option>
              <Select.Option value="fixed">Fixed Amount</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="discountValue" label="Discount Value">
            <InputNumber min={0} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="expiresAt" label="Expiration Date">
        <DatePicker showTime />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Save Voucher
        </Button>
      </Form.Item>
    </Form>
  )
}
```

#### 2.2 Real-time Updates

```typescript
// services/websocket/websocket.service.ts
export class WebSocketService {
  private socket: Socket
  private reconnectAttempts = 0

  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    })

    this.socket.on('redemption:new', (data) => {
      queryClient.invalidateQueries({ queryKey: ['redemptions'] })
      showNotification({
        type: 'success',
        message: `New redemption: ${data.voucherTitle}`,
      })
    })

    this.socket.on('voucher:updated', (data) => {
      queryClient.setQueryData(['vouchers', data.id], data)
    })
  }

  disconnect() {
    this.socket?.disconnect()
  }
}

// hooks/use-websocket.ts
export function useWebSocket() {
  const { token } = useAuthStore()
  const wsRef = useRef<WebSocketService>()

  useEffect(() => {
    if (token) {
      wsRef.current = new WebSocketService()
      wsRef.current.connect(token)

      return () => wsRef.current?.disconnect()
    }
  }, [token])

  return wsRef.current
}
```

#### 2.3 Analytics Dashboard

```tsx
// app/(dashboard)/provider/analytics/page.tsx
export default function AnalyticsPage() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.analytics.getOverview(),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" />

      {/* KPI Cards */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6">
        <Card>
          <Text>Total Redemptions</Text>
          <Metric>{metrics?.totalRedemptions || 0}</Metric>
          <Flex className="mt-4">
            <Text>vs last month</Text>
            <BadgeDelta deltaType="increase">{metrics?.redemptionGrowth || 0}%</BadgeDelta>
          </Flex>
        </Card>

        <Card>
          <Text>Active Vouchers</Text>
          <Metric>{metrics?.activeVouchers || 0}</Metric>
        </Card>

        <Card>
          <Text>Revenue Generated</Text>
          <Metric>${metrics?.revenue || 0}</Metric>
        </Card>

        <Card>
          <Text>Conversion Rate</Text>
          <Metric>{metrics?.conversionRate || 0}%</Metric>
        </Card>
      </Grid>

      {/* Charts */}
      <Card>
        <Title>Redemptions Over Time</Title>
        <AreaChart className="h-72 mt-4" data={metrics?.redemptionHistory || []} index="date" categories={['redemptions']} colors={['indigo']} />
      </Card>
    </div>
  )
}
```

#### 2.4 Offline Support

```typescript
// lib/offline/offline-queue.ts
export class OfflineQueue {
  private queue = new Map<string, QueuedRequest>()
  private db: IDBDatabase

  async init() {
    this.db = await openDB('pika-offline', 1, {
      upgrade(db) {
        db.createObjectStore('queue', { keyPath: 'id' })
      },
    })

    // Load persisted queue
    const tx = this.db.transaction('queue', 'readonly')
    const items = await tx.store.getAll()
    items.forEach((item) => this.queue.set(item.id, item))
  }

  async enqueue(request: QueuedRequest) {
    this.queue.set(request.id, request)

    // Persist to IndexedDB
    const tx = this.db.transaction('queue', 'readwrite')
    await tx.store.put(request)

    if (navigator.onLine) {
      this.processQueue()
    }
  }

  async processQueue() {
    for (const [id, request] of this.queue) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        })

        if (response.ok) {
          this.queue.delete(id)
          const tx = this.db.transaction('queue', 'readwrite')
          await tx.store.delete(id)
        }
      } catch (error) {
        console.error(`Failed to process ${id}:`, error)
      }
    }
  }
}

// hooks/use-offline.ts
export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const queueRef = useRef<OfflineQueue>()

  useEffect(() => {
    queueRef.current = new OfflineQueue()
    queueRef.current.init()

    const handleOnline = () => {
      setIsOnline(true)
      queueRef.current?.processQueue()
    }

    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, queue: queueRef.current }
}
```

### Phase 3: Admin Features (Week 4)

#### 3.1 Role-Based Routing

```tsx
// components/auth/role-guard.tsx
export function RoleGuard({ allowedRoles, children }: { allowedRoles: UserRole[]; children: React.ReactNode }) {
  const { user } = useAuthStore()

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

// app/(dashboard)/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['ADMIN']}>{children}</RoleGuard>
}
```

#### 3.2 User Management

```tsx
// app/(dashboard)/admin/users/page.tsx
export default function UsersPage() {
  const [filters, setFilters] = useState<UserFilters>({})
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => api.admin.getUsers(filters),
  })

  const columns: ColumnsType<User> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Badge status={status === 'active' ? 'success' : 'error'} text={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => editUser(record)}>
            Edit
          </Button>
          <Button size="small" danger onClick={() => deleteUser(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="User Management" />

      <Card>
        <Space className="mb-4">
          <Input.Search placeholder="Search users..." onSearch={(value) => setFilters({ ...filters, search: value })} />
          <Select placeholder="Filter by role" onChange={(role) => setFilters({ ...filters, role })}>
            <Select.Option value="">All</Select.Option>
            <Select.Option value="CUSTOMER">Customer</Select.Option>
            <Select.Option value="SERVICE_PROVIDER">Service Provider</Select.Option>
            <Select.Option value="ADMIN">Admin</Select.Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={data?.items}
          loading={isLoading}
          pagination={{
            total: data?.total,
            pageSize: 20,
            onChange: (page) => setFilters({ ...filters, page }),
          }}
        />
      </Card>
    </div>
  )
}
```

## Core Features

### 1. Authentication & Authorization

- JWT-based authentication with refresh tokens
- Role-based access control (Customer, Service Provider, Admin)
- Protected routes with automatic redirects
- Persistent auth state with Zustand

### 2. Dashboard Views

- **Service Provider**: Voucher management, redemptions, analytics, settings
- **Admin**: User management, platform analytics, provider verification
- Shared components with role-specific features

### 3. Voucher Management

- CRUD operations with optimistic updates
- Bulk operations (activate/deactivate multiple)
- QR code generation for redemptions
- Real-time status updates

### 4. Analytics & Reporting

- Real-time metrics with WebSocket updates
- Interactive charts using Recharts/Tremor
- Data export functionality
- Customizable date ranges

### 5. Offline Capabilities

- Service Worker for offline access
- IndexedDB for local data persistence
- Queue system for syncing actions when online
- Offline voucher validation

### 6. Performance Optimizations

- Code splitting with dynamic imports
- Image optimization with Next.js Image
- Data virtualization for large lists
- Smart caching with React Query

## Development Workflow

### 1. Setup Development Environment

```bash
# Clone and setup
git clone <repo>
cd pika/packages/frontend/dashboard
yarn install

# Environment variables
cp .env.example .env.local
# Edit .env.local with your API URLs

# Start development
yarn dev
```

### 2. Code Standards

```typescript
// ESLint configuration
export default {
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
}

// Prettier configuration
export default {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  tabWidth: 2,
  printWidth: 100,
}
```

### 3. Git Workflow

```bash
# Branch naming
feature/PIKA-XXX-description
bugfix/PIKA-XXX-description

# Commit messages
feat: add voucher bulk operations
fix: resolve redemption race condition
chore: update dependencies
test: add provider flow tests
```

## Testing Strategy

### 1. Unit Tests with Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
  },
});

// Example test
describe('VoucherForm', () => {
  it('should validate required fields', async () => {
    const onSubmit = vi.fn();
    render(<VoucherForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByText('Save Voucher'));

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

### 2. Integration Tests

```typescript
// API mocking with MSW
const server = setupServer(
  rest.post('/api/v1/vouchers', (req, res, ctx) => {
    return res(ctx.json({ id: '123', ...req.body }))
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### 3. E2E Tests with Playwright

```typescript
test('complete voucher creation flow', async ({ page }) => {
  await page.goto('/provider/vouchers/new')
  await page.fill('input[name="title"]', 'Summer Sale')
  await page.fill('input[name="discount"]', '25')
  await page.click('button:has-text("Save")')

  await expect(page.locator('text=Voucher created')).toBeVisible()
})
```

## Deployment

### 1. Build Configuration

```typescript
// next.config.mjs
export default {
  output: 'standalone',
  images: {
    domains: ['localhost', 'api.pika.com'],
  },
  experimental: {
    optimizePackageImports: ['antd', 'lodash-es', 'date-fns'],
  },
}
```

### 2. Docker Setup

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### 3. CI/CD Pipeline

```yaml
name: Dashboard CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'packages/frontend/dashboard/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: yarn install
      - run: yarn test
      - run: yarn lint
      - run: yarn typecheck
      - run: yarn build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t pika-dashboard .
      - run: docker push pika-dashboard
```

## Performance Targets

- **Core Web Vitals**:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

- **Bundle Size**:
  - Initial JS < 200KB
  - Total JS < 600KB
  - CSS < 100KB

- **API Response Times**:
  - List endpoints < 200ms
  - Single resource < 100ms
  - Mutations < 300ms

## Security Checklist

- [ ] JWT tokens stored securely (httpOnly cookies in production)
- [ ] CSRF protection enabled
- [ ] Content Security Policy headers configured
- [ ] Input validation on all forms
- [ ] XSS protection with proper escaping
- [ ] Rate limiting on API endpoints
- [ ] Secure WebSocket connections (WSS)
- [ ] Regular dependency updates

## Monitoring & Observability

```typescript
// Error tracking with Sentry
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1,
})

// Performance monitoring
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (metric.label === 'web-vital') {
    // Send to analytics
    analytics.track('Web Vital', {
      metric: metric.name,
      value: metric.value,
      page: window.location.pathname,
    })
  }
}
```

## Conclusion

This implementation guide provides a straightforward path to building a modern, performant dashboard for Pika. The architecture emphasizes:

1. **Simplicity**: Using battle-tested tools (Next.js, Ant Design, React Query)
2. **Performance**: Offline support, real-time updates, optimized bundles
3. **Maintainability**: Clean architecture, comprehensive testing, TypeScript
4. **Scalability**: Role-based architecture supporting both service providers and admins

Follow the phased approach to deliver value incrementally while maintaining high quality standards.
