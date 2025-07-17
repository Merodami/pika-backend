import { TokenParam } from '@api/parameters/auth.js'
import { registry } from '@api/schemaRegistry.js'
import { OpenAPIV3 } from 'openapi-types'

// Authentication routes
export const AuthRoutes: Partial<OpenAPIV3.Document> = {
  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        operationId: 'registerUser',
        summary: 'Register a new user',
        description: 'Create a new user account with customer or provider role',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('UserRegistration'),
              examples: {
                customer: {
                  summary: 'New customer registration',
                  value: {
                    email: 'customer@example.com',
                    password: 'SecurePass123!',
                    first_name: 'Juan',
                    last_name: 'Perez',
                    phoneNumber: '+595981123456',
                    role: 'CUSTOMER',
                  },
                },
                provider: {
                  summary: 'New service provider registration',
                  value: {
                    email: 'provider@example.com',
                    password: 'SecurePass123!',
                    first_name: 'Maria',
                    last_name: 'Gonzalez',
                    phoneNumber: '+595981234567',
                    role: 'PROVIDER',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: registry.ref('AuthResponse'),
                examples: {
                  success: {
                    summary: 'Registration successful',
                    value: {
                      user: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        email: 'customer@example.com',
                        emailVerified: false,
                        first_name: 'Juan',
                        last_name: 'Perez',
                        phoneNumber: '+595981123456',
                        phoneVerified: false,
                        avatarUrl: null,
                        role: 'CUSTOMER',
                        status: 'ACTIVE',
                        lastLoginAt: null,
                        createdAt: '2025-05-07T14:30:00Z',
                        updatedAt: '2025-05-07T14:30:00Z',
                      },
                      tokens: {
                        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        refresh_token:
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        expires_in: 3600,
                      },
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '409': {
            description: 'Email already registered',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
                examples: {
                  emailTaken: {
                    summary: 'Email already in use',
                    value: {
                      status_code: 409,
                      error: 'Conflict',
                      message: 'Email already registered',
                      details: [
                        {
                          field: 'email',
                          message: 'This email address is already in use',
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          '422': registry.refResponse('ValidationError'),
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        operationId: 'loginUser',
        summary: 'Login user',
        description: 'Authenticate a user and return access and refresh tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('Login'),
              examples: {
                login: {
                  summary: 'User login',
                  value: {
                    email: 'customer@example.com',
                    password: 'SecurePass123!',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: registry.ref('AuthResponse'),
                examples: {
                  success: {
                    summary: 'Login successful',
                    value: {
                      user: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        email: 'customer@example.com',
                        emailVerified: true,
                        first_name: 'Juan',
                        last_name: 'Perez',
                        phoneNumber: '+595981123456',
                        phoneVerified: true,
                        avatarUrl:
                          'https://api.servicemarketplace.py/avatars/123e4567.jpg',
                        role: 'CUSTOMER',
                        status: 'ACTIVE',
                        lastLoginAt: '2025-05-07T14:35:00Z',
                        createdAt: '2025-05-01T10:00:00Z',
                        updatedAt: '2025-05-07T14:35:00Z',
                      },
                      tokens: {
                        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        refresh_token:
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        expires_in: 3600,
                      },
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '422': registry.refResponse('ValidationError'),
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        tags: ['Auth'],
        operationId: 'refreshToken',
        summary: 'Refresh token',
        description: 'Get new access token using refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refresh_token'],
                properties: {
                  refresh_token: {
                    type: 'string',
                  },
                },
              },
              examples: {
                refresh: {
                  summary: 'Refresh token example',
                  value: {
                    refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: registry.ref('AuthResponse'),
                examples: {
                  success: {
                    summary: 'New tokens',
                    value: {
                      user: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        email: 'customer@example.com',
                        emailVerified: true,
                        first_name: 'Juan',
                        last_name: 'Perez',
                        phoneNumber: '+595981123456',
                        phoneVerified: true,
                        avatarUrl:
                          'https://api.servicemarketplace.py/avatars/123e4567.jpg',
                        role: 'CUSTOMER',
                        status: 'ACTIVE',
                        lastLoginAt: '2025-05-07T14:35:00Z',
                        createdAt: '2025-05-01T10:00:00Z',
                        updatedAt: '2025-05-07T14:35:00Z',
                      },
                      tokens: {
                        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        refresh_token:
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        expires_in: 3600,
                      },
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
        },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        operationId: 'forgotPassword',
        summary: 'Request password reset',
        description: 'Send password reset email to user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                  },
                },
              },
              examples: {
                reset: {
                  summary: 'Password reset request',
                  value: {
                    email: 'customer@example.com',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset email sent',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                    },
                  },
                },
                examples: {
                  success: {
                    summary: 'Reset email sent',
                    value: {
                      message:
                        'Password reset instructions have been sent to your email',
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '422': registry.refResponse('ValidationError'),
        },
      },
    },
    '/api/v1/auth/reset-password/{token}': {
      parameters: [TokenParam],
      post: {
        tags: ['Auth'],
        operationId: 'resetPassword',
        summary: 'Reset password',
        description: 'Reset user password using token from email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password', 'passwordConfirmation'],
                properties: {
                  password: {
                    type: 'string',
                    format: 'password',
                    minLength: 8,
                  },
                  passwordConfirmation: {
                    type: 'string',
                    format: 'password',
                  },
                },
              },
              examples: {
                reset: {
                  summary: 'Password reset',
                  value: {
                    password: 'NewSecurePass456!',
                    passwordConfirmation: 'NewSecurePass456!',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password reset successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                    },
                  },
                },
                examples: {
                  success: {
                    summary: 'Password reset successful',
                    value: {
                      message:
                        'Your password has been successfully reset. You can now log in with your new password.',
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': {
            description: 'Invalid or expired token',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
                examples: {
                  invalidToken: {
                    summary: 'Invalid token',
                    value: {
                      status_code: 401,
                      error: 'Unauthorized',
                      message: 'Invalid or expired reset token',
                      details: [],
                    },
                  },
                },
              },
            },
          },
          '422': registry.refResponse('ValidationError'),
        },
      },
    },
    '/api/v1/auth/verify-email/{token}': {
      parameters: [TokenParam],
      get: {
        tags: ['Auth'],
        operationId: 'verifyEmail',
        summary: 'Verify email',
        description: 'Verify user email using token from verification email',
        responses: {
          '200': {
            description: 'Email verified successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                    },
                  },
                },
                examples: {
                  success: {
                    summary: 'Email verified',
                    value: {
                      message: 'Your email has been successfully verified',
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': {
            description: 'Invalid or expired token',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
                examples: {
                  invalidToken: {
                    summary: 'Invalid token',
                    value: {
                      status_code: 401,
                      error: 'Unauthorized',
                      message: 'Invalid or expired verification token',
                      details: [],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        operationId: 'logoutUser',
        summary: 'Logout user',
        description: 'Invalidate current user session',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                    },
                  },
                },
                examples: {
                  success: {
                    summary: 'Logout successful',
                    value: {
                      message: 'You have been successfully logged out',
                    },
                  },
                },
              },
            },
          },
          '401': registry.refResponse('UnauthorizedError'),
        },
      },
    },
    '/api/v1/auth/exchange-token': {
      post: {
        tags: ['Auth'],
        operationId: 'exchangeFirebaseToken',
        summary: 'Exchange Firebase ID token for JWT tokens',
        description:
          'Exchanges a Firebase ID token for internal JWT access and refresh tokens. Supports Google, Facebook, and other Firebase providers.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: registry.ref('TokenExchangeRequest'),
              examples: {
                googleLogin: {
                  summary: 'Google Firebase token exchange',
                  value: {
                    firebase_id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA5...',
                    provider: 'google',
                    device_info: {
                      device_id: '123e4567-e89b-12d3-a456-426614174000',
                      device_name: 'iPhone 15 Pro',
                      device_type: 'ios',
                      fcm_token: 'fPF1d2mF8kE:APA91bH...',
                    },
                  },
                },
                facebookLogin: {
                  summary: 'Facebook Firebase token exchange',
                  value: {
                    firebase_id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA5...',
                    provider: 'facebook',
                    device_info: {
                      device_id: '987e6543-e21b-43d3-b654-426614174321',
                      device_name: 'Samsung Galaxy S24',
                      device_type: 'android',
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token exchange successful',
            content: {
              'application/json': {
                schema: registry.ref('TokenExchangeResponse'),
                examples: {
                  newUser: {
                    summary: 'New user registration via Firebase',
                    value: {
                      user: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        email: 'user@gmail.com',
                        first_name: 'John',
                        last_name: 'Doe',
                        role: 'CUSTOMER',
                        is_new_user: true,
                        requires_additional_info: true,
                        requires_mfa: false,
                      },
                      tokens: {
                        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        refresh_token:
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        expires_in: 900,
                      },
                    },
                  },
                  existingUser: {
                    summary: 'Existing user login via Firebase',
                    value: {
                      user: {
                        id: '456e7890-e12b-34d5-c678-426614174111',
                        email: 'existing@gmail.com',
                        first_name: 'Jane',
                        last_name: 'Smith',
                        role: 'PROVIDER',
                        is_new_user: false,
                        requires_additional_info: false,
                        requires_mfa: true,
                      },
                      tokens: {
                        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        refresh_token:
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        expires_in: 900,
                      },
                    },
                  },
                },
              },
            },
          },
          '400': registry.refResponse('BadRequestError'),
          '401': registry.refResponse('UnauthorizedError'),
          '403': registry.refResponse('ForbiddenError'),
          '422': registry.refResponse('ValidationError'),
          '428': {
            description: 'Precondition Required - MFA required',
            content: {
              'application/json': {
                schema: registry.ref('Error'),
                examples: {
                  mfaRequired: {
                    summary: 'Multi-factor authentication required',
                    value: {
                      status_code: 428,
                      error: 'Precondition Required',
                      message: 'Multi-factor authentication required',
                      details: [],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
