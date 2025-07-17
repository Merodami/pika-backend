# Provider Service Internal API

## Overview

The Provider Service exposes internal endpoints for service-to-service communication. These endpoints are protected by service authentication and are not accessible to external clients.

## Authentication

All internal endpoints require service authentication using the following headers:

- `x-api-key`: The service API key (configured via `SERVICE_API_KEY` environment variable)
- `x-service-name`: The name of the calling service
- `x-service-id`: A unique identifier for the calling service instance

## Endpoints

### GET /internal/users/:user_id/provider

Retrieves provider information by user ID.

**Parameters:**

- `user_id` (path): UUID of the user

**Response:**

- `200 OK`: Provider information found
  ```json
  {
    "id": "string",
    "userId": "string",
    "businessName": { "en": "string", "es": "string", "gn": "string" },
    "businessDescription": { "en": "string", "es": "string", "gn": "string" },
    "categoryId": "string",
    "verified": boolean,
    "active": boolean,
    "avgRating": number,
    "createdAt": "string",
    "updatedAt": "string"
  }
  ```
- `404 Not Found`: User does not have a provider profile
  ```json
  {
    "error": "Provider not found",
    "message": "User does not have a service provider profile"
  }
  ```

### GET /internal/health

Health check endpoint for internal monitoring.

**Response:**

- `200 OK`:
  ```json
  {
    "status": "healthy",
    "service": "provider-internal",
    "timestamp": "2025-06-19T22:00:00.000Z"
  }
  ```

## Usage Example

```typescript
// Using the ProviderServiceClient from @helpi/shared
import { ProviderServiceClient } from '@helpi/shared'

const providerClient = new ProviderServiceClient()
const provider = await providerClient.getProviderByUserId(userId)
```

## Security Considerations

- Internal endpoints are only accessible within the service mesh
- Service authentication is required for all requests
- No user JWT tokens are accepted on internal endpoints
- All requests are logged with service identity for audit trails
