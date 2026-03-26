"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerRepository = void 0;
const mongoose_1 = require("mongoose");
const LedgerEntry_model_1 = require("../models/LedgerEntry.model");
class LedgerRepository {
    async create(data, session) {
        const [entry] = await LedgerEntry_model_1.LedgerEntry.create([data], { session });
        if (!entry)
            throw new Error('Failed to create ledger entry');
        return entry;
    }
    async findByEnrollment(enrollmentId) {
        return LedgerEntry_model_1.LedgerEntry.find({ enrollmentId }).sort({ createdAt: 1 });
    }
    async computeBalance(enrollmentId) {
        const result = await LedgerEntry_model_1.LedgerEntry.aggregate([
            { $match: { enrollmentId: new mongoose_1.Types.ObjectId(enrollmentId.toString()) } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                },
            },
        ]);
        let credits = 0;
        let debits = 0;
        for (const r of result) {
            if (r._id === 'CREDIT')
                credits = r.total;
            if (r._id === 'DEBIT')
                debits = r.total;
        }
        return debits - credits;
    }
    async findByDateRange(from, to) {
        return LedgerEntry_model_1.LedgerEntry.find({
            createdAt: { $gte: from, $lte: to },
        }).sort({ createdAt: 1 });
    }
    async findByReference(referenceId, referenceType) {
        return LedgerEntry_model_1.LedgerEntry.findOne({ referenceId, referenceType });
    }
}
exports.LedgerRepository = LedgerRepository;
//# sourceMappingURL=ledger.repository.js.map