import { Request, Response } from 'express';
import { pdfPrintService } from '../services/pdfPrint.service';
import { DocType } from '../config/printConfig';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class PrintController {
    /**
     * POST /api/print/silent
     * Generates a PDF from provided HTML and sends it directly to the default printer.
     */
    async silentPrint(req: Request, res: Response): Promise<void> {
        try {
            const { html, docType } = req.body;

            if (!html || typeof html !== 'string') {
                sendError(res, 'HTML content is required', 400);
                return;
            }

            if (!docType || (docType !== 'admission' && docType !== 'receipt')) {
                sendError(res, 'Valid docType (admission or receipt) is required', 400);
                return;
            }

            // Generate and print silently
            await pdfPrintService.generateAndPrint(html, docType as DocType);

            sendSuccess(res, { message: 'Print job dispatched successfully' }, 200, 'Printed');
        } catch (err: unknown) {
            console.error('Print Controller Error:', err);
            sendError(res, err instanceof Error ? err.message : 'Silent print failed', 500);
        }
    }

    /**
     * POST /api/print/pdf
     * Generates a PDF from provided HTML and returns the PDF buffer.
     * Useful if the user just wants to download the generated PDF.
     */
    async generatePdf(req: Request, res: Response): Promise<void> {
        try {
            const { html, docType } = req.body;

            if (!html || typeof html !== 'string') {
                sendError(res, 'HTML content is required', 400);
                return;
            }

            if (!docType || (docType !== 'admission' && docType !== 'receipt')) {
                sendError(res, 'Valid docType (admission or receipt) is required', 400);
                return;
            }

            const pdfBuffer = await pdfPrintService.generatePdf(html, docType as DocType);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${docType}.pdf"`);
            res.status(200).send(pdfBuffer);
        } catch (err: unknown) {
            console.error('PDF Generation Error:', err);
            sendError(res, err instanceof Error ? err.message : 'PDF generation failed', 500);
        }
    }
}

export const printController = new PrintController();
