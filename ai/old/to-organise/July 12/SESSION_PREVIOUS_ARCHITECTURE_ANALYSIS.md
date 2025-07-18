# Previous Architecture Session Implementation Analysis

## Overview

This document provides a comprehensive analysis of the session implementation from the previous architecture, identifying key features, business logic, and fields that need to be ported to the current clean architecture implementation.

## 1. Database Schema Fields

### Session Model

The previous architecture's Session model included these fields:

- `sub_token` - User authentication token field (missing in current implementation)
- Status values: `"upcoming"`, `"cancelled"`, `"completed"`, `"PENDING_APPROVAL"`, `"payment_pending"`, `"declined"`
- Purpose enum: `WORKING`, `WORKOUT`, `CONTENT`
- TeamSize enum: `CREATOR`, `BRAND`, `ENTERPRISE`
- `payment_deadline` - Timestamp for temporary reservation expiry
- `feedback` - Direct session feedback storage
- `guests` - String array of guest emails/IDs

## 2. Core Business Logic

### Session Duration Validation

Valid session durations in minutes: `[60, 75, 90, 105, 120, 135, 150, 165, 180]`

### Pricing Structure

**CONTENT Sessions** (based on TeamSize):

- CREATOR: £40/hour
- BRAND: £60/hour
- ENTERPRISE: £100/hour
- 20% discount for sessions longer than 5 hours

**Regular Sessions**: Based on gym hourly rates and special prices

### Pre-booking Requirements

- **ParQ Completion**: Users must complete ParQ questionnaire before booking
- **Credit Validation**: Ensure sufficient credits before booking
- **Gym Membership**: Validate active gym membership status

### Cancellation Rules

- **Members**: Can cancel up to 4 hours before session
- **Non-members**: Must cancel 12 hours before session
- **Refund Logic**: Full credit refund if cancelled within allowed window

### Update Rules

- **Members**: Can update session details up to 24 hours before
- **Non-members**: Can update up to 12 hours before

## 3. Missing API Endpoints

### Temporary Reservation System

```typescript
POST /sessions/reserve
{
  gymId, date, startTime, duration, purpose, teamSize?, guests?
}
// Creates session with PAYMENT_PENDING status and 2-minute deadline
```

### Extra Time Request

```typescript
PUT /sessions/extratime/:id
{
  additionalMinutes: number
}
// Allows extending ongoing sessions
```

### Session Approval (Admin)

```typescript
POST /sessions/admin/:id/approve
{
  notes?: string,
  notifyCreator?: boolean
}
// Approves CONTENT sessions

POST /sessions/admin/:id/decline
{
  reason: string,
  notifyCreator?: boolean
}
// Declines CONTENT sessions with reason
```

### Alternative Sessions

```typescript
POST /sessions/alternative-slots
{
  originalSessionId?: string,
  date: string,
  duration: number,
  userLocation?: { lat, lng }
}
// Returns alternative available sessions at nearby gyms
```

## 4. Email Notification System

### Notification Triggers

1. **Session Creation**: Notify admin when CONTENT session requested
2. **Booking Confirmation**: Send confirmation to user
3. **Field Street Bookings**: Special notification to admin
4. **Cancellation**: Notify affected users
5. **Waiting List**: Notify next user when spot opens
6. **Review Submission**: Notify admin when review posted
7. **Session Approval/Decline**: Notify session creator

## 5. Advanced Features

### Session Slot Calculation

- Generate time slots with 30-minute intervals
- Duration options: 60-180 minutes in 15-minute increments
- Dynamic pricing per slot based on:
  - Hourly rates
  - Special prices
  - Peak/off-peak times
- Conflict detection with existing bookings

### Waiting List Management

- Automatic queue management
- Priority-based ordering
- Automatic notification when spot available
- Grace period for accepting spot

### Guest Management

- Add guests via email
- Automatic addition to user's guest list
- Track invitation status
- Allow guests to join without account

### Session Records (Audit Trail)

- Track all session modifications
- Record who made changes
- Store change descriptions
- Timestamp all events

## 6. Integration Points

### Payment System

- Stripe integration for paid sessions
- Credit deduction for bookings
- Refund processing for cancellations
- Payment deadline tracking

### S3 Integration

- Session review image uploads
- Profile picture storage for reviews

### Geolocation Services

- Find nearest gym
- Calculate alternative locations
- Distance-based recommendations

## 7. Data Validation Rules

### Session Creation

- Validate session doesn't overlap with existing bookings
- Check gym operating hours
- Validate user hasn't exceeded daily booking limit
- Ensure session date is in future

### Guest Validation

- Maximum guests per session type
- Validate guest emails
- Check guest booking conflicts

## 8. Missing Database Fields Summary

### Session Table

- `sub_token` (or adapt to current auth)
- Ensure all status enums are supported
- Consider adding fields for:
  - `maxGuests`
  - `requiresApproval`
  - `approvedBy`
  - `approvedAt`
  - `declinedReason`

### Supporting Tables

- **SessionRecord**: Full audit trail implementation
- **SessionInvitation**: Enhanced with reminder tracking
- **WaitingList**: Priority and grace period fields

## 9. Performance Optimizations

### Caching Strategy

- Cache available slots for performance
- Cache gym pricing information
- Cache user session history

### Query Optimizations

- Indexed searches on date/time/gym
- Efficient slot availability queries
- Optimized waiting list queries

## 10. Migration Considerations

### Priority Features to Implement

1. **High Priority**:
   - Session approval workflow for CONTENT
   - Temporary reservation system
   - Enhanced cancellation logic
   - Guest management

2. **Medium Priority**:
   - Alternative session finding
   - Waiting list enhancements
   - Extra time requests
   - Advanced pricing logic

3. **Low Priority**:
   - Geolocation features
   - Complex notification system
   - Full audit trail

### Breaking Changes

- Status enum values need normalization
- Pricing logic requires careful migration
- Guest system needs backward compatibility

## Conclusion

The previous architecture had a sophisticated session management system with complex business rules, advanced features, and comprehensive notification system. Porting these features to the current clean architecture will require:

1. Database schema updates
2. Enhanced service layer logic
3. Additional API endpoints
4. Improved validation rules
5. Integration with external services

The migration should be done incrementally, starting with core features and gradually adding advanced functionality.
