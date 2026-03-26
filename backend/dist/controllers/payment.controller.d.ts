import { Request, Response } from 'express';
export declare class PaymentController {
    createPayment(req: Request, res: Response): Promise<void>;
    getPayment(req: Request, res: Response): Promise<void>;
    cancelPayment(req: Request, res: Response): Promise<void>;
}
export declare const paymentController: PaymentController;
//# sourceMappingURL=payment.controller.d.ts.map