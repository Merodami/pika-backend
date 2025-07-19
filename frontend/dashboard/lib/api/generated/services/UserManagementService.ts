/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageResponse } from '../models/MessageResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserManagementService {
    /**
     * List all users with admin details
     * @returns any List of users
     * @throws ApiError
     */
    public static getUsers({
        search,
        email,
        status,
        role,
        flags,
        emailVerified,
        phoneVerified,
        identityVerified,
        registeredFrom,
        registeredTo,
        lastLoginFrom,
        lastLoginTo,
        minSpent,
        maxSpent,
        hasReports,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
    }: {
        /**
         * Search in name, email, phone
         */
        search?: string,
        email?: string,
        status?: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED',
        role?: 'ADMIN' | 'CUSTOMER' | 'BUSINESS',
        flags?: Array<'VERIFIED' | 'PREMIUM' | 'SUSPICIOUS' | 'REPORTED' | 'VIP'>,
        emailVerified?: boolean,
        phoneVerified?: boolean,
        identityVerified?: boolean,
        /**
         * ISO 8601 datetime with timezone
         */
        registeredFrom?: string,
        /**
         * ISO 8601 datetime with timezone
         */
        registeredTo?: string,
        /**
         * ISO 8601 datetime with timezone
         */
        lastLoginFrom?: string,
        /**
         * ISO 8601 datetime with timezone
         */
        lastLoginTo?: string,
        minSpent?: number,
        maxSpent?: number,
        hasReports?: boolean,
        page?: number,
        limit?: number,
        sortBy?: 'createdAt' | 'lastLoginAt' | 'email',
        sortOrder?: 'ASC' | 'DESC',
    }): CancelablePromise<{
        data: Array<{
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber?: string;
            dateOfBirth?: string;
            avatarUrl?: string;
            status: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
            role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
            flags?: Array<'VERIFIED' | 'PREMIUM' | 'SUSPICIOUS' | 'REPORTED' | 'VIP'>;
            emailVerified: boolean;
            phoneVerified: boolean;
            identityVerified: boolean;
            /**
             * ISO 8601 datetime with timezone
             */
            verificationDate?: string;
            /**
             * ISO 8601 datetime with timezone
             */
            lastLoginAt?: string;
            /**
             * ISO 8601 datetime with timezone
             */
            lastActivityAt?: string;
            loginCount?: number;
            ipAddress?: string;
            userAgent?: string;
            stats: {
                totalBookings: number;
                creditsBalance: number;
                friendsCount: number;
                followersCount: number;
                reportsCount: number;
            };
            adminNotes?: string;
            suspensionReason?: string;
            /**
             * ISO 8601 datetime with timezone
             */
            suspendedAt?: string;
            suspendedBy?: string;
            description?: string;
            specialties?: Array<string>;
            /**
             * When the record was created
             */
            createdAt: string;
            /**
             * When the record was last updated
             */
            updatedAt: string;
        }>;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users',
            query: {
                'search': search,
                'email': email,
                'status': status,
                'role': role,
                'flags': flags,
                'emailVerified': emailVerified,
                'phoneVerified': phoneVerified,
                'identityVerified': identityVerified,
                'registeredFrom': registeredFrom,
                'registeredTo': registeredTo,
                'lastLoginFrom': lastLoginFrom,
                'lastLoginTo': lastLoginTo,
                'minSpent': minSpent,
                'maxSpent': maxSpent,
                'hasReports': hasReports,
                'page': page,
                'limit': limit,
                'sortBy': sortBy,
                'sortOrder': sortOrder,
            },
        });
    }
    /**
     * Create a new user (admin only)
     * @returns any User created successfully
     * @throws ApiError
     */
    public static postUsers({
        requestBody,
    }: {
        requestBody?: {
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
            dateOfBirth: string;
            role?: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
            status?: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
            appVersion?: string;
            alias?: string;
        },
    }): CancelablePromise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        avatarUrl?: string;
        status: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
        role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
        flags?: Array<'VERIFIED' | 'PREMIUM' | 'SUSPICIOUS' | 'REPORTED' | 'VIP'>;
        emailVerified: boolean;
        phoneVerified: boolean;
        identityVerified: boolean;
        /**
         * ISO 8601 datetime with timezone
         */
        verificationDate?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        lastLoginAt?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        lastActivityAt?: string;
        loginCount?: number;
        ipAddress?: string;
        userAgent?: string;
        stats: {
            totalBookings: number;
            creditsBalance: number;
            friendsCount: number;
            followersCount: number;
            reportsCount: number;
        };
        adminNotes?: string;
        suspensionReason?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        suspendedAt?: string;
        suspendedBy?: string;
        description?: string;
        specialties?: Array<string>;
        /**
         * When the record was created
         */
        createdAt: string;
        /**
         * When the record was last updated
         */
        updatedAt: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid user data`,
                409: `User already exists`,
            },
        });
    }
    /**
     * Update user information (admin)
     * @returns any User updated successfully
     * @throws ApiError
     */
    public static patchUsers({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: {
            firstName?: string;
            lastName?: string;
            phoneNumber?: string;
            dateOfBirth?: string;
            role?: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
            status?: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
            appVersion?: string;
            alias?: string;
            activeMembership?: boolean;
            description?: string;
            specialties?: Array<string>;
        },
    }): CancelablePromise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        avatarUrl?: string;
        status: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
        role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
        flags?: Array<'VERIFIED' | 'PREMIUM' | 'SUSPICIOUS' | 'REPORTED' | 'VIP'>;
        emailVerified: boolean;
        phoneVerified: boolean;
        identityVerified: boolean;
        /**
         * ISO 8601 datetime with timezone
         */
        verificationDate?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        lastLoginAt?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        lastActivityAt?: string;
        loginCount?: number;
        ipAddress?: string;
        userAgent?: string;
        stats: {
            totalBookings: number;
            creditsBalance: number;
            friendsCount: number;
            followersCount: number;
            reportsCount: number;
        };
        adminNotes?: string;
        suspensionReason?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        suspendedAt?: string;
        suspendedBy?: string;
        description?: string;
        specialties?: Array<string>;
        /**
         * When the record was created
         */
        createdAt: string;
        /**
         * When the record was last updated
         */
        updatedAt: string;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/users/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Delete user (admin only)
     * @returns void
     * @throws ApiError
     */
    public static deleteUsers({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/users/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Update user status
     * @returns any User status updated
     * @throws ApiError
     */
    public static patchUsersStatus({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: {
            status: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
            reason?: string;
            /**
             * Suspension duration in days
             */
            duration?: number;
            notifyUser?: boolean;
        },
    }): CancelablePromise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        avatarUrl?: string;
        status: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
        role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
        flags?: Array<'VERIFIED' | 'PREMIUM' | 'SUSPICIOUS' | 'REPORTED' | 'VIP'>;
        emailVerified: boolean;
        phoneVerified: boolean;
        identityVerified: boolean;
        /**
         * ISO 8601 datetime with timezone
         */
        verificationDate?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        lastLoginAt?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        lastActivityAt?: string;
        loginCount?: number;
        ipAddress?: string;
        userAgent?: string;
        stats: {
            totalBookings: number;
            creditsBalance: number;
            friendsCount: number;
            followersCount: number;
            reportsCount: number;
        };
        adminNotes?: string;
        suspensionReason?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        suspendedAt?: string;
        suspendedBy?: string;
        description?: string;
        specialties?: Array<string>;
        /**
         * When the record was created
         */
        createdAt: string;
        /**
         * When the record was last updated
         */
        updatedAt: string;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/users/{id}/status',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Ban user
     * @returns MessageResponse User banned
     * @throws ApiError
     */
    public static putUsersBan({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: {
            reason: string;
            duration?: number;
        },
    }): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/users/{id}/ban',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Unban user
     * @returns MessageResponse User unbanned
     * @throws ApiError
     */
    public static putUsersUnban({
        id,
    }: {
        id: string,
    }): CancelablePromise<MessageResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/users/{id}/unban',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get user by email
     * @returns any User details
     * @throws ApiError
     */
    public static getUsersEmail({
        email,
    }: {
        email: string,
    }): CancelablePromise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        avatarUrl?: string;
        status: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
        role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
        flags?: Array<'VERIFIED' | 'PREMIUM' | 'SUSPICIOUS' | 'REPORTED' | 'VIP'>;
        emailVerified: boolean;
        phoneVerified: boolean;
        identityVerified: boolean;
        /**
         * ISO 8601 datetime with timezone
         */
        verificationDate?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        lastLoginAt?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        lastActivityAt?: string;
        loginCount?: number;
        ipAddress?: string;
        userAgent?: string;
        stats: {
            totalBookings: number;
            creditsBalance: number;
            friendsCount: number;
            followersCount: number;
            reportsCount: number;
        };
        adminNotes?: string;
        suspensionReason?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        suspendedAt?: string;
        suspendedBy?: string;
        description?: string;
        specialties?: Array<string>;
        /**
         * When the record was created
         */
        createdAt: string;
        /**
         * When the record was last updated
         */
        updatedAt: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/email/{email}',
            path: {
                'email': email,
            },
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Admin verifies user email, phone, or account
     * @returns any Verification successful
     * @throws ApiError
     */
    public static postAdminUsersVerify({
        requestBody,
    }: {
        requestBody?: {
            type: 'EMAIL' | 'PHONE' | 'ACCOUNT_CONFIRMATION';
            token?: string;
            code?: string;
            userId?: string;
            email?: string;
            phoneNumber?: string;
        },
    }): CancelablePromise<{
        success: boolean;
        message: string;
        /**
         * Detailed user information for admin
         */
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber?: string;
            dateOfBirth?: string;
            avatarUrl?: string;
            status: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
            role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
            flags?: Array<'VERIFIED' | 'PREMIUM' | 'SUSPICIOUS' | 'REPORTED' | 'VIP'>;
            emailVerified: boolean;
            phoneVerified: boolean;
            identityVerified: boolean;
            /**
             * ISO 8601 datetime with timezone
             */
            verificationDate?: string;
            /**
             * ISO 8601 datetime with timezone
             */
            lastLoginAt?: string;
            /**
             * ISO 8601 datetime with timezone
             */
            lastActivityAt?: string;
            loginCount?: number;
            ipAddress?: string;
            userAgent?: string;
            stats: {
                totalBookings: number;
                creditsBalance: number;
                friendsCount: number;
                followersCount: number;
                reportsCount: number;
            };
            adminNotes?: string;
            suspensionReason?: string;
            /**
             * ISO 8601 datetime with timezone
             */
            suspendedAt?: string;
            suspendedBy?: string;
            description?: string;
            specialties?: Array<string>;
            /**
             * When the record was created
             */
            createdAt: string;
            /**
             * When the record was last updated
             */
            updatedAt: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/users/verify',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request`,
                404: `User not found`,
            },
        });
    }
    /**
     * Admin resends verification email or SMS
     * @returns any Verification resent
     * @throws ApiError
     */
    public static postAdminUsersResendVerification({
        requestBody,
    }: {
        requestBody?: {
            type: 'EMAIL' | 'PHONE';
            userId?: string;
            email?: string;
            phoneNumber?: string;
        },
    }): CancelablePromise<{
        success: boolean;
        message: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/users/resend-verification',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request`,
                404: `User not found`,
            },
        });
    }
    /**
     * Get user verification status
     * @returns any User verification status retrieved successfully
     * @throws ApiError
     */
    public static getAdminUsersVerificationStatus({
        id,
    }: {
        id: string,
    }): CancelablePromise<{
        userId: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        identityVerified: boolean;
        /**
         * ISO 8601 datetime with timezone
         */
        verificationDate?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/users/{id}/verification-status',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden - Admin access required`,
                404: `User not found`,
            },
        });
    }
    /**
     * Upload avatar for a user (admin only)
     * @returns any Avatar uploaded successfully
     * @throws ApiError
     */
    public static postAdminUsersAvatar({
        id,
        formData,
    }: {
        id: string,
        formData?: {
            /**
             * Avatar image file (multipart/form-data)
             */
            file?: any;
        },
    }): CancelablePromise<{
        /**
         * URL of the uploaded avatar
         */
        avatarUrl: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/users/{id}/avatar',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Bad request`,
                404: `User not found`,
            },
        });
    }
    /**
     * Get current admin user profile
     * @returns any Admin user profile
     * @throws ApiError
     */
    public static getAdminUsersMe(): CancelablePromise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        avatarUrl?: string;
        status: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
        role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
        flags?: Array<'VERIFIED' | 'PREMIUM' | 'SUSPICIOUS' | 'REPORTED' | 'VIP'>;
        emailVerified: boolean;
        phoneVerified: boolean;
        identityVerified: boolean;
        /**
         * ISO 8601 datetime with timezone
         */
        verificationDate?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        lastLoginAt?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        lastActivityAt?: string;
        loginCount?: number;
        ipAddress?: string;
        userAgent?: string;
        stats: {
            totalBookings: number;
            creditsBalance: number;
            friendsCount: number;
            followersCount: number;
            reportsCount: number;
        };
        adminNotes?: string;
        suspensionReason?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        suspendedAt?: string;
        suspendedBy?: string;
        description?: string;
        specialties?: Array<string>;
        /**
         * When the record was created
         */
        createdAt: string;
        /**
         * When the record was last updated
         */
        updatedAt: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/users/me',
            errors: {
                401: `Unauthorized`,
                403: `Forbidden - Admin access required`,
            },
        });
    }
    /**
     * Update current admin user profile
     * @returns any Updated admin user profile
     * @throws ApiError
     */
    public static patchAdminUsersMe({
        requestBody,
    }: {
        requestBody?: {
            firstName?: string;
            lastName?: string;
            phoneNumber?: string;
            dateOfBirth?: string;
            avatarUrl?: string;
            adminNotes?: string;
        },
    }): CancelablePromise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        avatarUrl?: string;
        status: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
        role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
        flags?: Array<'VERIFIED' | 'PREMIUM' | 'SUSPICIOUS' | 'REPORTED' | 'VIP'>;
        emailVerified: boolean;
        phoneVerified: boolean;
        identityVerified: boolean;
        /**
         * ISO 8601 datetime with timezone
         */
        verificationDate?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        lastLoginAt?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        lastActivityAt?: string;
        loginCount?: number;
        ipAddress?: string;
        userAgent?: string;
        stats: {
            totalBookings: number;
            creditsBalance: number;
            friendsCount: number;
            followersCount: number;
            reportsCount: number;
        };
        adminNotes?: string;
        suspensionReason?: string;
        /**
         * ISO 8601 datetime with timezone
         */
        suspendedAt?: string;
        suspendedBy?: string;
        description?: string;
        specialties?: Array<string>;
        /**
         * When the record was created
         */
        createdAt: string;
        /**
         * When the record was last updated
         */
        updatedAt: string;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/admin/users/me',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request`,
                401: `Unauthorized`,
                403: `Forbidden - Admin access required`,
            },
        });
    }
}
