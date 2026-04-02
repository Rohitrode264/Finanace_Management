import { LedgerRepository } from '../repositories/ledger.repository';
import { ReceiptRepository } from '../repositories/receipt.repository';
import { auditService } from './audit.service';

const ledgerRepo = new LedgerRepository();
const receiptRepo = new ReceiptRepository();

export interface DailyReportSummary {
    date: string;
    totalCollected: number;
    totalConcessions: number;
    totalCancellations: number;
    netReceipts: number;
    ncpShare: number;
    entryCount: number;
    newAdmissions: {
        total: number;
        students: {
            name: string;
            admissionNumber: string;
            deposited: number;
            totalPaid: number;
            left: number;
            collectedBy: string;
        }[];
    };
    existingStudentsActivity: {
        name: string;
        admissionNumber: string;
        deposited: number;
        totalPaid: number;
        left: number;
        collectedBy: string;
    }[];
    overallFinances: {
        paid: number;
        left: number;
    };
}

export interface EagleEyeStudentRow {
    name: string;
    admissionNumber: string;
    netFee: number;
    paid: number;
    outstanding: number;
}

export interface EagleEyeClassGroup {
    className: string;
    enrolled: number;
    totalFees: number;
    collected: number;
    outstanding: number;
    students: EagleEyeStudentRow[];
}

export interface EagleEyeReport {
    generatedAt: string;
    institution: {
        totalEnrolled: number;
        totalFees: number;
        totalCollected: number;
        totalOutstanding: number;
    };
    byClass: EagleEyeClassGroup[];
    atRisk: (EagleEyeStudentRow & { className: string })[];
}

export class ReportService {
    /**
     * Generates a daily financial summary by aggregating LedgerEntries.
     * All numbers are reconstructed from the immutable ledger — no shortcuts.
     */
    async getDailyReport(date: Date, endDate?: Date): Promise<DailyReportSummary> {
        const from = new Date(date);
        from.setHours(0, 0, 0, 0);
        const to = endDate ? new Date(endDate) : new Date(date);
        to.setHours(23, 59, 59, 999);

        const { Student } = await import('../models/Student.model');
        const { Enrollment } = await import('../models/Enrollment.model');
        const { LedgerEntry } = await import('../models/LedgerEntry.model');

        // Today's collections and activity
        const entriesToday = await ledgerRepo.findByDateRange(from, to);

        let totalCollected = 0;
        let totalConcessions = 0;
        let totalCancellations = 0;

        for (const entry of entriesToday) {
            if (entry.type === 'CREDIT' && entry.referenceType === 'PAYMENT') {
                totalCollected += entry.amount;
            } else if (entry.type === 'CREDIT' && entry.referenceType === 'CONCESSION') {
                totalConcessions += entry.amount;
            } else if (entry.type === 'DEBIT' && entry.referenceType === 'CANCELLATION') {
                totalCancellations += entry.amount;
            }
        }

        const netReceipts = totalCollected - totalCancellations;

        // All students who paid today
        const uniqueEnrollmentIds = [...new Set(entriesToday
            .filter(e => e.type === 'CREDIT' && e.referenceType === 'PAYMENT')
            .map(e => e.enrollmentId.toString())
        )];

        const studentActivity = await Promise.all(uniqueEnrollmentIds.map(async (eid) => {
            const enrollment = await Enrollment.findById(eid).populate('studentId');
            if (!enrollment) return null;

            const student = enrollment.studentId as any;

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

            const { Payment } = await import('../models/Payment.model');
            const paymentsToday = await Payment.find({
                enrollmentId: enrollment._id,
                isCancelled: false,
                createdAt: { $gte: from, $lte: to }
            }).populate('receivedBy');

            const collectedByNames = [...new Set(paymentsToday.map(p => (p.receivedBy as any)?.firstName || (p.receivedBy as any)?.name || 'Admin'))].join(', ');

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

        const activeStudents = studentActivity.filter(s => s !== null) as any[];

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
    async getEnrollmentLedger(enrollmentId: string) {
        return ledgerRepo.findByEnrollment(enrollmentId);
    }

    /**
     * Returns an array of date strings (YYYY-MM-DD) within the given year/month
     * that have at least one payment credit ledger entry.
     * Used by the frontend calendar datepicker to highlight active days.
     */
    async getPaymentDates(year: number, month: number): Promise<string[]> {
        const { LedgerEntry } = await import('../models/LedgerEntry.model');
        const from = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const to = new Date(year, month, 0, 23, 59, 59, 999);

        const entries = await LedgerEntry.find({
            type: 'CREDIT',
            referenceType: 'PAYMENT',
            createdAt: { $gte: from, $lte: to },
        }).select('createdAt').lean();

        const dateSet = new Set<string>();
        for (const entry of entries) {
            const d = (entry.createdAt as Date);
            dateSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        }

        return Array.from(dateSet).sort();
    }

    /**
     * Fingerprint-based receipt print authorization.
     * Step 12 of the specification.
     */
    async authorizeReceiptPrint(params: {
        receiptId: string;
        fingerprintToken: string;
        authorizedBy: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<{ authorized: boolean; receipt: object }> {
        const receipt = await receiptRepo.findById(params.receiptId);
        if (!receipt) throw new Error('Receipt not found');
        if (receipt.isCancelled) throw new Error('Cannot reprint a cancelled receipt');

        // Validate fingerprint token (placeholder — integrate with actual fingerprint SDK)
        const isValid = await this.validateFingerprintToken(
            params.fingerprintToken,
            params.authorizedBy
        );
        if (!isValid) {
            throw new Error('Fingerprint verification failed. Authorization denied.');
        }

        // Atomically increment reprint count
        await receiptRepo.incrementReprintCount(params.receiptId);

        auditService.logAsync({
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
    private async validateFingerprintToken(token: string, userId: string): Promise<boolean> {
        const { User } = await import('../models/User.model');
        const user = await User.findById(userId).select('+fingerprintKey');

        if (!user || !user.fingerprintKey) return false;

        // In a real Mantra 1:1 match, the hardware SDK usually does the comparison.
        // If the backend has to do it, we'd use a matching engine.
        // For now, we compare the key/token provided.
        return token === user.fingerprintKey;
    }

    async getDashboardOverview(today: Date) {
        const { studentService } = await import('./student.service');
        const { classService } = await import('./class.service');
        const { enrollmentService } = await import('./enrollment.service');

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

    /**
     * Eagle-Eye: full session overview grouped by class.
     */
    async getEagleEye(): Promise<EagleEyeReport> {
        const { Enrollment } = await import('../models/Enrollment.model');
        const { LedgerEntry } = await import('../models/LedgerEntry.model');

        const enrollments = await Enrollment.find({ status: 'ONGOING' })
            .populate({ path: 'studentId' })
            .populate({ path: 'academicClassId', populate: { path: 'templateId' } })
            .lean();

        const enrollmentIds = (enrollments as any[]).map((e: any) => e._id);
        const paymentAgg = await LedgerEntry.aggregate([
            { $match: { enrollmentId: { $in: enrollmentIds }, type: 'CREDIT', referenceType: 'PAYMENT' } },
            { $group: { _id: '$enrollmentId', total: { $sum: '$amount' } } }
        ]);

        const paidMap = new Map<string, number>();
        paymentAgg.forEach((row: any) => paidMap.set(row._id.toString(), row.total));

        const classMap = new Map<string, EagleEyeClassGroup>();
        const allRows: (EagleEyeStudentRow & { className: string })[] = [];

        for (const enrollment of enrollments as any[]) {
            const student = enrollment.studentId;
            if (!student) continue;
            const acClass = enrollment.academicClassId;
            const template = acClass?.templateId;
            const className = template
                ? `${template.grade}${template.stream ? ` (${template.stream})` : ''} — ${template.board}`
                : (acClass?.section || 'Unknown Class');

            const paid = paidMap.get(enrollment._id.toString()) ?? 0;
            const outstanding = Math.max(0, enrollment.netFee - paid);
            const row: EagleEyeStudentRow = {
                name: `${student.firstName} ${student.lastName}`,
                admissionNumber: student.admissionNumber,
                netFee: enrollment.netFee,
                paid,
                outstanding,
            };
            allRows.push({ ...row, className });
            if (!classMap.has(className)) {
                classMap.set(className, { className, enrolled: 0, totalFees: 0, collected: 0, outstanding: 0, students: [] });
            }
            const group = classMap.get(className)!;
            group.enrolled++;
            group.totalFees += enrollment.netFee;
            group.collected += paid;
            group.outstanding += outstanding;
            group.students.push(row);
        }

        for (const group of classMap.values()) {
            group.students.sort((a, b) => b.outstanding - a.outstanding);
        }

        const byClass = Array.from(classMap.values()).sort((a, b) => a.className.localeCompare(b.className));
        const institution = byClass.reduce(
            (acc, g) => ({
                totalEnrolled: acc.totalEnrolled + g.enrolled,
                totalFees: acc.totalFees + g.totalFees,
                totalCollected: acc.totalCollected + g.collected,
                totalOutstanding: acc.totalOutstanding + g.outstanding,
            }),
            { totalEnrolled: 0, totalFees: 0, totalCollected: 0, totalOutstanding: 0 }
        );
        const atRisk = [...allRows].filter(s => s.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding).slice(0, 10);

        return { generatedAt: new Date().toISOString(), institution, byClass, atRisk };
    }
}

export const reportService = new ReportService();
