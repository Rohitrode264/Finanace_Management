import { ClientSession, Types } from 'mongoose';
import { Payment, IPayment } from '../models/Payment.model';

export class PaymentRepository {
    async create(data: Partial<IPayment>, session: ClientSession): Promise<IPayment> {
        const [payment] = await Payment.create([data], { session });
        if (!payment) throw new Error('Failed to create payment');
        return payment as IPayment;
    }

    async findById(id: string | Types.ObjectId): Promise<IPayment | null> {
        return Payment.findById(id).populate('receivedBy', 'name firstName lastName') as unknown as Promise<IPayment | null>;
    }

    async findByEnrollment(enrollmentId: string | Types.ObjectId): Promise<IPayment[]> {
        return Payment.find({ enrollmentId }).sort({ createdAt: -1 }) as unknown as Promise<IPayment[]>;
    }

    async cancelPayment(
        paymentId: string | Types.ObjectId,
        cancelledBy: string | Types.ObjectId,
        reason: string,
        session: ClientSession
    ): Promise<IPayment | null> {
        return Payment.findOneAndUpdate(
            { _id: paymentId, isCancelled: false },
            {
                $set: {
                    isCancelled: true,
                    cancellationReason: reason,
                    cancelledBy: new Types.ObjectId(cancelledBy.toString()),
                    cancelledAt: new Date(),
                },
            },
            { new: true, session }
        ) as unknown as Promise<IPayment | null>;
    }

    async setReceiptId(
        paymentId: string | Types.ObjectId,
        receiptId: string | Types.ObjectId,
        session: ClientSession
    ): Promise<void> {
        await Payment.findByIdAndUpdate(paymentId, { $set: { receiptId } }, { session });
    }

    async hardDelete(paymentId: string | Types.ObjectId, session: ClientSession): Promise<void> {
        await Payment.findByIdAndDelete(paymentId, { session });
    }
}
