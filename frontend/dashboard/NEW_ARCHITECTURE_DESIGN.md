# Pika Dashboard - New Architecture Design

## Executive Summary

A modern, enterprise-grade dashboard built with Next.js 15, React 19, and TypeScript, featuring:
- React Server Components (RSC) first approach
- Internationalization (i18n) with next-intl
- Role-based access control (RBAC)
- Type-safe API integration
- Modern state management with Zustand

## Core Architecture Principles

### 1. Server-First Approach
- **Default to RSC**: Client components only when needed
- **Server Actions**: For all mutations
- **Streaming SSR**: With Suspense boundaries
- **Edge Runtime**: Where applicable

### Understanding React Server Components Dynamism

**RSC ≠ Static Pages!** They provide fluid, dynamic experiences:

```typescript
// This is a Server Component but still dynamic!
export default async function VoucherList() {
  const vouchers = await getVouchers() // Fresh data on each request
  
  return (
    <div>
      {vouchers.map(voucher => (
        <VoucherCard key={voucher.id} voucher={voucher}>
          {/* Client component for interactions */}
          <VoucherActions voucherId={voucher.id} />
        </VoucherCard>
      ))}
    </div>
  )
}

// Client component for interactivity
'use client'
function VoucherActions({ voucherId }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  
  return (
    <>
      <button onClick={() => setIsEditing(true)}>Edit</button>
      <form action={deleteVoucher}>
        <input type="hidden" name="id" value={voucherId} />
        <button type="submit">Delete</button>
      </form>
    </>
  )
}
```

**How RSC Provides Fluid Updates**:
1. **Server Actions**: Update data without full page reload
2. **Revalidation**: `revalidatePath()` updates specific components
3. **Streaming**: Progressive rendering of UI sections
4. **Client Islands**: Interactive parts remain stateful
5. **Soft Navigation**: Next.js router preserves client state

**Example: Dynamic Voucher Management**
```typescript
// Server action for instant updates
async function deleteVoucher(formData: FormData) {
  'use server'
  const id = formData.get('id')
  await voucherService.delete(id)
  revalidatePath('/admin/vouchers') // Only this part re-renders!
}

// The page updates without reload, feels like SPA!
```

### 2. Type Safety Throughout
- **End-to-end types**: From API to UI via Generated SDK
- **Generated SDK**: From OpenAPI spec with proper enums
- **Frontend validation**: Using SDK types, not backend schemas
- **Type-safe translations**: Generated from JSON

### 3. Performance Optimized
- **Minimal client JS**: RSC by default
- **Code splitting**: Automatic with App Router
- **Image optimization**: Next.js Image component
- **Font optimization**: Next.js font loading

## Technology Stack

### Core Dependencies
```json
{
  "dependencies": {
    "next": "^15.4.4",              // Framework
    "react": "^19.1.0",             // UI library
    "react-dom": "^19.1.0",         
    "next-intl": "^3.x",            // i18n
    "zustand": "^5.0.6",            // State management
    "antd": "^5.26.6",              // UI components
    "react-hook-form": "^7.61.1",   // Forms
    "@hookform/resolvers": "^5.2.0",
    "zod": "^4.0.10",               // Validation (frontend forms only)
    "tailwindcss": "^4.1.11",       // Styling
    "clsx": "^2.1.1",               // Class utilities
    "tailwind-merge": "^3.3.1",
    "lucide-react": "^0.526.0",     // Icons
    "recharts": "^3.1.0",           // Charts
    "date-fns": "^4.1.0",           // Date utils
    "sonner": "^2.0.6",             // Toast notifications
    "server-only": "^0.0.1",        // Server code safety
    "axios": "^1.x"                 // HTTP client (used by generated SDK)
  },
  "devDependencies": {
    "@pika/api": "workspace:^",     // Backend schemas for form extensions (dev only)
    "openapi-typescript-codegen": "^0.x" // SDK generator
  }
}
```

## Directory Structure

```
app/
├── [locale]/                       # i18n routing
│   ├── (auth)/                    # Public routes
│   │   ├── login/
│   │   │   ├── page.tsx          # Server Component
│   │   │   └── login-form.tsx    # Client Component
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/               # Protected routes
│   │   ├── layout.tsx            # Auth check + role layout
│   │   ├── page.tsx              # Role-based redirect
│   │   ├── admin/                # Admin-only routes
│   │   │   ├── businesses/
│   │   │   ├── users/
│   │   │   ├── voucher-books/
│   │   │   └── analytics/
│   │   └── business/             # Business owner routes
│   │       ├── profile/
│   │       ├── vouchers/
│   │       └── dashboard/
│   └── layout.tsx                # Locale provider
├── _components/                   # Shared components
│   ├── ui/                       # Generic UI components
│   ├── forms/                    # Form components
│   └── layouts/                  # Layout components
├── _services/                     # Server-side services
│   ├── auth.service.ts           # Auth utilities
│   ├── business.service.ts       # Business logic
│   └── voucher.service.ts        # Voucher logic
├── _hooks/                        # Client hooks
│   ├── use-form-draft.ts         # Form persistence
│   └── use-translations.ts       # i18n helpers
├── actions/                       # Server actions
│   ├── auth.ts
│   ├── business.ts
│   └── vouchers.ts
└── lib/
    ├── api/                      # API configuration
    │   └── generated/            # OpenAPI SDK (types, enums, services)
    ├── schemas/                  # Frontend-specific form schemas
    │   └── auth/                 # Extends SDK types for forms
    └── i18n/                     # i18n configuration
```

## State Management Architecture

### Zustand Stores

```typescript
// stores/app.store.ts - UI and app state
interface AppState {
  // UI State
  sidebarCollapsed: boolean
  theme: 'light' | 'dark'
  
  // Form Drafts (persisted)
  formDrafts: Record<string, any>
  
  // Actions
  toggleSidebar: () => void
  saveFormDraft: (formId: string, data: any) => void
  clearFormDraft: (formId: string) => void
  
  // Language switch helper
  isLanguageSwitching: boolean
  setLanguageSwitching: (value: boolean) => void
}

// stores/auth.store.ts - Auth state only
interface AuthState {
  // Cached user data
  user: User | null
  
  // Actions
  setUser: (user: User | null) => void
  clearAuth: () => void
}

// Usage with persistence
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // State
      sidebarCollapsed: false,
      theme: 'light',
      formDrafts: {},
      isLanguageSwitching: false,
      
      // Actions
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      saveFormDraft: (formId, data) => set((state) => ({
        formDrafts: { ...state.formDrafts, [formId]: data }
      })),
      
      clearFormDraft: (formId) => set((state) => {
        const { [formId]: _, ...rest } = state.formDrafts
        return { formDrafts: rest }
      }),
      
      setLanguageSwitching: (value) => set({ isLanguageSwitching: value })
    }),
    {
      name: 'pika-app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        formDrafts: state.formDrafts, // Persist form drafts
      })
    }
  )
)
```

### State Management Principles

1. **Server State**: Handled by RSC and Server Actions
2. **Client State**: Minimal, only UI and user interactions
3. **Form State**: react-hook-form + Zustand for drafts
4. **Cache State**: Next.js built-in caching

## SDK and Schema Architecture (Balanced Approach)

### The Two-Layer System

The frontend uses a **balanced approach** combining build-time schema reuse with runtime SDK usage:

```
Build Time (Development):
└── @pika/api schemas      # Extend backend validation logic

Runtime (Production):
└── lib/api/generated/     # SDK for API calls and enums
```

### Import Patterns

#### 1. Build-Time Imports (Schema Extensions)

```typescript
// ✅ Correct - Using proper index exports from @pika/api
import { authFrontend, userAdmin, shared } from '@pika/api'

// Access schemas through namespaced exports
const { AdminCreateUserRequest } = userAdmin
const { SecurePassword, Email } = shared

// Or import specific schemas
import { AdminCreateUserRequest } from '@pika/api/schemas/user/admin/management'
import { SecurePassword } from '@pika/api/schemas/shared/primitives'
```

#### 2. Runtime Imports (SDK Usage)

```typescript
// ✅ Correct - Using generated SDK for API calls
import { UserService, AdminCreateUserRequest } from '@/lib/api/generated'

// Use SDK enums at runtime
const role = AdminCreateUserRequest.role.BUSINESS
const status = AdminCreateUserRequest.status.UNCONFIRMED

// Make API calls
const user = await UserService.getProfile()
```

### The Pattern: Smart Schema Extension

```typescript
// lib/schemas/auth/forms.ts
import { z } from 'zod'
import { userAdmin, shared } from '@pika/api'

// EXTEND backend schema with UI concerns
export const AdminCreateBusinessUserSchema = userAdmin.AdminCreateUserRequest
  .omit({ role: true, status: true }) // Remove auto-set fields
  .extend({
    // Reuse backend validation
    temporaryPassword: shared.SecurePassword,
    confirmPassword: z.string().min(1),
    // Frontend-specific fields
    sendWelcomeEmail: z.boolean().default(true),
    requirePasswordChange: z.boolean().default(true),
  })
  .refine((data) => data.temporaryPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// Transform function for API calls
export function transformToAPI(formData: z.infer<typeof AdminCreateBusinessUserSchema>) {
  const { confirmPassword, temporaryPassword, sendWelcomeEmail, requirePasswordChange, ...userData } = formData
  
  return {
    createUser: {
      ...userData,
      role: 'business', // Use string literal for API
      status: 'unconfirmed',
    },
    options: {
      temporaryPassword,
      sendWelcomeEmail,
      requirePasswordChange,
    }
  }
}
```

### Why This Architecture Works

| Aspect | Build Time | Runtime |
|--------|------------|---------|
| **Validation** | Import Zod schemas from `@pika/api` | Use extended schemas |
| **Types** | Extend backend interfaces | Use SDK types |
| **Enums** | N/A | Use SDK enums |
| **API Calls** | N/A | Use SDK services |
| **Bundle Size** | Tree-shaken, only validation logic | Full SDK included |

### Benefits of the Balanced Approach

1. **No Duplication**: Reuse `SecurePassword`, `Email`, etc. from backend
2. **Consistency**: Frontend validation matches backend exactly
3. **Maintainability**: Change validation rules in one place
4. **Type Safety**: Full TypeScript support throughout
5. **Security**: Backend internals not exposed to browser
6. **Flexibility**: Can extend schemas for UI needs
7. **Multi-Frontend**: Same patterns work for React, Flutter, etc.

### Generated SDK Limitations

The SDK **provides**:
- Types and interfaces
- Enums for API values
- Service classes for API calls
- HTTP client configuration

The SDK **does NOT provide**:
- Zod validation schemas
- Complex validation logic
- Transform functions
- Business rules

This is why we need the balanced approach!

## Authentication Architecture

### Server-Side Auth

```typescript
// app/_services/auth.service.ts
import 'server-only'
import { UserService } from '@/lib/api/generated'
import type { UserProfileResponse } from '@/lib/api/generated'

export async function getCurrentUser(): Promise<UserProfileResponse | null> {
  const token = cookies().get('pika-access-token')
  if (!token) return null
  
  try {
    // SDK service handles the API call
    const user = await UserService.getUserProfile()
    return user
  } catch {
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireRole(role: 'ADMIN' | 'BUSINESS') {
  const user = await requireAuth()
  if (user.role !== role.toLowerCase()) redirect('/unauthorized')
  return user
}
```

### Protected Routes

```typescript
// app/[locale]/(dashboard)/layout.tsx
export default async function DashboardLayout({
  children,
  params: { locale }
}: Props) {
  const user = await requireAuth()
  
  return (
    <DashboardProvider user={user} locale={locale}>
      <div className="flex h-screen">
        <Sidebar user={user} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </DashboardProvider>
  )
}
```

## Internationalization (i18n) Architecture

### Configuration

```typescript
// i18n/config.ts
export const locales = ['es', 'en', 'gn'] as const
export const defaultLocale = 'es'

export const localeConfig = {
  es: { name: 'Español', flag: '🇪🇸', currency: 'EUR', dateFormat: 'dd/MM/yyyy' },
  en: { name: 'English', flag: '🇺🇸', currency: 'USD', dateFormat: 'MM/dd/yyyy' },
  gn: { name: 'Guaraní', flag: '🇵🇾', currency: 'PYG', dateFormat: 'dd/MM/yyyy' }
}
```

### Language Switching with State Preservation

```typescript
// components/language-switcher.tsx
'use client'

export function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const { saveFormDraft, setLanguageSwitching } = useAppStore()
  const [isPending, startTransition] = useTransition()
  
  const handleLanguageChange = (newLocale: string) => {
    // Save any active form data
    const activeForm = document.querySelector('form[data-form-id]')
    if (activeForm) {
      const formId = activeForm.getAttribute('data-form-id')
      const formData = new FormData(activeForm)
      saveFormDraft(formId!, Object.fromEntries(formData))
    }
    
    // Set switching state for loading UI
    setLanguageSwitching(true)
    
    // Perform soft navigation
    startTransition(() => {
      const newPath = pathname.replace(/^\/[^\/]+/, `/${newLocale}`)
      router.push(newPath)
    })
  }
  
  return (
    <Select
      onChange={handleLanguageChange}
      loading={isPending}
      // ... options
    />
  )
}
```

### Translation Loading Strategy

```typescript
// Static translations (UI)
messages/
├── es.json
├── en.json
└── gn.json

// Dynamic translations (from API)
async function getEntityTranslations(keys: string[], locale: string) {
  return fetch(`/api/translations?keys=${keys.join(',')}&lang=${locale}`)
}

// Hybrid usage in components
export default async function CategoryList({ locale }: Props) {
  const t = await getTranslations(locale)
  const categories = await getCategories()
  
  // Fetch dynamic translations for category names
  const translationKeys = categories.map(c => c.nameKey)
  const translations = await getEntityTranslations(translationKeys, locale)
  
  return (
    <div>
      <h1>{t('categories.title')}</h1> {/* Static */}
      {categories.map(category => (
        <div key={category.id}>
          {translations[category.nameKey]} {/* Dynamic */}
        </div>
      ))}
    </div>
  )
}
```

## Data Fetching Patterns

### 1. Server Components (Default)

```typescript
// Direct data fetching using SDK services
import { BusinessService, VoucherService } from '@/lib/api/generated'

export default async function BusinessDashboard() {
  const user = await getCurrentUser()
  
  // Use SDK services for API calls
  const business = await BusinessService.getMyBusiness()
  const vouchers = await VoucherService.getBusinessVouchers({
    businessId: business.id
  })
  
  return <DashboardView business={business} vouchers={vouchers} />
}
```

### 2. Server Actions (Mutations)

```typescript
// app/actions/vouchers.ts
'use server'

import { revalidatePath } from 'next/cache'
import { VoucherService } from '@/lib/api/generated'
import type { CreateVoucherRequest } from '@/lib/api/generated'

export async function createVoucher(data: FormData) {
  const user = await requireBusiness()
  
  // Prepare request using SDK types
  const request: CreateVoucherRequest = {
    title: data.get('title') as string,
    description: data.get('description') as string,
    businessId: user.businessId,
    // ... other fields
  }
  
  // Use SDK service for API call
  const voucher = await VoucherService.createVoucher({
    requestBody: request
  })
  
  revalidatePath('/business/vouchers')
  redirect(`/business/vouchers/${voucher.id}`)
}
```

### 3. Client Components (Interactive)

```typescript
'use client'

import { useFormStatus } from 'react-dom'
import { createVoucher } from '@/actions/vouchers'

export function VoucherForm() {
  const { pending } = useFormStatus()
  const { formDrafts, clearFormDraft } = useAppStore()
  
  // Restore draft if exists
  const draft = formDrafts['create-voucher']
  
  return (
    <form 
      action={createVoucher} 
      data-form-id="create-voucher"
      onSubmit={() => clearFormDraft('create-voucher')}
    >
      <input 
        name="title" 
        defaultValue={draft?.title}
        required 
      />
      <button disabled={pending}>
        {pending ? 'Creating...' : 'Create Voucher'}
      </button>
    </form>
  )
}
```

## Role-Based Access Control (RBAC)

### Route Structure

```
/[locale]/
├── (dashboard)/
│   ├── admin/          # requireRole('ADMIN')
│   ├── business/       # requireRole('BUSINESS')
│   └── shared/         # requireAuth()
```

### Dynamic UI Components

```typescript
// components/role-based-ui.tsx
interface RoleGateProps {
  roles: UserRole[]
  fallback?: ReactNode
  children: ReactNode
}

export async function RoleGate({ roles, fallback, children }: RoleGateProps) {
  const user = await getCurrentUser()
  
  if (!user || !roles.includes(user.role)) {
    return fallback || null
  }
  
  return children
}

// Usage
<RoleGate roles={['ADMIN']}>
  <AdminPanel />
</RoleGate>
```

### Admin Voucher Management

Admins have complete control over ALL vouchers:
- Create/Edit/Delete any individual voucher (from any business)
- Create/Edit/Delete voucher books
- View all vouchers across the platform
- Bulk operations on vouchers

## Performance Optimizations

### 1. Streaming SSR

```typescript
export default async function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<MetricsSkeleton />}>
        <DashboardMetrics />
      </Suspense>
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  )
}
```

### 2. Parallel Data Loading

```typescript
export default async function BusinessProfile() {
  // Load data in parallel
  const [business, vouchers, analytics] = await Promise.all([
    getBusinessProfile(),
    getBusinessVouchers(),
    getBusinessAnalytics()
  ])
  
  return <ProfileView {...{ business, vouchers, analytics }} />
}
```

### 3. Static Generation Where Possible

```typescript
// Generate static params for known locales
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}
```

## Security Best Practices

1. **Server-Only Code**: Use `import 'server-only'` for sensitive logic
2. **Environment Variables**: Never expose secrets to client
3. **CSRF Protection**: Built into Server Actions
4. **Input Validation**: Zod schemas on all inputs
5. **SQL Injection**: Using Prisma ORM
6. **XSS Protection**: React's built-in escaping

## Development Workflow

### 1. SDK Generation

```bash
# Backend: Generate OpenAPI spec
cd ../../ && yarn generate:openapi

# Frontend: Generate SDK from OpenAPI
yarn generate:sdk

# This creates:
# - lib/api/generated/models/* (types with enums)
# - lib/api/generated/services/* (API clients)
# - Proper TypeScript enums for all API values

# Generate translation types
yarn i18n:build
```

### 2. Development Commands

```bash
# Start dev server
yarn dev

# Type checking
yarn typecheck

# Linting
yarn lint:fix

# Build
yarn build
```

## Migration Strategy

### Phase 1: Foundation (Week 1)
- [x] Remove outdated patterns
- [ ] Set up new directory structure
- [ ] Implement auth with middleware
- [ ] Create base layouts

### Phase 2: Core Features (Week 2)
- [ ] Convert pages to RSC
- [ ] Implement server actions
- [ ] Add i18n support
- [ ] Role-based routing

### Phase 3: Integration (Week 3)
- [ ] Connect to backend APIs
- [ ] Implement caching strategy
- [ ] Add error boundaries
- [ ] Performance optimization

### Phase 4: Polish (Week 4)
- [ ] Complete UI components
- [ ] Add loading states
- [ ] Implement analytics
- [ ] Documentation

## Benefits of New Architecture

1. **Performance**: 70% less JavaScript, faster initial load
2. **SEO**: Full SSR with metadata API
3. **Developer Experience**: Type safety, clear patterns
4. **Maintainability**: Clear separation of concerns
5. **Scalability**: Easy to add features and languages
6. **Security**: Server-side auth, validated inputs

## Conclusion

This architecture provides a modern, scalable foundation for the Pika dashboard that leverages the latest React and Next.js features while maintaining excellent developer experience and performance.