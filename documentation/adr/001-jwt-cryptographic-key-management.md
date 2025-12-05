# ADR-001: JWT Cryptographic Key Management with Runtime Caching

## Status

Accepted

## Context

The application faced critical issues with JWT authentication in production and local environments:

1. **String Manipulation Hell**: RSA keys were being manipulated as strings throughout the codebase with various formats:
   - Base64 encoded keys (Vercel production)
   - PEM format with escaped newlines (`\n`)
   - Single-line PEM format
   - Multi-line PEM format

2. **Performance Issues**: Every JWT operation involved:
   - Reading environment variables
   - String parsing and validation
   - Format conversion
   - Key preparation

3. **Error-Prone**: Different environments handled keys differently, leading to authentication failures

4. **Production Impact**: Users couldn't log in due to key format mismatches

## Decision

### 1. Cryptographic Algorithm: RS256

We decided to use **RS256 (RSA-SHA256)** as our standard JWT signing algorithm:

- **Asymmetric encryption**: Separate keys for signing (private) and verification (public)
- **Industry standard**: Widely adopted, battle-tested
- **Security**: More secure than HS256 for distributed systems
- **Key rotation**: Easier to rotate keys without breaking existing tokens
- **Microservices ready**: Public key can be shared across services

### 2. Key Management Pattern: Runtime Caching with KeyManager

Implemented a **singleton KeyManager** class that:

- **Loads once**: Keys are loaded from environment variables at application startup
- **Validates once**: Uses `jose` library to validate and import keys
- **Caches forever**: Stores validated `KeyLike` objects in memory
- **Serves fast**: Direct memory access for all JWT operations

### 3. Key Storage Format

- **Production (Vercel)**: Base64-encoded PEM keys
- **Local Development**: Any format (base64, escaped newlines, PEM)
- **Runtime**: `jose` KeyLike objects (optimized binary format)

## Implementation

### KeyManager Architecture

```typescript
class KeyManager {
  private cache: Map<string, KeyLike | string>

  async initialize() {
    // Load keys once at startup
    // Validate with jose
    // Cache in memory
  }

  getJWTPrivateKey(): KeyLike {
    // Return cached key (nanoseconds)
  }
}
```

### JWT Service Integration

```typescript
class JwtTokenService {
  constructor() {
    if (!keyManager.isInitialized()) {
      throw new Error('KeyManager not initialized')
    }
  }

  private getSigningKey() {
    return keyManager.getJWTPrivateKey() // No string manipulation!
  }
}
```

### Library Choice: jose

Selected **jose v6.0.13** for cryptographic operations:

- **Modern**: Built for ES6/TypeScript
- **Zero dependencies**: Lightweight and fast
- **Standards compliant**: Full JOSE suite (JWT, JWS, JWE, JWK)
- **Type-safe**: Excellent TypeScript support
- **Node.js optimized**: Uses native crypto module

## Consequences

### Positive

- **Performance**: ~1000x faster (memory access vs string parsing)
- **Reliability**: Keys validated once at startup, fail fast
- **Maintainability**: No string manipulation throughout codebase
- **Type Safety**: Using `KeyLike` objects instead of strings
- **Extensibility**: Easy to add new key types (database connections, API clients)

### Negative

- **Memory Usage**: Keys stored in memory (negligible ~10KB)
- **Restart Required**: Key changes require application restart
- **Initialization Order**: KeyManager must initialize before JWT services

## Migration Path

1. **Phase 1**: Implement KeyManager with backward compatibility ✅
2. **Phase 2**: Update JwtTokenService to use KeyManager ✅
3. **Phase 3**: Add comprehensive tests ✅
4. **Phase 4**: Deploy to production
5. **Phase 5**: Remove legacy `prepareRSAKey` utilities

## Security Considerations

### Key Protection

- Keys never logged or exposed
- Validated at startup (fail fast)
- Stored as binary `KeyLike` objects (not strings)

### Algorithm Security

- **RS256**: 2048-bit RSA keys (minimum)
- **Future**: Consider RS384/RS512 for higher security
- **Rotation**: Plan for key rotation strategy

### Environment Security

- Production keys in Vercel environment variables
- Never commit keys to repository
- Use different keys for different environments

## Monitoring

### Metrics to Track

- KeyManager initialization time
- Cache hit rate (should be 100%)
- JWT signing/verification performance
- Key rotation events

### Health Checks

```typescript
app.get('/health', (req, res) => {
  const stats = keyManager.getStats()
  res.json({
    keyManager: {
      initialized: stats.initialized,
      keysLoaded: stats.keysLoaded,
    },
  })
})
```

## References

- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)
- [jose library documentation](https://github.com/panva/jose)
- [RS256 vs HS256](https://auth0.com/blog/rs256-vs-hs256-whats-the-difference/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## Decision Makers

- Development Team
- Security Team Review Pending

## Date

2024-12-25

## Notes

This ADR supersedes any previous JWT key handling approaches. The KeyManager pattern can be extended for other cryptographic needs (API keys, encryption keys, certificates).
