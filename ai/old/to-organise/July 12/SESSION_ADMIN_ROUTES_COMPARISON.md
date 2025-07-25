# Session Admin Routes Comparison and Decisions

## Overview

This document tracks the route-by-route comparison between previous architecture and current implementation, along with decisions made for each route.

## Admin Routes Analysis

### 1. GET /session/admin/all - Get All Sessions

**Previous Architecture:**

- Simple implementation: `await prismaClient.session.findMany({})`
- No pagination, filtering, or sorting
- Direct database response
- Response format: `{ sessions: [...] }`

**Current Architecture:**

- Complex query parameters (filtering by user, gym, status, purpose, dates)
- Pagination with metadata
- Multiple sort options
- Includes all relations (invitees, invitations, waitingList, reviews, records)
- DTO transformation
- Redis caching
- Response format: `{ data: [...], pagination: {...} }`

**Decision: ✅ KEEP CURRENT**

- Current implementation is a significant improvement
- Pagination and filtering are essential for admin dashboards
- Proper DTO transformation ensures consistent API responses

---

### 2. GET /session/admin/:id - Get Session Details

**Previous Architecture:**

- Includes relations: user, gym, invitations, waitingList
- Direct database response
- Response format: `{ session: {...} }`

**Current Architecture:**

- Includes all relations: user (partial), gym (partial), invitedFriendsClients, invitations, waitingList, reviews, records
- DTO transformation with mapper
- Clean error handling
- Direct JSON response (no wrapper)

**Decision: ✅ KEEP CURRENT WITH MINOR CONSIDERATION**

- Current is more comprehensive
- Consider wrapping response in `{ session: {...} }` for consistency
- Consider including full user and gym objects for admin view

---

### 3. DELETE /session/:id - Delete Session

**Previous Architecture:**

```typescript
// Controller
export async function deleteSession(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.params.id
  try {
    await deleteSessionService(sessionId)
    res.status(200).send({ message: 'Session deleted by admin.' })
  } catch (err) {
    console.log(err)
    handleRestError(res, next, err)
  }
}

// Service
export async function deleteSessionService(id: string) {
  await prismaClient.session.delete({
    where: { id },
  })
}
```

**Current Architecture:**

```typescript
async deleteSession(
  request: Request<SessionIdParam>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = request.params
    await this.sessionService.deleteSession(id)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
```

**Key Differences:**

- Previous: Returns 200 with message `{ message: "Session deleted by admin." }`
- Current: Returns 204 No Content (RESTful standard for DELETE)
- Both use simple delete without soft delete

**Decision: ✅ KEEP CURRENT**

- HTTP 204 No Content follows REST standards for DELETE operations
- No response body needed for successful deletion

---

### 4. PUT /admin/session/:id/approve - Approve Session Request

**Previous Architecture:**

```typescript
// Controller
export async function approveSessionRequest(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.params.id
  try {
    const session = await approveSessionRequestService(sessionId)
    res.status(200).send({ message: 'Session request approved.', session })
  } catch (err) {
    console.log(err)
    handleRestError(res, next, err)
  }
}

// Service
export async function approveSessionRequestService(sessionId: string) {
  const session = await prismaClient.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  })
  if (!session) {
    throw new Error('Session not found.')
  }
  if (session.status !== 'PENDING_APPROVAL') {
    throw new Error('Session is not pending approval.')
  }
  const updatedSession = await prismaClient.session.update({
    where: { id: sessionId },
    data: {
      status: 'payment_pending',
      updated_at: new Date(),
    },
  })
  // TODO: Send an invoice to the user
  return updatedSession
}
```

**Current Architecture:**

- Route: `POST /sessions/admin/:id/approve` (different HTTP method)
- Accepts optional notes in request body
- Changes status to 'UPCOMING' (not 'payment_pending')
- Creates audit trail with admin user ID
- Uses proper context for admin identification
- Returns DTO-transformed response
- No direct invoice sending (handled elsewhere)

**Key Differences:**

- Previous: PUT method, changes to 'payment_pending', includes TODO for invoice
- Current: POST method, changes to 'UPCOMING', includes audit trail
- Previous: Returns message + session
- Current: Returns session DTO only

**Decision: ⚠️ ADAPT TO MATCH PREVIOUS (SIMPLIFIED)**

Changes needed:

1. **Change status transition**: PENDING_APPROVAL → PAYMENT_PENDING (not UPCOMING)
2. **Return format**: Add message to response: `{ message: "Session request approved.", session }`
3. **Keep the audit trail** from current implementation

**What we're NOT implementing** (because previous didn't have it):

- ❌ Payment deadline (previous doesn't set it for approved sessions)
- ❌ Payment completion logic (no endpoint exists in previous)
- ❌ Invoice generation (only TODO comment)
- ❌ Email notifications (only TODO comment)
- ❌ Way to transition from PAYMENT_PENDING to UPCOMING

**Note**: This will replicate the incomplete behavior from previous architecture where approved sessions get stuck in PAYMENT_PENDING status.

---

## Summary of Decisions

1. **GET /session/admin/all**: Keep current enhanced implementation
2. **GET /session/admin/:id**: Keep current with minor considerations
3. **DELETE /session/:id**: Keep current (204 No Content)
4. **PUT /admin/session/:id/approve**: [Pending decision]

### 5. PUT /admin/session/:id/decline - Decline Session Request

**Previous Architecture:**

- Validates session exists and is in PENDING_APPROVAL status
- Changes status to "declined"
- Sets cancelled_at timestamp
- Returns: `{ message: "Session request declined.", session }`
- TODO: Send notification email to user

**Current Architecture:**

- Route: `POST /sessions/admin/:id/decline` (different HTTP method)
- Requires decline reason in request body
- Changes status to 'DECLINED' (uppercase)
- Creates audit trail with admin user ID and reason
- Returns session DTO only

**Decision: ✅ KEEP CURRENT WITH MINOR CHANGES**

- Current is better with audit trail
- Change: Make decline reason optional (not required)
- Add: Set cancelled_at timestamp when declining
- Add: Return message with response: `{ message: "Session request declined.", session }`

---

### 6. POST /admin/cleanup-expired-reservations - Cleanup Expired Reservations

**Previous Architecture:**

```typescript
// Service
export async function cleanupExpiredReservationsService() {
  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000)
  const expiredSessions = await prismaClient.session.deleteMany({
    where: {
      status: 'PAYMENT_PENDING',
      payment_deadline: {
        lt: now,
        gte: fiveMinutesAgo, // Only clean up recent expired sessions
      },
    },
  })
  if (expiredSessions.count > 0) {
    console.log(`Cleaned up ${expiredSessions.count} expired reservations`)
  }
}
```

- Deletes sessions with PAYMENT_PENDING status where payment_deadline has passed
- Only looks at sessions expired in last 5 minutes (optimization)
- Returns: `{ message: "Expired reservations cleanup completed successfully" }`

**Current Architecture:**

- Returns more detailed response with count and IDs
- Response: `{ message: "...", cleanedUp: count, reservationIds: [...] }`
- Implementation details not shown in controller

**Decision: ✅ KEEP CURRENT**

- Current provides better feedback with count and IDs
- Ensure service implementation includes the 5-minute optimization from previous
- Keep the enhanced response format

---

## Summary of Final Decisions

1. **GET /session/admin/all**: ✅ Keep current enhanced implementation
2. **GET /session/admin/:id**: ✅ Keep current
3. **DELETE /session/:id**: ✅ Keep current (204 No Content)
4. **PUT /admin/session/:id/approve**: ⚠️ Change to PAYMENT_PENDING status only
5. **PUT /admin/session/:id/decline**: ✅ Keep current, make reason optional
6. **POST /admin/cleanup-expired-reservations**: ✅ Keep current

## Implementation Tasks (Minimal Changes)

1. **Approval endpoint**:
   - Change status to PAYMENT_PENDING (not UPCOMING)
   - Add message wrapper to response
   - That's it - no payment flow since it doesn't exist

2. **Decline endpoint**:
   - Make reason optional
   - Set cancelled_at timestamp
   - Add message wrapper to response

3. **Cleanup optimization**:
   - Ensure 5-minute window is implemented in service

## General Patterns Observed

1. **Previous architecture**: Simple, direct database operations with basic responses
2. **Current architecture**: Enhanced with DTOs, proper error handling, caching, and comprehensive features
3. **Decision approach**: Keep current improvements unless previous had specific behavior we need to match
4. **Incomplete features**: Don't implement features that were never completed in previous (payment flow)
