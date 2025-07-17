/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * PDF generation job status
 */
export type GeneratePdfResponse = {
    /**
     * PDF generation job ID
     */
    jobId: string;
    /**
     * Generation status
     */
    status: 'queued' | 'processing' | 'completed' | 'failed';
    /**
     * Status message
     */
    message: string;
    /**
     * Estimated completion time
     */
    estimatedCompletion?: string;
    /**
     * PDF URL if already completed
     */
    pdfUrl?: string;
};

