# Simple Backend Implementation for First-Access Login

## Overview

Simple implementation to support temporary password flow following OAuth 2.0 patterns.

## Required Changes

### 1. Database Update (Single Field)

```sql
-- Add one field to track temporary passwords
ALTER TABLE users ADD COLUMN is_temporary_password BOOLEAN DEFAULT FALSE;
```

### 2. Update OAuth Token Response

```typescript
// packages/api/src/public/schemas/auth/oauth.ts

// Modify existing TokenResponse to add one optional field
export const TokenResponse = openapi(
  z.object({
    accessToken: JWTToken.describe('JWT access token'),
    tokenType: z.literal('Bearer').describe('Token type'),
    expiresIn: z.number().int().positive().describe('Token lifetime in seconds'),
    refreshToken: JWTToken.optional().describe('JWT refresh token'),
    scope: z.string().optional().describe('Granted permissions'),
    user: AuthUserResponse.optional().describe('User information'),
    // ADD THIS ONE FIELD:
    requiresPasswordChange: z.boolean().optional().describe('User must change password'),
  }),
  // ... rest stays the same
)
```

### 3. Update AuthController Token Method

```typescript
// packages/services/auth/src/controllers/AuthController.ts

async token(
  request: Request<{}, {}, TokenRequest>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { grantType } = request.body

    if (grantType === 'password') {
      const { username, password } = request.body
      const result = await this.authService.login(username, password)

      const oauthResponse = {
        accessToken: result.accessToken,
        tokenType: 'Bearer' as const,
        expiresIn: 900,
        refreshToken: result.refreshToken,
        scope: 'read write',
        user: AuthMapper.toUserResponse(result.user),
        // ADD THIS CHECK:
        requiresPasswordChange: result.user.isTemporaryPassword === true,
      }

      response.json(oauthResponse)
    }
    // ... rest stays the same
  } catch (error) {
    next(error)
  }
}
```

### 4. Update Change Password to Clear Flag

```typescript
// packages/services/auth/src/services/AuthService.ts

async changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  // ... existing validation logic ...

  // When updating the user, also clear the temporary password flag
  await this.userServiceClient.updateUser(userId, {
    password: hashedPassword,
    isTemporaryPassword: false,  // ADD THIS
  })

  // ... rest stays the same
}
```

### 5. Admin Endpoint to Set Temporary Password

```typescript
// packages/services/user/src/controllers/UserController.ts

async resetPasswordToTemporary(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = request.params

    // Generate temporary password
    const tempPassword = this.generateTempPassword() // e.g., "Temp123!@#"

    // Update user
    await this.userService.updateUser(id, {
      password: await bcrypt.hash(tempPassword, 12),
      isTemporaryPassword: true,
    })

    // Send email with temporary password
    await this.emailService.sendTempPassword(id, tempPassword)

    response.json({
      success: true,
      message: 'Temporary password sent to user email',
    })
  } catch (error) {
    next(error)
  }
}
```

## That's It! 🎯

### What This Gives You:

1. **Login with temp password** → Normal OAuth login works
2. **Get flag in response** → `requiresPasswordChange: true`
3. **Frontend redirects** → To `/auth/change-password`
4. **User changes password** → Flag gets cleared
5. **Next login** → Normal flow, no flag

### Frontend Usage:

```typescript
const result = await signIn('credentials', {
  email: data.email,
  password: data.password,
  redirect: false,
})

if (result?.ok) {
  const session = await fetch('/api/auth/session').then((res) => res.json())

  if (session?.requiresPasswordChange) {
    router.push('/auth/change-password')
  } else {
    router.push('/dashboard')
  }
}
```

### Total Changes:

- 1 database field
- 1 schema field
- 3 small code updates
- 1 admin endpoint

No complex password history, no account locking, no expiry dates - just the simple flag you need!
