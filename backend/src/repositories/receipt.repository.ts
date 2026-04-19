import { ClientSession, Types } from 'mongoose';
import { Receipt, IReceipt } from '../models/Receipt.model';

export class ReceiptRepository {
    async create(data: Partial<IReceipt>, session: ClientSession): Promise<IReceipt> {
        const [receipt] = await Receipt.create([data], { session });
        if (!receipt) throw new Error('Failed to create receipt');
        return receipt as IReceipt;
    }

    async findById(id: string | Types.ObjectId): Promise<IReceipt | null> {
        return Receipt.findById(id)
            .populate({
                path: 'paymentId',
                populate: { path: 'receivedBy' }
            })
            .populate({
                path: 'enrollmentId',
                populate: [
                    { path: 'studentId' },
                    { path: 'academicClassId', populate: { path: 'templateId' } }
                ]
            }) as unknown as Promise<IReceipt | null>;
    }

    async findByReceiptNumber(receiptNumber: string): Promise<IReceipt | null> {
        return Receipt.findOne({ receiptNumber: receiptNumber.toUpperCase() }) as unknown as Promise<IReceipt | null>;
    }

    async findByPaymentId(paymentId: string | Types.ObjectId): Promise<IReceipt | null> {
        return Receipt.findOne({ paymentId })
            .populate({
                path: 'paymentId',
                populate: { path: 'receivedBy' }
            })
            .populate({
                path: 'enrollmentId',
                populate: [
                    { path: 'studentId' },
                    { path: 'academicClassId', populate: { path: 'templateId' } }
                ]
            }) as unknown as Promise<IReceipt | null>;
    }

    async incrementReprintCount(receiptId: string | Types.ObjectId): Promise<void> {
        await Receipt.findByIdAndUpdate(receiptId, { $inc: { reprintCount: 1 } });
    }

    async markCancelled(receiptId: string | Types.ObjectId, session: ClientSession): Promise<void> {
        await Receipt.findByIdAndUpdate(receiptId, { $set: { isCancelled: true } }, { session });
    }

    async hardDeleteByPaymentId(paymentId: string | Types.ObjectId, session: ClientSession): Promise<void> {
        await Receipt.collection.deleteMany({ paymentId: new Types.ObjectId(paymentId.toString()) }, { session });
    }
}
