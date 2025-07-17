/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Create new support problem
 */
export type CreateSupportProblemRequest = {
    title: string;
    description: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
    type?: 'BILLING' | 'TECHNICAL' | 'ACCOUNT' | 'GENERAL' | 'BUG_REPORT' | 'FEATURE_REQUEST';
    files?: Array<string>;
};

