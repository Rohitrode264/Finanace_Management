import { DocType } from '../config/printConfig';
/**
 * PdfPrintService
 *
 * Responsibilities:
 *  1. Accept raw HTML + a docType
 *  2. Use Puppeteer to render the HTML server-side and generate a PDF
 *     with the paper size / margin / scale defined in PRINT_CONFIG
 *  3. Optionally send that PDF to the local printer via pdf-to-printer
 *
 * This is intentionally decoupled from Express so it can be called from any
 * controller or background job without modification.
 */
export declare class PdfPrintService {
    /**
     * Generate a PDF buffer from raw HTML.
     *
     * @param html     Complete HTML string (inline styles, no external CSS files required)
     * @param docType  One of the keys in PRINT_CONFIG
     * @returns        PDF as a Buffer
     */
    generatePdf(html: string, docType: DocType): Promise<Buffer>;
    /**
     * Send a PDF file to the default Windows printer silently.
     *
     * Writes the buffer to a temp file, prints it, then deletes it.
     * This keeps the backend stateless — no permanent temp files accumulate.
     *
     * @param pdfBuffer   PDF content as a Buffer
     * @param printerName Optional printer name.  If omitted, the OS default is used.
     */
    printPdf(pdfBuffer: Buffer, printerName?: string): Promise<void>;
    /**
     * Convenience method: generate PDF and immediately send it to the printer.
     *
     * @param html         HTML content to render
     * @param docType      Document type key (maps to PRINT_CONFIG)
     * @param printerName  Optional printer name (default printer if omitted)
     */
    generateAndPrint(html: string, docType: DocType, printerName?: string): Promise<Buffer>;
}
export declare const pdfPrintService: PdfPrintService;
//# sourceMappingURL=pdfPrint.service.d.ts.map