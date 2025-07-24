/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Detailed user information for admin
 */
export type AdminUserDetailResponse = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    avatarUrl?: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED';
    role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS';
    emailVerified: boolean;
    phoneVerified: boolean;
    /**
     * ISO 8601 datetime with timezone
     */
    lastLoginAt?: string;
    /**
     * When the record was created
     */
    createdAt: string;
    /**
     * When the record was last updated
     */
    updatedAt: string;
};

