import { ClientSession, Types } from 'mongoose';
import { IReceipt } from '../models/Receipt.model';
export declare class ReceiptRepository {
    create(data: Partial<IReceipt>, session: ClientSession): Promise<IReceipt>;
    findById(id: string | Types.ObjectId): Promise<IReceipt | null>;
    findByReceiptNumber(receiptNumber: string): Promise<IReceipt | null>;
    findByPaymentId(paymentId: string | Types.ObjectId): Promise<IReceipt | null>;
    incrementReprintCount(receiptId: string | Types.ObjectId): Promise<void>;
    markCancelled(receiptId: string | Types.ObjectId, session: ClientSession): Promise<void>;
    hardDeleteByPaymentId(paymentId: string | Types.ObjectId, session: ClientSession): Promise<void>;
}
//# sourceMappingURL=receipt.repository.d.ts.map