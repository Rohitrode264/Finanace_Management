/**
 * Centralised per-document print configuration.
 *
 * Each entry maps a docType string to the Puppeteer PDF options that should
 * be used when generating that document type.  Adding a new document type
 * only requires adding a new key here — no other code needs to change.
 */
export type DocType = 'admission' | 'receipt';
interface PuppeteerPDFOptions {
    format?: string;
    width?: string;
    height?: string;
    scale?: number;
    margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };
    printBackground?: boolean;
    landscape?: boolean;
}
interface DocPrintConfig {
    /** Puppeteer PDF options for this document type */
    pdf: PuppeteerPDFOptions;
    /** Human-readable label (for logs / errors) */
    label: string;
}
export declare const PRINT_CONFIG: Record<DocType, DocPrintConfig>;
export {};
//# sourceMappingURL=printConfig.d.ts.map