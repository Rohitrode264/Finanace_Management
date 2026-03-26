"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = exports.ReportService = void 0;
const ledger_repository_1 = require("../repositories/ledger.repository");
const receipt_repository_1 = require("../repositories/receipt.repository");
const audit_service_1 = require("./audit.service");
const ledgerRepo = new ledger_repository_1.LedgerRepository();
const receiptRepo = new receipt_repository_1.ReceiptRepository();
class ReportService {
    /**
     * Generates a daily financial summary by aggregating LedgerEntries.
     * All numbers are reconstructed from the immutable ledger — no shortcuts.
     */
    async getDailyReport(date, endDate) {
        const from = new Date(date);
        from.setHours(0, 0, 0, 0);
        const to = endDate ? new Date(endDate) : new Date(date);
        to.setHours(23, 59, 59, 999);
        const { Student } = await Promise.resolve().then(() => __importStar(require('../models/Student.model')));
        const { Enrollment } = await Promise.resolve().then(() => __importStar(require('../models/Enrollment.model')));
        const { LedgerEntry } = await Promise.resolve().then(() => __importStar(require('../models/LedgerEntry.model')));
        // Today's collections and activity
        const entriesToday = await ledgerRepo.findByDateRange(from, to);
        let totalCollected = 0;
        let totalConcessions = 0;
        let totalCancellations = 0;
        for (const entry of entriesToday) {
            if (entry.type === 'CREDIT' && entry.referenceType === 'PAYMENT') {
                totalCollected += entry.amount;
            }
            else if (entry.type === 'CREDIT' && entry.referenceType === 'CONCESSION') {
                totalConcessions += entry.amount;
            }
            else if (entry.type === 'DEBIT' && entry.referenceType === 'CANCELLATION') {
                totalCancellations += entry.amount;
            }
        }
        const netReceipts = totalCollected - totalCancellations;
        // All students who paid today
        const uniqueEnrollmentIds = [...new Set(entriesToday
                .filter(e => e.type === 'CREDIT' && e.referenceType === 'PAYMENT')
                .map(e => e.enrollmentId.toString()))];
        const studentActivity = await Promise.all(uniqueEnrollmentIds.map(async (eid) => {
            const enrollment = await Enrollment.findById(eid).populate('studentId');
            if (!enrollment)
                return null;
            const student = enrollment.studentId;
            // Total paid for THIS enrollment ever
            const allPayments = await LedgerEntry.aggregate([
                { $match: { enrollmentId: enrollment._id, type: 'CREDIT', referenceType: 'PAYMENT' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalPaid = allPayments[0]?.total || 0;
            const remaining = Math.max(0, enrollment.netFee - totalPaid);
            // Amount paid TODAY
            const paidTodayRes = await LedgerEntry.aggregate([
                {
                    $match: {
                        enrollmentId: enrollment._id,
                        type: 'CREDIT',
                        referenceType: 'PAYMENT',
                        createdAt: { $gte: from, $lte: to }
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const { Payment } = await Promise.resolve().then(() => __importStar(require('../models/Payment.model')));
            const paymentsToday = await Payment.find({
                enrollmentId: enrollment._id,
                isCancelled: false,
                createdAt: { $gte: from, $lte: to }
            }).populate('receivedBy');
            const collectedByNames = [...new Set(paymentsToday.map(p => p.receivedBy?.firstName || p.receivedBy?.name || 'Admin'))].join(', ');
            return {
                name: `${student.firstName} ${student.lastName}`,
                admissionNumber: student.admissionNumber,
                isNew: student.createdAt >= from && student.createdAt <= to,
                paidToday: paidTodayRes[0]?.total || 0,
                totalPaidToDate: totalPaid,
                remainingBalance: remaining,
                collectedBy: collectedByNames || 'N/A'
            };
        }));
        const activeStudents = studentActivity.filter(s => s !== null);
        // Overall Finances (Summary of ongoing enrollments)
        const ongoingEnrollments = await Enrollment.find({ status: 'ONGOING' });
        const totalNetFee = ongoingEnrollments.reduce((sum, e) => sum + e.netFee, 0);
        const ongoingIds = ongoingEnrollments.map((e) => e._id);
        const totalPaidRes = await LedgerEntry.aggregate([
            {
                $match: {
                    enrollmentId: { $in: ongoingIds },
                    type: 'CREDIT',
                    referenceType: 'PAYMENT',
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalPaid = totalPaidRes[0]?.total || 0;
        const totalLeft = Math.max(0, totalNetFee - totalPaid);
        const ncpShare = netReceipts * 0.35;
        return {
            date: endDate ? `${from.toISOString().split('T')[0]} to ${to.toISOString().split('T')[0]}` : (from.toISOString().split('T')[0] ?? date.toDateString()),
            totalCollected,
            totalConcessions,
            totalCancellations,
            netReceipts,
            ncpShare,
            entryCount: entriesToday.length,
            newAdmissions: {
                total: activeStudents.filter(s => s.isNew).length,
                students: activeStudents.filter(s => s.isNew).map(s => ({
                    name: s.name,
                    admissionNumber: s.admissionNumber,
                    deposited: s.paidToday,
                    totalPaid: s.totalPaidToDate,
                    left: s.remainingBalance,
                    collectedBy: s.collectedBy
                }))
            },
            existingStudentsActivity: activeStudents.filter(s => !s.isNew).map(s => ({
                name: s.name,
                admissionNumber: s.admissionNumber,
                deposited: s.paidToday,
                totalPaid: s.totalPaidToDate,
                left: s.remainingBalance,
                collectedBy: s.collectedBy
            })),
            overallFinances: {
                paid: totalPaid,
                left: totalLeft,
            },
        };
    }
    /**
     * Returns the full ledger for an enrollment for audit/display purposes.
     */
    async getEnrollmentLedger(enrollmentId) {
        return ledgerRepo.findByEnrollment(enrollmentId);
    }
    /**
     * Returns an array of date strings (YYYY-MM-DD) within the given year/month
     * that have at least one payment credit ledger entry.
     * Used by the frontend calendar datepicker to highlight active days.
     */
    async getPaymentDates(year, month) {
        const { LedgerEntry } = await Promise.resolve().then(() => __importStar(require('../models/LedgerEntry.model')));
        const from = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const to = new Date(year, month, 0, 23, 59, 59, 999);
        const entries = await LedgerEntry.find({
            type: 'CREDIT',
            referenceType: 'PAYMENT',
            createdAt: { $gte: from, $lte: to },
        }).select('createdAt').lean();
        const dateSet = new Set();
        for (const entry of entries) {
            const d = entry.createdAt;
            dateSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        }
        return Array.from(dateSet).sort();
    }
    /**
     * Fingerprint-based receipt print authorization.
     * Step 12 of the specification.
     */
    async authorizeReceiptPrint(params) {
        const receipt = await receiptRepo.findById(params.receiptId);
        if (!receipt)
            throw new Error('Receipt not found');
        if (receipt.isCancelled)
            throw new Error('Cannot reprint a cancelled receipt');
        // Validate fingerprint token (placeholder — integrate with actual fingerprint SDK)
        const isValid = await this.validateFingerprintToken(params.fingerprintToken, params.authorizedBy);
        if (!isValid) {
            throw new Error('Fingerprint verification failed. Authorization denied.');
        }
        // Atomically increment reprint count
        await receiptRepo.incrementReprintCount(params.receiptId);
        audit_service_1.auditService.logAsync({
            actorId: params.authorizedBy,
            action: 'RECEIPT_REPRINT_AUTHORIZED',
            entityType: 'RECEIPT',
            entityId: params.receiptId,
            before: { reprintCount: receipt.reprintCount },
            after: {
                reprintCount: receipt.reprintCount + 1,
                fingerprintToken: params.fingerprintToken,
                authorizedBy: params.authorizedBy,
            },
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });
        return { authorized: true, receipt };
    }
    /**
     * Validates a fingerprint session token or captured template.
     * For Mantra MFS100, the frontend captures a Base64 template.
     */
    async validateFingerprintToken(token, userId) {
        const { User } = await Promise.resolve().then(() => __importStar(require('../models/User.model')));
        const user = await User.findById(userId).select('+fingerprintKey');
        if (!user || !user.fingerprintKey)
            return false;
        // In a real Mantra 1:1 match, the hardware SDK usually does the comparison.
        // If the backend has to do it, we'd use a matching engine.
        // For now, we compare the key/token provided.
        return token === user.fingerprintKey;
    }
    async getDashboardOverview(today) {
        const { studentService } = await Promise.resolve().then(() => __importStar(require('./student.service')));
        const { classService } = await Promise.resolve().then(() => __importStar(require('./class.service')));
        const { enrollmentService } = await Promise.resolve().then(() => __importStar(require('./enrollment.service')));
        const [dailyReport, students, classes, enrollments] = await Promise.all([
            this.getDailyReport(today),
            studentService.countTotal(),
            classService.countTotal(),
            enrollmentService.countTotal(),
        ]);
        return {
            daily: dailyReport,
            stats: {
                totalStudents: students,
                totalClasses: classes,
                totalEnrollments: enrollments,
            }
        };
    }
}
exports.ReportService = ReportService;
exports.reportService = new ReportService();
//# sourceMappingURL=report.service.js.map