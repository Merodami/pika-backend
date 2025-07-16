# Stripe Mock Testing Guide

## Overview

This guide explains how to use stripe-mock for testing payment functionality in the Pika platform.

## What is stripe-mock?

stripe-mock is an official mock HTTP server that responds like the real Stripe API, maintained by Stripe themselves. It allows you to test Stripe integrations without making real API calls or using test mode API keys.

## Setup

### Local Development

1. **Start stripe-mock with Docker Compose**:

   ```bash
   yarn docker:local
   ```

   This starts PostgreSQL, Redis, and stripe-mock containers.

2. **Verify stripe-mock is running**:
   ```bash
   docker ps | grep stripe-mock
   curl http://localhost:12111/v1/charges
   ```

### Environment Configuration

The following environment variables control stripe-mock:

```env
STRIPE_MOCK_HOST=localhost
STRIPE_MOCK_PORT=12111
```

These are already configured in `.env`, `.env.local`, and `.env.test`.

## Writing Tests with stripe-mock

### 1. Basic Setup

```typescript
import { StripeMockHelper } from '@pika/tests'

// Wait for stripe-mock to be ready
await StripeMockHelper.waitForStripeMock()

// Create a Stripe instance configured for stripe-mock
const stripeInstance = StripeMockHelper.createMockStripeInstance()
```

### 2. Integration Test Example

```typescript
import { StripeMockHelper } from '@pika
import { createPaymentServer } from '../server.js'

describe('Payment Integration Tests', () => {
  let app: Express

  beforeAll(async () => {
    // Wait for stripe-mock
    await StripeMockHelper.waitForStripeMock()

    // Create server with stripe-mock instance
    const stripeInstance = StripeMockHelper.createMockStripeInstance()
    const { app: paymentApp } = await createPaymentServer({
      prisma: testDb.prisma,
      cacheService: new MemoryCacheService(),
      stripeInstance, // Inject stripe-mock
    })

    app = paymentApp
  })

  it('should create a product', async () => {
    const response = await request(app)
      .post('/products')
      .send({
        name: 'Test Product',
        description: 'Test Description',
      })
      .expect(201)

    expect(response.body.id).toMatch(/^prod_/)
  })
})
```

### 3. Unit Test Example

```typescript
describe('StripeService', () => {
  let stripeService: StripeService

  beforeAll(async () => {
    const stripeInstance = StripeMockHelper.createMockStripeInstance()
    stripeService = new StripeService(stripeInstance)
  })

  it('should create a customer', async () => {
    const customer = await stripeService.createCustomer('test@example.com', 'Test Customer')

    expect(customer.id).toMatch(/^cus_/)
    expect(customer.email).toBe('test@example.com')
  })
})
```

## Important Differences from Real Stripe API

### 1. Metadata Handling

stripe-mock may not always preserve metadata on objects. Tests should be flexible:

```typescript
// Instead of:
expect(product.metadata).toEqual({ key: 'value' })

// Use:
expect(product.metadata).toBeDefined()
```

### 2. Status Transitions

Some status transitions may behave differently:

```typescript
// Subscription cancellation may not immediately show as 'canceled'
expect(['active', 'canceled']).toContain(subscription.status)
```

### 3. Webhook Signatures

stripe-mock doesn't validate webhook signatures. In tests, you can use simplified webhook handling.

### 4. Data Persistence

stripe-mock resets data between connections. Each test run starts fresh.

## Testing Patterns

### 1. Service-to-Service Communication

When testing subscription service calling payment service:

```typescript
// In subscription service test
const mockPaymentClient = {
  createProduct: vi.fn().mockResolvedValue({ id: 'prod_test_123' }),
  createPrice: vi.fn().mockResolvedValue({ id: 'price_test_123' }),
}

const planService = new PlanService(planRepository, cacheService, mockPaymentClient)
```

### 2. End-to-End Testing

For full E2E tests with stripe-mock:

```typescript
// Start all services with stripe-mock
const paymentServer = await createPaymentServer({
  stripeInstance: StripeMockHelper.createMockStripeInstance(),
})

const subscriptionServer = await createSubscriptionServer({
  paymentClient: new PaymentServiceClient(paymentServerUrl),
})

// Test full flow
const plan = await createPlan() // Creates Stripe product & price
const subscription = await subscribeToPlan() // Uses Stripe subscription
```

## CI/CD Integration

stripe-mock is automatically included in GitHub Actions:

```yaml
services:
  stripe-mock:
    image: stripe/stripe-mock:latest
    ports:
      - 12111:12111
```

## Troubleshooting

### stripe-mock not responding

1. Check if container is running:

   ```bash
   docker ps | grep stripe-mock
   ```

2. Check logs:

   ```bash
   docker logs pika_stripe_mock
   ```

3. Restart containers:
   ```bash
   yarn docker:local:down
   yarn docker:local
   ```

### Tests timing out

Increase timeout for stripe-mock to start:

```typescript
await StripeMockHelper.waitForStripeMock({ maxRetries: 60 })
```

### Unexpected responses

Enable debug logging:

```typescript
const stripe = new Stripe('sk_test_123', {
  apiVersion: '2025-05-28.basil',
  host: 'localhost',
  port: 12111,
  protocol: 'http',
  telemetry: false,
  maxNetworkRetries: 0,
})
```

## Best Practices

1. **Always wait for stripe-mock** to be ready before running tests
2. **Use dependency injection** to pass stripe instances to services
3. **Keep tests independent** - don't rely on data from previous tests
4. **Mock service clients** for unit tests, use real stripe-mock for integration tests
5. **Be flexible with assertions** due to stripe-mock limitations

## Resources

- [stripe-mock GitHub](https://github.com/stripe/stripe-mock)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Pika Payment Service](../packages/services/payment/README.md)
