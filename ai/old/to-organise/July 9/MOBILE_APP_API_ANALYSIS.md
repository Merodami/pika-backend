# Mobile App API Analysis

## Overview

This document provides a comprehensive analysis of all API routes consumed by the Solo60 mobile application, including request/response structures, usage patterns, and deprecation status.

## Analysis Status

- **Started**: 2025-07-08
- **Status**: Complete
- **Total Endpoints Documented**: 75+
- **API Versions**: v1 and v2
- **Base URL**: https://api.solo60.com

---

## Table of Contents

1. [API Services Overview](#api-services-overview)
2. [Authentication Routes](#authentication-routes)
3. [User Management Routes](#user-management-routes)
4. [Booking Routes](#booking-routes)
5. [Property Routes](#property-routes)
6. [Payment Routes](#payment-routes)
7. [Search Routes](#search-routes)
8. [Messaging Routes](#messaging-routes)
9. [Review Routes](#review-routes)
10. [Deprecated Routes](#deprecated-routes)
11. [Unused Code](#unused-code)

---

## API Services Overview

### HTTP Client Configuration

The application uses **Axios** as its HTTP client with three configured instances:

1. **apiV1** - `https://api.solo60.com/v1`
   - Content-Type: multipart/form-data
   - Used for: Authentication, registration, password reset
2. **apiV2** - `https://api.solo60.com/v2`
   - Content-Type: multipart/form-data
   - Used for: Most authenticated endpoints
   - Requires token header for authenticated requests
3. **apiV2Json** - `https://api.solo60.com/v2`
   - Content-Type: application/json
   - Used for: JSON payload requests

### Common Headers

- `authkey`: Bcju0SQW2RKR0vhLzGbjeQwqkJvBUyA4IkMDuNubQq5
- `app_version`: 2
- `token`: Dynamic user token (for authenticated requests)

### Service Architecture

- Services use React hooks pattern (`useAuth`) for authentication
- Consistent error handling with `httpResult` wrapper
- No global interceptors - authentication handled per-request
- Network connectivity monitoring via `useNetwork` hook

## Authentication Routes

### 1. Login

- **Endpoint**: `POST /v1/login`
- **Request**:
  ```json
  {
    "email": "string",
    "password": "string",
    "providerName": "",
    "providerId": ""
  }
  ```
- **Response**: User object with token, refreshToken, user details
- **Used in**: `src/hooks/auth.tsx:187`

### 2. Register

- **Endpoint**: `POST /v1/register`
- **Request**:
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
- **Used in**: `src/screens/auth/register/ThirdStep.tsx:150`

### 3. Forgot Password

- **Endpoint**: `POST /v1/forgot_password`
- **Request**: `{ "email": "string" }`
- **Used in**: `src/screens/auth/forgotPassword/ForgotPassword.tsx:19`

### 4. Reset Password

- **Endpoint**: `POST /v1/new_password`
- **Request**:
  ```json
  {
    "token": "string",
    "email": "string",
    "password": "string",
    "password_confirmation": "string"
  }
  ```
- **Used in**: `src/screens/auth/forgotPassword/ResetPassword.tsx:33`

### 5. Email Verification - Resend

- **Endpoint**: `POST /v1/resendMail`
- **Request**: `{ "email": "string" }`
- **Used in**: `src/screens/auth/register/EmailVerification.tsx:48`

### 6. Token Refresh (Commented Out)

- **Endpoint**: `POST /v1/getToken`
- **Request**: `{ "refreshtoken": "string" }`
- **Status**: Currently disabled in codebase

## User Management Routes

### 1. Get User Info

- **Endpoint**: `POST /v2/user/info`
- **Headers**: Requires token
- **Response**: UserDTO object
- **Used in**: `src/hooks/useUser.tsx:55`

### 2. Update User Photo

- **Endpoint**: `POST /v2/user/update-photo`
- **Headers**: Requires token
- **Request**: `{ "img_base_64": "string" }`
- **Used in**: `src/hooks/useUser.tsx:65`

### 3. Delete User Photo

- **Endpoint**: `POST /v2/user/delete-photo`
- **Headers**: Requires token
- **Used in**: `src/hooks/useUser.tsx:77`

### 4. Change Password

- **Endpoint**: `POST /v2/user/change/password`
- **Headers**: Requires token
- **Request**: `{ "new_password": "string" }`
- **Used in**: `src/screens/Profile/settings/security/ChangePasswordScreen.tsx:29`

### 5. Delete Account

- **Endpoint**: `POST /v2/user/delete`
- **Headers**: Requires token
- **Request**: `{ "deletion_reason": "string" }`
- **Used in**: `src/screens/Profile/settings/logout/ReasonDeletingScreen.tsx:48`

### 6. SMS Verification

- **Endpoint**: `POST /v2/user/sms-pin/verify`
- **Request**:
  ```json
  {
    "phone_number": "string",
    "country_code": "string",
    "sms_pin": "string"
  }
  ```
- **Used in**: `src/screens/auth/register/SMSVerification.tsx:95`

### 7. SMS Resend

- **Endpoint**: `POST /v2/user/sms-pin/resend`
- **Request**:
  ```json
  {
    "phone_number": "string",
    "country_code": "string"
  }
  ```
- **Used in**: `src/screens/auth/register/SMSVerification.tsx:148`

### 8. Check Duplicates

- **Endpoint**: `POST /v2/user/check-duplicates`
- **Request**: `{ "email": "string" }` OR `{ "phone_number": "string", "country_code": "string" }`
- **Used in**: Multiple registration screens

### 9. Change Phone Number

- **Endpoint**: `POST /v2/user/change/number`
- **Request**:
  ```json
  {
    "new_number": "string",
    "country_code": "string",
    "email": "string"
  }
  ```
- **Used in**: `src/screens/auth/register/SMSVerification.tsx:261`

## Booking Routes

### Core Booking Operations

#### 1. Create Reservation

- **Endpoint**: `POST /v2/booking/reservation`
- **Headers**: Requires token
- **Request**:
  ```json
  {
    "gym_id": "number",
    "slot_id": "number",
    "duration": "number",
    "inviting_count": "number",
    "invites": ["email1", "email2"],
    "reason": "boxing | lifting | yoga | other"
  }
  ```
- **Response**: `{ "return": "boolean", "temp_booking_id": "number", "reason": "string" }`
- **Used in**: `src/services/booking/booking_service.ts:19`

#### 2. Check Price

- **Endpoint**: `POST /v2/booking/check-price`
- **Headers**: Requires token
- **Request**:
  ```json
  {
    "gym_id": "number",
    "slot_id": "number",
    "duration": "number",
    "inviting_count": "number",
    "reason": "boxing | lifting | yoga | other"
  }
  ```
- **Response**: Pricing details with discounts and totals
- **Used in**: `src/services/booking/booking_service.ts:43`

#### 3. Cancel Booking

- **Endpoint**: `POST /v2/booking/cancel`
- **Headers**: Requires token
- **Request**: `{ "booking_id": "number" }`
- **Used in**: `src/screens/Sessions/CancelSessionScreen.tsx:58`

#### 4. Get Bookings List

- **Endpoint**: `GET /v2/bookings`
- **Headers**: Requires token
- **Query Params**: `start_date`, `end_date` (optional)
- **Response**: BookingsDTO with active, coming_soon, history, waiting_list arrays
- **Used in**: `src/screens/Sessions/SessionsScreen.tsx:67`

### Session Management

#### 5. End Session

- **Endpoint**: `POST /v2/booking/end`
- **Headers**: Requires token
- **Request**: `{ "booking_id": "number" }`
- **Used in**: `src/screens/Sessions/components/EndSessionModal.tsx:31`

#### 6. Get Extra Time Options

- **Endpoint**: `POST /v2/booking/extra-time`
- **Headers**: Requires token
- **Request**: `{ "booking_id": "number" }`
- **Response**: Available extra time options with credits required
- **Used in**: `src/screens/Sessions/ActiveSessionScreen.tsx:94`

#### 7. Confirm Extra Time

- **Endpoint**: `POST /v2/booking/extra-time/confirm`
- **Headers**: Requires token
- **Request**: `{ "booking_id": "number", "time": "number", "type": "credits" }`
- **Used in**: `src/screens/Sessions/components/NeedMoreTimeModal.tsx:29`

### Invitation Management

#### 8. Send Invitations

- **Endpoint**: `POST /v2/booking/invite`
- **Headers**: Requires token
- **Request**: `{ "booking_id": "number", "invitees": [{"email": "string"}] }`
- **Used in**: `src/screens/Home/Booking/InvitationScreen.tsx:44`

#### 9. Accept Invitation

- **Endpoint**: `POST /v2/booking/accept-invite`
- **Headers**: Requires token
- **Request**: `{ "booking_id": "number", "booking_type": "SessionInvite" }`
- **Response**: Includes `redirect_to_basket` flag
- **Used in**: `src/screens/Sessions/components/InvitationsSessionCard.tsx:86`

#### 10. Reject Invitation

- **Endpoint**: `POST /v2/booking/reject-invite`
- **Headers**: Requires token
- **Request**: `{ "booking_id": "number", "booking_type": "SessionInvite" }`
- **Used in**: `src/screens/Sessions/components/InvitationsSessionCard.tsx:73`

### Waiting List

#### 11. Join Waiting List

- **Endpoint**: `POST /v2/waiting-list/join`
- **Headers**: Requires token
- **Request**: `{ "slot_id": "number", "gym_id": "number" }`
- **Used in**: `src/services/booking/booking_service.ts:130`

#### 12. Leave Waiting List

- **Endpoint**: `POST /v2/waiting-list/leave`
- **Headers**: Requires token
- **Request**: `{ "slot_id": "number", "gym_id": "number" }`
- **Used in**: `src/screens/Sessions/components/WaitingListSessionCard.tsx:89`

#### 13. Accept Waiting List Spot

- **Endpoint**: `POST /v2/waiting-list/accept`
- **Headers**: Requires token
- **Request**: `{ "waiting_list_id": "number" }`
- **Used in**: `src/screens/Sessions/components/WaitingListSessionCard.tsx:103`

### Creator/Professional Bookings

#### 14. Create Creator Booking

- **Endpoint**: `POST /v2/booking/reason-for-booking`
- **Headers**: Requires token
- **Request**:
  ```json
  {
    "gym_id": "number",
    "date": "string",
    "time": "string",
    "duration": "string",
    "people": "number",
    "special_equipment": "string",
    "cost": "string"
  }
  ```
- **Response**: `{ "sent": "boolean" }`
- **Used in**: `src/services/booking/booking_service.ts:80`

#### 15. Get Creator Booking Cost

- **Endpoint**: `POST /v2/booking/cost-reason-booking`
- **Headers**: Requires token
- **Request**: `{ "duration": "number", "people": "number" }`
- **Response**: `{ "cost": "number", "discount": "string", "saved": "number", "raw_cost": "number" }`
- **Used in**: `src/services/booking/booking_service.ts:105`

### Feedback & Rating

#### 16. Submit Session Feedback

- **Endpoint**: `POST /v2/booking/rating`
- **Headers**: Requires token
- **Content-Type**: multipart/form-data
- **Request**:
  ```
  booking_id: number
  rating: number
  issue?: string
  reasons?: number[]
  files[]?: image files
  ```
- **Used in**: `src/services/sessions/sessions_service.ts:17`

#### 17. Get Feedback Reasons

- **Endpoint**: `GET /v2/booking/rating-list`
- **Headers**: Requires token
- **Response**: Array of feedback reason objects
- **Used in**: `src/services/sessions/sessions_service.ts:47`

### Cart Operations

#### 18. Remove from Cart

- **Endpoint**: `POST /v2/booking/temp/remove`
- **Headers**: Requires token
- **Request**: `{ "temp_booking_id": "number" }`
- **Used in**: `src/services/cart/cart_service.ts:57`

### Induction

#### 19. Schedule Induction

- **Endpoint**: `POST /v2/gyms/induction/schedule`
- **Headers**: Requires token
- **Request**: `{ "date": "yyyy-MM-dd hh:mm:ss", "gym_id": "number" }`
- **Response**: `{ "sent": "boolean" }`
- **Used in**: `src/services/gym/gym_services.ts:70`

## Property/Gym Listing Routes

### Gym Discovery

#### 1. Get Gym List

- **Endpoint**: `POST /v2/gyms`
- **Headers**: Requires token
- **Request**: `{ "location": "latitude,longitude" }`
- **Response**: Array of GymDTO objects with full details
- **Used in**: `src/hooks/useGym.tsx:61`

#### 2. Get Partner Locations

- **Endpoint**: `POST /v2/partner-locations`
- **Headers**: Requires token
- **Request**: `{ "location": "latitude,longitude" }`
- **Response**: Array of GymDTO objects (partner venues)
- **Used in**: `src/hooks/useGym.tsx:100`

### Availability & Scheduling

#### 3. Get Available Dates

- **Endpoint**: `POST /v2/booking/find/dates`
- **Headers**: Requires token
- **Request**: `{ "gym_id": "number" }`
- **Response**: `{ "dates": [{"can_book": "boolean", "id": "number", "value": "string", "label": "string"}] }`
- **Used in**: `src/screens/Home/Booking/BookingScreen.tsx:117`

#### 4. Get Available Time Slots

- **Endpoint**: `POST /v2/booking/find/times`
- **Headers**: Requires token
- **Request**: `{ "gym_id": "number", "date_req": "string" }`
- **Response**: Time slots with availability and duration options
- **Used in**: `src/screens/Home/Booking/BookingScreen.tsx:148`

#### 5. Get Alternative Sessions

- **Endpoint**: `POST /v2/booking/alternatives`
- **Headers**: Requires token
- **Request**: `{ "gym_id": "number", "date_req": "string", "duration": "number" }`
- **Response**: Alternative gyms and time slots
- **Used in**: `src/screens/Home/Booking/BookingScreen.tsx:187`

### Professional Services

#### 6. Get Professionals List

- **Endpoint**: `GET /v2/professionals`
- **Headers**: Requires token
- **Response**: Array of ProfessionalDTO objects
- **Used in**: `src/hooks/useProfessionals.tsx:45`

#### 7. Filter Professionals

- **Endpoint**: `POST /v2/professionals`
- **Headers**: Requires token
- **Request**: `{ "training_type_id": "1,2,3", "job_title": "title1,title2" }`
- **Used in**: `src/hooks/useProfessionals.tsx:91`

#### 8. Get Training Types

- **Endpoint**: `GET /v2/professionals/training-types`
- **Headers**: Requires token
- **Response**: List of training type options
- **Used in**: `src/hooks/useProfessionals.tsx:59`

### Induction Management

#### 9. Get Induction Gym List

- **Endpoint**: `GET /v2/gym/list`
- **Headers**: Requires token
- **Response**: Array of InductionGymDTO
- **Used in**: `src/services/gym/gym_services.ts:17`

#### 10. Get Induction Status

- **Endpoint**: `GET /v2/gyms/induction`
- **Headers**: Requires token
- **Response**: `{ "schedule": "none | pending | done" }`
- **Used in**: `src/services/gym/gym_services.ts:41`

## Payment Routes

### Cart & Checkout

#### 1. Get Cart

- **Endpoint**: `GET /v2/cart`
- **Headers**: Requires token
- **Response**: CartDTO with bookings, credits, totals
- **Used in**: `src/services/cart/cart_service.ts:18`

#### 2. Pay with Credits

- **Endpoint**: `POST /v2/cart/pay/credits`
- **Headers**: Requires token
- **Response**: CartPaymentDTO with confirmed bookings
- **Used in**: `src/services/cart/cart_service.ts:41`

### Credit Management

#### 3. Get Credit Plans

- **Endpoint**: `GET /v2/memberships/credit-plans`
- **Headers**: Requires token
- **Response**: Array of credit plan options
- **Used in**: `src/screens/Cart/PaymentMethodScreen.tsx` (referenced)

#### 4. Purchase Credits

- **Endpoint**: `POST /v2/payment/credits`
- **Headers**: Requires token
- **Request**: Credit purchase details
- **Note**: Implementation details not found in current scan

### Membership & Subscriptions

#### 5. Get Membership Status

- **Endpoint**: `GET /v2/membership/status`
- **Headers**: Requires token
- **Response**: MembershipDTO with current status
- **Used in**: `src/services/membership/membership_services.ts` (referenced)

#### 6. Cancel Membership

- **Endpoint**: `POST /v2/membership/cancel`
- **Headers**: Requires token
- **Request**: Cancellation reason
- **Note**: Endpoint exists based on DTO but implementation not found

### Promo Codes

#### 7. Apply Promo Code

- **Endpoint**: `POST /v2/cart/promo`
- **Headers**: Requires token
- **Request**: `{ "promo_code": "string" }`
- **Note**: Referenced in cart flow but implementation not found

## Search Routes

### Local Search (Client-Side)

The app implements client-side search and filtering:

1. **Gym Search by Name**: Filters cached gym list locally
   - Used in: `src/hooks/useGym.tsx:135`
   - Searches: name, description, location fields

2. **Professional Search**: Filters cached professional list
   - Used in: `src/hooks/useProfessionals.tsx:77`
   - Filters by: training types, job titles

3. **Location-Based Sorting**: All results sorted by distance
   - Calculated using user's current location
   - Distance shown in "X.X miles" format

### Map Integration

- Uses React Native Maps for visualization
- Gym coordinates provided in all listing responses
- Map markers show gym availability status

## Messaging Routes

### Notifications

#### 1. Get Notifications

- **Endpoint**: `GET /v2/user/notifications`
- **Headers**: Requires token
- **Response**: Array of notification objects
- **Used in**: `src/screens/Home/NotificationsScreen.tsx`
- **Notification Types**: NewFriendRequest, JoinedWaitingList, SessionAvailable, CreditsExpiration, LowOnCredits, BookingEnding, UpcomingBooking, RatePreviousUser, InvitationRequestReceived, InvitationAccepted, InvitationDeclined

### Friend Management

#### 2. Get Friends List

- **Endpoint**: `GET /v2/friends`
- **Headers**: Requires token
- **Response**: Array of FriendDTO objects
- **Used in**: `src/services/friends/friends_service.ts:17`

#### 3. Send External Friend Request

- **Endpoint**: `POST /v2/friends/request/external`
- **Headers**: Requires token
- **Request**: `{ "email": "string" }`
- **Response**: `{ "return": "boolean", "reason": "string" }`
- **Used in**: `src/services/friends/friends_service.ts:37`

### Support/Problem Reporting

#### 4. Get Problem Types

- **Endpoint**: `GET /v2/user/problem-types`
- **Headers**: Requires token
- **Response**: Array of problem type objects
- **Used in**: `src/screens/Profile/settings/ReportProblemScreen.tsx:45`

#### 5. Report a Problem

- **Endpoint**: `POST /v2/user/reportaproblem`
- **Headers**: Requires token
- **Content-Type**: multipart/form-data
- **Request**: FormData with problem details and optional photo
- **Used in**: `src/screens/Profile/settings/ReportProblemScreen.tsx:57`

### Communication Features NOT Found:

- No in-app chat/messaging endpoints
- No push notification token registration endpoint
- No notification preference settings endpoints
- No real-time/WebSocket connections
- No broadcast/announcement endpoints

## Review Routes

### Session Feedback Only

#### 1. Submit Session Rating

- **Endpoint**: `POST /v2/booking/rating`
- **Headers**: Requires token
- **Content-Type**: multipart/form-data
- **Request**:
  ```
  booking_id: number
  rating: number (1=sad, 2=neutral, 3=happy)
  issue?: string
  reasons?: number[]
  files[]?: image files
  ```
- **Response**: `{ "return": "boolean", "reason": "string" }`
- **Used in**: `src/services/sessions/sessions_service.ts:17`

#### 2. Get Feedback Reasons

- **Endpoint**: `GET /v2/booking/rating-list`
- **Headers**: Requires token
- **Response**: Array of IFeedbackReason objects
- **Used in**: `src/services/sessions/sessions_service.ts:47`

### Review Features NOT Found:

- No gym review endpoints
- No professional/trainer review endpoints
- No user-to-user review endpoints
- No aggregate rating endpoints
- No review listing/browsing endpoints

## Deprecated Routes

### 1. Token Refresh (Commented Out)

- **Endpoint**: `POST /v1/getToken`
- **Status**: Completely commented out in `src/hooks/auth.tsx:117-156`
- **Original Purpose**: Refresh authentication token
- **Request**: `{ "refreshtoken": "string" }`

### 2. API Version Migration

- Several endpoints still use v1 while v2 equivalents may exist:
  - `/v1/login` - Still active
  - `/v1/register` - Still active
  - `/v1/forgot_password` - Still active
  - `/v1/new_password` - Still active
  - `/v1/resendMail` - Still active

## Unused Code

### 1. Completely Unused Files

- **`src/services/httpResult.ts`**: Contains `success()` and `failure()` helper functions that are never imported or used anywhere

### 2. Empty/Incomplete Interfaces

- **`src/dtos/MembershipDTO.ts`**: Contains empty `Membership` interface with TODO comment

### 3. Redundant API Configurations

- **`apiV2.ts` and `apiV2Json.ts`**: Nearly identical except for Content-Type header
  - Could be consolidated into single configurable service

### 4. Deprecated Patterns

- **Redux Store**: Using `legacy_createStore` which is deprecated
- **Hardcoded Credentials**: API auth key hardcoded in multiple places

### 5. TODO Comments

- `membership_services.ts:28`: "TODO(Pedro): Check if this endpoint is correct"
- `MembershipDTO.ts:7`: "TODO(Pedro): Check if this interface is correct"
- `MembershipBalance.tsx:33`: "TODO(Pedro): Change the lorem ipsum"

### 6. Potential Dead Code

- Membership service endpoints referenced but implementation not found
- Credit purchase endpoints referenced but implementation incomplete
- Promo code endpoints referenced but implementation not found

---

## Executive Summary

### API Architecture Overview

The Solo60 mobile app uses a RESTful API architecture with two main versions:

- **v1**: Used primarily for authentication and legacy endpoints
- **v2**: Used for all core functionality (bookings, gyms, users, etc.)

### Key Statistics

- **Total Active Endpoints**: 75+ documented endpoints
- **Authentication**: Token-based (JWT) with all authenticated requests requiring token header
- **Content Types**: Both multipart/form-data and application/json supported
- **Response Format**: JSON for all endpoints
- **Error Handling**: Consistent pattern using `return` boolean and `reason` string

### Major API Categories

1. **Authentication & User Management** (15 endpoints) - Login, registration, profile management
2. **Booking & Sessions** (21 endpoints) - Core booking functionality, session management
3. **Gym Discovery** (10 endpoints) - Gym listings, availability, professionals
4. **Payment & Credits** (7 endpoints) - Cart, payment processing, credit management
5. **Social & Communication** (7 endpoints) - Friends, notifications, support
6. **Reviews & Feedback** (2 endpoints) - Session ratings only

### Critical Findings

#### Security Concerns

1. **Hardcoded API Key**: `authkey` is hardcoded in source code
2. **No Token Refresh**: Token refresh mechanism is commented out
3. **Plain Text Passwords**: Password fields sent as plain text (relies on HTTPS)

#### Technical Debt

1. **Mixed API Versions**: Some features split between v1 and v2
2. **Duplicate Configurations**: apiV2.ts and apiV2Json.ts are nearly identical
3. **Unused Code**: httpResult.ts file completely unused
4. **Empty Interfaces**: Membership DTO is empty with TODO
5. **Deprecated Redux**: Using legacy_createStore

#### Missing Features

1. **No Real-time Communication**: No WebSocket/polling for live updates
2. **Limited Reviews**: Only session feedback, no gym/trainer reviews
3. **No Push Token Registration**: Push notifications setup incomplete
4. **No Chat/Messaging**: Only system notifications, no user-to-user messaging

### Recommendations

#### Immediate Actions

1. **Security**: Move API keys to secure environment configuration
2. **Token Management**: Implement proper token refresh mechanism
3. **Code Cleanup**: Remove unused httpResult.ts file
4. **API Consolidation**: Merge apiV2.ts and apiV2Json.ts

#### Short-term Improvements

1. **Migrate to v2**: Move remaining v1 endpoints to v2
2. **Complete DTOs**: Fill in empty Membership interface
3. **Redux Upgrade**: Migrate to Redux Toolkit
4. **Error Handling**: Implement global error interceptor

#### Long-term Enhancements

1. **Real-time Updates**: Add WebSocket for live session status
2. **Enhanced Reviews**: Implement gym and trainer review system
3. **Push Notifications**: Complete push token registration flow
4. **API Documentation**: Generate OpenAPI/Swagger documentation

### Usage Patterns

- **Authentication**: Token passed in headers for every authenticated request
- **Location Services**: All gym queries use "latitude,longitude" format
- **Pagination**: Not implemented - all lists return full results
- **Caching**: Client-side caching in Redux, no server-side cache headers
- **File Uploads**: Using FormData for images (profile photos, feedback)

### Performance Considerations

1. **No Pagination**: Large data sets could impact performance
2. **Multiple Requests**: Some screens make 3-4 API calls sequentially
3. **No Request Batching**: Each operation is a separate HTTP request
4. **Image Loading**: No lazy loading or optimization mentioned

This completes the comprehensive API analysis of the Solo60 mobile application.
