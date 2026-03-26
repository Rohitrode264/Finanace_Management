import { Request, Response } from 'express';
export declare class ReceiptController {
    getReceipt(req: Request, res: Response): Promise<void>;
    getByPayment(req: Request, res: Response): Promise<void>;
    authorizePrint(req: Request, res: Response): Promise<void>;
}
export declare const receiptController: ReceiptController;
//# sourceMappingURL=receipt.controller.d.ts.map