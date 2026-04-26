import { chromium } from 'playwright';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { PRINT_CONFIG, DocType } from '../config/printConfig';

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
export class PdfPrintService {
    /**
     * Generate a PDF buffer from raw HTML.
     *
     * @param html     Complete HTML string (inline styles, no external CSS files required)
     * @param docType  One of the keys in PRINT_CONFIG
     * @returns        PDF as a Buffer
     */
    async generatePdf(html: string, docType: DocType): Promise<Buffer> {
        const config = PRINT_CONFIG[docType];
        if (!config) {
            throw new Error(`Unknown docType: "${docType}". Add it to PRINT_CONFIG.`);
        }

        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage'],
        });

        try {
            const page = await browser.newPage();

            // Set content and wait until all network requests are idle
            // (fonts, images embedded as data-URIs won't trigger network calls)
            await page.setContent(html, { waitUntil: 'networkidle' });

            // Emulate screen media so we get the "what you see is what you get" 
            // version, bypassing any CSS that hides elements during print.
            await page.emulateMedia({ media: 'screen' });

            const pdfBuffer: Buffer = Buffer.from(
                await page.pdf({
                    ...config.pdf,
                    // Always output as a Buffer, not a file path
                }),
            );

            return pdfBuffer;
        } finally {
            await browser.close();
        }
    }

    /**
     * Send a PDF file to the default Windows printer silently.
     *
     * Writes the buffer to a temp file, prints it, then deletes it.
     * This keeps the backend stateless — no permanent temp files accumulate.
     *
     * @param pdfBuffer   PDF content as a Buffer
     * @param printerName Optional printer name.  If omitted, the OS default is used.
     */
    async printPdf(pdfBuffer: Buffer, printerName?: string): Promise<void> {
        // pdf-to-printer is a Windows-only CJS module; dynamic import keeps
        // the rest of the codebase ESM-compatible.
        const { print } = await import('pdf-to-printer');

        // Write to a uniquely-named temp file so concurrent print jobs don't clash
        const tmpPath = path.join(os.tmpdir(), `ncp_print_${Date.now()}.pdf`);

        fs.writeFileSync(tmpPath, pdfBuffer);

        const options: Record<string, unknown> = { silent: true };
        if (printerName) options['printer'] = printerName;

        // "Fire and forget" print command to avoid blocking the HTTP response.
        // It often takes Windows spooler a while to process, which causes Axios to timeout
        // on the frontend. We just queue it and let it resolve independently.
        print(tmpPath, options as any)
            .then(() => console.log(`Print job queued successfully: ${tmpPath}`))
            .catch(err => console.error(`Print job failed: ${tmpPath}`, err))
            .finally(() => {
                // Always clean up the temp file after the print bridge is completely done
                setTimeout(() => {
                    if (fs.existsSync(tmpPath)) {
                        fs.unlinkSync(tmpPath);
                        console.log(`Cleaned up temp file: ${tmpPath}`);
                    }
                }, 5000); // 5 sec buffer to ensure file handles are released
            });
    }

    /**
     * Convenience method: generate PDF and immediately send it to the printer.
     *
     * @param html         HTML content to render
     * @param docType      Document type key (maps to PRINT_CONFIG)
     * @param printerName  Optional printer name (default printer if omitted)
     */
    async generateAndPrint(
        html: string,
        docType: DocType,
        printerName?: string,
    ): Promise<Buffer> {
        const pdfBuffer = await this.generatePdf(html, docType);
        await this.printPdf(pdfBuffer, printerName);
        return pdfBuffer;
    }
}

export const pdfPrintService = new PdfPrintService();
