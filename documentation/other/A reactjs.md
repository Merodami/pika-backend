# React Best Practices - Dashboard Project

## 🎯 Core Principles

### 1. Single Source of Truth for Types & Validation

**Pattern**: All validation schemas and types come from backend packages
**File**: `/lib/validations/auth.ts:11-83`

```typescript
// ✅ CORRECT - Import from shared packages
import { authFrontend, authPublic, shared } from '@merodami/pika-api'

// ❌ WRONG - Never create local schemas
const LoginSchema = z.object({...}) // DON'T DO THIS
```

**Why**:

- Ensures frontend/backend consistency
- Type safety across the entire stack
- Single place to update validation rules
- Prevents drift between frontend and backend

### 2. Custom Hooks for Business Logic

**Pattern**: Extract complex logic into custom hooks
**Files**: `/hooks/useLocalizedRouter.ts`, `/hooks/useDataGrid.ts`

```typescript
// Custom hook for localized navigation
export function useLocalizedRouter() {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale || 'es'

  const push = useCallback(
    (href: string) => {
      if (href.match(/^\/[a-z]{2}(\/|$)/)) {
        router.push(href)
      } else {
        router.push(`/${locale}${href}`)
      }
    },
    [router, locale],
  )

  return { push, replace, prefetch, locale }
}
```

**Why**:

- Reusable logic across components
- Easier testing in isolation
- Cleaner component code
- Better separation of concerns

### 3. Performance Optimization with Memoization

**Pattern**: Use React.memo, useMemo, and useCallback strategically
**File**: `/hooks/useDataGrid.ts:92-100`

```typescript
// Memoize expensive computations
const serverQueryParams = useMemo<ServerQueryParams>(() => {
  const params: ServerQueryParams = {}

  if (enableServerSide) {
    params.page = pagination.pageIndex + 1
    params.limit = pagination.pageSize
  }

  // ... expensive filtering logic
  return params
}, [pagination, sorting, columnFilters, globalFilter])

// Debounce expensive operations
const debouncedSearch = useMemo(
  () =>
    debounce((value: string) => {
      setGlobalFilter(value)
    }, debounceMs),
  [debounceMs],
)
```

**Why**:

- Prevents unnecessary re-renders
- Optimizes expensive computations
- Reduces API calls with debouncing
- Improves overall performance

### 4. Form Handling with React Hook Form + Zod

**Pattern**: Combine React Hook Form with Zod for type-safe forms
**File**: `/app/[locale]/(auth)/login/loginForm.tsx:79-91`

```typescript
const {
  control,
  handleSubmit,
  formState: { errors },
} = useForm<LoginFormInput, unknown, LoginFormOutput>({
  resolver: zodResolver(LoginFormSchema),
  defaultValues: formDrafts['login'] || {
    email: '',
    password: '',
    rememberMe: false,
  },
})
```

**Why**:

- Type-safe form validation
- Better performance (uncontrolled components)
- Less re-renders
- Built-in error handling

### 5. State Management with Zustand

**Pattern**: Use Zustand for client-side global state
**File**: `/store/app.store.ts:29-77`

```typescript
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'light',
      formDrafts: {},

      saveFormDraft: (formId: string, data: Record<string, any>) =>
        set((state) => ({
          formDrafts: { ...state.formDrafts, [formId]: data },
        })),
    }),
    {
      name: 'pika-app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        formDrafts: state.formDrafts,
      }),
    },
  ),
)
```

**Why**:

- Simpler than Redux
- Built-in persistence
- TypeScript support out of the box
- Minimal boilerplate
- Selective state persistence

### 6. Component Composition Pattern

**Pattern**: Use composition for flexible, reusable components
**File**: `/components/auth/authFormWrapper.tsx`

```typescript
interface AuthFormWrapperProps {
  children: React.ReactNode
  error: string | null
  success: string | null
  onSubmit: (e: React.FormEvent) => void
}

export function AuthFormWrapper({
  children,
  error,
  success,
  onSubmit,
}: AuthFormWrapperProps) {
  return (
    <Form onSubmit={onSubmit}>
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}
      {children}
    </Form>
  )
}
```

**Why**:

- Flexible component design
- Reduces prop drilling
- Better component reusability
- Cleaner component APIs

### 7. Error Boundaries for Resilience

**Pattern**: Wrap features in error boundaries
**File**: Component error handling pattern

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}
```

**Why**:

- Prevents entire app crashes
- Better user experience
- Error tracking and monitoring
- Graceful degradation

### 8. Data Fetching with TanStack Table

**Pattern**: Use TanStack Table for complex data grids
**File**: `/components/ui/DataGrid/DataGrid.tsx:49-80`

```typescript
const table = useReactTable({
  data,
  columns,
  state: {
    sorting: state.sorting,
    columnFilters: state.columnFilters,
    pagination: state.pagination,
  },
  enableRowSelection: true,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
})
```

**Why**:

- Powerful table features out of the box
- Excellent performance with large datasets
- Built-in virtualization support
- Flexible and customizable

### 9. Internationalization with next-intl

**Pattern**: Use next-intl for translations
**File**: All components using `useTranslations`

```typescript
export function LoginForm() {
  const t = useTranslations('auth.login')
  const tErrors = useTranslations('errors')

  return (
    <Button>{t('button')}</Button>
  )
}
```

**Why**:

- Type-safe translations
- Server and client support
- Automatic locale detection
- Lazy loading of translations

### 10. TypeScript Strict Mode

**Pattern**: Use strict TypeScript configuration

```typescript
// Use discriminated unions for state
type LoadingState = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: User } | { status: 'error'; error: string }

// Use const assertions for literals
const ROLES = ['admin', 'business', 'user'] as const
type Role = (typeof ROLES)[number]
```

**Why**:

- Catches errors at compile time
- Better IntelliSense support
- Self-documenting code
- Safer refactoring

## 📋 Component Checklist

When creating a new React component:

- [ ] Use TypeScript with proper types
- [ ] Import validation schemas from `@merodami/pika-api`
- [ ] Use `'use client'` directive only when needed
- [ ] Extract complex logic to custom hooks
- [ ] Use React Hook Form for forms
- [ ] Implement proper error handling
- [ ] Add loading states
- [ ] Use translations from next-intl
- [ ] Memoize expensive computations
- [ ] Handle edge cases (empty states, errors)

## 🚫 Anti-Patterns to Avoid

### 1. Creating Local Validation Schemas

```typescript
// ❌ NEVER DO THIS
const EmailSchema = z.string().email()

// ✅ ALWAYS DO THIS
import { shared } from '@merodami/pika-api'
const { Email } = shared
```

### 2. Direct API Calls in Components

```typescript
// ❌ WRONG
function Component() {
  useEffect(() => {
    fetch('/api/users') // Don't do this
  }, [])
}

// ✅ CORRECT - Use server actions or API hooks
function Component() {
  const { data } = useUsers() // Custom hook
}
```

### 3. Inline Functions in JSX

```typescript
// ❌ WRONG - Creates new function on every render
<button onClick={() => handleClick(id)}>Click</button>

// ✅ CORRECT - Use useCallback
const handleButtonClick = useCallback(() => {
  handleClick(id)
}, [id])
<button onClick={handleButtonClick}>Click</button>
```

### 4. Using useState for Everything

```typescript
// ❌ WRONG - Too many useState calls
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)
const [data, setData] = useState(null)

// ✅ CORRECT - Use reducer for complex state
const [state, dispatch] = useReducer(dataReducer, initialState)
```

### 5. Not Handling Loading States

```typescript
// ❌ WRONG
function UserList() {
  const users = useUsers()
  return <div>{users.map(...)}</div>
}

// ✅ CORRECT
function UserList() {
  const { data: users, loading, error } = useUsers()

  if (loading) return <Skeleton />
  if (error) return <ErrorMessage />
  if (!users?.length) return <EmptyState />

  return <div>{users.map(...)}</div>
}
```

## 🎨 Component Organization

```
/components
  /ui              # Generic, reusable UI components
    - Button.tsx
    - Input.tsx
    - DataGrid/

  /features        # Feature-specific components
    /user
      - UserTable.tsx
      - UserForm.tsx
    /business
      - BusinessList.tsx

  /layouts         # Layout components
    - DashboardLayout.tsx
    - AuthLayout.tsx
```

## 🧪 Testing Best Practices

### 1. Test User Behavior, Not Implementation

```typescript
// ✅ Good test
it('should display error when login fails', async () => {
  render(<LoginForm />)

  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'wrong')
  await userEvent.click(screen.getByRole('button', { name: 'Login' }))

  expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
})
```

### 2. Use MSW for API Mocking

```typescript
const handlers = [
  rest.post('/api/login', (req, res, ctx) => {
    return res(ctx.status(401), ctx.json({ error: 'Invalid credentials' }))
  }),
]
```

### 3. Test Accessibility

```typescript
it('should be accessible', async () => {
  const { container } = render(<LoginForm />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## 🔧 Development Tools

### Essential Extensions

- React Developer Tools
- Redux DevTools (works with Zustand)
- TypeScript Error Lens
- ESLint
- Prettier

### Performance Monitoring

- React DevTools Profiler
- Lighthouse
- Web Vitals tracking

### Debugging

```typescript
// Use React DevTools profiler
<Profiler id="LoginForm" onRender={onRenderCallback}>
  <LoginForm />
</Profiler>

// Track performance metrics
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'
```

## 📚 Resources

- [React Documentation](https://react.dev)
- [React Hook Form](https://react-hook-form.com)
- [Zustand](https://docs.pmnd.rs/zustand)
- [TanStack Table](https://tanstack.com/table)
- [next-intl](https://next-intl-docs.vercel.app)
- [Zod](https://zod.dev)

---

Remember: **Consistency is key**. Follow these patterns throughout the codebase for maintainability and team collaboration.
