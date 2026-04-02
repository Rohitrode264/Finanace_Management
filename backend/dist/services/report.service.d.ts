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
    atRisk: (EagleEyeStudentRow & {
        className: string;
    })[];
}
export declare class ReportService {
    /**
     * Generates a daily financial summary by aggregating LedgerEntries.
     * All numbers are reconstructed from the immutable ledger — no shortcuts.
     */
    getDailyReport(date: Date, endDate?: Date): Promise<DailyReportSummary>;
    /**
     * Returns the full ledger for an enrollment for audit/display purposes.
     */
    getEnrollmentLedger(enrollmentId: string): Promise<import("../models/LedgerEntry.model").ILedgerEntry[]>;
    /**
     * Returns an array of date strings (YYYY-MM-DD) within the given year/month
     * that have at least one payment credit ledger entry.
     * Used by the frontend calendar datepicker to highlight active days.
     */
    getPaymentDates(year: number, month: number): Promise<string[]>;
    /**
     * Fingerprint-based receipt print authorization.
     * Step 12 of the specification.
     */
    authorizeReceiptPrint(params: {
        receiptId: string;
        fingerprintToken: string;
        authorizedBy: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<{
        authorized: boolean;
        receipt: object;
    }>;
    /**
     * Validates a fingerprint session token or captured template.
     * For Mantra MFS100, the frontend captures a Base64 template.
     */
    private validateFingerprintToken;
    getDashboardOverview(today: Date): Promise<{
        daily: DailyReportSummary;
        stats: {
            totalStudents: number;
            totalClasses: number;
            totalEnrollments: number;
        };
    }>;
    /**
     * Eagle-Eye: full session overview grouped by class.
     */
    getEagleEye(): Promise<EagleEyeReport>;
}
export declare const reportService: ReportService;
//# sourceMappingURL=report.service.d.ts.map