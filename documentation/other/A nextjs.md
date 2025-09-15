# Next.js Best Practices - Dashboard Project

## 🚀 App Router Architecture

### 1. Server Components by Default

**Pattern**: Use Server Components unless client interactivity is needed
**File**: `/app/[locale]/layout.tsx:1-37`

```typescript
// Server Component (default - no 'use client')
export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params
  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
```

**Why**:

- Smaller JavaScript bundle
- Better SEO and initial page load
- Direct database access possible
- Automatic code splitting
- No hydration overhead

### 2. Client Components Only When Needed

**Pattern**: Add `'use client'` only for interactivity
**File**: `/app/[locale]/(auth)/login/loginForm.tsx:1`

```typescript
'use client' // Only because we need useState, useForm, onChange

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  // Interactive form logic...
}
```

**When to use Client Components**:

- `useState`, `useEffect`, `useReducer`
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party libraries requiring browser
- Custom hooks using state/effects

### 3. Server Actions for Mutations

**Pattern**: Use Server Actions for data mutations
**File**: `/app/actions/auth.ts:14-100`

```typescript
'use server'

export async function login(data: z.infer<typeof TokenRequest>) {
  try {
    // Validate on server
    const validatedData = TokenRequest.parse(data)

    // Call API directly from server
    const tokenData = await authToken(validatedData)

    // Set cookies server-side (secure)
    await setTokens(tokenData.accessToken, tokenData.refreshToken)

    return { success: true, user: tokenData.user }
  } catch (error) {
    // Handle errors server-side
    return { error: 'Invalid credentials' }
  }
}
```

**Why**:

- Progressive enhancement
- Built-in CSRF protection
- Type-safe with TypeScript
- No API route boilerplate
- Direct database access

### 4. Middleware for Edge Logic

**Pattern**: Use middleware for auth, i18n, redirects
**File**: `/middleware.ts:22-40`

```typescript
export async function middleware(request: NextRequest) {
  // Skip Next.js internals
  if (pathname.includes('/_next/')) return

  // Compose middleware handlers
  return compose(
    withI18n, // Locale detection
    withAuth, // Authentication check
    withBusinessRegistration, // Business flow
    withSecurityHeaders, // Security headers
    withRateLimit, // Rate limiting
  )(request)
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
}
```

**Why**:

- Runs at the edge (fast)
- Before rendering (security)
- URL rewriting capability
- Cookie manipulation
- Geolocation detection

### 5. Parallel Data Fetching

**Pattern**: Fetch data in parallel, not sequentially
**File**: Server component pattern

```typescript
// ❌ WRONG - Sequential (slow)
async function Page() {
  const user = await getUser()
  const posts = await getPosts(user.id)
  const comments = await getComments(posts[0].id)
}

// ✅ CORRECT - Parallel (fast)
async function Page() {
  const [user, posts, comments] = await Promise.all([getUser(), getPosts(), getComments()])
}
```

**Why**:

- Reduces total loading time
- Better performance
- Optimal resource utilization

### 6. Dynamic Imports for Code Splitting

**Pattern**: Lazy load heavy components
**File**: Component loading pattern

```typescript
import dynamic from 'next/dynamic'

// Lazy load heavy components
const DataGrid = dynamic(
  () => import('@/components/ui/DataGrid'),
  {
    loading: () => <DataGridSkeleton />,
    ssr: false  // Only if component needs browser APIs
  }
)

// Lazy load with named export
const Chart = dynamic(
  () => import('@/components/charts').then(mod => mod.BarChart),
  { loading: () => <ChartSkeleton /> }
)
```

**Why**:

- Smaller initial bundle
- Faster page loads
- Load components on demand
- Better Core Web Vitals

### 7. Internationalization with next-intl

**Pattern**: URL-based locale routing
**File**: `/app/[locale]/layout.tsx:34-36`

```typescript
// Generate static params for all locales
export async function generateStaticParams() {
  return locales.map((locale: Locale) => ({ locale }))
}

// Middleware handles locale detection
export function middleware(request: NextRequest) {
  const locale = getLocaleFromPathname(pathname, defaultLocale)
  // Redirect if no locale in URL
  if (!pathname.startsWith(`/${locale}`)) {
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url))
  }
}
```

**Why**:

- SEO-friendly URLs
- Static generation support
- Automatic locale detection
- Server-side translations

### 8. Image Optimization

**Pattern**: Use next/image for automatic optimization
**File**: Image component usage

```typescript
import Image from 'next/image'

export function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="Company Logo"
      width={120}
      height={40}
      priority  // Load immediately for LCP
      placeholder="blur"  // Show blurred placeholder
      blurDataURL={logoBlurData}  // Base64 blur data
    />
  )
}
```

**Why**:

- Automatic format selection (WebP, AVIF)
- Responsive images
- Lazy loading by default
- Prevents layout shift
- Built-in optimization

### 9. Font Optimization

**Pattern**: Use next/font for optimal font loading
**File**: `/app/layout.tsx` pattern

```typescript
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

**Why**:

- No layout shift (CLS)
- Self-hosted fonts
- Automatic subsetting
- Preloading optimization
- CSS variable integration

### 10. Metadata and SEO

**Pattern**: Use generateMetadata for dynamic SEO
**File**: `/app/[locale]/(auth)/login/page.tsx:8-20`

```typescript
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.login' })

  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      locale,
    },
  }
}
```

**Why**:

- Dynamic meta tags
- Better SEO
- Social media previews
- Type-safe metadata

### 11. API Routes with Route Handlers

**Pattern**: Use Route Handlers for APIs
**File**: `/app/api/auth/logout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Clear auth cookies
    const response = NextResponse.json({ success: true })
    response.cookies.delete('access-token')
    response.cookies.delete('refresh-token')

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}

// Support specific HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
```

**Why**:

- Full control over response
- Streaming support
- Edge runtime compatible
- TypeScript support

### 12. Environment Variables

**Pattern**: Separate client/server env vars
**File**: Environment configuration

```typescript
// .env.local
DATABASE_URL=postgresql://...  # Server only
NEXT_PUBLIC_API_URL=https://api.example.com  # Client & Server

// Usage
// Server Component or API Route
const dbUrl = process.env.DATABASE_URL  // ✅ Works

// Client Component
const apiUrl = process.env.NEXT_PUBLIC_API_URL  // ✅ Works
const dbUrl = process.env.DATABASE_URL  // ❌ undefined
```

**Why**:

- Security (no secrets in browser)
- Clear separation
- Build-time validation
- Type safety with zod

### 13. Caching Strategies

**Pattern**: Use Next.js caching layers
**File**: Data fetching patterns

```typescript
import { unstable_cache } from 'next/cache'
import { cache } from 'react'

// Request memoization (per-request)
export const getUser = cache(async (id: string) => {
  const user = await db.user.findUnique({ where: { id } })
  return user
})

// Data cache (across requests)
export const getCachedPosts = unstable_cache(
  async (userId: string) => {
    return db.post.findMany({ where: { userId } })
  },
  ['posts'], // Cache key
  {
    revalidate: 60, // Revalidate after 60 seconds
    tags: ['posts'], // For on-demand revalidation
  },
)

// On-demand revalidation
import { revalidateTag, revalidatePath } from 'next/cache'

export async function createPost() {
  // Create post...
  revalidateTag('posts') // Invalidate cache
  revalidatePath('/posts') // Revalidate page
}
```

**Why**:

- Reduced database load
- Faster response times
- Automatic deduplication
- Granular cache control

### 14. Error Handling

**Pattern**: Use error.tsx and not-found.tsx
**File**: `/app/[locale]/error.tsx` pattern

```typescript
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}

// not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>404 - Page Not Found</h2>
      <Link href="/">Go home</Link>
    </div>
  )
}
```

**Why**:

- Graceful error handling
- Better UX
- Error boundary per route
- Automatic error logging

### 15. Loading States

**Pattern**: Use loading.tsx for instant loading states
**File**: `/app/[locale]/admin/loading.tsx`

```typescript
export default function Loading() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-12 w-48" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}
```

**Why**:

- Instant loading UI
- Better perceived performance
- Automatic Suspense boundaries
- No loading state logic in components

## 📁 File Structure Best Practices

```
/app
  /[locale]                 # i18n routing
    /(auth)                 # Route group (no URL impact)
      /login
        page.tsx           # Server Component
        loginForm.tsx      # Client Component
        loading.tsx        # Loading UI
        error.tsx          # Error boundary

    /(dashboard)
      /admin
        layout.tsx         # Nested layout
        page.tsx
        /users
          page.tsx
          [id]/
            page.tsx       # Dynamic route

  /api                     # API routes
    /auth
      /logout
        route.ts          # Route handler

  /actions                 # Server actions
    auth.ts
    users.ts

/components
  /ui                      # Shared components
  /features               # Feature components

/lib
  /api                    # API clients
  /utils                  # Utilities
  /validations           # Zod schemas

/middleware.ts            # Edge middleware
```

## 🔒 Security Best Practices

### 1. Server-Only Code

```typescript
import 'server-only' // Ensures file never runs on client

export async function getSecretData() {
  const secret = process.env.SECRET_KEY
  // This code only runs on server
}
```

### 2. CSRF Protection

```typescript
// Server Actions have built-in CSRF protection
'use server'

export async function deleteUser(id: string) {
  // Automatically protected against CSRF
}
```

### 3. Content Security Policy

```typescript
// middleware.ts
const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self';
`

response.headers.set('Content-Security-Policy', csp)
```

## ⚡ Performance Optimization

### 1. Static Generation

```typescript
// Generate static pages at build time
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({
    id: post.id,
  }))
}
```

### 2. Streaming SSR

```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      <Header />  {/* Renders immediately */}
      <Suspense fallback={<Loading />}>
        <SlowComponent />  {/* Streams when ready */}
      </Suspense>
    </>
  )
}
```

### 3. Partial Prerendering (Experimental)

```typescript
export const experimental_ppr = true

export default async function Page() {
  return (
    <>
      <StaticContent />  {/* Prerendered */}
      <Suspense fallback={<Loading />}>
        <DynamicContent />  {/* Rendered on request */}
      </Suspense>
    </>
  )
}
```

## 🚫 Anti-Patterns to Avoid

### 1. Using useEffect for Data Fetching

```typescript
// ❌ WRONG - Client-side fetching
function Page() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/data').then(...)
  }, [])
}

// ✅ CORRECT - Server Component
async function Page() {
  const data = await getData()
  return <div>{data}</div>
}
```

### 2. Putting Everything in Client Components

```typescript
// ❌ WRONG - Unnecessary client component
'use client'
export function StaticContent() {
  return <div>Static text</div>  // No interactivity needed
}

// ✅ CORRECT - Server Component
export function StaticContent() {
  return <div>Static text</div>
}
```

### 3. Not Using Suspense Boundaries

```typescript
// ❌ WRONG - No loading state
async function Page() {
  const data = await slowFetch()
  return <div>{data}</div>
}

// ✅ CORRECT - With Suspense
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncComponent />
    </Suspense>
  )
}
```

### 4. Blocking Data Fetches

```typescript
// ❌ WRONG - Sequential
const user = await getUser()
const posts = await getPosts(user.id)

// ✅ CORRECT - Parallel
const [user, posts] = await Promise.all([getUser(), getPosts()])
```

## 🧪 Testing Strategies

### 1. Component Testing

```typescript
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

// Test with providers
function renderWithProviders(component: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  )
}
```

### 2. Server Action Testing

```typescript
import { login } from '@/app/actions/auth'

describe('login action', () => {
  it('should return user on success', async () => {
    const result = await login({
      username: 'test@example.com',
      password: 'password',
    })

    expect(result.success).toBe(true)
    expect(result.user).toBeDefined()
  })
})
```

### 3. E2E Testing with Playwright

```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard')
})
```

## 🛠 Development Tools

### Essential Config Files

```json
// next.config.js
module.exports = {
  experimental: {
    typedRoutes: true,  // Type-safe Link href
    optimizePackageImports: ['lodash-es', 'antd'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}
```

### VSCode Settings

```json
{
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]]
}
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Playground](https://app-router.vercel.app)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)
- [Vercel Templates](https://vercel.com/templates)
- [Next.js Discord](https://nextjs.org/discord)

---

Remember: **Leverage the platform**. Use Next.js features to their fullest for optimal performance and developer experience.
