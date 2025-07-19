/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageResponse } from '../models/MessageResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * OAuth 2.0 Token Endpoint
     * Exchange credentials or refresh token for access tokens (RFC 6749)
     * @returns any Successfully generated tokens
     * @throws ApiError
     */
    public static postAuthToken({
        requestBody,
    }: {
        requestBody?: ({
            grantType: 'password';
            /**
             * User email address
             */
            username: string;
            /**
             * User password
             */
            password: string;
            /**
             * Requested permissions
             */
            scope?: string;
        } | {
            grantType: 'refreshToken';
            /**
             * Valid refresh token
             */
            refreshToken: string;
            /**
             * Requested permissions (subset of original)
             */
            scope?: string;
        }),
    }): CancelablePromise<{
        /**
         * JWT access token
         */
        accessToken: string;
        /**
         * Token type
         */
        tokenType: 'Bearer';
        /**
         * Token lifetime in seconds
         */
        expiresIn: number;
        /**
         * JWT refresh token
         */
        refreshToken?: string;
        /**
         * Granted permissions
         */
        scope?: string;
        /**
         * User information for password grant
         */
        user?: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            profilePicture?: string;
            /**
             * User role
             */
            role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/token',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request`,
                401: `Invalid credentials`,
            },
        });
    }
    /**
     * User registration
     * @returns any Registration successful
     * @throws ApiError
     */
    public static postAuthRegister({
        requestBody,
    }: {
        requestBody?: {
            email: string;
            /**
             * Password must meet security requirements
             */
            password: string;
            firstName: string;
            lastName: string;
            /**
             * Phone number in E.164 format
             */
            phoneNumber?: string;
            /**
             * Date of birth
             */
            dateOfBirth?: string;
            /**
             * User must accept terms and conditions
             */
            acceptTerms: boolean;
            /**
             * User consent for marketing emails
             */
            marketingConsent?: boolean;
        },
    }): CancelablePromise<{
        message?: string;
        /**
         * Newly created user ID
         */
        userId: string;
        /**
         * Whether verification email was sent successfully
         */
        emailSent: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid registration data`,
            },
        });
    }
    /**
     * OAuth 2.0 Token Introspection
     * Check if a token is active and get its metadata (RFC 7662)
     * @returns any Token introspection result
     * @throws ApiError
     */
    public static postAuthIntrospect({
        requestBody,
    }: {
        requestBody?: {
            /**
             * Token to validate
             */
            token: string;
            /**
             * Hint about token type
             */
            tokenTypeHint?: 'accessToken' | 'refreshToken';
        },
    }): CancelablePromise<{
        /**
         * Whether token is active
         */
        active: boolean;
        /**
         * Token scopes
         */
        scope?: string;
        /**
         * User email
         */
        username?: string;
        tokenType?: 'Bearer';
        /**
         * Expiration time (Unix timestamp)
         */
        exp?: number;
        /**
         * Issued at (Unix timestamp)
         */
        iat?: number;
        /**
         * Subject (user ID)
         */
        sub?: string;
        /**
         * User ID
         */
        userId?: string;
        /**
         * User email
         */
        userEmail?: string;
        userRole?: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/introspect',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * OAuth 2.0 Token Revocation
     * Revoke an access or refresh token (RFC 7009)
     * @returns any Token successfully revoked
     * @throws ApiError
     */
    public static postAuthRevoke({
        requestBody,
    }: {
        requestBody?: {
            /**
             * Token to revoke
             */
            token: string;
            /**
             * Hint about token type
             */
            tokenTypeHint?: 'accessToken' | 'refreshToken';
            /**
             * Revoke all tokens for user
             */
            allDevices?: boolean;
        },
    }): CancelablePromise<{
        success?: boolean;
        message?: string;
        /**
         * Number of tokens revoked
         */
        revokedCount?: number;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/revoke',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * OAuth 2.0 UserInfo Endpoint
     * Get information about the authenticated user
     * @returns any User information
     * @throws ApiError
     */
    public static getAuthUserinfo(): CancelablePromise<{
        /**
         * User ID
         */
        id: string;
        email: string;
        emailVerified?: boolean;
        firstName: string;
        lastName: string;
        /**
         * Combined first and last name
         */
        fullName?: string;
        profilePicture?: string;
        role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
        /**
         * User permissions
         */
        permissions?: Array<string>;
        /**
         * User locale
         */
        locale?: string;
        createdAt?: string;
        updatedAt?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/userinfo',
            errors: {
                401: `Not authenticated`,
            },
        });
    }
    /**
     * Request password reset
     * @returns MessageResponse Password reset email sent (if account exists)
     * @throws ApiError
     */
    public static postAuthForgotPassword({
        requestBody,
    }: {
        requestBody?: {
            email: string;
        },
    }): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/forgot-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reset password with token
     * @returns MessageResponse Password reset successful
     * @throws ApiError
     */
    public static postAuthResetPassword({
        requestBody,
    }: {
        requestBody?: {
            /**
             * Password reset token from email
             */
            token: string;
            /**
             * New password meeting security requirements
             */
            newPassword: string;
        },
    }): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/reset-password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid or expired token`,
            },
        });
    }
    /**
     * Verify email address
     * @returns MessageResponse Email verified successfully
     * @throws ApiError
     */
    public static getAuthVerifyEmail({
        token,
    }: {
        /**
         * Email verification token from email link
         */
        token: string,
    }): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/verify-email/{token}',
            path: {
                'token': token,
            },
            errors: {
                400: `Invalid or expired verification token`,
            },
        });
    }
    /**
     * Resend email verification
     * @returns MessageResponse Verification email sent (if account exists)
     * @throws ApiError
     */
    public static postAuthResendVerification({
        requestBody,
    }: {
        requestBody?: {
            email: string;
        },
    }): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/resend-verification',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Change user password
     * @returns MessageResponse Password changed successfully
     * @throws ApiError
     */
    public static postAuthChangePassword({
        requestBody,
    }: {
        requestBody?: {
            /**
             * Current password for verification
             */
            currentPassword: string;
            /**
             * New password meeting security requirements
             */
            newPassword: string;
        },
    }): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/change-password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid current password`,
            },
        });
    }
}
