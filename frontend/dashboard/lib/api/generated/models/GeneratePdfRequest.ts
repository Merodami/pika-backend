/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Generate PDF for voucher book
 */
export type GeneratePdfRequest = {
    /**
     * Force regeneration even if PDF already exists
     */
    force?: boolean;
    /**
     * Generation priority
     */
    priority?: 'low' | 'normal' | 'high';
};

