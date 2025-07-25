# Session/Booking Gap Analysis: Current vs Previous Architecture

## Overview

This document compares the session/booking functionality between the previous architecture and current architecture, highlighting what's missing or needs to be implemented.

## ✅ What EXISTS in Current Architecture

### 1. Database Models (Complete)

- ✅ `Session` model with all core fields
- ✅ `SessionInvitee`, `Invitation`, `WaitingList`, `SessionReview`, `SessionRecord` models
- ✅ All enums: `SessionStatus`, `SessionPurpose`, `TeamSize`, `InviteeStatus`, etc.
- ✅ `GymHourlyPrice` and `GymSpecialPrice` models for dynamic pricing

### 2. Core Services

- ✅ `SessionService` with basic CRUD operations
- ✅ `SessionInviteeService` for managing invitations
- ✅ `WaitingListService` for queue management
- ✅ `SessionRecordService` for audit trail

### 3. API Endpoints (Mostly Complete)

- ✅ All core session endpoints (`/session/*`)
- ✅ Reservation endpoints (`/session/reservations/*`)
- ✅ Available/alternative slots endpoints
- ✅ Guest invitation endpoints
- ✅ Waiting list endpoints
- ✅ Admin management endpoints
- ✅ Check-in/check-out functionality

### 4. Business Logic Implemented

- ✅ Session creation with validation
- ✅ Dynamic pricing calculation (including content sessions)
- ✅ Temporary reservation system
- ✅ Availability checking
- ✅ Session updates and cancellations
- ✅ Guest invitation system
- ✅ Waiting list management
- ✅ Session feedback/reviews
- ✅ Extra time requests

## ❌ What's MISSING or Different

### 1. Critical Missing Features

#### 1.1 Automated Cleanup Cron Job

**Previous Architecture**: Had automated cron job running every 6 hours

```typescript
// Previous: src/cron/cleanupReservations.ts
export const cleanupReservationsCron = new CronJob('0 */6 * * *', async () => {
  await cleanupExpiredReservationsService()
})
```

**Current Architecture**:

- Has the cleanup function but NO automated execution
- Must be triggered manually via admin endpoint
- **Impact**: Expired reservations won't be cleaned automatically

#### 1.2 ParQ Validation

**Previous Architecture**: Required ParQ completion before booking

```typescript
const hasCompletedParQ = await hasUserCompletedParQ(subToken)
if (!hasCompletedParQ) {
  throw new Error('You must complete the ParQ before booking a session.')
}
```

**Current Architecture**:

- ParQ model exists but NO validation in session creation
- **Impact**: Users can book without health questionnaire

#### 1.3 Sub_token Field

**Previous Architecture**: Used `sub_token` for user identification
**Current Architecture**: Uses `userId` directly

- This is actually an improvement (cleaner architecture)

### 2. Business Logic Differences

#### 2.1 Update/Cancel Time Windows

**Previous Architecture**:

- Members: 24hr update notice, 4hr cancel notice
- Non-members: 12hr for both

**Current Architecture**:

- No membership-based time window validation
- Missing `isMember` checks in update/cancel logic

#### 2.2 Guest List Storage

**Previous Architecture**: Stored guest emails in user's `guests[]` array
**Current Architecture**: No automatic storage of frequently invited guests

#### 2.3 Email Notifications

**Previous Architecture**: Multiple email templates and triggers

- Field Street noise warning
- Content session approval requests
- Guest invitations

**Current Architecture**:

- Has communication service integration
- But specific email templates/triggers not implemented

#### 2.4 Waiting List Auto-notification

**Previous Architecture**: Automatically notified next user when spot opened
**Current Architecture**: Has the service but unclear if auto-triggered on cancellation

### 3. Missing Validation Rules

#### 3.1 Session Duration Validation

**Previous Architecture**: Strict validation for 15-minute increments

```typescript
const allowedDurationsInMinutes = [60, 75, 90, 105, 120, 135, 150, 165, 180]
```

**Current Architecture**: No explicit duration validation

#### 3.2 Maximum Guests Validation

**Previous Architecture**: Hard limit of 5 guests per session
**Current Architecture**: No validation on guest count

#### 3.3 Single Pending Reservation

**Previous Architecture**: Prevented multiple PAYMENT_PENDING sessions per user
**Current Architecture**: No such validation

### 4. API Response Differences

#### 4.1 Time Slot Response Format

**Previous Architecture**: Detailed slot information with durations

```typescript
{
  id: number,
  start_time: string,
  available: boolean,
  booking_id: string | null,
  durations: Array<{
    duration: number,
    credits: number,
    label: string
  }>
}
```

**Current Architecture**: Simpler format, missing duration options

### 5. Performance Optimizations

#### 5.1 Cleanup Optimization

**Previous Architecture**: Only cleaned sessions expired in last 5 minutes
**Current Architecture**: No such optimization

#### 5.2 Caching Strategy

**Previous Architecture**: Memoized price calculations
**Current Architecture**: Has Redis caching but not for calculations

### 6. Content Session Approval Flow

**Previous Architecture**:

- PENDING_APPROVAL status for content sessions
- Admin approval/decline endpoints
- Email notifications to admin

**Current Architecture**:

- Has the endpoints but workflow not fully implemented
- Missing automatic admin notifications

## 📋 Implementation Priority

### High Priority (Business Critical)

1. **Automated Cleanup Cron Job** - Prevents system clogging
2. **ParQ Validation** - Legal/safety requirement
3. **Duration Validation** - Prevents invalid bookings
4. **Guest Count Validation** - Prevents overbooking
5. **Membership-based Time Windows** - Business rule enforcement

### Medium Priority (User Experience)

1. **Guest List Storage** - Convenience feature
2. **Email Notifications** - Communication improvement
3. **Waiting List Auto-notification** - User satisfaction
4. **Single Pending Reservation** - Prevents abuse

### Low Priority (Nice to Have)

1. **Performance Optimizations** - System efficiency
2. **Detailed Slot Response** - Enhanced UX
3. **Memoized Calculations** - Performance boost

## 🔧 Technical Debt Items

1. **Job Queue System**: Current architecture has job types defined but no implementation
2. **Email Templates**: Need to be created and integrated
3. **Notification Triggers**: Many trigger points exist but not connected
4. **Test Coverage**: Integration tests exist but don't cover all edge cases

## 📝 Notes

- The current architecture is generally well-structured and has most core functionality
- Main gaps are in automation, validation rules, and notification systems
- Database schema is complete and matches requirements
- Service layer architecture is cleaner than previous version
- Missing features are mostly business logic, not structural issues
