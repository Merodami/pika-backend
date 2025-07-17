/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Reset password with token
 */
export type ResetPasswordRequest = {
    /**
     * Password reset token from email
     */
    token: string;
    /**
     * New password meeting security requirements
     */
    newPassword: string;
};

