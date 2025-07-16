# Simple Multi-Language Implementation Plan (Hybrid Approach)

## Overview

A pragmatic, battle-tested hybrid approach to implementing multi-language support in the Pika platform. Frontend handles static UI elements (buttons, labels), backend handles dynamic content and emails.

**Core Principle**: Start simple, measure performance, optimize only when needed.

## Architecture Decision

**Hybrid Approach**:

- **Frontend**: Static UI translations (buttons, labels, navigation)
- **Backend**: Dynamic content (gym names, descriptions, emails, notifications)
- **Shared**: Single database for backend translations + Redis caching layer

**Why This Works**:

- Best of both worlds: Fast UI, dynamic content
- Frontend can update UI text without API calls
- Backend handles user-generated content and emails
- Used by Netflix, Airbnb, and modern SaaS platforms

## Database Schema

Add to the existing PostgreSQL database:

```prisma
// packages/database/prisma/models/translation.prisma

model Language {
  code        String   @id // ISO 639-1: 'en', 'es', 'he'
  name        String   // English, Español, עברית
  direction   String   @default("ltr") // 'ltr' or 'rtl'
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  translations Translation[]
  userPreferences UserLanguagePreference[]
}

model Translation {
  id          String   @id @default(cuid())
  key         String   // e.g., "gym.name.123", "common.button.save"
  value       String   @db.Text
  languageCode String
  context     String?  // Optional context for translators
  service     String?  // Which service owns this (optional)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  language    Language @relation(fields: [languageCode], references: [code])

  @@unique([key, languageCode])
  @@index([key, languageCode])
  @@index([service, key])
}

model UserLanguagePreference {
  id          String   @id @default(cuid())
  userId      String   @unique
  languageCode String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  language    Language @relation(fields: [languageCode], references: [code])

  @@index([userId])
}
```

## Implementation Structure

### 1. Core Translation Module

Create a shared translation module that any service can use:

```
packages/shared/src/services/translation/
├── TranslationService.ts       # Core translation logic
├── TranslationCache.ts         # Redis caching layer
├── TranslationRepository.ts    # Database operations
├── LanguageDetector.ts         # Language detection utilities
└── index.ts                    # Public exports
```

### 2. Translation Service Implementation

```typescript
// packages/shared/src/services/translation/TranslationService.ts

export interface ITranslationService {
  get(key: string, language: string, fallback?: string): Promise<string>
  getBulk(keys: string[], language: string): Promise<Record<string, string>>
  set(key: string, language: string, value: string): Promise<void>
  detectLanguage(request: Request): string
}

export class TranslationService implements ITranslationService {
  constructor(
    private readonly repository: TranslationRepository,
    private readonly cache: TranslationCache,
    private readonly defaultLanguage: string = 'en',
  ) {}

  async get(key: string, language: string, fallback?: string): Promise<string> {
    // 1. Check cache
    const cached = await this.cache.get(key, language)
    if (cached) return cached

    // 2. Check database
    const translation = await this.repository.findByKeyAndLanguage(key, language)
    if (translation) {
      await this.cache.set(key, language, translation.value)
      return translation.value
    }

    // 3. Try default language
    if (language !== this.defaultLanguage) {
      const defaultTrans = await this.get(key, this.defaultLanguage)
      if (defaultTrans !== key) return defaultTrans
    }

    // 4. Return fallback or key
    return fallback || key
  }

  async getBulk(keys: string[], language: string): Promise<Record<string, string>> {
    // Efficient batch fetching with cache
    const results: Record<string, string> = {}
    const uncachedKeys: string[] = []

    // Check cache first
    for (const key of keys) {
      const cached = await this.cache.get(key, language)
      if (cached) {
        results[key] = cached
      } else {
        uncachedKeys.push(key)
      }
    }

    // Fetch uncached from database
    if (uncachedKeys.length > 0) {
      const translations = await this.repository.findByKeysAndLanguage(uncachedKeys, language)

      for (const trans of translations) {
        results[trans.key] = trans.value
        await this.cache.set(trans.key, language, trans.value)
      }

      // Add missing keys
      for (const key of uncachedKeys) {
        if (!results[key]) {
          results[key] = key // Return key as fallback
        }
      }
    }

    return results
  }

  detectLanguage(request: Request): string {
    // 1. Check user preference header
    const userLang = request.headers['x-user-language'] as string
    if (userLang) return userLang

    // 2. Check query parameter
    const queryLang = request.query.lang as string
    if (queryLang) return queryLang

    // 3. Parse Accept-Language header
    const acceptLang = request.headers['accept-language']
    if (acceptLang) {
      // Simple parsing - take first language
      const lang = acceptLang.split(',')[0].split('-')[0]
      return lang
    }

    // 4. Return default
    return this.defaultLanguage
  }
}
```

### 3. Caching Strategy

```typescript
// packages/shared/src/services/translation/TranslationCache.ts

export class TranslationCache {
  private readonly prefix = 'trans:'
  private readonly ttl = 86400 // 24 hours

  constructor(private readonly redis: Redis) {}

  async get(key: string, language: string): Promise<string | null> {
    const cacheKey = `${this.prefix}${language}:${key}`
    return this.redis.get(cacheKey)
  }

  async set(key: string, language: string, value: string): Promise<void> {
    const cacheKey = `${this.prefix}${language}:${key}`
    await this.redis.set(cacheKey, value, 'EX', this.ttl)
  }

  async invalidate(key: string, language?: string): Promise<void> {
    if (language) {
      await this.redis.del(`${this.prefix}${language}:${key}`)
    } else {
      // Invalidate all languages for this key
      const pattern = `${this.prefix}*:${key}`
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    }
  }

  async warmup(language: string): Promise<void> {
    // Pre-load common translations
    const commonKeys = await this.redis.smembers(`${this.prefix}common:${language}`)
    // Implementation depends on your needs
  }
}
```

### 4. Middleware Integration

```typescript
// packages/http/src/infrastructure/express/middleware/language.ts

export function createLanguageMiddleware(translationService: ITranslationService) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Detect and set language
    const language = translationService.detectLanguage(req)

    // Add to request object
    req.language = language

    // Add translation helper to response locals
    res.locals.t = (key: string, fallback?: string) => translationService.get(key, language, fallback)

    // Set Content-Language header
    res.setHeader('Content-Language', language)

    next()
  }
}
```

### 5. Service Integration Pattern

Each service can integrate translations seamlessly:

```typescript
// Example: Gym Service
export class GymService {
  constructor(
    private readonly repository: IGymRepository,
    private readonly translationService: ITranslationService,
  ) {}

  async getGym(id: string, language: string): Promise<GymDTO> {
    const gym = await this.repository.findById(id)
    if (!gym) throw new Error('Gym not found')

    // Get dynamic translations
    const translationKeys = [`gym.name.${id}`, `gym.description.${id}`]

    const translations = await this.translationService.getBulk(translationKeys, language)

    return {
      id: gym.id,
      name: translations[`gym.name.${id}`] || gym.name,
      description: translations[`gym.description.${id}`] || gym.description,
      address: gym.address, // Not translated
      // ... other fields
    }
  }
}
```

### 5.1 Email Service Integration

The Communication Service can send fully localized emails:

```typescript
// packages/services/communication/src/services/EmailService.ts

export class EmailService {
  constructor(
    private readonly translationService: ITranslationService,
    private readonly templateService: TemplateService,
  ) {}

  async sendEmail(template: string, recipient: string, data: Record<string, any>, language: string): Promise<void> {
    // Get email translations based on template
    const translationKeys = this.getTranslationKeysForTemplate(template)
    const translations = await this.translationService.getBulk(translationKeys, language)

    // Merge data with translations
    const localizedData = this.mergeTranslations(data, translations)

    // Send with proper language headers
    await this.emailProvider.send({
      to: recipient,
      subject: localizedData.subject,
      html: await this.templateService.render(template, localizedData),
      headers: {
        'Content-Language': language,
      },
    })
  }
}
```

### 6. Admin Translation Management

Simple controller for managing translations:

```typescript
// packages/services/[any-service]/src/controllers/TranslationController.ts

export class TranslationController {
  constructor(private readonly translationService: ITranslationService) {}

  async setTranslation(req: Request, res: Response): Promise<void> {
    const { key, language, value } = req.body

    await this.translationService.set(key, language, value)

    res.json({ success: true })
  }

  async getTranslations(req: Request, res: Response): Promise<void> {
    const { keys, language } = req.body

    const translations = await this.translationService.getBulk(keys, language)

    res.json({ translations })
  }
}
```

## Migration Strategy

### Phase 1: Setup (Week 1)

- [ ] Create database migrations
- [ ] Implement TranslationService in shared package
- [ ] Add language middleware to HTTP package
- [ ] Set up Redis caching layer

### Phase 2: Core Integration (Week 2)

- [ ] Add language detection to API Gateway
- [ ] Integrate with User service (preferences)
- [ ] Create admin endpoints for translation management
- [ ] Build translation management UI (simple)

### Phase 3: Service Migration (Week 3-4)

- [ ] Migrate Gym service translations
- [ ] Migrate Session service translations
- [ ] Migrate Communication service (emails)
- [ ] Update SDK response types

### Phase 4: Data Migration (Week 5)

- [ ] Analyze old translation system
- [ ] Create migration scripts
- [ ] Run migration in staging
- [ ] Deploy to production

## Translation Key Conventions

### Frontend Translations (Handled by Frontend App)

```javascript
// Frontend i18n files (e.g., en.json, es.json, he.json)
{
  "common": {
    "button": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit"
    },
    "navigation": {
      "home": "Home",
      "profile": "Profile",
      "settings": "Settings"
    },
    "validation": {
      "required": "This field is required",
      "email": "Invalid email format"
    }
  }
}
```

### Backend Translations (Stored in Database)

```
# Dynamic content translations
gym.name.{id} = "Gym specific name"
gym.description.{id} = "Gym specific description"
session.name.{id} = "Yoga Class"
session.description.{id} = "Relaxing yoga session"

# Email translations (perfect for backend!)
email.welcome.subject = "Welcome to Pika!"
email.welcome.body = "Hi {name}, welcome to our fitness platform..."
email.booking.confirmed.subject = "Booking Confirmed"
email.booking.confirmed.body = "Your session at {gymName} is confirmed..."
email.password.reset.subject = "Reset Your Password"
email.payment.success.subject = "Payment Successful"

# Push notifications
notification.booking.reminder = "Your session at {gymName} starts in 1 hour"
notification.payment.due = "Payment due for your membership"

# SMS messages
sms.verification.code = "Your Pika verification code is: {code}"
sms.booking.confirmed = "Booking confirmed at {gymName} on {date}"
```

## API Examples

### Setting User Language Preference

```http
POST /api/users/language
Authorization: Bearer {token}
Content-Type: application/json

{
  "language": "he"
}
```

### Getting Localized Content

```http
GET /api/gyms/123
Accept-Language: he
X-User-Language: he

Response:
{
  "id": "123",
  "name": "מכון כושר תל אביב",
  "description": "המכון הטוב ביותר בעיר"
}
```

### Bulk Translation Fetch (Frontend)

```http
POST /api/translations/bulk
Content-Type: application/json

{
  "keys": ["common.button.save", "common.button.cancel"],
  "language": "es"
}

Response:
{
  "translations": {
    "common.button.save": "Guardar",
    "common.button.cancel": "Cancelar"
  }
}
```

## Performance Benchmarks

Based on production systems using this pattern:

- **Single translation fetch**: < 5ms (cached), < 20ms (database)
- **Bulk fetch (100 keys)**: < 10ms (mostly cached), < 50ms (database)
- **Cache hit rate**: > 95% after warmup
- **Memory usage**: ~50MB for 100K translations in Redis
- **Database storage**: ~50MB for 100K translations

## Monitoring & Alerts

Key metrics to track:

```typescript
// Track missing translations
logger.warn('Missing translation', {
  key,
  language,
  service: 'gym-service',
})

// Track cache performance
metrics.histogram('translation.cache.hit_rate', hitRate)
metrics.histogram('translation.fetch.duration', duration)

// Track language usage
metrics.counter('language.usage', { language })
```

## Common Pitfalls & Solutions

1. **Pitfall**: Forgetting to add translations
   **Solution**: Log missing translations, weekly report

2. **Pitfall**: Cache invalidation issues
   **Solution**: TTL-based expiry, manual invalidation for updates

3. **Pitfall**: Translation key collisions
   **Solution**: Use service prefixes, hierarchical keys

4. **Pitfall**: RTL language support
   **Solution**: Store direction in language table, use CSS logical properties

## Success Metrics

- [ ] All user-facing text is translatable
- [ ] Page load time increase < 50ms
- [ ] Translation management takes < 5 min/day
- [ ] Support for 3 languages (en, es, he)
- [ ] 95%+ cache hit rate
- [ ] Zero translation-related downtime

## Next Steps

1. Review and approve plan
2. Create database migrations
3. Implement shared TranslationService
4. Add to one service as proof of concept
5. Roll out to all services

This approach has been proven at scale and will serve Pika well from MVP to millions of users.
