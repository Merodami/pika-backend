/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * PDF download information
 */
export type PdfDownloadResponse = {
    /**
     * Download URL for the PDF
     */
    url: string;
    /**
     * Suggested filename for download
     */
    filename: string;
    /**
     * MIME type
     */
    contentType?: string;
    /**
     * File size in bytes
     */
    size?: number;
    /**
     * When the PDF was generated
     */
    generatedAt: string;
};

