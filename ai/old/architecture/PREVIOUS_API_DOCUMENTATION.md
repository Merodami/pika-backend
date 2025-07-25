# SOLO60 API Documentation - Current Microservices Architecture

This document provides comprehensive API documentation for the current microservices architecture implementation.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Gateway](#api-gateway)
3. [Authentication Service](#authentication-service)
4. [User Service](#user-service)
5. [Gym Service](#gym-service)
6. [Session Service](#session-service)
7. [Payment Service](#payment-service)
8. [Subscription Service](#subscription-service)
9. [Communication Service](#communication-service)
10. [Social Service](#social-service)
11. [Support Service](#support-service)
12. [Storage Service](#storage-service)
13. [Internal Service Communication](#internal-service-communication)

## Architecture Overview

The SOLO60 platform has been migrated from a monolithic PHP architecture to a modern microservices architecture using:

- **Technology Stack**: Node.js 22.x, TypeScript 5.8.3, Express 5.x
- **Architecture Pattern**: Clean Architecture with microservices
- **API Gateway**: Centralized routing and authentication
- **Service Communication**: HTTP-based with service authentication via API keys
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Authentication**: OAuth 2.0 standard with JWT tokens

### Service Ports

- API Gateway: 5500
- Auth Service: 5501
- User Service: 5502
- Gym Service: 5503
- Session Service: 5504
- Payment Service: 5505
- Subscription Service: 5506
- Communication Service: 5507
- Social Service: 5508
- Support Service: 5509
- Storage Service: 5510

## API Gateway

The API Gateway routes requests to microservices using the following pattern:

- Base URL: `/api/v1/{service}/{route}`
- Admin routes: `/api/v1/admin/{service}/{route}`
- Internal routes: Not exposed through gateway (direct service-to-service)

### Routing Structure

```
/api/v1/auth/*        → Auth Service (5501)
/api/v1/users/*       → User Service (5502)
/api/v1/gyms/*        → Gym Service (5503)
/api/v1/sessions/*    → Session Service (5504)
/api/v1/payments/*    → Payment Service (5505)
/api/v1/credits/*     → Payment Service (5505)
/api/v1/subscriptions/* → Subscription Service (5506)
/api/v1/communications/* → Communication Service (5507)
/api/v1/notifications/* → Communication Service (5507)
/api/v1/social/*      → Social Service (5508)
/api/v1/friends/*     → Social Service (5508)
/api/v1/support/*     → Support Service (5509)
/api/v1/problems/*    → Support Service (5509)
/api/v1/files/*       → Storage Service (5510)
/api/v1/uploads/*     → Storage Service (5510)
```

## Authentication Service

OAuth 2.0 compliant authentication service.

### Public Endpoints

#### Register User
```
POST /api/v1/auth/register
```

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dob": "1990-01-01"
}
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": false
  },
  "message": "Registration successful. Please check your email to verify your account."
}
```

#### OAuth 2.0 Token Endpoint
```
POST /api/v1/auth/token
```

Request (Password Grant):
```json
{
  "grant_type": "password",
  "username": "user@example.com",
  "password": "SecurePassword123!"
}
```

Request (Refresh Token Grant):
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "refresh_token_here"
}
```

Response:
```json
{
  "access_token": "jwt_access_token",
  "token_type": "Bearer",
  "expires_in": 7200,
  "refresh_token": "refresh_token",
  "scope": "read write"
}
```

#### Forgot Password
```
POST /api/v1/auth/forgot-password
```

Request:
```json
{
  "email": "user@example.com"
}
```

#### Reset Password
```
POST /api/v1/auth/reset-password
```

Request:
```json
{
  "token": "reset_token",
  "password": "NewSecurePassword123!"
}
```

#### Verify Email
```
GET /api/v1/auth/verify-email/:token
```

#### Resend Verification
```
POST /api/v1/auth/resend-verification
```

Request:
```json
{
  "email": "user@example.com"
}
```

#### Change Password (Authenticated)
```
POST /api/v1/auth/change-password
Authorization: Bearer {access_token}
```

Request:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

#### Token Introspection
```
POST /api/v1/auth/introspect
```

Request:
```json
{
  "token": "access_or_refresh_token"
}
```

Response:
```json
{
  "active": true,
  "scope": "read write",
  "username": "user@example.com",
  "exp": 1234567890,
  "sub": "user_id"
}
```

#### Token Revocation
```
POST /api/v1/auth/revoke
```

Request:
```json
{
  "token": "refresh_token"
}
```

#### User Info
```
GET /api/v1/auth/userinfo
Authorization: Bearer {access_token}
```

Response:
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe"
}
```

## User Service

User profile and management service.

### Public Endpoints

#### Get Current User
```
GET /api/v1/users/me
Authorization: Bearer {access_token}
```

Response:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "dob": "1990-01-01",
  "avatarUrl": "https://storage.solo60.com/avatars/user.jpg",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### Update Current User
```
PUT /api/v1/users/me
Authorization: Bearer {access_token}
```

Request:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "dob": "1990-01-01"
}
```

#### Get User by ID
```
GET /api/v1/users/:id
Authorization: Bearer {access_token}
```

#### Get User by Sub Token
```
GET /api/v1/users/sub/:subToken
Authorization: Bearer {access_token}
```

#### Get User Friends
```
GET /api/v1/users/:id/friends
Authorization: Bearer {access_token}
```

Response:
```json
{
  "friends": [
    {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Doe",
      "avatarUrl": "https://storage.solo60.com/avatars/jane.jpg"
    }
  ],
  "total": 1
}
```

#### Upload Avatar
```
POST /api/v1/users/:id/avatar
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

Form Data:
- avatar: File (image/jpeg, image/png)

### Admin Endpoints

#### Get All Users
```
GET /api/v1/admin/users?page=1&limit=20&search=john&status=active
Authorization: Bearer {admin_token}
```

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "active",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Get User by Email
```
GET /api/v1/admin/users/email/:email
Authorization: Bearer {admin_token}
```

#### Create User
```
POST /api/v1/admin/users
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "email": "newuser@example.com",
  "password": "TempPassword123!",
  "firstName": "New",
  "lastName": "User",
  "phone": "+1234567890",
  "dob": "1990-01-01",
  "role": "user"
}
```

#### Update User
```
PATCH /api/v1/admin/users/:id
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "status": "active",
  "role": "admin"
}
```

#### Delete User
```
DELETE /api/v1/admin/users/:id
Authorization: Bearer {admin_token}
```

#### Update User Status
```
PUT /api/v1/admin/users/:id/status
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "status": "inactive",
  "reason": "Account suspension due to policy violation"
}
```

#### Ban User
```
PUT /api/v1/admin/users/:id/ban
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "reason": "Policy violation",
  "duration": 7,
  "unit": "days"
}
```

#### Unban User
```
PUT /api/v1/admin/users/:id/unban
Authorization: Bearer {admin_token}
```

## Gym Service

Gym management and discovery service.

### Public Endpoints

#### Get All Gyms
```
GET /api/v1/gyms?page=1&limit=20&city=Madrid&amenities=wifi,parking
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "FitLife Gym Madrid",
      "description": "Modern fitness center",
      "address": {
        "street": "Calle Mayor 123",
        "city": "Madrid",
        "state": "Madrid",
        "country": "Spain",
        "postalCode": "28001"
      },
      "coordinates": {
        "latitude": 40.4168,
        "longitude": -3.7038
      },
      "amenities": ["wifi", "parking", "showers", "lockers"],
      "operatingHours": {
        "monday": { "open": "06:00", "close": "22:00" },
        "tuesday": { "open": "06:00", "close": "22:00" }
      },
      "images": ["https://storage.solo60.com/gyms/gym1.jpg"],
      "rating": 4.5,
      "totalReviews": 150,
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### Search Gyms
```
GET /api/v1/gyms/search?q=fitness&lat=40.4168&lng=-3.7038&radius=5000
Authorization: Bearer {access_token}
```

#### Search Nearby Gyms
```
GET /api/v1/gyms/nearby?lat=40.4168&lng=-3.7038&radius=5000
Authorization: Bearer {access_token}
```

#### Find Nearest Gym
```
GET /api/v1/gyms/nearest?lat=40.4168&lng=-3.7038
Authorization: Bearer {access_token}
```

#### Get Gym by ID
```
GET /api/v1/gyms/:id
Authorization: Bearer {access_token}
```

### Induction Endpoints

#### Get My Inductions
```
GET /api/v1/gyms/inductions
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "gymId": "gym_uuid",
      "userId": "user_uuid",
      "status": "completed",
      "completedAt": "2024-01-01T00:00:00Z",
      "gym": {
        "id": "gym_uuid",
        "name": "FitLife Gym Madrid"
      }
    }
  ]
}
```

#### Request Induction
```
POST /api/v1/gyms/inductions
Authorization: Bearer {access_token}
```

Request:
```json
{
  "gymId": "gym_uuid",
  "preferredDate": "2024-01-15",
  "preferredTime": "10:00",
  "notes": "First time at this gym"
}
```

#### Get Induction by ID
```
GET /api/v1/gyms/inductions/:id
Authorization: Bearer {access_token}
```

#### Update Induction
```
PUT /api/v1/gyms/inductions/:id
Authorization: Bearer {access_token}
```

#### Delete Induction
```
DELETE /api/v1/gyms/inductions/:id
Authorization: Bearer {access_token}
```

### Equipment/Stuff Endpoints

#### Get All Equipment
```
GET /api/v1/gyms/stuff?gymId=uuid
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Treadmill",
      "category": "cardio",
      "brand": "Life Fitness",
      "model": "T5",
      "quantity": 10,
      "status": "available",
      "gymId": "gym_uuid"
    }
  ]
}
```

#### Get Equipment by ID
```
GET /api/v1/gyms/stuff/:id
Authorization: Bearer {access_token}
```

### Favorite Gym Endpoints

#### Get Favorite Gyms
```
GET /api/v1/gyms/favorites
Authorization: Bearer {access_token}
```

#### Add Favorite Gym
```
POST /api/v1/gyms/favorites
Authorization: Bearer {access_token}
```

Request:
```json
{
  "gymId": "gym_uuid"
}
```

#### Remove Favorite Gym
```
DELETE /api/v1/gyms/favorites/:gymId
Authorization: Bearer {access_token}
```

### Admin Endpoints

#### Create Gym
```
POST /api/v1/admin/gyms
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "name": "New Fitness Center",
  "description": "State of the art facility",
  "address": {
    "street": "123 Main St",
    "city": "Madrid",
    "state": "Madrid",
    "country": "Spain",
    "postalCode": "28001"
  },
  "coordinates": {
    "latitude": 40.4168,
    "longitude": -3.7038
  },
  "amenities": ["wifi", "parking", "showers"],
  "operatingHours": {
    "monday": { "open": "06:00", "close": "22:00" }
  },
  "contactEmail": "info@newfitness.com",
  "contactPhone": "+34123456789"
}
```

#### Update Gym
```
PUT /api/v1/admin/gyms/:id
Authorization: Bearer {admin_token}
```

#### Delete Gym
```
DELETE /api/v1/admin/gyms/:id
Authorization: Bearer {admin_token}
```

#### Upload Gym Picture
```
POST /api/v1/admin/gyms/:id/pictures
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

#### Create Equipment
```
POST /api/v1/admin/gyms/stuff
Authorization: Bearer {admin_token}
```

#### Update Equipment
```
PUT /api/v1/admin/gyms/stuff/:id
Authorization: Bearer {admin_token}
```

#### Delete Equipment
```
DELETE /api/v1/admin/gyms/stuff/:id
Authorization: Bearer {admin_token}
```

## Session Service

Training session booking and management service.

### Public Endpoints

#### Get All Sessions
```
GET /api/v1/sessions?page=1&limit=20&gymId=uuid&date=2024-01-15
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "uuid",
      "gymId": "gym_uuid",
      "userId": "user_uuid",
      "startTime": "2024-01-15T10:00:00Z",
      "endTime": "2024-01-15T11:00:00Z",
      "status": "confirmed",
      "type": "personal",
      "maxParticipants": 1,
      "currentParticipants": 1,
      "gym": {
        "id": "gym_uuid",
        "name": "FitLife Gym Madrid"
      },
      "user": {
        "id": "user_uuid",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Get Available Slots
```
GET /api/v1/sessions/available-slots?gymId=uuid&date=2024-01-15&duration=60
Authorization: Bearer {access_token}
```

Response:
```json
{
  "slots": [
    {
      "startTime": "09:00",
      "endTime": "10:00",
      "available": true
    },
    {
      "startTime": "10:00",
      "endTime": "11:00",
      "available": false
    }
  ]
}
```

#### Get Alternative Slots
```
GET /api/v1/sessions/alternative-slots?gymId=uuid&date=2024-01-15&time=10:00&duration=60
Authorization: Bearer {access_token}
```

#### Get Session History
```
GET /api/v1/sessions/history?page=1&limit=20
Authorization: Bearer {access_token}
```

#### Search Sessions by Gym
```
GET /api/v1/sessions/search/:gymId?date=2024-01-15&status=available
Authorization: Bearer {access_token}
```

#### Get Session Feedback
```
GET /api/v1/sessions/feedback/:id
Authorization: Bearer {access_token}
```

#### Submit Session Feedback
```
POST /api/v1/sessions/feedback/:id
Authorization: Bearer {access_token}
```

Request:
```json
{
  "rating": 5,
  "comment": "Great workout session!",
  "trainerRating": 5,
  "facilityRating": 4
}
```

#### Get User Sessions
```
GET /api/v1/sessions/user/:userId
Authorization: Bearer {access_token}
```

#### Get Session by ID
```
GET /api/v1/sessions/:id
Authorization: Bearer {access_token}
```

#### Create Session
```
POST /api/v1/sessions
Authorization: Bearer {access_token}
```

Request:
```json
{
  "gymId": "gym_uuid",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "type": "personal",
  "maxParticipants": 1,
  "notes": "Focus on cardio"
}
```

#### Update Session
```
PATCH /api/v1/sessions/:id
Authorization: Bearer {access_token}
```

Request:
```json
{
  "startTime": "2024-01-15T11:00:00Z",
  "endTime": "2024-01-15T12:00:00Z",
  "notes": "Rescheduled"
}
```

#### Cancel Session
```
POST /api/v1/sessions/:id/cancel
Authorization: Bearer {access_token}
```

Request:
```json
{
  "reason": "Unable to attend"
}
```

#### Create Reservation
```
POST /api/v1/sessions/reservations
Authorization: Bearer {access_token}
```

Request:
```json
{
  "gymId": "gym_uuid",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "type": "personal"
}
```

Response:
```json
{
  "reservationId": "reservation_uuid",
  "expiresAt": "2024-01-15T09:50:00Z",
  "status": "pending"
}
```

#### Confirm Reservation
```
POST /api/v1/sessions/reservations/:reservationId/confirm
Authorization: Bearer {access_token}
```

#### Request Extra Time
```
PUT /api/v1/sessions/extratime/:id
Authorization: Bearer {access_token}
```

Request:
```json
{
  "additionalMinutes": 30,
  "reason": "Need more time to complete workout"
}
```

#### Check In to Session
```
POST /api/v1/sessions/checkin/:id
Authorization: Bearer {access_token}
```

Request:
```json
{
  "location": {
    "latitude": 40.4168,
    "longitude": -3.7038
  }
}
```

#### Check Out from Session
```
POST /api/v1/sessions/checkout/:id
Authorization: Bearer {access_token}
```

Request:
```json
{
  "location": {
    "latitude": 40.4168,
    "longitude": -3.7038
  }
}
```

### Session Invitee Management

#### Create Invitee
```
POST /api/v1/sessions/invitee
Authorization: Bearer {access_token}
```

Request:
```json
{
  "sessionId": "session_uuid",
  "email": "guest@example.com",
  "name": "Guest User"
}
```

#### Get Invitee
```
GET /api/v1/sessions/invitee/:id
Authorization: Bearer {access_token}
```

#### Get Session Invitees
```
GET /api/v1/sessions/:sessionId/invitees
Authorization: Bearer {access_token}
```

#### Update Invitee
```
PUT /api/v1/sessions/invitee/:id
Authorization: Bearer {access_token}
```

#### Delete Invitee
```
DELETE /api/v1/sessions/invitee/:id
Authorization: Bearer {access_token}
```

#### Invite Guest
```
POST /api/v1/sessions/invite
Authorization: Bearer {access_token}
```

Request:
```json
{
  "sessionId": "session_uuid",
  "guests": [
    {
      "email": "guest1@example.com",
      "name": "Guest One"
    }
  ]
}
```

#### Update Invitation
```
PUT /api/v1/sessions/invitation/:id
Authorization: Bearer {access_token}
```

Request:
```json
{
  "status": "accepted"
}
```

### Waiting List

#### Join Waiting List
```
POST /api/v1/sessions/wait/join
Authorization: Bearer {access_token}
```

Request:
```json
{
  "sessionId": "session_uuid",
  "notificationPreference": "email"
}
```

#### Update Waiting List Status
```
PUT /api/v1/sessions/wait/:id
Authorization: Bearer {access_token}
```

#### Leave Waiting List
```
PUT /api/v1/sessions/wait/leave/:id
Authorization: Bearer {access_token}
```

### Admin Endpoints

#### Get Admin Available Slots
```
GET /api/v1/admin/sessions/available-slots
Authorization: Bearer {admin_token}
```

#### Get Session Analytics
```
GET /api/v1/admin/sessions/analytics?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {admin_token}
```

Response:
```json
{
  "totalSessions": 1500,
  "completedSessions": 1400,
  "cancelledSessions": 100,
  "averageSessionDuration": 58,
  "popularTimeSlots": [
    { "hour": 18, "count": 250 },
    { "hour": 19, "count": 230 }
  ],
  "gymStatistics": [
    {
      "gymId": "gym_uuid",
      "gymName": "FitLife Gym Madrid",
      "totalSessions": 500,
      "utilizationRate": 0.75
    }
  ]
}
```

#### Get All Sessions (Admin)
```
GET /api/v1/admin/sessions/all?page=1&limit=20&gymId=uuid&userId=uuid&status=completed
Authorization: Bearer {admin_token}
```

#### Create Session (Admin)
```
POST /api/v1/admin/sessions/
Authorization: Bearer {admin_token}
```

#### Book Session for User
```
POST /api/v1/admin/sessions/book
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "userId": "user_uuid",
  "gymId": "gym_uuid",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "type": "personal",
  "notes": "Admin booked session"
}
```

#### Get Booking Statistics
```
POST /api/v1/admin/sessions/stats/bookings
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "userIds": ["user_uuid1", "user_uuid2"],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

Response:
```json
{
  "stats": [
    {
      "userId": "user_uuid1",
      "totalBookings": 15,
      "completedBookings": 14,
      "cancelledBookings": 1,
      "totalHours": 14.5,
      "favoriteGym": {
        "gymId": "gym_uuid",
        "gymName": "FitLife Gym Madrid",
        "bookingCount": 10
      }
    }
  ]
}
```

#### Get Session Details (Admin)
```
GET /api/v1/admin/sessions/:id
Authorization: Bearer {admin_token}
```

#### Delete Session (Admin)
```
DELETE /api/v1/admin/sessions/:id
Authorization: Bearer {admin_token}
```

#### Cancel Session (Admin)
```
POST /api/v1/admin/sessions/:id/cancel
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "reason": "Facility maintenance",
  "notifyUsers": true
}
```

#### Approve Session Content
```
POST /api/v1/admin/sessions/:id/approve
Authorization: Bearer {admin_token}
```

#### Decline Session Content
```
POST /api/v1/admin/sessions/:id/decline
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "reason": "Inappropriate content"
}
```

#### Force Check-in
```
POST /api/v1/admin/sessions/force-checkin
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "sessionId": "session_uuid",
  "userId": "user_uuid",
  "reason": "Manual check-in by admin"
}
```

#### Cleanup Expired Reservations
```
POST /api/v1/admin/sessions/cleanup-expired-reservations
Authorization: Bearer {admin_token}
```

## Payment Service

Payment processing and credit management service.

### Credits Endpoints

#### Get User Credits
```
GET /api/v1/credits/users/:userId
Authorization: Bearer {access_token}
```

Response:
```json
{
  "userId": "user_uuid",
  "credits": [
    {
      "id": "credit_uuid",
      "type": "purchased",
      "amount": 100,
      "remaining": 85,
      "expiresAt": "2024-12-31T23:59:59Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "totalAvailable": 85,
  "totalPurchased": 100,
  "totalConsumed": 15
}
```

#### Get Credit History
```
GET /api/v1/credits/users/:userId/history?page=1&limit=20
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "history_uuid",
      "type": "consumption",
      "amount": -1,
      "balance": 85,
      "description": "Session booking",
      "relatedId": "session_uuid",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### Add Credits (Admin)
```
POST /api/v1/credits/users/:userId/add
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "amount": 50,
  "type": "bonus",
  "reason": "Customer loyalty reward",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### Consume Credits
```
POST /api/v1/credits/users/:userId/consume
Authorization: Bearer {access_token}
```

Request:
```json
{
  "amount": 1,
  "reason": "Session booking",
  "relatedId": "session_uuid"
}
```

#### Smart Consume Credits
```
POST /api/v1/credits/users/:userId/consume-smart
Authorization: Bearer {access_token}
```

Request:
```json
{
  "amount": 5,
  "reason": "Premium session booking",
  "relatedId": "session_uuid",
  "priority": ["purchased", "subscription", "bonus"]
}
```

#### Transfer Credits
```
POST /api/v1/credits/users/:userId/transfer
Authorization: Bearer {access_token}
```

Request:
```json
{
  "toUserId": "recipient_uuid",
  "amount": 10,
  "reason": "Gift to friend"
}
```

#### Purchase Credits
```
POST /api/v1/credits/add-credits
Authorization: Bearer {access_token}
```

Request:
```json
{
  "creditPackId": "pack_uuid",
  "paymentMethodId": "pm_stripe_id"
}
```

### Credit Packs

#### Get All Credit Packs
```
GET /api/v1/payments/credit-packs
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "pack_uuid",
      "name": "Starter Pack",
      "credits": 10,
      "price": 9.99,
      "currency": "EUR",
      "bonus": 0,
      "description": "Perfect for beginners",
      "isActive": true
    }
  ]
}
```

#### Get Credit Pack by ID
```
GET /api/v1/payments/credit-packs/:id
Authorization: Bearer {access_token}
```

#### Create Credit Pack (Admin)
```
POST /api/v1/payments/credit-packs
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "name": "Premium Pack",
  "credits": 100,
  "price": 79.99,
  "currency": "EUR",
  "bonus": 20,
  "description": "Best value for regular users",
  "validityDays": 365
}
```

#### Update Credit Pack (Admin)
```
PUT /api/v1/payments/credit-packs/:id
Authorization: Bearer {admin_token}
```

#### Delete Credit Pack (Admin)
```
DELETE /api/v1/payments/credit-packs/:id
Authorization: Bearer {admin_token}
```

### Memberships

#### Get User Memberships
```
GET /api/v1/payments/memberships
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "membership_uuid",
      "planId": "plan_uuid",
      "status": "active",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "autoRenew": true,
      "plan": {
        "name": "Premium Annual",
        "price": 599.99,
        "credits": 120
      }
    }
  ]
}
```

#### Get Membership History
```
GET /api/v1/payments/memberships/history
Authorization: Bearer {access_token}
```

#### Create Membership
```
POST /api/v1/payments/memberships
Authorization: Bearer {access_token}
```

Request:
```json
{
  "planId": "plan_uuid",
  "paymentMethodId": "pm_stripe_id",
  "autoRenew": true
}
```

#### Cancel Membership
```
PUT /api/v1/payments/memberships/:id/cancel
Authorization: Bearer {access_token}
```

Request:
```json
{
  "reason": "No longer needed",
  "cancelImmediately": false
}
```

### Promo Codes

#### Validate Promo Code
```
GET /api/v1/payments/promo-codes/:code
Authorization: Bearer {access_token}
```

Response:
```json
{
  "valid": true,
  "code": "SUMMER2024",
  "discount": 20,
  "discountType": "percentage",
  "applicableTo": ["credit_packs", "memberships"],
  "expiresAt": "2024-08-31T23:59:59Z"
}
```

#### Create Promo Code (Admin)
```
POST /api/v1/payments/promo-codes
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "code": "NEWYEAR2024",
  "discount": 25,
  "discountType": "percentage",
  "applicableTo": ["credit_packs"],
  "maxUses": 1000,
  "expiresAt": "2024-01-31T23:59:59Z"
}
```

#### Update Promo Code (Admin)
```
PUT /api/v1/payments/promo-codes/:id
Authorization: Bearer {admin_token}
```

#### Delete Promo Code (Admin)
```
DELETE /api/v1/payments/promo-codes/:id
Authorization: Bearer {admin_token}
```

### Products

#### Get All Products
```
GET /api/v1/payments/products
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "product_uuid",
      "stripeProductId": "prod_stripe_id",
      "name": "Monthly Membership",
      "description": "Access to all gyms",
      "type": "membership",
      "prices": [
        {
          "id": "price_uuid",
          "stripePriceId": "price_stripe_id",
          "amount": 49.99,
          "currency": "EUR",
          "interval": "month"
        }
      ]
    }
  ]
}
```

#### Get Product by ID
```
GET /api/v1/payments/products/:id
Authorization: Bearer {access_token}
```

### Webhooks

#### Stripe Webhook
```
POST /api/v1/payments/webhooks/stripe
Stripe-Signature: {stripe_signature}
```

Raw Body: Stripe webhook payload

## Subscription Service

Subscription plan and management service.

### Public Endpoints

#### Get My Subscription
```
GET /api/v1/subscriptions/me
Authorization: Bearer {access_token}
```

Response:
```json
{
  "id": "subscription_uuid",
  "planId": "plan_uuid",
  "status": "active",
  "currentPeriodStart": "2024-01-01",
  "currentPeriodEnd": "2024-01-31",
  "cancelAtPeriodEnd": false,
  "plan": {
    "id": "plan_uuid",
    "name": "Premium Monthly",
    "price": 49.99,
    "interval": "month",
    "credits": 10,
    "features": ["unlimited_gym_access", "priority_booking"]
  }
}
```

#### Create Subscription
```
POST /api/v1/subscriptions
Authorization: Bearer {access_token}
```

Request:
```json
{
  "planId": "plan_uuid",
  "paymentMethodId": "pm_stripe_id"
}
```

#### Get Subscription by ID
```
GET /api/v1/subscriptions/:id
Authorization: Bearer {access_token}
```

#### Update Subscription
```
PUT /api/v1/subscriptions/:id
Authorization: Bearer {access_token}
```

Request:
```json
{
  "planId": "new_plan_uuid"
}
```

#### Cancel Subscription
```
POST /api/v1/subscriptions/:id/cancel
Authorization: Bearer {access_token}
```

Request:
```json
{
  "reason": "Too expensive",
  "cancelImmediately": false
}
```

#### Reactivate Subscription
```
POST /api/v1/subscriptions/:id/reactivate
Authorization: Bearer {access_token}
```

### Plans

#### Get All Plans
```
GET /api/v1/subscriptions/plans
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "plan_uuid",
      "name": "Basic Monthly",
      "price": 29.99,
      "currency": "EUR",
      "interval": "month",
      "intervalCount": 1,
      "credits": 5,
      "features": ["gym_access", "basic_support"],
      "isActive": true
    }
  ]
}
```

#### Get Plan by ID
```
GET /api/v1/subscriptions/plans/:id
Authorization: Bearer {access_token}
```

#### Create Plan (Admin)
```
POST /api/v1/subscriptions/plans
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "name": "Enterprise Annual",
  "price": 999.99,
  "currency": "EUR",
  "interval": "year",
  "intervalCount": 1,
  "credits": 200,
  "features": ["unlimited_everything", "dedicated_support"],
  "stripePriceId": "price_stripe_id"
}
```

#### Update Plan (Admin)
```
PUT /api/v1/subscriptions/plans/:id
Authorization: Bearer {admin_token}
```

#### Delete Plan (Admin)
```
DELETE /api/v1/subscriptions/plans/:id
Authorization: Bearer {admin_token}
```

### Admin Endpoints

#### Get All Subscriptions
```
GET /api/v1/subscriptions?page=1&limit=20&status=active
Authorization: Bearer {admin_token}
```

#### Process Subscription Credits
```
POST /api/v1/subscriptions/:id/process-credits
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "period": "2024-01"
}
```

## Communication Service

Email and notification management service.

### Email Endpoints

#### Send Email
```
POST /api/v1/communications/emails/send
Authorization: Bearer {access_token}
```

Request:
```json
{
  "to": "recipient@example.com",
  "subject": "Workout Reminder",
  "templateId": "workout_reminder",
  "data": {
    "userName": "John",
    "sessionTime": "10:00 AM",
    "gymName": "FitLife Gym"
  }
}
```

#### Send Bulk Email (Admin)
```
POST /api/v1/communications/emails/send-bulk
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "recipients": ["user1@example.com", "user2@example.com"],
  "subject": "System Maintenance Notice",
  "templateId": "system_notice",
  "data": {
    "maintenanceDate": "2024-01-20",
    "duration": "2 hours"
  }
}
```

#### Get Email History
```
GET /api/v1/communications/emails/history?page=1&limit=20
Authorization: Bearer {access_token}
```

#### Get Email by ID
```
GET /api/v1/communications/emails/history/:id
Authorization: Bearer {access_token}
```

### Notification Endpoints

#### Get User Notifications
```
GET /api/v1/notifications?page=1&limit=20&unreadOnly=true
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "notification_uuid",
      "type": "session_reminder",
      "title": "Session Starting Soon",
      "message": "Your session at FitLife Gym starts in 30 minutes",
      "data": {
        "sessionId": "session_uuid",
        "gymId": "gym_uuid"
      },
      "read": false,
      "createdAt": "2024-01-15T09:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  },
  "unreadCount": 3
}
```

#### Get Notification by ID
```
GET /api/v1/notifications/:id
Authorization: Bearer {access_token}
```

#### Mark Notification as Read
```
PUT /api/v1/notifications/:id/read
Authorization: Bearer {access_token}
```

#### Mark All Notifications as Read
```
PUT /api/v1/notifications/read-all
Authorization: Bearer {access_token}
```

#### Delete Notification
```
DELETE /api/v1/notifications/:id
Authorization: Bearer {access_token}
```

#### Update Notification Preferences
```
PUT /api/v1/notifications/preferences
Authorization: Bearer {access_token}
```

Request:
```json
{
  "email": {
    "sessionReminders": true,
    "marketing": false,
    "systemUpdates": true
  },
  "push": {
    "sessionReminders": true,
    "friendRequests": true,
    "marketing": false
  }
}
```

### Template Management (Admin)

#### Get All Templates
```
GET /api/v1/communications/templates
Authorization: Bearer {admin_token}
```

#### Get Template by ID
```
GET /api/v1/communications/templates/:id
Authorization: Bearer {admin_token}
```

#### Create Template
```
POST /api/v1/communications/templates
Authorization: Bearer {admin_token}
```

Request:
```json
{
  "name": "welcome_email",
  "subject": "Welcome to SOLO60!",
  "body": "Hello {{userName}}, welcome to SOLO60...",
  "type": "email",
  "variables": ["userName"],
  "isActive": true
}
```

#### Update Template
```
PUT /api/v1/communications/templates/:id
Authorization: Bearer {admin_token}
```

#### Delete Template
```
DELETE /api/v1/communications/templates/:id
Authorization: Bearer {admin_token}
```

## Social Service

Social networking and activity feed service.

### Friend Management

#### Send Friend Request
```
POST /api/v1/friends/request
Authorization: Bearer {access_token}
```

Request:
```json
{
  "userId": "target_user_uuid",
  "message": "Hey, let's workout together!"
}
```

#### Accept Friend Request
```
PUT /api/v1/friends/:id/accept
Authorization: Bearer {access_token}
```

#### Decline Friend Request
```
PUT /api/v1/friends/:id/decline
Authorization: Bearer {access_token}
```

#### Cancel Friend Request
```
DELETE /api/v1/friends/:id/cancel
Authorization: Bearer {access_token}
```

#### Get Friends List
```
GET /api/v1/friends?page=1&limit=20
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "friend_uuid",
      "userId": "user_uuid",
      "friendId": "friend_user_uuid",
      "status": "accepted",
      "friend": {
        "id": "friend_user_uuid",
        "firstName": "Jane",
        "lastName": "Smith",
        "avatarUrl": "https://storage.solo60.com/avatars/jane.jpg"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### Get Friend Requests
```
GET /api/v1/friends/requests
Authorization: Bearer {access_token}
```

#### Get Sent Friend Requests
```
GET /api/v1/friends/requests/sent
Authorization: Bearer {access_token}
```

#### Get Blocked Users
```
GET /api/v1/friends/blocked
Authorization: Bearer {access_token}
```

#### Get Friend Suggestions
```
GET /api/v1/friends/discover/suggestions?limit=10
Authorization: Bearer {access_token}
```

#### Get Mutual Friends
```
GET /api/v1/friends/discover/mutual/:userId
Authorization: Bearer {access_token}
```

#### Block User
```
PUT /api/v1/friends/:id/block
Authorization: Bearer {access_token}
```

#### Unblock User
```
PUT /api/v1/friends/:id/unblock
Authorization: Bearer {access_token}
```

### Activity Feed

#### Get Activity Feed
```
GET /api/v1/social/activities?page=1&limit=20&type=workout
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "activity_uuid",
      "userId": "user_uuid",
      "type": "workout_completed",
      "data": {
        "sessionId": "session_uuid",
        "gymName": "FitLife Gym",
        "duration": 60,
        "workoutType": "strength"
      },
      "user": {
        "id": "user_uuid",
        "firstName": "John",
        "lastName": "Doe",
        "avatarUrl": "https://storage.solo60.com/avatars/john.jpg"
      },
      "likes": 15,
      "comments": 3,
      "isLiked": false,
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Get Activity by ID
```
GET /api/v1/social/activities/:id
Authorization: Bearer {access_token}
```

#### Create Activity
```
POST /api/v1/social/activities
Authorization: Bearer {access_token}
```

Request:
```json
{
  "type": "workout_completed",
  "data": {
    "sessionId": "session_uuid",
    "gymName": "FitLife Gym",
    "duration": 60,
    "workoutType": "cardio",
    "notes": "Great HIIT session!"
  },
  "visibility": "friends"
}
```

#### Delete Activity
```
DELETE /api/v1/social/activities/:id
Authorization: Bearer {access_token}
```

### Follow System

#### Follow User
```
POST /api/v1/social/follow/:userId
Authorization: Bearer {access_token}
```

#### Unfollow User
```
DELETE /api/v1/social/follow/:userId
Authorization: Bearer {access_token}
```

#### Get Followers
```
GET /api/v1/social/followers?page=1&limit=20
Authorization: Bearer {access_token}
```

#### Get Following
```
GET /api/v1/social/following?page=1&limit=20
Authorization: Bearer {access_token}
```

### Interactions

#### Like Activity
```
POST /api/v1/social/activities/:activityId/like
Authorization: Bearer {access_token}
```

#### Unlike Activity
```
DELETE /api/v1/social/activities/:activityId/like
Authorization: Bearer {access_token}
```

#### Comment on Activity
```
POST /api/v1/social/activities/:activityId/comment
Authorization: Bearer {access_token}
```

Request:
```json
{
  "comment": "Awesome workout! Keep it up! 💪"
}
```

#### Get Activity Comments
```
GET /api/v1/social/activities/:activityId/comments?page=1&limit=20
Authorization: Bearer {access_token}
```

#### Delete Comment
```
DELETE /api/v1/social/comments/:commentId
Authorization: Bearer {access_token}
```

## Support Service

Customer support and problem reporting service.

### Problem/Ticket Management

#### Get User's Problems
```
GET /api/v1/problems?page=1&limit=20&status=open
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "problem_uuid",
      "userId": "user_uuid",
      "category": "payment",
      "subject": "Credit purchase not reflected",
      "description": "I purchased 50 credits but they haven't been added to my account",
      "status": "in_progress",
      "priority": "high",
      "assignedTo": "support_agent_uuid",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

#### Get Problem by ID
```
GET /api/v1/problems/:id
Authorization: Bearer {access_token}
```

#### Create Problem Report
```
POST /api/v1/problems
Authorization: Bearer {access_token}
```

Request:
```json
{
  "category": "technical",
  "subject": "App crashes when booking session",
  "description": "The app crashes every time I try to book a session at FitLife Gym",
  "attachments": ["screenshot_uuid1", "log_file_uuid"]
}
```

#### Update Problem
```
PUT /api/v1/problems/:id
Authorization: Bearer {access_token}
```

Request:
```json
{
  "status": "resolved",
  "resolution": "Issue has been fixed in the latest app update"
}
```

#### Delete Problem
```
DELETE /api/v1/problems/:id
Authorization: Bearer {access_token}
```

### Support Comments

#### Get Problem Comments
```
GET /api/v1/problems/:problemId/comments
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "comment_uuid",
      "problemId": "problem_uuid",
      "userId": "user_uuid",
      "comment": "I've tried reinstalling the app but the issue persists",
      "isStaff": false,
      "user": {
        "id": "user_uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

#### Add Comment
```
POST /api/v1/problems/:problemId/comments
Authorization: Bearer {access_token}
```

Request:
```json
{
  "comment": "Here's additional information about the issue..."
}
```

#### Update Comment
```
PUT /api/v1/support/comments/:id
Authorization: Bearer {access_token}
```

#### Delete Comment
```
DELETE /api/v1/support/comments/:id
Authorization: Bearer {access_token}
```

## Storage Service

File upload and management service.

### File Management

#### Upload File
```
POST /api/v1/files/upload
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

Form Data:
- file: File
- folder: string (optional, e.g., "avatars", "documents")
- isPublic: boolean (optional, default: false)

Response:
```json
{
  "id": "file_uuid",
  "filename": "workout-plan.pdf",
  "originalName": "My Workout Plan.pdf",
  "mimeType": "application/pdf",
  "size": 1048576,
  "url": "https://storage.solo60.com/files/file_uuid",
  "folder": "documents",
  "isPublic": false,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### Upload Multiple Files
```
POST /api/v1/files/upload-multiple
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

Form Data:
- files: File[] (multiple files)
- folder: string (optional)

Response:
```json
{
  "files": [
    {
      "id": "file_uuid1",
      "filename": "photo1.jpg",
      "url": "https://storage.solo60.com/files/file_uuid1"
    },
    {
      "id": "file_uuid2",
      "filename": "photo2.jpg",
      "url": "https://storage.solo60.com/files/file_uuid2"
    }
  ],
  "uploaded": 2,
  "failed": 0
}
```

#### Get File
```
GET /api/v1/files/:id
Authorization: Bearer {access_token}
```

#### Download File
```
GET /api/v1/files/:id/download
Authorization: Bearer {access_token}
```

#### Delete File
```
DELETE /api/v1/files/:id
Authorization: Bearer {access_token}
```

#### List User Files
```
GET /api/v1/files?page=1&limit=20&folder=documents
Authorization: Bearer {access_token}
```

Response:
```json
{
  "data": [
    {
      "id": "file_uuid",
      "filename": "workout-plan.pdf",
      "mimeType": "application/pdf",
      "size": 1048576,
      "url": "https://storage.solo60.com/files/file_uuid",
      "folder": "documents",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  },
  "totalSize": 10485760
}
```

## Internal Service Communication

Services communicate internally using dedicated endpoints not exposed through the API Gateway.

### Authentication Headers

All internal service calls must include:
```
x-api-key: {service_api_key}
x-service-name: {calling_service_name}
x-correlation-id: {request_correlation_id}
```

### User Service Internal Endpoints

#### Get User by Email (Internal)
```
GET /internal/users/auth/by-email/:email
x-api-key: {service_api_key}
```

#### Get User by ID (Internal)
```
GET /internal/users/auth/:id
x-api-key: {service_api_key}
```

#### Create User (Internal)
```
POST /internal/users
x-api-key: {service_api_key}
```

#### Update Last Login (Internal)
```
POST /internal/users/:id/last-login
x-api-key: {service_api_key}
```

#### Check Email Availability (Internal)
```
GET /internal/users/check-email/:email
x-api-key: {service_api_key}
```

#### Check Phone Availability (Internal)
```
GET /internal/users/check-phone/:phone
x-api-key: {service_api_key}
```

#### Update Password (Internal)
```
POST /internal/users/:id/password
x-api-key: {service_api_key}
```

#### Verify Email (Internal)
```
POST /internal/users/:id/verify-email
x-api-key: {service_api_key}
```

### Communication Service Internal Endpoints

#### Send System Email (Internal)
```
POST /internal/communications/email/send
x-api-key: {service_api_key}
```

Request:
```json
{
  "to": "user@example.com",
  "templateId": "password_reset",
  "data": {
    "resetLink": "https://app.solo60.com/reset?token=xxx",
    "userName": "John"
  }
}
```

#### Create System Notification (Internal)
```
POST /internal/communications/notification/create
x-api-key: {service_api_key}
```

Request:
```json
{
  "userId": "user_uuid",
  "type": "session_reminder",
  "title": "Session Starting Soon",
  "message": "Your session starts in 30 minutes",
  "data": {
    "sessionId": "session_uuid"
  }
}
```

### Payment Service Internal Endpoints

#### Process Subscription Credits (Internal)
```
POST /internal/payments/credits/subscription
x-api-key: {service_api_key}
```

#### Get User Credit Balance (Internal)
```
GET /internal/payments/credits/balance/:userId
x-api-key: {service_api_key}
```

### Subscription Service Internal Endpoints

#### Check Active Subscription (Internal)
```
GET /internal/subscriptions/check/:userId
x-api-key: {service_api_key}
```

#### Process Subscription Event (Internal)
```
POST /internal/subscriptions/event
x-api-key: {service_api_key}
```

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "correlationId": "correlation_uuid",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Request validation failed
- `CONFLICT`: Resource conflict (e.g., duplicate)
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Rate Limiting

API Gateway implements rate limiting:
- Anonymous: 100 requests per hour
- Authenticated: 1000 requests per hour
- Admin: 5000 requests per hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642291200
```

## Pagination

All list endpoints support pagination:
```
GET /api/v1/resource?page=1&limit=20&sort=createdAt&order=desc
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Webhook Events

The platform sends webhooks for various events:

### Session Events
- `session.created`
- `session.updated`
- `session.cancelled`
- `session.completed`
- `session.checkin`
- `session.checkout`

### Payment Events
- `payment.succeeded`
- `payment.failed`
- `subscription.created`
- `subscription.updated`
- `subscription.cancelled`
- `credits.purchased`
- `credits.consumed`

### User Events
- `user.created`
- `user.updated`
- `user.deleted`
- `user.verified`

Webhook payload format:
```json
{
  "id": "webhook_uuid",
  "type": "session.created",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    // Event-specific data
  }
}
```

## Migration Notes

### Changes from Previous Architecture

1. **Authentication**: Migrated from custom JWT to OAuth 2.0 standard
2. **API Structure**: RESTful URLs with consistent patterns
3. **Microservices**: Separated into domain-specific services
4. **Internal APIs**: Added service-to-service communication
5. **Real-time**: WebSocket support for notifications (coming soon)
6. **File Storage**: Dedicated storage service with S3 backend
7. **Social Features**: Complete social networking functionality
8. **Rate Limiting**: Implemented at API Gateway level
9. **Webhooks**: Event-driven architecture for integrations

### Deprecated Endpoints

The following endpoints from the previous architecture have been removed:
- Professional endpoints (entire feature removed)
- ParQ endpoints (entire feature removed)
- `/user/request-deletion` (replaced with admin endpoint)
- `/user/notifications` (moved to communication service)

### Breaking Changes

1. Authentication headers changed from `x-access-token` to `Authorization: Bearer`
2. All timestamps now in ISO 8601 format
3. Error response structure standardized
4. Pagination parameters changed from `offset/limit` to `page/limit`
5. File uploads moved to dedicated storage service

## Version Information

- API Version: v1
- Last Updated: 2025-01-11
- Architecture: Microservices
- Technology Stack: Node.js 22.x, TypeScript 5.8.3, Express 5.x, PostgreSQL, Redis