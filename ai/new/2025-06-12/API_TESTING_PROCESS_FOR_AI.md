# API Testing Process for AI

This document is specifically designed for AI assistants to quickly test Pika API endpoints without needing to understand the authentication process.

## 🚀 Quick Start - AI Test Script

Use `scripts/ai-api-test.js` for instant API testing:

```bash
# Basic usage - test any endpoint
node scripts/ai-api-test.js /api/v1/bookings

# Test with different roles
node scripts/ai-api-test.js /api/v1/bookings --role admin
node scripts/ai-api-test.js /api/v1/bookings --role provider

# Test different HTTP methods
node scripts/ai-api-test.js /api/v1/bookings --method POST --data '{"serviceId":"123"}'
node scripts/ai-api-test.js /api/v1/bookings/47ed5897-f03e-4ad5-8b79-02c3b1c38e1b --method PATCH --data '{"notes":"Updated"}'

# Get help
node scripts/ai-api-test.js --help
```

**The script automatically:**

- ✅ Generates valid JWT tokens
- ✅ Uses correct local environment settings
- ✅ Includes predefined test user IDs
- ✅ Provides clear success/failure feedback

## 📋 Prerequisites

Ensure services are running:

```bash
yarn docker:local      # Start databases
yarn local:generate    # Setup database
yarn local            # Start all services
```

## 🧪 Common Testing Scenarios

### 1. Test RBAC (Role-Based Access Control)

```bash
# Customer sees only their bookings (3 total)
node scripts/ai-api-test.js /api/v1/bookings --role customer

# Admin sees all bookings (53+ total)
node scripts/ai-api-test.js /api/v1/bookings --role admin

# Customer tries to access another's booking (should fail with 403)
node scripts/ai-api-test.js /api/v1/bookings/f5fd9745-3909-4901-beae-1ebefbb3baba --role customer
```

### 2. Test CRUD Operations

```bash
# CREATE - Add new booking
node scripts/ai-api-test.js /api/v1/bookings --method POST --data '{
  "serviceId": "12345678-1234-5678-1234-567812345678",
  "sessionDate": "2024-02-01",
  "sessionTime": "10:00",
  "notes": "Test booking"
}'

# READ - Get specific booking
node scripts/ai-api-test.js /api/v1/bookings/47ed5897-f03e-4ad5-8b79-02c3b1c38e1b

# UPDATE - Modify booking
node scripts/ai-api-test.js /api/v1/bookings/47ed5897-f03e-4ad5-8b79-02c3b1c38e1b --method PATCH --data '{
  "sessionTime": "14:00"
}'

# DELETE - Remove booking
node scripts/ai-api-test.js /api/v1/bookings/47ed5897-f03e-4ad5-8b79-02c3b1c38e1b --method DELETE
```

### 3. Test Other Endpoints

```bash
# Categories
node scripts/ai-api-test.js /api/v1/categories
node scripts/ai-api-test.js /api/v1/categories/123

# Services
node scripts/ai-api-test.js /api/v1/services
node scripts/ai-api-test.js /api/v1/services --role provider

# Users
node scripts/ai-api-test.js /api/v1/users/profile
node scripts/ai-api-test.js /api/v1/users --role admin

# Pagination
node scripts/ai-api-test.js "/api/v1/bookings?page=2&limit=10" --role admin

# Filtering
node scripts/ai-api-test.js "/api/v1/bookings?status=CONFIRMED" --role admin
```

## 📊 Predefined Test Data

### Test Users

| Role     | User ID                                | Email                | Description      |
| -------- | -------------------------------------- | -------------------- | ---------------- |
| Customer | `46ab8859-dae5-4737-8dfd-48381aa7b5cb` | customer@example.com | Has 3 bookings   |
| Admin    | `admin-user-123`                       | admin@example.com    | Full access      |
| Provider | `provider-user-123`                    | provider@example.com | Service provider |

### Customer's Test Bookings

- `47ed5897-f03e-4ad5-8b79-02c3b1c38e1b` (own booking - accessible)
- `a8af5c45-8c24-41e3-8aca-1bbadfa26d7a` (own booking - accessible)
- `e2c8b1f0-9e6d-4a5b-8c7f-1e4d8a5b2c3e` (own booking - accessible)
- `f5fd9745-3909-4901-beae-1ebefbb3baba` (other's booking - forbidden)

## 🎯 AI Testing Workflow

When asked to test an API:

1. **Use the AI test script directly**:

   ```bash
   node scripts/ai-api-test.js <endpoint> [options]
   ```

2. **Interpret the results**:
   - ✅ **200-299**: Request successful
   - 🚫 **403**: Access denied (RBAC working)
   - ❌ **401**: Authentication failed
   - ❓ **404**: Resource not found
   - ⚠️ **500+**: Server error

3. **Example testing sequence**:

   ```bash
   # Test if RBAC is working
   node scripts/ai-api-test.js /api/v1/bookings --role customer
   # Expected: 3 bookings

   node scripts/ai-api-test.js /api/v1/bookings/f5fd9745-3909-4901-beae-1ebefbb3baba --role customer
   # Expected: 403 Forbidden
   ```

## 🛠️ Troubleshooting

### Services Not Running

```bash
# Check service health
curl http://localhost:8000/health
curl http://localhost:4001/health

# Restart services
yarn kill && yarn local
```

### Database Issues

```bash
yarn db:migrate
yarn db:seed
```

### Token Issues

The AI test script handles tokens automatically. If manual testing needed:

- JWT Secret: `a3f2c1b4d5e6f7890a1b2c3d4e5f67890abcdeffedcba0987654321fedcba0987`
- Token expires after 1 hour

## 📝 Response Formats

### Success Response

```json
{
  "data": [...],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

### Error Response

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You can only view your own bookings"
}
```

## 🎯 Quick Reference

```bash
# Most common test - verify RBAC
node scripts/ai-api-test.js /api/v1/bookings --role customer  # Should see 3
node scripts/ai-api-test.js /api/v1/bookings --role admin     # Should see 53+

# Test specific booking access
node scripts/ai-api-test.js /api/v1/bookings/47ed5897-f03e-4ad5-8b79-02c3b1c38e1b  # Customer's own - OK
node scripts/ai-api-test.js /api/v1/bookings/f5fd9745-3909-4901-beae-1ebefbb3baba  # Other's - Forbidden

# Get valid service IDs for testing
node scripts/ai-api-test.js /api/v1/services
```

---

**Note for AI**: This document and the `ai-api-test.js` script are your primary tools for API testing. The script handles all authentication complexity, so you can focus on testing the actual endpoints and verifying behavior.
