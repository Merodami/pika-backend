# Session/Booking System Analysis - Previous Architecture

## Overview

This document provides a comprehensive analysis of all session and booking functionality found in the previous-architecture directory. The system supports scheduling, capacity management, dynamic pricing, guest management, waiting lists, and various user types (members, non-members, professionals, content creators).

## 📊 Database Schema

### Core Session Model

**Location**: `previous-architecture/prisma/schema.prisma:283-312`

```prisma
model Session {
  id               String         @id @default(uuid())
  sub_token        String
  userId           String
  user             User           @relation(fields: [userId], references: [id])
  gymId            String
  gym              Gym            @relation(fields: [gymId], references: [id])
  date             DateTime       @db.Date
  start_time       DateTime       @db.Time()
  end_time         DateTime       @db.Time()
  duration         Int            // Duration in minutes
  status           String?        @default("upcoming")
  payment_deadline DateTime?      @db.Timestamp()
  price            Int            // Price in credits
  guests           String[]       // Array of guest emails
  purpose          SessionPurpose // WORKING, WORKOUT, CONTENT
  teamSize         TeamSize?      // CREATOR, BRAND, ENTERPRISE
  created_at       DateTime?      @default(now())
  updated_at       DateTime?
  cancelled_at     DateTime?
  feedback         String?

  // Relations
  invitations           Invitation[]
  waitingList           WaitingList[]
  sessionRecords        SessionRecords[]
  reviews               SessionReview[]
  invitedFriendsClients SessionInvitee[]
}
```

### Session Status Values

- `upcoming` - Active future session
- `cancelled` - Cancelled by user
- `completed` - Past session
- `PENDING_APPROVAL` - Content session awaiting admin approval
- `payment_pending` - Approved but awaiting payment
- `declined` - Content session declined by admin
- `PAYMENT_PENDING` - Temporary reservation with deadline

### Related Models

#### SessionInvitee

Links sessions to Friend records for invitation management

```prisma
model SessionInvitee {
  id        String   @id @default(uuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id])
  friendId  String
  friend    Friend   @relation(fields: [friendId], references: [id])
  invitedAt DateTime @default(now())
  status    String?  // confirmed, declined, pending
}
```

#### SessionReview

Post-session rating system

```prisma
model SessionReview {
  id        String        @id @default(uuid())
  sessionId String
  userId    String
  rating    SessionRating // SAD, NEUTRAL, HAPPY
  reason    String?       // Required for SAD ratings
  image     String?
  createdAt DateTime      @default(now())
}
```

#### SessionRecords

Audit trail for all session modifications

```prisma
model SessionRecords {
  id          String   @id @default(uuid())
  sessionId   String
  type        String   // update, cancel, etc.
  description String
  modifiedBy  String   // sub_token of modifier
  createdAt   DateTime @default(now())
}
```

#### WaitingList

Queue management for fully booked sessions

```prisma
model WaitingList {
  id        String   @id @default(uuid())
  sub_token String
  userId    String
  sessionId String
  joined_at DateTime @default(now())
  status    String   @default("waiting") // waiting, accepted, declined, left
}
```

#### Invitation

Guest invitation tracking

```prisma
model Invitation {
  id          String    @id @default(uuid())
  userId      String
  guest_email String
  sessionId   String
  friendId    String?
  created_at  DateTime  @default(now())
  status      String    // pending, accepted, declined
}
```

## 💼 Business Logic & Rules

### Session Creation

**Location**: `previous-architecture/src/services/session.ts:84-279`

#### Rules:

1. **Duration**: 60-180 minutes in 15-minute increments (60, 75, 90, 105, 120, 135, 150, 165, 180)
2. **ParQ Requirement**: Users must complete ParQ before booking
3. **User Type**: Only users can book (not admins)
4. **Credit Check**: Sufficient credits required before booking
5. **Auto-consumption**: Credits consumed immediately upon booking
6. **Special Notifications**: Field Street gym triggers noise warning email

#### Pricing Logic:

- **Regular Sessions**: Dynamic pricing based on gym hourly/special prices
- **Content Sessions**: Fixed pricing by team size
  - CREATOR: £40/hour
  - BRAND: £60/hour
  - ENTERPRISE: £100/hour
  - 20% discount for sessions over 5 hours

### Temporary Reservations

**Location**: `previous-architecture/src/services/session.ts:1277-1373`

#### Features:

- **Payment Deadline**: 2 minutes from creation
- **Single Reservation**: Users can only have one pending reservation
- **Status**: PAYMENT_PENDING
- **Cleanup**: Automated via cron job every 6 hours
- **Slot Hold**: Prevents others from booking during payment window

### Pricing Calculation

**Location**: `previous-architecture/src/services/session.ts:43-82`

#### Algorithm:

```typescript
function calculateSessionPriceService(gymId: string, sessionDate: Date, sessionStartHour: number, durationInMinutes: number, cachedHourlyPrices: any[], cachedSpecialPrices: any[]): number
```

1. Calculates price per hour block
2. Special prices override hourly prices
3. Pro-rates partial hours
4. Returns ceiling of calculated price

### Availability & Scheduling

**Location**: `previous-architecture/src/services/session.ts:1060-1184`

#### Time Slot Generation:

- **Interval**: 30-minute slots throughout the day
- **Duration Options**: Shows available durations (60-180 minutes)
- **Conflict Check**: Validates against existing bookings
- **Pending Reservations**: Includes non-expired PAYMENT_PENDING sessions
- **Performance**: Optimized with caching and parallel queries

#### Response Format:

```typescript
interface TimeSlot {
  id: number
  start_time: string // "HH:MM" format
  available: boolean
  booking_id: string | null
  durations: Array<{
    duration: number
    credits: number
    label: string // e.g., "1 hour 30 mins"
  }>
}
```

### Session Modifications

**Location**: `previous-architecture/src/services/session.ts:342-381`

#### Update Rules:

- **Members**: 24-hour advance notice required
- **Non-members**: 12-hour advance notice required
- **Validation**: Checks new slot availability
- **Audit**: Creates SessionRecords entry
- **Notifications**: Notifies all guests of changes

### Session Cancellation

**Location**: `previous-architecture/src/services/session.ts:383-471`

#### Cancellation Rules:

- **Members**: 4-hour advance notice
- **Non-members**: 12-hour advance notice
- **Credit Refund**: Automatic full refund
- **Guest Notification**: All guests notified
- **Waiting List**: Next user notified if applicable
- **Audit**: Creates cancellation record

### Extra Time Requests

**Location**: `previous-architecture/src/services/session.ts:597-639`

#### Features:

- **Credit Calculation**: Pro-rated based on session price
- **Availability Check**: Validates against next session
- **Credit Requirement**: Must have sufficient credits
- **Real-time Update**: Extends end_time and duration

## 🎯 API Endpoints

### Core Session Operations

**Location**: `previous-architecture/src/routes/session.routes.ts`

| Method | Endpoint              | Description                  | Auth Required |
| ------ | --------------------- | ---------------------------- | ------------- |
| POST   | `/session`            | Create new session           | User          |
| POST   | `/session/reserve`    | Create temporary reservation | User          |
| PUT    | `/session/:id`        | Update session details       | User          |
| PUT    | `/session/cancel/:id` | Cancel session               | User          |
| GET    | `/session/:id`        | Get session details          | User          |
| GET    | `/session/history`    | Get user's session history   | User          |
| DELETE | `/session/:id`        | Delete session               | Admin         |

### Availability & Search

| Method | Endpoint                     | Description                 | Auth Required |
| ------ | ---------------------------- | --------------------------- | ------------- |
| POST   | `/session/available-slots`   | Find available time slots   | User          |
| POST   | `/session/alternative-slots` | Find alternative gyms/times | User          |
| GET    | `/session/search/:gymId`     | Search sessions by gym      | User          |

### Guest & Social Features

| Method | Endpoint                       | Description               | Auth Required |
| ------ | ------------------------------ | ------------------------- | ------------- |
| POST   | `/session/invite`              | Invite guest to session   | User          |
| PUT    | `/session/invitation/:id`      | Accept/decline invitation | User          |
| POST   | `/session/invitee`             | Create session invitee    | User          |
| GET    | `/session/:sessionId/invitees` | Get all invitees          | User          |
| PUT    | `/session/invitee/:id`         | Update invitee status     | User          |
| DELETE | `/session/invitee/:id`         | Remove invitee            | User          |

### Waiting List

| Method | Endpoint                  | Description                | Auth Required |
| ------ | ------------------------- | -------------------------- | ------------- |
| POST   | `/session/wait/join`      | Join waiting list          | User          |
| PUT    | `/session/wait/:id`       | Update waiting list status | User          |
| PUT    | `/session/wait/leave/:id` | Leave waiting list         | User          |

### Additional Features

| Method | Endpoint                 | Description             | Auth Required |
| ------ | ------------------------ | ----------------------- | ------------- |
| GET    | `/session/feedback/:id`  | Submit session feedback | User          |
| PUT    | `/session/extratime/:id` | Request extra time      | User          |

### Admin Operations

| Method | Endpoint               | Description               | Auth Required |
| ------ | ---------------------- | ------------------------- | ------------- |
| GET    | `/session/admin/all`   | Get all sessions          | Admin         |
| GET    | `/session/admin/:id`   | Get detailed session info | Admin         |
| PUT    | `/session/approve/:id` | Approve content session   | Admin         |
| PUT    | `/session/decline/:id` | Decline content session   | Admin         |

## 🔔 Key Features

### Guest Management System

**Location**: `previous-architecture/src/services/session.ts:473-563`

#### Features:

- **Capacity**: Maximum 5 guests per session
- **Guest List**: Stores emails in user's guest list for future use
- **User Detection**: Different flow for registered vs non-registered guests
- **Notifications**: In-app for registered users, email for others
- **Validation**: Prevents duplicate invitations

### Waiting List Management

**Location**: `previous-architecture/src/services/waitingList.ts`

#### Features:

- **Capacity**: Maximum 3 users per waiting list
- **Queue Order**: FIFO (First In, First Out)
- **Status Tracking**: waiting, accepted, declined, left
- **Auto-notification**: Next user notified when spot opens
- **Single Entry**: Users can only be on one waiting list

### Session Review System

**Location**: `previous-architecture/src/services/sessionReview.ts`

#### Features:

- **Rating Options**: SAD, NEUTRAL, HAPPY
- **Mandatory Feedback**: SAD ratings require explanation
- **Image Support**: Optional image upload
- **Admin Alerts**: Email notification for SAD ratings

### Alternative Sessions

**Location**: `previous-architecture/src/services/session.ts:1209-1275`

#### Algorithm:

1. Find current gym location
2. Get all other gyms
3. Calculate nearest gym using geolocation
4. Return available slots at nearest gym
5. Format with same duration options

## 🏗️ Background Jobs

### Cleanup Expired Reservations

**Location**: `previous-architecture/src/cron/cleanupReservations.ts`

#### Configuration:

- **Schedule**: Every 6 hours (cron: "0 _/6 _ \* \*")
- **Target**: PAYMENT_PENDING sessions past deadline
- **Optimization**: Only checks sessions expired in last 5 minutes
- **Lock**: Prevents overlapping executions

## 📋 Validation Rules Summary

### Duration Validation

- Minimum: 60 minutes
- Maximum: 180 minutes
- Increments: 15 minutes
- Allowed values: [60, 75, 90, 105, 120, 135, 150, 165, 180]

### Capacity Limits

- Guests per session: 5
- Waiting list size: 3
- Pending reservations per user: 1

### Time Windows

| Action        | Members  | Non-Members |
| ------------- | -------- | ----------- |
| Update Notice | 24 hours | 12 hours    |
| Cancel Notice | 4 hours  | 12 hours    |

### Prerequisites

- ParQ completion required
- Sufficient credits
- Valid user account (not admin)

## 🔐 Security & Permissions

### Authentication Layers

1. **User Authentication**: Required for all endpoints
2. **Session Ownership**: Validated for modifications
3. **Admin Routes**: Separate middleware check
4. **API Key**: Service-to-service authentication

### Data Protection

- Audit trail for all modifications
- Soft deletes with cancelled_at timestamp
- User isolation via sub_token
- Guest email privacy in user's list

## 📧 Notification System Integration

### Trigger Points

1. **Session Creation**: Field Street noise warning
2. **Guest Invitations**: Email or in-app notification
3. **Session Updates**: All guests notified
4. **Session Cancellation**: Guests and waiting list notified
5. **Waiting List**: Next user notified when spot opens
6. **Content Sessions**: Admin email for approval
7. **Session Reviews**: Admin alert for SAD ratings

### Email Templates Used

- `field-street-noise-warning`
- `EMAILJS_SESION_REQUEST_TEMPLATE_ID` (content sessions)
- Guest invitation templates (TODO)
- Cancellation notifications (TODO)

## 🚀 Performance Optimizations

### Database Query Optimization

1. **Parallel Queries**: Fetch pricing and bookings simultaneously
2. **Selective Fields**: Only query needed columns
3. **Indexed Lookups**: Uses unique constraints effectively
4. **Caching**: Price calculations cached in memory

### Time Slot Generation

- Pre-calculated minute ranges
- Memoized duration labels
- Efficient overlap detection
- Batch processing for slots

## 📝 TODO Items Found

1. **Stripe Integration**: Payment processing for content sessions
2. **Email Templates**: Guest invitations, cancellations
3. **Partner Space Logic**: Special rules for partner gyms
4. **Free Friends**: Logic for member guest privileges
5. **Professional Clients**: Special invitation rules
6. **Invoice Generation**: For approved content sessions
7. **Decline Notifications**: Email users when content declined

## 🔄 Migration Considerations

When migrating to the new architecture, consider:

1. **Database Schema**: Map to new Prisma models
2. **Business Rules**: Preserve all validation logic
3. **API Compatibility**: Maintain endpoint structure
4. **Credit System**: Ensure proper transaction handling
5. **Notification Integration**: Update service connections
6. **Background Jobs**: Migrate cron configurations
7. **Audit Trail**: Preserve modification history
8. **Performance**: Maintain query optimizations
