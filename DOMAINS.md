# VoucherBook Domains & Infrastructure

## Production Domains

### API Endpoints

- **Main API**: `https://api.thevoucherbook.com`
- **API Version**: v1 (`https://api.thevoucherbook.com/api/v1`)
- **Health Check**: `https://api.thevoucherbook.com/health`
- **API Documentation**: `https://api.thevoucherbook.com/docs` (if enabled)

### Web Applications

- **Admin/Business Dashboard**: `https://dashboard.thevoucherbook.com`
  - Admin panel for platform management
  - Business portal for voucher management
  - Analytics and reporting interface
- **Customer Web App**: `https://thevoucherbook.com` (coming soon)
  - Public-facing website
  - Customer voucher browsing
  - Account management

- **Flutter App Web**: `https://app.thevoucherbook.com`
  - Progressive Web App (PWA) version
  - Mobile web experience
  - Deep linking target for mobile apps
  - App download landing page

### Mobile Applications

- **iOS App**: [App Store Link] (coming soon)
- **Android App**: [Play Store Link] (coming soon)

---

## Development/Staging Domains

### API Endpoints

- **Dev API**: `https://dev.api.thevoucherbook.com`
- **API Version**: v1 (`https://dev.api.thevoucherbook.com/api/v1`)
- **Health Check**: `https://dev.api.thevoucherbook.com/health`
- **API Documentation**: `https://dev.api.thevoucherbook.com/docs` (if enabled)

### Web Applications

- **Dev Admin/Business Dashboard**: `https://dev.dashboard.thevoucherbook.com`
  - Testing environment for admin features
  - Business portal development
  - QA and staging tests

- **Dev Customer Web**: `https://dev.thevoucherbook.com` (coming soon)
  - Development version of public site
  - Feature testing
  - Preview environment

- **Dev Flutter App Web**: `https://dev.app.thevoucherbook.com`
  - Development PWA version
  - Mobile web testing
  - Deep linking development
  - Beta testing environment

---

## Domain Architecture

```
┌─────────────────────────────────────────┐
│          Production Environment          │
├─────────────────────────────────────────┤
│                                         │
│  api.thevoucherbook.com                │
│    ├── /api/v1/auth                    │
│    ├── /api/v1/vouchers                │
│    ├── /api/v1/businesses              │
│    ├── /api/v1/users                   │
│    └── /api/v1/categories              │
│                                         │
│  dashboard.thevoucherbook.com          │
│    ├── /admin/*                        │
│    ├── /business/*                     │
│    └── /analytics/*                    │
│                                         │
│  app.thevoucherbook.com                │
│    ├── /                               │
│    ├── /download                       │
│    ├── /deeplink/*                     │
│    └── /voucher/*                      │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│        Development Environment           │
├─────────────────────────────────────────┤
│                                         │
│  dev.api.thevoucherbook.com            │
│    └── (same structure as production)   │
│                                         │
│  dev.dashboard.thevoucherbook.com      │
│    └── (same structure as production)   │
│                                         │
│  dev.app.thevoucherbook.com            │
│    └── (same structure as production)   │
│                                         │
└─────────────────────────────────────────┘
```

---

## SSL/TLS Configuration

All domains use HTTPS with:

- **SSL Provider**: Let's Encrypt / Vercel
- **TLS Version**: 1.2+ minimum
- **HSTS**: Enabled with 1-year max-age
- **Certificate Auto-renewal**: Yes

---

## DNS Configuration

### Production DNS Records

| Type  | Name      | Value                | TTL |
| ----- | --------- | -------------------- | --- |
| A     | api       | Vercel IP            | 300 |
| A     | dashboard | Vercel IP            | 300 |
| A     | app       | Vercel IP            | 300 |
| A     | @         | Vercel IP            | 300 |
| CNAME | www       | cname.vercel-dns.com | 300 |

### Development DNS Records

| Type  | Name          | Value                | TTL |
| ----- | ------------- | -------------------- | --- |
| CNAME | dev.api       | cname.vercel-dns.com | 300 |
| CNAME | dev.dashboard | cname.vercel-dns.com | 300 |
| CNAME | dev.app       | cname.vercel-dns.com | 300 |
| CNAME | dev           | cname.vercel-dns.com | 300 |

---

## CORS Configuration

### Production API CORS

```javascript
allowedOrigins: ['https://dashboard.thevoucherbook.com', 'https://app.thevoucherbook.com', 'https://thevoucherbook.com', 'https://www.thevoucherbook.com']
```

### Development API CORS

```javascript
allowedOrigins: [
  'https://dev.dashboard.thevoucherbook.com',
  'https://dev.app.thevoucherbook.com',
  'https://dev.thevoucherbook.com',
  'http://localhost:3000', // Local development
  'http://localhost:3001', // Local admin dashboard
  'http://localhost:5173', // Vite dev server
  'http://localhost:8080', // Flutter web dev server
]
```

---

## Environment Variables

### Production

```env
API_URL=https://api.thevoucherbook.com
DASHBOARD_URL=https://dashboard.thevoucherbook.com
FLUTTER_APP_URL=https://app.thevoucherbook.com
APP_URL=https://thevoucherbook.com
NODE_ENV=production
```

### Development

```env
API_URL=https://dev.api.thevoucherbook.com
DASHBOARD_URL=https://dev.dashboard.thevoucherbook.com
FLUTTER_APP_URL=https://dev.app.thevoucherbook.com
APP_URL=https://dev.thevoucherbook.com
NODE_ENV=development
```

---

## API Endpoints by Domain

### Authentication Endpoints

- **Production**: `https://api.thevoucherbook.com/api/v1/auth`
- **Development**: `https://dev.api.thevoucherbook.com/api/v1/auth`

### Voucher Endpoints

- **Production**: `https://api.thevoucherbook.com/api/v1/vouchers`
- **Development**: `https://dev.api.thevoucherbook.com/api/v1/vouchers`

### Popular Searches (NEW)

- **Production**: `https://api.thevoucherbook.com/api/v1/vouchers/search/popular`
- **Development**: `https://dev.api.thevoucherbook.com/api/v1/vouchers/search/popular`

### Business Endpoints

- **Production**: `https://api.thevoucherbook.com/api/v1/businesses`
- **Development**: `https://dev.api.thevoucherbook.com/api/v1/businesses`

### User Endpoints

- **Production**: `https://api.thevoucherbook.com/api/v1/users`
- **Development**: `https://dev.api.thevoucherbook.com/api/v1/users`

### Category Endpoints

- **Production**: `https://api.thevoucherbook.com/api/v1/categories`
- **Development**: `https://dev.api.thevoucherbook.com/api/v1/categories`

---

## Deployment Infrastructure

### Hosting Providers

- **API**: Vercel (Serverless Functions)
- **Dashboard**: Vercel (Next.js)
- **Database**: PostgreSQL (Supabase/Railway)
- **Redis**: Upstash
- **File Storage**: AWS S3
- **CDN**: Vercel Edge Network

### Monitoring & Analytics

- **Error Tracking**: Sentry
- **Analytics**: Google Analytics / Mixpanel
- **Uptime Monitoring**: Better Uptime / Pingdom
- **Logging**: Vercel Logs / Datadog

---

## Security Headers

All domains implement these security headers:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

---

## Rate Limiting

### API Rate Limits

- **Production**: 100 requests/minute per IP
- **Development**: 500 requests/minute per IP
- **Authenticated**: 1000 requests/minute per user

### Dashboard Rate Limits

- **Login Attempts**: 5 attempts per 15 minutes
- **API Calls**: Inherits from API limits

---

## Webhook Endpoints

### Stripe Webhooks

- **Production**: `https://api.thevoucherbook.com/api/v1/webhooks/stripe`
- **Development**: `https://dev.api.thevoucherbook.com/api/v1/webhooks/stripe`

### Other Integrations

- Coming soon...

---

## Mobile App Configuration

### iOS

```swift
struct Environment {
    static let productionAPI = "https://api.thevoucherbook.com"
    static let developmentAPI = "https://dev.api.thevoucherbook.com"
}
```

### Android

```kotlin
object Environment {
    const val PRODUCTION_API = "https://api.thevoucherbook.com"
    const val DEVELOPMENT_API = "https://dev.api.thevoucherbook.com"
}
```

### Flutter

```dart
class Environment {
  static const String productionApi = 'https://api.thevoucherbook.com';
  static const String developmentApi = 'https://dev.api.thevoucherbook.com';

  static const String productionDashboard = 'https://dashboard.thevoucherbook.com';
  static const String developmentDashboard = 'https://dev.dashboard.thevoucherbook.com';

  static const String productionApp = 'https://app.thevoucherbook.com';
  static const String developmentApp = 'https://dev.app.thevoucherbook.com';
}
```

---

## Contact & Support

- **Technical Issues**: tech@thevoucherbook.com
- **Domain Management**: admin@thevoucherbook.com
- **Security Issues**: security@thevoucherbook.com

---

## Change Log

| Date       | Change                                       | Environment    |
| ---------- | -------------------------------------------- | -------------- |
| 2025-08-27 | Initial domain setup                         | All            |
| 2025-08-27 | Added popular searches endpoint              | API            |
| 2025-08-27 | Added app.thevoucherbook.com for Flutter web | Production/Dev |
| TBD        | Customer web app launch                      | Production     |
| TBD        | Mobile app store links                       | Mobile         |

---

## Notes

- All development domains are protected with basic authentication during beta
- Production domains require proper JWT authentication
- API versioning follows `/api/v1/` pattern
- Health checks don't require authentication
- Webhook endpoints bypass JWT for signature verification
