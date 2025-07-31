import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { defaultLocale, locales } from './i18n/config'

// Create the i18n middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
})

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('Middleware: Processing path:', pathname)

  // Get locale preference from header (sent by client)
  const preferredLocale = request.headers.get('x-preferred-locale')

  // Apply intl middleware
  const response = intlMiddleware(request)

  // Extract locale from pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // Get the pathname without locale
  const pathnameWithoutLocale = pathnameHasLocale
    ? pathname.slice(3) // Remove /xx/
    : pathname

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  )

  // Modern auth check: Look for token in multiple places
  const accessToken =
    request.cookies.get('pika-access-token') ||
    request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!isPublicRoute && !accessToken) {
    // Get locale for redirect (prefer stored locale, then pathname, then default)
    const locale =
      preferredLocale ||
      (pathnameHasLocale ? pathname.substring(1, 3) : defaultLocale)

    // Redirect to login if no token
    const url = new URL(`/${locale}/login`, request.url)

    url.searchParams.set('from', pathname)

    return NextResponse.redirect(url)
  }

  // Add security headers
  const headers = new Headers(response.headers)

  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // CSP header for production
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' " +
        (process.env.NEXT_PUBLIC_API_URL || '') +
        '; ' +
        "frame-ancestors 'none';"
    )
  }

  return NextResponse.next({
    headers,
    request: {
      headers: request.headers,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|public|api).*)',
  ],
}
