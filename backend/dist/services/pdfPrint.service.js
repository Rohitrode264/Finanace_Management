"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfPrintService = exports.PdfPrintService = void 0;
const playwright_1 = require("playwright");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const printConfig_1 = require("../config/printConfig");
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
class PdfPrintService {
    /**
     * Generate a PDF buffer from raw HTML.
     *
     * @param html     Complete HTML string (inline styles, no external CSS files required)
     * @param docType  One of the keys in PRINT_CONFIG
     * @returns        PDF as a Buffer
     */
    async generatePdf(html, docType) {
        const config = printConfig_1.PRINT_CONFIG[docType];
        if (!config) {
            throw new Error(`Unknown docType: "${docType}". Add it to PRINT_CONFIG.`);
        }
        const browser = await playwright_1.chromium.launch({
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
            const pdfBuffer = Buffer.from(await page.pdf({
                ...config.pdf,
                // Always output as a Buffer, not a file path
            }));
            return pdfBuffer;
        }
        finally {
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
    async printPdf(pdfBuffer, printerName) {
        // pdf-to-printer is a Windows-only CJS module; dynamic import keeps
        // the rest of the codebase ESM-compatible.
        const { print } = await Promise.resolve().then(() => __importStar(require('pdf-to-printer')));
        // Write to a uniquely-named temp file so concurrent print jobs don't clash
        const tmpPath = path_1.default.join(os_1.default.tmpdir(), `ncp_print_${Date.now()}.pdf`);
        fs_1.default.writeFileSync(tmpPath, pdfBuffer);
        const options = { silent: true };
        if (printerName)
            options['printer'] = printerName;
        // "Fire and forget" print command to avoid blocking the HTTP response.
        // It often takes Windows spooler a while to process, which causes Axios to timeout
        // on the frontend. We just queue it and let it resolve independently.
        print(tmpPath, options)
            .then(() => console.log(`Print job queued successfully: ${tmpPath}`))
            .catch(err => console.error(`Print job failed: ${tmpPath}`, err))
            .finally(() => {
            // Always clean up the temp file after the print bridge is completely done
            setTimeout(() => {
                if (fs_1.default.existsSync(tmpPath)) {
                    fs_1.default.unlinkSync(tmpPath);
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
    async generateAndPrint(html, docType, printerName) {
        const pdfBuffer = await this.generatePdf(html, docType);
        await this.printPdf(pdfBuffer, printerName);
        return pdfBuffer;
    }
}
exports.PdfPrintService = PdfPrintService;
exports.pdfPrintService = new PdfPrintService();
//# sourceMappingURL=pdfPrint.service.js.map