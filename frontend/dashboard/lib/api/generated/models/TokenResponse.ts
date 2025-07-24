/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * OAuth 2.0 compatible token response
 */
export type TokenResponse = {
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
};

