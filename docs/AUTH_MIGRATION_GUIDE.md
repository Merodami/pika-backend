# Authentication Migration Guide

This guide describes how to migrate from the current authentication implementation to industry-standard OAuth 2.0 patterns.

## Overview

The migration aligns our authentication with OAuth 2.0 (RFC 6749) and modern security standards while maintaining backward compatibility.

## Key Changes

### 1. Endpoint Standardization

#### Current Endpoints → OAuth 2.0 Endpoints

| Current              | New                      | Purpose          |
| -------------------- | ------------------------ | ---------------- |
| `POST /auth/login`   | `POST /oauth/token`      | Get access token |
| `POST /auth/refresh` | `POST /oauth/token`      | Refresh token    |
| `POST /auth/logout`  | `POST /oauth/revoke`     | Revoke token     |
| `GET /auth/me`       | `GET /oauth/userinfo`    | Get user info    |
| -                    | `POST /oauth/introspect` | Validate token   |

### 2. Request/Response Format Changes

#### Login → Token Request

**Before:**

```json
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": true
}
```

**After:**

```json
POST /oauth/token
{
  "grant_type": "password",
  "username": "user@example.com",
  "password": "password123",
  "scope": "read write"
}
```

#### Login Response → Token Response

**Before:**

```json
{
  "user": {
    "id": "123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

**After:**

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJ...",
  "scope": "read write",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### 3. Frontend Session Interface

```typescript
// Old Session Interface
interface Session {
  user: User
  token: string // Deprecated
  refreshToken?: string
  error?: string
}

// New Session Interface (OAuth 2.0 compliant)
interface SessionState {
  authenticated: boolean
  user?: UserInfo
  access_token?: string // OAuth 2.0 standard field
  refresh_token?: string // OAuth 2.0 standard field
  expires_at?: number // Unix timestamp
  error?: string
}
```

## Migration Steps

### Phase 1: Backend Updates (Backward Compatible)

1. **Add OAuth endpoints** alongside existing auth endpoints
2. **Update token generation** to include standard OAuth fields
3. **Implement token introspection** for better security
4. **Add proper error responses** following OAuth 2.0 spec

### Phase 2: SDK Generation

1. **Generate new SDK** with OAuth schemas
2. **Update frontend types** to use OAuth-compliant interfaces
3. **Create adapter functions** for backward compatibility

### Phase 3: Frontend Migration

1. **Update API calls** to use new endpoints
2. **Update state management** to use new session structure
3. **Update token storage** and management
4. **Update error handling** for OAuth error responses

### Phase 4: Deprecation

1. **Mark old endpoints** as deprecated
2. **Log usage** of deprecated endpoints
3. **Notify clients** of deprecation timeline
4. **Remove old endpoints** after migration period

## Frontend Implementation Example

### Authentication Service

```typescript
import { TokenRequest, TokenResponse, SessionState } from '@pika/api-sdk'

class AuthService {
  private session: SessionState = {
    authenticated: false,
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const request: TokenRequest = {
        grant_type: 'password',
        username: email,
        password: password,
        scope: 'read write',
      }

      const response = await api.oauth.token(request)

      this.session = {
        authenticated: true,
        user: response.user,
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        expires_at: Date.now() + response.expires_in * 1000,
      }
    } catch (error) {
      this.session = {
        authenticated: false,
        error: error.error_description || 'Authentication failed',
      }
    }
  }

  async refreshToken(): Promise<void> {
    if (!this.session.refresh_token) {
      throw new Error('No refresh token available')
    }

    const request: TokenRequest = {
      grant_type: 'refresh_token',
      refresh_token: this.session.refresh_token,
    }

    const response = await api.oauth.token(request)

    this.session = {
      ...this.session,
      access_token: response.access_token,
      refresh_token: response.refresh_token || this.session.refresh_token,
      expires_at: Date.now() + response.expires_in * 1000,
    }
  }

  async logout(): Promise<void> {
    if (this.session.access_token) {
      await api.oauth.revoke({
        token: this.session.access_token,
        token_type_hint: 'access_token',
      })
    }

    this.session = {
      authenticated: false,
    }
  }
}
```

### Token Interceptor

```typescript
// Axios interceptor example
axios.interceptors.request.use(
  (config) => {
    const session = authService.getSession()
    if (session.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        await authService.refreshToken()
        const session = authService.getSession()
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`
        return axios(originalRequest)
      } catch (refreshError) {
        authService.logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)
```

## Security Best Practices

1. **Token Storage**
   - Store tokens in memory or secure storage
   - Never store in localStorage for sensitive apps
   - Use httpOnly cookies for web apps when possible

2. **Token Rotation**
   - Implement automatic token refresh
   - Use short-lived access tokens (15-60 minutes)
   - Rotate refresh tokens on use

3. **PKCE for SPAs**
   - Implement PKCE for public clients
   - Use authorization code flow for OAuth providers

4. **Error Handling**
   - Never expose sensitive information in errors
   - Log security events for monitoring
   - Implement rate limiting on auth endpoints

## Testing

1. **Unit Tests**
   - Test all grant types
   - Test error scenarios
   - Test token expiration handling

2. **Integration Tests**
   - Test full authentication flow
   - Test token refresh flow
   - Test concurrent requests

3. **Security Tests**
   - Test invalid tokens
   - Test expired tokens
   - Test token revocation

## Monitoring

1. **Metrics to Track**
   - Login success/failure rates
   - Token refresh rates
   - Token expiration events
   - Deprecated endpoint usage

2. **Alerts**
   - High failure rates
   - Unusual token usage patterns
   - Security anomalies
