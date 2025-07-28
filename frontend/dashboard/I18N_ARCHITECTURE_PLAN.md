# Frontend i18n Architecture Plan

## Backend Language Analysis

### Supported Languages

- **Spanish (es)** - Default language
- **English (en)**
- **Guaraní (gn)** - Indigenous language of Paraguay

### Backend Implementation Details

1. **Language Detection Priority**:
   - `x-user-language` header (user preference)
   - `?lang=` query parameter
   - `Accept-Language` header
   - Default to Spanish (es)

2. **Translation System**:
   - Database-driven translations
   - Translation keys format: `category.subcategory.key` (e.g., `email.welcome.subject`)
   - User language preferences stored in DB
   - Support for RTL languages (direction field)

3. **API Responses**:
   - `Content-Language` header in responses
   - Translation keys returned for multilingual content
   - Frontend responsible for fetching translations

## Frontend i18n Architecture (Recommended)

### Technology Stack

**next-intl** - The industry standard for Next.js 15+

- Server Components support
- App Router optimized
- Built-in performance optimizations
- Type-safe translations

### Implementation Strategy

#### 1. URL Structure

```
/[locale]/dashboard
/[locale]/admin
/[locale]/business
```

Benefits:

- SEO friendly
- Clear language indication
- Easy sharing of localized URLs

#### 2. Translation Loading Strategy

**Hybrid Approach**:

1. **Static Translations**: UI strings, buttons, labels (bundled)
2. **Dynamic Translations**: Entity names, descriptions (from API)

```typescript
// Static translations (frontend)
{
  "common.button.save": "Save",
  "common.button.cancel": "Cancel",
  "dashboard.title": "Dashboard"
}

// Dynamic translations (from backend)
{
  "category.name.123": "Fitness",
  "voucher.title.456": "20% Off Gym Membership"
}
```

#### 3. Architecture Components

```
app/
├── [locale]/
│   ├── layout.tsx              // Locale provider
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── admin/
│   │   └── business/
│   └── api/
├── i18n/
│   ├── config.ts              // i18n configuration
│   ├── request.ts             // Server-side helpers
│   └── client.ts              // Client-side helpers
├── messages/
│   ├── en.json               // English translations
│   ├── es.json               // Spanish translations
│   └── gn.json               // Guaraní translations
└── middleware.ts             // Language detection & routing
```

#### 4. Language Detection Flow

```typescript
// middleware.ts
1. Check cookie for saved preference
2. Check Accept-Language header
3. Detect from URL
4. Default to Spanish (es)
```

#### 5. Key Features

1. **Automatic Language Switching**
   - Language selector in header
   - Persists to cookie & user preference

2. **Number & Date Formatting**

   ```typescript
   // Locale-aware formatting
   formatDate(date, locale) // 01/31/2024 (en) vs 31/01/2024 (es)
   formatCurrency(amount, locale) // $100.00 (en) vs 100,00 € (es)
   ```

3. **RTL Support**

   ```typescript
   // Automatic when Hebrew is selected
   <html dir={locale === 'he' ? 'rtl' : 'ltr'}>
   ```

4. **Translation Key Namespacing**
   ```typescript
   // Organized by feature
   t('auth.login.title')
   t('dashboard.metrics.revenue')
   t('vouchers.create.button')
   ```

#### 6. Type Safety

```typescript
// Generated types from translation files
type TranslationKeys =
  | 'common.button.save'
  | 'common.button.cancel'
  | 'dashboard.title'
// ... auto-generated

// Type-safe translation function
const t = useTranslations()
t('common.button.save') // ✅ Type-safe
t('invalid.key') // ❌ TypeScript error
```

#### 7. Performance Optimizations

1. **Translation Splitting**
   - Load only necessary translations per page
   - Lazy load admin translations for admin users

2. **Caching Strategy**
   - Static translations: Bundled at build time
   - Dynamic translations: React Query with 24h cache

3. **Server Components**
   - Translations loaded server-side
   - No client-side hydration needed for static text

#### 8. Integration with Backend

```typescript
// Sync language preference
async function updateUserLanguage(locale: Locale) {
  await fetch('/api/user/language', {
    method: 'PUT',
    headers: {
      'x-user-language': locale,
    },
  })
}

// Fetch dynamic translations
async function getEntityTranslations(keys: string[], locale: Locale) {
  return await fetch(`/api/translations?keys=${keys.join(',')}&lang=${locale}`)
}
```

## Implementation Status

### ✅ Phase 1: Core Setup (COMPLETED)

- ✅ Install next-intl
- ✅ Set up routing structure with `[locale]` dynamic routes
- ✅ Create language switcher component
- ✅ Implement middleware for locale detection

### ✅ Phase 2: Static Translations (COMPLETED)

- ✅ Create translation files (en.json, es.json, gn.json)
- ✅ Translate common UI elements (auth, dashboard, navigation)
- ✅ Set up i18n configuration and request handling

### 🔄 Phase 3: Dynamic Integration (IN PROGRESS)

- ⏳ Connect to backend translation API (planned)
- ⏳ Implement caching strategy for dynamic content
- ⏳ Handle entity translations (vouchers, categories)

### 📋 Phase 4: Polish (PLANNED)

- ⏳ RTL support testing
- ⏳ Number/date formatting enhancement
- ⏳ Performance optimization
- ✅ Documentation updated

## Current Implementation Details

### Implemented Features

1. **URL-based Routing**: `/[locale]/dashboard` structure working
2. **Server Components**: Using `getTranslations()` from next-intl/server
3. **Client Components**: Using `useTranslations()` hook
4. **Middleware**: Automatic locale detection and routing
5. **Language Switcher**: Smooth transitions with soft navigation
6. **Workspace Integration**: Frontend properly registered in monorepo

### Files Created/Modified

```
frontend/dashboard/
├── app/[locale]/                    # ✅ Localized routes
│   ├── layout.tsx                   # ✅ Locale provider
│   ├── (auth)/login/page.tsx        # ✅ Localized auth
│   └── (dashboard)/                 # ✅ Localized dashboard
├── i18n/
│   ├── config.ts                    # ✅ Locale configuration
│   └── request.ts                   # ✅ Server request handling
├── messages/
│   ├── en.json                      # ✅ English translations
│   ├── es.json                      # ✅ Spanish translations
│   └── gn.json                      # ✅ Guaraní translations
├── components/ui/languageSwitcher.tsx # ✅ Language selector
├── store/app.store.ts               # ✅ Language preference state
└── middleware.ts                    # ✅ Locale detection
```

## Benefits

1. **SEO Optimized**: Separate URLs per language
2. **Performance**: Server-side rendering of translations
3. **Type Safety**: Full TypeScript support
4. **User Experience**: Seamless language switching
5. **Maintainable**: Clear separation of concerns
6. **Scalable**: Easy to add new languages

## Migration Impact

- No breaking changes to existing code
- Progressive enhancement approach
- Can be implemented alongside existing features

## Dynamic Language Switching Strategy

### Industry Standard Options

#### 1. URL-Based (SEO Friendly)

- **Pattern**: `/en/dashboard` → `/es/dashboard`
- **Pros**: SEO benefits, shareable links, server-side rendered
- **Cons**: Requires navigation, potential form state loss

#### 2. Client-Side Dynamic (No Refresh)

- **Pattern**: Change locale in context, re-render components
- **Pros**: Instant updates, preserves form state
- **Cons**: No SEO benefit, larger bundle size

### Recommended: Hybrid Approach

```typescript
// Modern implementation with next-intl
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function changeLanguage(locale: string) {
    // Soft navigation preserves React state
    startTransition(() => {
      router.replace(pathname, { locale })
    })

    // Update backend preference
    updateUserLanguagePreference(locale)
  }

  return (
    <Select
      onChange={changeLanguage}
      loading={isPending}
      options={[
        { value: 'es', label: '🇪🇸 Español' },
        { value: 'en', label: '🇺🇸 English' },
        { value: 'gn', label: '🇵🇾 Guaraní' }
      ]}
    />
  )
}
```

### Form State Preservation

```typescript
// Preserve form data during language switch
export function usePreservedFormState() {
  const saveFormState = () => {
    const formData = new FormData(formElement)
    sessionStorage.setItem('form-draft', JSON.stringify(formData))
  }

  const restoreFormState = () => {
    const saved = sessionStorage.getItem('form-draft')
    if (saved) {
      // Restore form values after navigation
      sessionStorage.removeItem('form-draft')
    }
  }

  return { saveFormState, restoreFormState }
}
```

### Implementation Details

1. **URL Structure**: `/[locale]/path` for all routes
2. **Soft Navigation**: Using Next.js router with transitions
3. **State Preservation**: Warning dialogs for unsaved changes
4. **Loading States**: Smooth transitions with loading indicators
5. **Persistence**: Cookie + backend user preference

### Benefits of Hybrid Approach

- ✅ SEO optimization with locale in URL
- ✅ Shareable localized links
- ✅ Smooth UX with soft navigation
- ✅ Server-side rendering benefits
- ✅ Progressive enhancement
- ✅ Preserves most React state
- ✅ Works with back/forward browser navigation
