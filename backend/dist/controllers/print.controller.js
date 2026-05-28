"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printController = exports.PrintController = void 0;
const pdfPrint_service_1 = require("../services/pdfPrint.service");
const apiResponse_1 = require("../utils/apiResponse");
class PrintController {
    /**
     * POST /api/print/silent
     * Generates a PDF from provided HTML and sends it directly to the default printer.
     */
    async silentPrint(req, res) {
        try {
            const { html, docType } = req.body;
            if (!html || typeof html !== 'string') {
                (0, apiResponse_1.sendError)(res, 'HTML content is required', 400);
                return;
            }
            if (!docType || (docType !== 'admission' && docType !== 'receipt')) {
                (0, apiResponse_1.sendError)(res, 'Valid docType (admission or receipt) is required', 400);
                return;
            }
            // Generate and print silently
            await pdfPrint_service_1.pdfPrintService.generateAndPrint(html, docType);
            (0, apiResponse_1.sendSuccess)(res, { message: 'Print job dispatched successfully' }, 200, 'Printed');
        }
        catch (err) {
            console.error('Print Controller Error:', err);
            (0, apiResponse_1.sendError)(res, err instanceof Error ? err.message : 'Silent print failed', 500);
        }
    }
    /**
     * POST /api/print/pdf
     * Generates a PDF from provided HTML and returns the PDF buffer.
     * Useful if the user just wants to download the generated PDF.
     */
    async generatePdf(req, res) {
        try {
            const { html, docType } = req.body;
            if (!html || typeof html !== 'string') {
                (0, apiResponse_1.sendError)(res, 'HTML content is required', 400);
                return;
            }
            if (!docType || (docType !== 'admission' && docType !== 'receipt')) {
                (0, apiResponse_1.sendError)(res, 'Valid docType (admission or receipt) is required', 400);
                return;
            }
            const pdfBuffer = await pdfPrint_service_1.pdfPrintService.generatePdf(html, docType);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${docType}.pdf"`);
            res.status(200).send(pdfBuffer);
        }
        catch (err) {
            console.error('PDF Generation Error:', err);
            (0, apiResponse_1.sendError)(res, err instanceof Error ? err.message : 'PDF generation failed', 500);
        }
    }
}
exports.PrintController = PrintController;
exports.printController = new PrintController();
//# sourceMappingURL=print.controller.js.map