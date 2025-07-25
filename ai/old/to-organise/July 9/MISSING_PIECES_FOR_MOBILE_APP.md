# Missing Pieces for Mobile App API Contract

## Overview

This document provides a detailed gap analysis between the legacy mobile app's API expectations and our current Solo60 API implementation. The mobile app must continue functioning with our new backend, requiring us to maintain full API compatibility.

## Analysis Approach

- Section-by-section comparison of MOBILE_APP_API_ANALYSIS.md against our current implementation
- Identification of missing endpoints, parameter mismatches, and response format differences
- Priority classification based on mobile app usage patterns
- Implementation recommendations for each gap

## Mobile App API Characteristics

- **Base URL**: https://api.solo60.com
- **Versions**: v1 (auth/legacy) and v2 (main functionality)
- **Auth**: Token-based with static API key
- **Content Types**: Primarily multipart/form-data, some JSON
- **Response Pattern**: Consistent `{ "return": boolean, "reason": string }` for operations

---

## 1. Authentication Routes Analysis

### Mobile App Requirements vs Current Implementation

#### 1.1 Login Endpoint

**Mobile App Expects**: `POST /v1/login`

```json
{
  "email": "string",
  "password": "string",
  "providerName": "",
  "providerId": ""
}
```

**Current Implementation**: `POST /api/v1/auth/token`

```json
{
  "grantType": "password",
  "username": "email",
  "password": "string",
  "scope": "optional"
}
```

**Gap Analysis**:

- ✅ Basic login functionality exists
- ❌ Different endpoint path (v1/login vs api/v1/auth/token)
- ❌ Different request format (OAuth2 vs custom)
- ❌ Missing social provider support (providerName, providerId)
- ❌ Response format mismatch (mobile expects user object with token field)

**Required Changes**:

1. Create adapter endpoint at `/v1/login` that translates to OAuth format
2. Add social provider support to authentication service
3. Transform OAuth response to match mobile app format

#### 1.2 Registration Endpoint

**Mobile App Expects**: `POST /v1/register`

```json
{
  "provider_name": "APP",
  "user_type_id": 1 | 2,
  "tags": [],
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "password": "string",
  "waiver_accept": 1,
  "provider_id": "",
  "mobile": "string",
  "dateOfBirth": "01/01/2000",
  "app_version": 2,
  "country_code": "string"
}
```

**Current Implementation**: `POST /api/v1/auth/register`

```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "optional",
  "dateOfBirth": "ISO date",
  "role": "MEMBER | PROFESSIONAL",
  "acceptTerms": true,
  "marketingConsent": "optional"
}
```

**Gap Analysis**:

- ✅ Core registration exists
- ❌ Different field names (snake_case vs camelCase)
- ❌ Missing fields: provider_name, provider_id, tags, app_version, country_code
- ❌ Different user type system (user_type_id vs role)
- ❌ Different waiver acceptance format
- ❌ Date format mismatch (DD/MM/YYYY vs ISO)
- ❌ Phone number format differs (separate country_code)

**Required Changes**:

1. Create adapter endpoint at `/v1/register`
2. Map user_type_id (1=MEMBER, 2=PROFESSIONAL)
3. Parse and convert date format
4. Handle country code separately from phone number
5. Store additional metadata (tags, app_version)

#### 1.3 Password Reset Flow

**Mobile App Expects**:

- `POST /v1/forgot_password` - Request reset
- `POST /v1/new_password` - Set new password

**Current Implementation**:

- `POST /api/v1/auth/forgot-password` ✅
- `POST /api/v1/auth/reset-password` ✅

**Gap Analysis**:

- ✅ Both endpoints exist
- ❌ Different paths
- ❌ Field naming differences

#### 1.4 Email Verification

**Mobile App Expects**: `POST /v1/resendMail`

**Current Implementation**: `POST /api/v1/auth/resend-verification`

**Gap Analysis**:

- ✅ Functionality exists
- ❌ Different endpoint path
- ❌ Possibly different request format

#### 1.5 Token Refresh

**Mobile App Expects**: `POST /v1/getToken` (currently commented out in mobile)

**Current Implementation**: OAuth2 refresh token grant at `/api/v1/auth/token`

**Gap Analysis**:

- ✅ Refresh functionality exists
- ❌ Different implementation approach
- ⚠️ Mobile app has this disabled - may not be critical

### Authentication Summary

**Critical Missing Components**:

1. Legacy endpoint adapters for v1 paths
2. Social login provider support
3. Response format transformations
4. Additional user metadata storage

---

## 2. User Management Routes Analysis

### Mobile App Requirements vs Current Implementation

#### 2.1 Get User Info

**Mobile App Expects**: `POST /v2/user/info`

**Current Implementation**: `GET /api/v1/users/me`

**Gap Analysis**:

- ✅ Endpoint exists
- ❌ Different HTTP method (POST vs GET)
- ❌ Different path
- ❌ Response format likely differs

#### 2.2 Photo Management

**Mobile App Expects**:

- `POST /v2/user/update-photo` with base64 image
- `POST /v2/user/delete-photo`

**Current Implementation**:

- `POST /api/v1/users/:id/avatar` (multipart upload)

**Gap Analysis**:

- ⚠️ Partial implementation
- ❌ No base64 support (expects multipart)
- ❌ No delete photo endpoint
- ❌ Different paths

#### 2.3 SMS Verification System

**Mobile App Expects**:

- `POST /v2/user/sms-pin/verify`
- `POST /v2/user/sms-pin/resend`

**Current Implementation**: ❌ Not found

**Gap Analysis**:

- ❌ Entire SMS verification system missing
- ❌ No SMS provider integration
- ❌ No PIN generation/validation logic

#### 2.4 Phone Number Management

**Mobile App Expects**:

- `POST /v2/user/change/number`
- Separate country code handling

**Current Implementation**: Can update via `PUT /api/v1/users/me`

**Gap Analysis**:

- ⚠️ Basic functionality exists
- ❌ No dedicated endpoint
- ❌ No country code separation
- ❌ No SMS verification for number changes

#### 2.5 Account Management

**Mobile App Expects**:

- `POST /v2/user/change/password`
- `POST /v2/user/delete` with deletion reason

**Current Implementation**:

- `POST /api/v1/auth/change-password` ✅
- `DELETE /api/v1/users/:id` (admin only)

**Gap Analysis**:

- ✅ Password change exists (different path)
- ❌ User self-deletion missing
- ❌ No deletion reason tracking

#### 2.6 Duplicate Checking

**Mobile App Expects**: `POST /v2/user/check-duplicates`

**Current Implementation**: ❌ Not found

**Gap Analysis**:

- ❌ No duplicate checking endpoint
- ❌ Important for registration flow

### User Management Summary

**Critical Missing Components**:

1. SMS verification service (major feature)
2. Base64 photo upload support
3. User self-deletion with reasons
4. Duplicate checking endpoint
5. Legacy endpoint adapters

---

## 3. Booking Routes Analysis (CORE FUNCTIONALITY)

### Mobile App Requirements vs Current Implementation

#### 3.1 Core Booking Operations

**Mobile App Expects**: Complex booking system with:

- Reservations with invites
- Duration-based pricing
- Credit consumption
- Waiting lists
- Session extensions

**Current Implementation**: Basic session/booking system exists but:

- ✅ Create/cancel bookings
- ✅ Basic reservation flow
- ⚠️ Limited pricing logic
- ❌ No invite system implementation
- ❌ No waiting list feature
- ❌ No session extension feature

#### 3.2 Detailed Endpoint Comparison

**Create Reservation**:

- Mobile: `POST /v2/booking/reservation`
- Current: `POST /api/v1/bookings/reservations`
- Gap: Missing invite system, duration options, reason field

**Check Price**:

- Mobile: `POST /v2/booking/check-price`
- Current: ❌ Not implemented
- Gap: Entire pricing calculation system missing

**Get Bookings**:

- Mobile: `GET /v2/bookings` (returns categorized lists)
- Current: `GET /api/v1/sessions` (basic list)
- Gap: Missing categorization (active, coming_soon, history, waiting_list)

**Session Management**:

- Mobile: End session, extra time request/confirm
- Current: Basic check-in/out only
- Gap: Missing end session and extra time features

**Invitations**:

- Mobile: Full invite system with accept/reject
- Current: Basic invitee management
- Gap: No invite workflow implementation

**Waiting List**:

- Mobile: Join/leave/accept waiting list
- Current: ❌ Not implemented
- Gap: Entire waiting list system missing

**Creator Bookings**:

- Mobile: Special booking type for content creators
- Current: ❌ Not implemented
- Gap: No creator-specific booking flow

**Feedback System**:

- Mobile: Rating with file uploads and reasons
- Current: Basic feedback endpoint exists
- Gap: Missing file upload support, rating reasons list

### Booking System Summary

**Critical Missing Components**:

1. Dynamic pricing calculation
2. Full invitation workflow
3. Waiting list management
4. Session extension features
5. Creator booking type
6. Enhanced feedback with file uploads

---

## 4. Property/Gym Routes Analysis

### Mobile App Requirements vs Current Implementation

#### 4.1 Gym Discovery

**Mobile App Expects**:

- `POST /v2/gyms` with location parameter
- Location format: "latitude,longitude"
- Distance calculation in response

**Current Implementation**:

- `GET /api/v1/gyms` with query params
- `GET /api/v1/gyms/nearby` for location search

**Gap Analysis**:

- ✅ Basic gym listing exists
- ✅ Location-based search available
- ❌ Different HTTP method and format
- ❌ No distance calculation in response
- ❌ Missing partner venue separation

#### 4.2 Availability System

**Mobile App Expects**:

- `POST /v2/booking/find/dates` - Available dates for gym
- `POST /v2/booking/find/times` - Time slots for date
- `POST /v2/booking/alternatives` - Alternative options

**Current Implementation**:

- `GET /api/v1/bookings/available-slots`
- `GET /api/v1/bookings/alternative-slots`

**Gap Analysis**:

- ⚠️ Basic availability exists
- ❌ No separate date/time discovery
- ❌ Different endpoint structure
- ❌ Missing duration options in slots

#### 4.3 Professional Services

**Mobile App Expects**:

- `GET /v2/professionals` - List all
- `POST /v2/professionals` - Filter by type/title
- `GET /v2/professionals/training-types`

**Current Implementation**: ❌ Not found

**Gap Analysis**:

- ❌ No professional/trainer discovery system
- ❌ No training type categorization
- ❌ Missing professional profiles

#### 4.4 Induction Management

**Mobile App Expects**:

- `GET /v2/gym/list` - Induction-specific gym list
- `GET /v2/gyms/induction` - User's induction status
- `POST /v2/gyms/induction/schedule`

**Current Implementation**:

- Basic induction endpoints exist at different paths

**Gap Analysis**:

- ⚠️ Partial implementation
- ❌ No status tracking endpoint
- ❌ Different response formats

### Gym/Property Summary

**Critical Missing Components**:

1. Professional/trainer discovery system
2. Separate partner venue handling
3. Enhanced availability discovery
4. Distance calculations
5. Training type categorization

---

## 5. Payment Routes Analysis

### Mobile App Requirements vs Current Implementation

#### 5.1 Cart System

**Mobile App Expects**:

- `GET /v2/cart` - Shopping cart with bookings
- `POST /v2/cart/pay/credits` - Pay with credits
- `POST /v2/cart/promo` - Apply promo code

**Current Implementation**: ❌ No cart system

**Gap Analysis**:

- ❌ Entire cart concept missing
- ❌ No multi-booking checkout
- ❌ No promo code system at cart level

#### 5.2 Credit Management

**Mobile App Expects**:

- `GET /v2/memberships/credit-plans`
- Credit-based payment system

**Current Implementation**:

- ✅ Credit system exists
- ✅ Credit packs available
- ❌ Different endpoint paths
- ❌ No membership integration

#### 5.3 Membership System

**Mobile App Expects**:

- `GET /v2/membership/status`
- `POST /v2/membership/cancel`

**Current Implementation**:

- ✅ Subscription system exists
- ❌ Called "subscriptions" not "memberships"
- ❌ Different endpoint structure

### Payment Summary

**Critical Missing Components**:

1. Shopping cart system
2. Cart-based credit payment
3. Membership terminology alignment
4. Integrated promo code system

---

## 6. Search Routes Analysis

### Mobile App Implementation

- Client-side filtering of cached data
- No server-side search endpoints
- Local distance calculations

**Current Implementation**:

- Server-side search endpoints exist
- No specific mobile optimization

**Gap Analysis**:

- ✅ Can work with existing endpoints
- ⚠️ Mobile app doesn't use search APIs
- 💡 Opportunity for optimization

---

## 7. Messaging Routes Analysis

### Mobile App Requirements vs Current Implementation

#### 7.1 Notifications

**Mobile App Expects**:

- `GET /v2/user/notifications`
- Multiple notification types
- Rich notification objects

**Current Implementation**:

- ✅ Full notification system exists
- ❌ Different endpoint paths
- ⚠️ May need type mapping

#### 7.2 Friend System

**Mobile App Expects**:

- `GET /v2/friends`
- `POST /v2/friends/request/external`

**Current Implementation**:

- ✅ Friend system exists
- ❌ No external friend requests
- ❌ Different paths

#### 7.3 Problem Reporting

**Mobile App Expects**:

- `GET /v2/user/problem-types`
- `POST /v2/user/reportaproblem` (multipart)

**Current Implementation**:

- ✅ Problem reporting exists
- ❌ Different endpoint structure
- ❌ No problem types endpoint

### Messaging Summary

**Critical Missing Components**:

1. External friend invitations
2. Problem type categorization
3. Multipart form support for reports

---

## 8. Review Routes Analysis

### Mobile App Requirements

- Only session feedback (no gym/trainer reviews)
- Rating with 1=sad, 2=neutral, 3=happy
- Optional issue reporting with images

**Current Implementation**:

- ✅ Session feedback exists
- ❌ Different rating scale
- ❌ No image upload support

---

## Critical Implementation Priorities

### Phase 1: Authentication & User

1. Create v1 endpoint adapters
2. Implement SMS verification service
3. Add social login support
4. Fix response format transformations

### Phase 2: Core Booking System

1. Implement pricing calculations
2. Build invitation workflow
3. Create waiting list system
4. Add session extensions

### Phase 3: Payment & Cart

1. Build shopping cart service
2. Implement cart-based payments
3. Add promo code system
4. Align membership terminology

### Phase 4: Discovery & Social

1. Add professional discovery
2. Implement external friend invites
3. Enhance gym availability system
4. Add problem type management

### Technical Requirements

1. Support both v1 and v2 endpoint paths
2. Handle multipart/form-data content type
3. Implement response transformations
4. Add static API key authentication
5. Support legacy field naming (snake_case)

### Infrastructure Needs

1. SMS provider integration
2. File storage for base64 images
3. Background job processing
4. Legacy API adapter layer
5. Response transformation middleware

---

## Executive Summary

### Overall Gap Assessment

The Solo60 platform has a solid microservices foundation with most core services implemented. However, significant work is required to support the legacy mobile app's API contract. The main challenges are:

1. **Endpoint Path Mismatch**: Mobile app expects `/v1` and `/v2` paths, while our system uses `/api/v1/` prefix
2. **Request/Response Format Differences**: Mobile uses different field naming (snake_case), content types (multipart/form-data), and response structures
3. **Missing Major Features**:
   - SMS verification system
   - Shopping cart concept
   - Waiting list management
   - Professional/trainer discovery
   - Session invitation workflow
   - Dynamic pricing calculations

### Critical Path to Mobile App Support

#### Immediate Requirements

1. **API Gateway Adapter Layer**
   - Route `/v1/*` and `/v2/*` to appropriate services
   - Transform request/response formats
   - Handle authentication header differences

2. **Authentication Compatibility**
   - Map mobile login/register to OAuth flow
   - Support static API key (`authkey`) validation
   - Transform token responses

#### Core Functionality

1. **Booking System Enhancement**
   - Implement invitation workflow
   - Add waiting list feature
   - Create pricing calculation engine
   - Support session extensions

2. **User Management**
   - SMS verification service
   - Base64 image support
   - Duplicate checking

#### Payment & Discovery

1. **Cart System**
   - New cart service
   - Multi-booking checkout
   - Credit-based payments

2. **Professional Discovery**
   - Trainer profiles
   - Training types
   - Filtering system

### Risk Assessment

**High Risk Areas**:

1. **SMS Verification**: Critical for user onboarding, completely missing
2. **Cart System**: Fundamental difference in payment flow
3. **Booking Invitations**: Core social feature not implemented
4. **Response Formats**: Extensive transformation needed

**Medium Risk Areas**:

1. **Professional Discovery**: New feature set needed
2. **Waiting Lists**: Complex state management
3. **File Uploads**: Different format expectations

**Low Risk Areas**:

1. **Search**: Mobile does client-side, minimal impact
2. **Reviews**: Limited to session feedback
3. **Notifications**: System exists, needs adaptation

### Recommended Approach

1. **Phase 1: Adapter Layer**
   - Build mobile API adapter service
   - Implement path routing and transformations
   - Test with authentication endpoints

2. **Phase 2: User Features**
   - SMS verification integration
   - Enhanced user endpoints
   - Photo management

3. **Phase 3: Booking Core** (Weeks 3-4)
   - Pricing engine
   - Invitation system
   - Waiting lists

4. **Phase 4: Payment Flow**
   - Cart service
   - Credit payment integration
   - Promo codes

5. **Phase 5: Discovery**
   - Professional profiles
   - Enhanced gym search
   - Training categorization

### Success Metrics

1. **API Compatibility**: 100% endpoint coverage
2. **Response Time**: <200ms for adapter layer
3. **Feature Parity**: All mobile app features functional
4. **Zero Breaking Changes**: Existing mobile apps continue working

### Technical Debt Considerations

1. **Dual API Versions**: Supporting both v1 and v2 adds complexity
2. **Format Transformations**: Performance overhead for every request
3. **Legacy Patterns**: Snake_case naming, multipart forms
4. **Static Auth Key**: Security concern that needs addressing

### Long-term Recommendations

1. **Mobile App Migration**: Plan to update mobile app to use modern API
2. **Deprecation Strategy**: Sunset v1 endpoints over time
3. **API Standardization**: Move to consistent REST/JSON patterns
4. **Security Enhancement**: Replace static API keys with proper auth

---

## Conclusion

Supporting the legacy mobile app requires substantial development effort, primarily in building an adapter layer and implementing missing features. The current microservices architecture provides a solid foundation, but significant gaps exist in booking workflows, payment systems, and user management features.

The recommended phased approach prioritizes critical authentication and booking features while building towards full compatibility. Success depends on careful transformation of requests/responses and implementation of missing business logic, particularly around SMS verification, cart-based payments, and social features like invitations and waiting lists.

Total estimated effort: 6-8 weeks for full compatibility with dedicated team.
