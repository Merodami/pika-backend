# Pika Dashboard

A modern, enterprise-grade admin and business management dashboard built with Next.js 15, React 19, and TypeScript. This dashboard provides a unified interface for managing businesses, vouchers, users, and platform operations.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [State Management](#state-management)
- [UI Components](#ui-components)
- [Testing](#testing)
- [Build & Deployment](#build--deployment)
- [Industry Standards Compliance](#industry-standards-compliance)
- [Performance Optimizations](#performance-optimizations)
- [Security](#security)
- [Contributing](#contributing)

## Architecture Overview

This dashboard follows industry-standard patterns for modern React applications:

- **Component Architecture**: Feature-based organization with clear separation of concerns
- **API Layer**: Auto-generated TypeScript SDK from OpenAPI specifications
- **State Management**: Zustand for global state, React Query for server state
- **Authentication**: OAuth 2.0 JWT-based with automatic token refresh
- **Multi-tenant**: Supports both Admin and Business user roles
- **Internationalization**: Multi-language support with next-intl (Spanish, English, Guaraní)

## Role-Based Access Control (RBAC)

The dashboard is a **shared application** that serves both business owners and platform administrators with different feature sets based on their roles.

### User Roles and Permissions

#### Business Owner Role

- **View Own Business**: Read-only access to their business information
- **Create Individual Vouchers**: Can create single vouchers (not voucher books)
- **View Own Vouchers**: See and manage their created vouchers
- **Limited Dashboard**: Access to business-specific metrics and analytics

#### Admin Role (Platform Administrators)

- **Full Business Management**: Create, read, update, delete all businesses
- **Complete Voucher Control**: Manage all vouchers across the platform
- **Voucher Book Builder**: Exclusive access to create and manage voucher books
- **User Management**: View and manage all platform users
- **Platform Analytics**: Access to comprehensive platform metrics
- **System Configuration**: Access to platform settings and configurations

### Implementation Strategy

#### 1. Route Protection

```typescript
// Business routes - accessible by business owners and admins
/business/*

// Admin routes - accessible only by admins
/admin/*

// Shared routes with role-based content
/dashboard (shows different content based on role)
/vouchers (filtered by ownership for business, all for admin)
```

#### 2. Component-Level Access Control

```typescript
// Example: Role-based component rendering
export function VoucherActions({ user, voucher }: Props) {
  const isAdmin = user.role === 'ADMIN'
  const isOwner = voucher.businessId === user.businessId

  return (
    <>
      {(isAdmin || isOwner) && (
        <Button onClick={onEdit}>Edit</Button>
      )}
      {isAdmin && (
        <Button onClick={onDelete} danger>Delete</Button>
      )}
    </>
  )
}
```

#### 3. API-Level Security

- All API calls include JWT tokens with role information
- Backend enforces role-based permissions
- Frontend role checks are for UX only - security is enforced server-side

#### 4. Navigation Structure

```typescript
// Dynamic navigation based on user role
const getNavigationItems = (user: User) => {
  const baseItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/vouchers', label: 'Vouchers', icon: 'ticket' },
  ]

  if (user.role === 'BUSINESS') {
    return [
      ...baseItems,
      { path: '/business/profile', label: 'My Business', icon: 'building' },
    ]
  }

  if (user.role === 'ADMIN') {
    return [
      ...baseItems,
      { path: '/admin/businesses', label: 'Businesses', icon: 'building' },
      { path: '/admin/users', label: 'Users', icon: 'users' },
      { path: '/admin/voucher-books', label: 'Voucher Books', icon: 'book' },
      { path: '/admin/analytics', label: 'Analytics', icon: 'chart' },
    ]
  }
}
```

### Feature Matrix

| Feature             | Business Owner   | Admin                 |
| ------------------- | ---------------- | --------------------- |
| View Dashboard      | ✅ (Own metrics) | ✅ (Platform metrics) |
| View Business       | ✅ (Own only)    | ✅ (All businesses)   |
| Edit Business       | ❌               | ✅                    |
| Create Voucher      | ✅ (Individual)  | ✅ (Individual)       |
| Create Voucher Book | ❌               | ✅                    |
| View Vouchers       | ✅ (Own only)    | ✅ (All vouchers)     |
| Manage Users        | ❌               | ✅                    |
| Platform Settings   | ❌               | ✅                    |
| Export Reports      | ✅ (Own data)    | ✅ (All data)         |

### Development Guidelines

1. **Always check roles on both frontend and backend**
2. **Use TypeScript discriminated unions for role-specific types**
3. **Implement loading states while checking permissions**
4. **Provide clear feedback for unauthorized actions**
5. **Test both roles thoroughly during development**

## Technology Stack

### Core Framework

- **Next.js 15.4.4**: React framework with App Router, Server Components, and Turbopack
- **React 19.1.1**: Latest React with concurrent features
- **TypeScript 5.8.3**: Type-safe development with strict configuration

### UI Libraries

- **Ant Design 5.26.6**: Enterprise-grade UI component library
- **Tailwind CSS 3.4.18**: Utility-first CSS framework
- **Lucide React 0.532.0**: Modern icon library

### State & Data Management

- **Zustand 5.0.6**: Lightweight state management
- **React Hook Form 7.61.1**: Performant forms with validation
- **Zod 4.0.10**: TypeScript-first schema validation
- **next-intl 4.3.4**: Internationalization for Next.js

### Development Tools

- **ESLint 9.32.0**: Code quality and consistency
- **Prettier 3.6.2**: Code formatting

### Utilities

- **date-fns 4.1.0**: Modern date utility library
- **clsx 2.1.1**: Utility for constructing className strings
- **tailwind-merge 3.3.1**: Merge Tailwind CSS classes without conflicts

## Project Structure

```
frontend/dashboard/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication routes (login, register)
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── admin/          # Admin-specific pages
│   │   └── business/       # Business owner pages
│   ├── [locale]/            # Internationalized routes
│   │   ├── (auth)/         # Localized auth pages
│   │   └── (dashboard)/    # Localized dashboard
│   ├── _services/           # Server-side services
│   │   └── authService.ts  # Auth utilities
│   ├── actions/             # Server actions
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/              # Reusable UI components
│   ├── auth/               # Authentication components
│   ├── features/           # Feature-specific components
│   ├── layouts/            # Layout components (header, sidebar)
│   └── ui/                 # Generic UI components
├── hooks/                   # Custom React hooks
│   ├── auth/               # Authentication hooks
│   ├── data/               # Data fetching hooks
│   └── ui/                 # UI-related hooks
├── lib/                     # Core utilities and libraries
│   ├── api/                # API client and adapters
│   │   ├── generated/      # Auto-generated SDK
│   │   ├── adminAdapter.ts # Admin API adapter
│   │   ├── businessAdapter.ts # Business API adapter
│   │   ├── voucherAdapter.ts # Voucher API adapter
│   │   └── client.ts       # Configured API client
│   ├── validations/        # Zod schemas
│   │   └── auth.ts         # Auth form validation
│   └── utils/              # General utilities
├── services/                # Business logic services
├── store/                   # Zustand stores
│   ├── auth.store.ts       # Authentication state
│   ├── app.store.ts        # App preferences (language)
│   ├── notifications.store.ts
│   └── ui.store.ts         # UI state
├── i18n/                    # Internationalization
│   ├── config.ts           # i18n configuration
│   └── request.ts          # Server-side helpers
├── messages/                # Translation files
│   ├── en.json            # English
│   ├── es.json            # Spanish
│   └── gn.json            # Guaraní
├── types/                   # TypeScript type definitions
└── tests/                   # Test files
```

## Getting Started

### Prerequisites

- Node.js 22.x (required by backend monorepo)
- Yarn 4.9.1 (Berry)
- Backend services running locally

> **Note**: The frontend dashboard is registered as a Yarn workspace in the monorepo

### Installation

```bash
# Install dependencies from root (workspace setup)
cd /path/to/pika-backend
yarn install

# The frontend dashboard is automatically included as a workspace
```

### Environment Variables

Create a `.env.local` file in the dashboard root:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5500/api/v1
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:5500
NEXT_PUBLIC_ENV=development

# Feature Flags
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_ENABLE_PWA=false
```

### Running the Development Server

```bash
# Start with Turbopack (recommended)
yarn dev

# The dashboard will be available at http://localhost:3000
```

## Development

### Code Style

The project enforces consistent code style through:

- **ESLint**: Configured with Next.js best practices
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict mode enabled

```bash
# Run linting
yarn lint

# Fix linting issues
yarn lint:fix

# Format code
yarn format:fix

# Type checking
yarn typecheck

# Run all validations
yarn validate
```

### Component Development Guidelines

1. **Feature-First Organization**: Group components by feature rather than type
2. **Composition over Inheritance**: Use hooks and component composition
3. **Type Safety**: Define interfaces for all props and state
4. **Accessibility**: Use semantic HTML and ARIA attributes
5. **Performance**: Implement React.memo and useMemo where appropriate

Example component structure:

```typescript
// components/features/voucher/VoucherCard.tsx
interface VoucherCardProps {
  voucher: VoucherResponse
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export const VoucherCard: React.FC<VoucherCardProps> = memo(
  ({ voucher, onEdit, onDelete }) => {
    // Component implementation
  }
)
```

## API Integration

### Auto-Generated SDK

The dashboard uses an auto-generated TypeScript SDK from the backend's OpenAPI specification:

```bash
# SDK is generated in the backend
cd ../../  # Navigate to backend root
yarn generate:api  # Generate OpenAPI spec
yarn generate:sdk  # Generate TypeScript SDK

# The SDK is output to:
# frontend/dashboard/lib/api/generated/
```

### API Client Configuration

The API client (`lib/api/client.ts`) provides:

- **Automatic token management**: Handles access/refresh tokens
- **Retry logic**: Configurable retry for failed requests
- **Error handling**: Unified error handling with toast notifications
- **Type safety**: Full TypeScript support from generated SDK

### Usage Example

```typescript
import { api } from '@/lib/api/client'

// In a React component or hook
const { data, isLoading, error } = useQuery({
  queryKey: ['vouchers', params],
  queryFn: () => api.vouchers.getVouchers(params),
})
```

### Adapter Pattern

For complex API operations, use adapter patterns:

```typescript
// lib/api/business-adapter.ts
export const businessAdapter = {
  async getDashboardMetrics(businessId: string) {
    const [vouchers, analytics] = await Promise.all([
      api.vouchers.getBusinessVouchers({ businessId }),
      api.analytics.getBusinessAnalytics({ businessId }),
    ])

    return {
      totalVouchers: vouchers.pagination.total,
      activeVouchers: analytics.activeCount,
      // ... transformed data
    }
  },
}
```

## Authentication

### JWT Token Management

- **Storage**: Secure HTTP-only cookies (recommended) or localStorage
- **Auto-refresh**: Tokens refresh automatically before expiration
- **Protected Routes**: Middleware ensures authentication

### Protected Route Implementation

```typescript
// components/auth/protected-route.tsx
export function ProtectedRoute({
  children,
  allowedRoles = []
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) return <LoadingScreen />
  if (!user) redirect('/login')
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    redirect('/unauthorized')
  }

  return children
}
```

## State Management

### Zustand Stores

Global application state is managed with Zustand:

```typescript
// store/auth.store.ts
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  checkAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  // Store implementation
}))
```

### React Query for Server State

Server state is managed with TanStack Query:

```typescript
// hooks/data/use-vouchers.ts
export function useVouchers(params: VoucherQueryParams) {
  return useQuery({
    queryKey: ['vouchers', params],
    queryFn: () => voucherAdapter.getVouchers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

## UI Components

### Design System

The dashboard uses a combination of:

1. **Ant Design**: Primary component library for complex components
2. **Custom Components**: Built with Tailwind CSS for specific needs
3. **Tremor**: For charts and data visualization

### Component Library Usage

```typescript
// Using Ant Design with Tailwind
import { Button, Card, Table } from 'antd'

<Card className="shadow-lg rounded-lg p-6">
  <Button type="primary" className="bg-blue-600 hover:bg-blue-700">
    Create Voucher
  </Button>
</Card>
```

### Responsive Design

- Mobile-first approach with Tailwind breakpoints
- Responsive navigation with collapsible sidebar
- Touch-optimized interactions

## Testing

### Unit Testing

```bash
# Run unit tests
yarn test

# Run with coverage
yarn test:coverage

# Watch mode
yarn test:watch
```

### Integration Testing

```bash
# Run integration tests
yarn test:integration
```

### Test Structure

```typescript
// components/features/voucher/VoucherCard.test.tsx
describe('VoucherCard', () => {
  it('should render voucher information', () => {
    const voucher = mockVoucher()
    render(<VoucherCard voucher={voucher} />)

    expect(screen.getByText(voucher.title)).toBeInTheDocument()
    expect(screen.getByText(voucher.description)).toBeInTheDocument()
  })
})
```

## Build & Deployment

### Production Build

```bash
# Create production build
yarn build

# Start production server
yarn start
```

### Build Optimizations

- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Automatic with next/font
- **Tree Shaking**: Removes unused code
- **Minification**: Automatic in production

### Deployment Options

1. **Vercel**: Recommended for Next.js applications
2. **Docker**: Containerized deployment
3. **Static Export**: For CDN deployment (limited features)

## Industry Standards Compliance

### Code Quality

✅ **TypeScript Strict Mode**: Full type safety
✅ **ESLint Configuration**: Enforces best practices
✅ **Prettier**: Consistent code formatting
✅ **Husky**: Pre-commit hooks for quality gates

### Performance

✅ **Code Splitting**: Automatic with dynamic imports
✅ **React Query**: Intelligent caching and background updates
✅ **Memoization**: Strategic use of React.memo and useMemo
✅ **Virtual Scrolling**: For large lists (when needed)

### Security

✅ **JWT Authentication**: Secure token management
✅ **HTTPS Only**: Enforced in production
✅ **XSS Protection**: React's built-in protections
✅ **CSRF Protection**: Token validation
✅ **Input Validation**: Zod schemas for all forms

### Accessibility

✅ **Semantic HTML**: Proper element usage
✅ **ARIA Labels**: For screen readers
✅ **Keyboard Navigation**: Full keyboard support
✅ **Focus Management**: Proper focus handling

### SEO & Meta

✅ **Next.js Metadata API**: Dynamic meta tags
✅ **Structured Data**: JSON-LD support
✅ **Sitemap Generation**: Automatic with Next.js

## Performance Optimizations

### Current Optimizations

1. **React Query Caching**: 5-minute stale time, 10-minute cache time
2. **Component Lazy Loading**: Dynamic imports for code splitting
3. **Image Optimization**: Next.js Image component with lazy loading
4. **Bundle Optimization**: Tree shaking and minification

### Monitoring

```typescript
// lib/utils/performance.ts
export function measurePerformance(metricName: string) {
  if (typeof window !== 'undefined' && window.performance) {
    const navigation = performance.getEntriesByType('navigation')[0]
    // Log metrics to analytics service
  }
}
```

## Security

### OAuth 2.0 Authentication Flow

1. **Registration**: User registers → backend returns userId, emailSent (no tokens)
2. **Email Verification**: User verifies email via link
3. **Login**: User logs in → backend returns access/refresh tokens
4. **Token Management**: Tokens stored in secure HTTP-only cookies
5. **Auto-refresh**: Tokens refresh automatically before expiration
6. **Server-side Auth**: Protected routes use server-side auth checks
7. **Logout**: Server action clears all tokens

### API Security

- **CORS**: Configured for allowed origins
- **Rate Limiting**: Implemented on API Gateway
- **Request Validation**: Zod schemas validate all inputs
- **Error Handling**: No sensitive data in error messages

## Contributing

### Development Workflow

1. Create feature branch from `main`
2. Implement feature following guidelines
3. Write/update tests
4. Run validation: `yarn validate`
5. Create pull request

### Commit Convention

Follow conventional commits:

```
feat: add voucher analytics dashboard
fix: resolve token refresh race condition
docs: update API integration guide
style: format dashboard components
refactor: simplify auth store logic
test: add voucher adapter tests
chore: update dependencies
```

### Code Review Checklist

- [ ] TypeScript types properly defined
- [ ] Component follows project patterns
- [ ] Tests written/updated
- [ ] No console.logs in production code
- [ ] Accessibility considerations
- [ ] Performance impact assessed
- [ ] Documentation updated

## Troubleshooting

### Common Issues

1. **Build Errors**: Clear `.next` folder and rebuild
2. **Type Errors**: Regenerate SDK after API changes
3. **Auth Issues**: Check token expiration and refresh logic
4. **Performance**: Use React DevTools Profiler

### Debug Mode

```typescript
// Enable debug logging
localStorage.setItem('debug', 'pika:*')
```

## Internationalization (i18n)

### Supported Languages

- **Spanish (es)** - Default language
- **English (en)**
- **Guaraní (gn)** - Indigenous language of Paraguay

### Implementation

```typescript
// URL-based routing with locale
/[locale]/dashboard  // e.g., /es/dashboard, /en/dashboard

// Server Components with translations
import { getTranslations } from 'next-intl/server'

export default async function Page({ params }) {
  const t = await getTranslations('dashboard')
  return <h1>{t('title')}</h1>
}

// Client Components with translations
import { useTranslations } from 'next-intl'

export function Component() {
  const t = useTranslations('common')
  return <button>{t('save')}</button>
}
```

### Language Switching

- Language switcher in header preserves current route
- User preference synced with backend
- Supports soft navigation for smooth UX

## Future Enhancements

- [ ] Progressive Web App (PWA) support
- [ ] Dark mode theme
- [ ] Advanced analytics dashboard
- [ ] Real-time collaboration features
- [ ] Offline support with service workers

## License

Proprietary - Pika Platform

---

For more information, contact the development team or refer to the main project documentation.
