import { ClientSession, Types } from 'mongoose';
import { IPayment } from '../models/Payment.model';
export declare class PaymentRepository {
    create(data: Partial<IPayment>, session: ClientSession): Promise<IPayment>;
    findById(id: string | Types.ObjectId): Promise<IPayment | null>;
    findByEnrollment(enrollmentId: string | Types.ObjectId): Promise<IPayment[]>;
    cancelPayment(paymentId: string | Types.ObjectId, cancelledBy: string | Types.ObjectId, reason: string, session: ClientSession): Promise<IPayment | null>;
    setReceiptId(paymentId: string | Types.ObjectId, receiptId: string | Types.ObjectId, session: ClientSession): Promise<void>;
}
//# sourceMappingURL=payment.repository.d.ts.map