# Business Settings Management System

## Overview

The Business Settings Management System provides a comprehensive configuration framework that allows business owners to customize their preferences, operational parameters, and platform behavior. This system stores flexible JSON-based settings in the database, enabling businesses to tailor the VoucherBook platform to their specific needs.

## Architecture

### Data Storage

- **Location**: Settings are stored in the `Business.settings` field as a JSONB column in PostgreSQL
- **Structure**: Hierarchical JSON object with versioning support
- **Flexibility**: Schema-less design allows for easy addition of new settings without database migrations

### Clean Architecture Layers

```
Controller (HTTP) → Service (Business Logic) → Repository (Data Access)
                         ↓
                    Cache Layer (Redis)
```

## Core Components

### 1. Settings Categories

#### Store Settings

Configuration for basic business operations:

- **Timezone**: Business operating timezone
- **Currency**: Primary currency for transactions
- **Language**: Default language for communications
- **Refund Policy**: How refunds are handled
- **Payment Terms**: Payment processing terms

#### Payment Settings

Payment acceptance configuration:

- **Accepts Cash**: Whether cash payments are accepted
- **Accepts Card**: Credit/debit card acceptance
- **Accepts Transfer**: Bank transfer support
- **Accepts Mobile Payment**: Digital wallet support
- **Provides Invoice**: Invoice generation capability

#### Voucher Settings

Voucher management preferences:

- **Auto-approve Vouchers**: Automatic voucher approval
- **Default Validity Days**: Standard voucher expiration period
- **Max Active Vouchers**: Limit on concurrent active vouchers
- **Max Redemptions Per Customer**: Per-customer redemption limit
- **Requires Verification**: Verification requirement for redemptions
- **Minimum Purchase Amount**: Minimum voucher value
- **Show on Marketplace**: Marketplace visibility
- **Allow Sharing**: Social sharing permissions
- **Platform Commission Agreed**: Commission agreement status

#### Communication Settings

Customer interaction preferences:

- **Response Time Commitment**: Expected response timeframe
- **Auto-reply Enabled**: Automatic response activation
- **Auto-reply Message**: Custom automatic response text
- **Accepts WhatsApp**: WhatsApp communication support
- **Accepts SMS**: SMS messaging support

#### Analytics Settings

Dashboard and reporting configuration:

- **Dashboard View**: Simple or detailed view preference
- **Default Time Range**: Standard reporting period
- **Email Reports**: Automated report delivery
- **Report Frequency**: Report generation schedule

#### Branding Settings

Visual customization options:

- **Voucher Template**: Template selection for vouchers
- **Primary Color**: Brand color for customization
- **Show Logo on Vouchers**: Logo display preference

#### Notification Settings

Alert and notification preferences:

- **Voucher Claim Notifications**: Alerts for new claims
- **Voucher Redeem Notifications**: Redemption alerts
- **Expiring Voucher Notifications**: Expiration warnings
- **New Review Notifications**: Review alerts
- **Daily Summary**: Daily activity digest
- **Monthly Summary**: Monthly report compilation
- **Email Notifications**: Email alert toggle
- **Push Notifications**: Mobile push alerts
- **In-app Notifications**: Platform notification display

## API Endpoints

### Business Owner Endpoints

#### Get Settings

```http
GET /businesses/:id/settings
Authorization: Bearer {token}
```

**Response:**

```json
{
  "settings": {
    "version": "1.0",
    "store": {
      "timezone": "America/New_York",
      "currency": "USD",
      "primaryLanguage": "en",
      "refundPolicy": "store_credit",
      "paymentTerms": "immediate"
    },
    "payment": { ... },
    "voucher": { ... },
    "communication": { ... },
    "analytics": { ... },
    "branding": { ... },
    "notifications": { ... },
    "updatedAt": "2024-01-20T10:00:00Z"
  }
}
```

#### Update Settings

```http
PATCH /businesses/:id/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "store": {
    "timezone": "Europe/London",
    "currency": "GBP"
  },
  "voucher": {
    "autoApproveVouchers": true
  }
}
```

**Note**: Partial updates are supported - only send the sections you want to modify.

#### Reset Settings

```http
POST /businesses/:id/settings/reset
Authorization: Bearer {token}
Content-Type: application/json

{
  "sections": ["store", "payment"]  // Optional - omit to reset all
}
```

## Security & Permissions

### Authorization Model

- **Business Owners**: Can only manage settings for their own businesses
- **Ownership Verification**: Every request validates business ownership
- **Role-based Access**: Uses RBAC with `businesses:read:own` and `businesses:write:own` permissions

### Data Protection

- **No Sensitive Data**: Settings don't contain sensitive information (e.g., tax IDs, passwords)
- **Audit Trail**: All changes are logged with timestamps
- **Validation**: Settings are validated before persistence

## Implementation Details

### Default Values

When a business has no settings configured, the system provides sensible defaults:

- Timezone: America/New_York
- Currency: USD
- Language: English
- Auto-approve Vouchers: Disabled
- Default Validity: 30 days
- All notifications: Enabled

### Caching Strategy

- **Service Layer Caching**: Uses Redis with @Cache decorator
- **TTL**: Default cache time-to-live of 3600 seconds
- **Cache Invalidation**: Automatic invalidation on updates
- **Cache Key Pattern**: `business:settings:{businessId}`

### Validation Rules

- **Timezone**: Must be valid IANA timezone
- **Currency**: Must be supported currency code
- **Colors**: Must be valid hex color codes
- **Numeric Limits**:
  - Validity days: 1-365
  - Max vouchers: 1-1000
  - Min purchase: >= 0

### Error Handling

- **404 Not Found**: Business doesn't exist
- **403 Forbidden**: User doesn't own the business
- **400 Bad Request**: Invalid settings data
- **401 Unauthorized**: Missing or invalid authentication

## Migration & Compatibility

### Version Management

- Settings include a `version` field for future migrations
- Current version: "1.0"
- Backward compatibility maintained through version checks

### Adding New Settings

1. Update TypeScript interfaces in `@pika/types`
2. Add default values
3. Update validation logic
4. No database migration needed (JSONB field)

## Best Practices

### For Developers

1. **Always use the Service layer** - Never access settings directly from repository in controllers
2. **Validate before saving** - Use the validation helpers
3. **Maintain defaults** - Every setting should have a sensible default
4. **Cache appropriately** - Use caching for read-heavy operations
5. **Log changes** - Important setting changes should be logged

### For Business Owners

1. **Start with defaults** - Customize only what's necessary
2. **Test changes** - Verify settings work as expected
3. **Document customizations** - Keep track of why settings were changed
4. **Regular review** - Periodically review and update settings

## Integration Points

### Voucher Service

- Uses voucher settings for:
  - Auto-approval logic
  - Validity period calculation
  - Redemption limits
  - Marketplace visibility

### Communication Service

- Respects communication preferences for:
  - Response time SLAs
  - Auto-reply functionality
  - Channel selection (WhatsApp, SMS)

### Notification Service

- Honors notification settings for:
  - Alert distribution
  - Channel selection (email, push, in-app)
  - Summary generation

## Performance Considerations

### Database

- JSONB indexing for efficient queries
- Single field update instead of multiple columns
- Reduced JOIN operations

### Caching

- Redis caching reduces database load
- Cache warming on application start
- Distributed cache for multi-instance deployments

### API Design

- Partial updates minimize data transfer
- Batch operations for efficiency
- Compression for large settings objects

## Testing Strategy

### Unit Tests

- Repository layer: Database operations
- Service layer: Business logic and validation
- Controller layer: HTTP handling

### Integration Tests

- End-to-end workflow testing
- Permission verification
- Cache behavior validation
- Error scenario handling

### Coverage Areas

- Default value generation
- Setting merging logic
- Validation rules
- Cache invalidation
- Authorization checks

## Future Enhancements

### Planned Features

1. **Settings Templates**: Pre-configured templates for different business types
2. **Bulk Updates**: Update settings for multiple businesses (admin feature)
3. **Settings History**: Track and revert changes
4. **Import/Export**: Settings backup and restoration
5. **A/B Testing**: Test different settings configurations
6. **Settings Inheritance**: Parent-child business settings

### Potential Improvements

- GraphQL API support
- Real-time settings sync
- Settings recommendations based on business type
- Automated settings optimization
- Settings marketplace for sharing configurations

## Monitoring & Analytics

### Key Metrics

- Settings update frequency
- Most changed settings
- Default vs. custom ratio
- Validation failure rate
- Cache hit ratio

### Alerts

- Unusual setting changes
- Validation failures spike
- Cache invalidation issues
- Performance degradation

## Support & Troubleshooting

### Common Issues

1. **Settings not updating**: Check cache invalidation
2. **Validation errors**: Review enum values and limits
3. **Permission denied**: Verify business ownership
4. **Missing settings**: Check default value generation

### Debug Steps

1. Check application logs for errors
2. Verify database settings field content
3. Clear Redis cache if stale data suspected
4. Validate JWT token claims
5. Check service health endpoints

## Conclusion

The Business Settings Management System provides a robust, flexible, and secure way for businesses to customize their VoucherBook experience. By leveraging JSON storage, clean architecture principles, and comprehensive validation, the system ensures both flexibility for future growth and stability for current operations.
