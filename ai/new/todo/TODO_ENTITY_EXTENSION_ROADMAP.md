# TODO: Entity Extension Roadmap for Pika API

## Overview

This document outlines a comprehensive roadmap for implementing entity extension patterns across the Pika API. Based on the successful implementation of `include_provider` for service endpoints, we've identified multiple high-value opportunities to reduce API calls and improve user experience.

## ✅ Already Implemented

### Service Routes (`include_provider`)

- **GET /vouchers** - ✅ Includes retailer and retailer profile information
- **GET /vouchers/:voucher_id** - ✅ Includes retailer and retailer profile information
- **Pattern Established**: Query parameter → Repository include → Mapper extension → API response
- **Test Coverage**: ✅ Comprehensive integration tests covering all scenarios

### Redemption Routes (Partial Implementation)

- **GET /redemptions** - ✅ Has `include_voucher`, `include_customer`, `include_review`
- **GET /redemptions/:redemption_id** - ✅ Has `include_voucher`, `include_customer`, `include_review`

### User Routes (Partial Implementation)

- **GET /users/:user_id** - ✅ Has `include_addresses`, `include_payment_methods`, `include_customer_profile`, `include_retailer_profile`

### Category Routes (Partial Implementation)

- **GET /categories/:category_id** - ✅ Has `include_children`

## 🎯 High Priority Extensions

### 1. Voucher Routes - Additional Extensions

**Estimated Effort**: Medium | **Business Value**: High

#### GET /vouchers & GET /vouchers/:voucher_id

```typescript
// New extensions to add
include_category = true // Category details & hierarchy
include_reviews = true // Reviews & ratings summary
include_availability = true // Retailer availability
include_stats = true // Redemption count, rating metrics
```

**Implementation Tasks**:

- [ ] Add `includeCategory` to `VoucherSearchQuery` and `GetVoucherQuery`
- [ ] Update `PrismaVoucherReadRepository.buildIncludeClause()` for category relation
- [ ] Update `VoucherMapper` to handle category data transformation
- [ ] Add category field to API schema and regenerate SDK
- [ ] Update sorting adapter to handle new include parameters
- [ ] Add integration tests for new extensions
- [ ] Update repository to include review aggregations when `include_reviews=true`
- [ ] Add availability lookup logic for `include_availability=true`

**Database Relations**:

```sql
Voucher.categoryId → Category
Voucher → Review (aggregations)
Voucher.retailerId → Retailer → Availability
```

### 2. Redemption Routes - Enhanced Extensions

**Estimated Effort**: Medium | **Business Value**: High

#### GET /redemptions & GET /redemptions/:redemption_id

```typescript
// New extensions to add (in addition to existing ones)
include_payment = true // Payment details & methods
include_retailer = true // Retailer info via voucher relation
include_category = true // Voucher category via voucher relation
include_retailer_profile = true // Full retailer profile
```

**Implementation Tasks**:

- [ ] Add `includePayment` to `RedemptionSearchQuery` and `GetRedemptionQuery`
- [ ] Update `PrismaRedemptionReadRepository.buildIncludeClause()` for payment relations
- [ ] Update `RedemptionMapper` to handle payment and nested retailer data
- [ ] Add payment and retailer fields to redemption API schema
- [ ] Regenerate SDK and update redemption types
- [ ] Add integration tests for payment and retailer inclusion
- [ ] Handle nested voucher → retailer → user relations

**Database Relations**:

```sql
Redemption.paymentId → Payment → PaymentMethod
Redemption.voucherId → Voucher → Retailer → User
Redemption.voucherId → Voucher → Category
```

### 3. User Routes - Activity Extensions

**Estimated Effort**: Medium-High | **Business Value**: High

#### GET /users/:user_id

```typescript
// New extensions to add (in addition to existing profiles/addresses)
include_recent_redemptions = true // Recent activity as customer/retailer
include_reviews_summary = true // Review statistics & recent reviews
include_active_vouchers = true // Vouchers offered (for retailers)
include_activity_stats = true // Redemption counts, ratings, etc.
```

**Implementation Tasks**:

- [ ] Add activity-related include parameters to `UserSearchQuery`
- [ ] Create aggregation queries for redemption history and review summaries
- [ ] Update `PrismaUserReadRepository` with complex include logic
- [ ] Update `UserMapper` to handle activity data transformation
- [ ] Add activity fields to user API schema
- [ ] Add role-based logic (retailer vs customer activity)
- [ ] Add pagination for activity data
- [ ] Add integration tests for activity extensions

**Database Relations**:

```sql
User → Redemption (as customer via customerId)
User → Retailer → Voucher → Redemption (as retailer)
User → Review (as reviewer)
Retailer → Review (received reviews)
```

## 🚀 Medium Priority Extensions

### 4. Category Routes - Marketplace Data

**Estimated Effort**: Medium | **Business Value**: Medium-High

#### GET /categories & GET /categories/:category_id

```typescript
// Extensions to add
include_vouchers = true // Vouchers in this category
include_retailers = true // Retailers in category
include_stats = true // Voucher count, retailer count, activity
include_parent = true // Parent category information (for breadcrumbs)
```

**Implementation Tasks**:

- [ ] Add voucher and retailer count aggregations to category queries
- [ ] Update `PrismaCategoryReadRepository` with voucher/retailer relations
- [ ] Add pagination for included vouchers/retailers
- [ ] Update `CategoryMapper` for nested data
- [ ] Add statistics calculation methods
- [ ] Add API schema updates for category extensions
- [ ] Add integration tests for marketplace data

### 5. Messaging Routes - Communication Context

**Estimated Effort**: Medium | **Business Value**: Medium

#### GET /conversations & GET /conversations/:conversation_id

```typescript
// Extensions to add
include_participants = true // Full participant user details
include_context_details = true // Related voucher/redemption info
include_unread_count = true // Per-conversation unread counts
include_last_message = true // Most recent message preview
```

**Implementation Tasks**:

- [ ] Add participant user lookup to conversation queries
- [ ] Add voucher/redemption context resolution
- [ ] Add unread message counting logic
- [ ] Update messaging schemas and mappers
- [ ] Add integration tests for conversation extensions

### 6. Notification Routes - Rich Context

**Estimated Effort**: Low-Medium | **Business Value**: Medium

#### GET /notifications

```typescript
// Extensions to add
include_entity_details = true // Details of referenced entities
include_sender = true // User who triggered notification
include_context = true // Full context (voucher, redemption, etc.)
```

**Implementation Tasks**:

- [ ] Add polymorphic entity resolution for notifications
- [ ] Update notification mapper for entity details
- [ ] Add sender user lookup
- [ ] Add integration tests for notification extensions

## 📋 Implementation Strategy

### Phase 1: Voucher Routes Enhancement (Weeks 1-2)

**Goal**: Complete the voucher entity extensions to provide comprehensive voucher data

1. **Week 1**: `include_category` implementation
   - Repository updates for category relations
   - Mapper updates for category data
   - API schema updates and SDK regeneration
   - Integration tests

2. **Week 2**: `include_reviews` and `include_stats` implementation
   - Review aggregation queries
   - Statistics calculation methods
   - Performance optimization for aggregations
   - Integration tests

### Phase 2: Redemption Routes Enhancement (Weeks 3-4)

**Goal**: Complete redemption context with payment and retailer data

1. **Week 3**: `include_payment` implementation
   - Payment relation mapping
   - Payment method details inclusion
   - Security considerations for payment data
   - Integration tests

2. **Week 4**: `include_retailer` via voucher relation
   - Nested voucher → retailer → user relations
   - Mapper updates for complex nesting
   - Integration tests

### Phase 3: User Activity Extensions (Weeks 5-6)

**Goal**: Rich user profiles with activity data

1. **Week 5**: Recent activity implementation
   - Booking history queries
   - Role-based activity filtering
   - Pagination for activity data

2. **Week 6**: Review and statistics extensions
   - Review summary aggregations
   - Activity statistics calculation
   - Integration tests

### Phase 4: Marketplace Enhancement (Weeks 7-8)

**Goal**: Category-based marketplace browsing

1. **Week 7**: Category statistics and relations
   - Voucher/retailer count aggregations
   - Parent/child category navigation
   - Performance optimization

2. **Week 8**: Category marketplace data
   - Voucher listings within categories
   - Retailer listings within categories
   - Integration tests

### Phase 5: Communication Context (Weeks 9-10)

**Goal**: Rich messaging and notification context

1. **Week 9**: Messaging extensions
   - Participant details in conversations
   - Context details for vouchers/redemptions
   - Unread count calculations

2. **Week 10**: Notification extensions
   - Entity detail resolution
   - Sender information inclusion
   - Integration tests

## 🔧 Technical Guidelines

### 1. Consistent Pattern Implementation

All entity extensions should follow the established pattern:

```typescript
// 1. Query Interface Update
interface EntitySearchQuery {
  includeRelatedEntity?: boolean
}

// 2. Repository Include Logic
private buildIncludeClause(includeRelated?: boolean) {
  const include: any = {}
  if (includeRelated) {
    include.relatedEntity = { /* relation config */ }
  }
  return include
}

// 3. Mapper Extension
static fromDocument(doc: EntityDocument): EntityDomain {
  // ... base mapping
  if (doc.relatedEntity) {
    domain.relatedEntity = /* transform relation */
  }
  return domain
}

// 4. API Schema Update
querystring: {
  include_related_entity: Type.Optional(Type.Union([Type.Boolean(), Type.String()]))
}

// 5. Integration Tests
it('should include related entity when include_related_entity=true', async () => {
  // Test implementation
})
```

### 2. Performance Considerations

- **Selective Loading**: Only fetch requested relations to avoid N+1 queries
- **Aggregation Optimization**: Use database-level aggregations for statistics
- **Caching Strategy**: Consider caching for frequently accessed relation data
- **Pagination**: Implement pagination for large related datasets (e.g., user bookings)

### 3. Security Guidelines

- **Access Control**: Respect existing permission models when including related data
- **Data Sensitivity**: Be cautious with payment data, personal information in relations
- **Role-Based Filtering**: Filter related data based on user roles and ownership

### 4. Testing Strategy

- **Integration Tests**: Each new extension needs comprehensive integration tests
- **Performance Tests**: Monitor query performance with relation loading
- **Security Tests**: Verify access control with related data inclusion
- **Backward Compatibility**: Ensure existing functionality remains unchanged

## 📊 Success Metrics

### Performance Metrics

- **API Call Reduction**: Target 30-50% reduction in API calls for common workflows
- **Response Time**: Keep 95th percentile response times under existing SLAs
- **Database Performance**: Monitor query execution times with relation loading

### Developer Experience Metrics

- **API Adoption**: Track usage of new include parameters
- **Error Reduction**: Monitor 4xx errors related to missing data
- **Documentation Usage**: Track API documentation views for entity extensions

### Business Metrics

- **User Experience**: Faster page load times, reduced loading states
- **Mobile Performance**: Reduced bandwidth usage on mobile clients
- **Support Tickets**: Reduction in API-related support requests

## 🚨 Risk Mitigation

### Technical Risks

- **Query Performance**: Implement query monitoring and optimization
- **Memory Usage**: Monitor application memory with large relation datasets
- **Database Load**: Implement connection pooling and query optimization

### Implementation Risks

- **Breaking Changes**: Maintain backward compatibility with existing API contracts
- **Test Coverage**: Ensure comprehensive test coverage for all new extensions
- **Documentation**: Keep API documentation updated with new capabilities

### Operational Risks

- **Deployment Strategy**: Use feature flags for gradual rollout of new extensions
- **Monitoring**: Implement comprehensive monitoring for new relation queries
- **Rollback Plan**: Ensure quick rollback capability for problematic extensions

---

## 📝 Notes

- This roadmap builds on the successful `include_provider` pattern implemented for service endpoints
- All entity extensions should follow the established patterns for consistency
- Performance and security considerations should be primary concerns throughout implementation
- Regular review and adjustment of priorities based on user feedback and analytics

**Last Updated**: December 2024  
**Next Review**: Q1 2025
