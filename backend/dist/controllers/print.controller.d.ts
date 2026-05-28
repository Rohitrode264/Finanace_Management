import { Request, Response } from 'express';
export declare class PrintController {
    /**
     * POST /api/print/silent
     * Generates a PDF from provided HTML and sends it directly to the default printer.
     */
    silentPrint(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/print/pdf
     * Generates a PDF from provided HTML and returns the PDF buffer.
     * Useful if the user just wants to download the generated PDF.
     */
    generatePdf(req: Request, res: Response): Promise<void>;
}
export declare const printController: PrintController;
//# sourceMappingURL=print.controller.d.ts.map