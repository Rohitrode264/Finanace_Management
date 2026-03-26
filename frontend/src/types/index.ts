// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginResponse {
    success: boolean;
    data: {
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
        permissions: string[];
    };
    message?: string;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    roleId: string;
    fingerprintKey: string | null;
    isActive: boolean;
}

// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
    _id: string;
    name: string;
    email: string;
    roleId: string | Role;
    fingerprintKey: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// ── Role & Permissions ────────────────────────────────────────────────────────
export interface Role {
    _id: string;
    name: string;
    description: string;
    isSystemRole: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Permission {
    _id: string;
    action: string;
    resource: string;
    description: string;
}

export interface RolePermission {
    _id: string;
    roleId: string;
    permissionId: string;
    createdAt: string;
}

// ── Student ───────────────────────────────────────────────────────────────────
// Matches backend Student.model.ts exactly
export type StudentStatus = 'ACTIVE' | 'DROPPED' | 'PASSED_OUT';

export interface Category {
    _id: string;
    name: string;
    description: string;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface Student {
    _id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
    alternatePhone?: string;
    motherPhone?: string;
    fatherName: string;
    motherName: string;
    schoolName?: string;
    email?: string;
    program?: string;
    bloodGroup?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        [key: string]: any;
    };
    history?: {
        previousSchool?: string;
        percentage?: string;
        yearPassout?: string;
        extraNote?: string;
    };
    status: StudentStatus;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// ── ClassTemplate ─────────────────────────────────────────────────────────────
// Matches backend ClassTemplate.model.ts exactly
export type Board = 'CBSE' | 'ICSE' | 'STATE' | 'IB' | 'OTHER';

export interface ClassTemplate {
    _id: string;
    grade: string;
    stream: string | null;
    board: Board;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// ── AcademicClass ─────────────────────────────────────────────────────────────
// Matches backend AcademicClass.model.ts exactly
export interface InstallmentPlan {
    installmentNo: number;
    dueDate: string;
    amount: number;
}

export interface AcademicClass {
    _id: string;
    templateId: string | ClassTemplate;
    academicYear: string;
    section: string;
    totalFee: number;
    installmentPlan: InstallmentPlan[];
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// ── Enrollment ────────────────────────────────────────────────────────────────
// Matches backend Enrollment.model.ts exactly
export type EnrollmentStatus = 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type ConcessionType = 'PERCENTAGE' | 'FLAT' | 'NONE';

export interface Enrollment {
    _id: string;
    studentId: string | Student;
    academicClassId: string | AcademicClass;
    academicYear: string;
    totalFee: number;
    concessionType: ConcessionType;
    concessionValue: number;
    netFee: number;
    status: EnrollmentStatus;
    outstandingBalance?: number;   // computed, returned by GET /enrollments/:id
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

// ── Payment ───────────────────────────────────────────────────────────────────
// Matches backend Payment.model.ts exactly
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CHEQUE' | 'BANK_TRANSFER';

export interface PaymentAllocation {
    installmentNo: number;
    amount: number;
}

export interface Payment {
    _id: string;
    enrollmentId: string | Enrollment;
    amount: number;
    paymentMode: PaymentMode;
    allocation: PaymentAllocation[];
    receiptId: string | null;
    receivedBy: string;
    fingerprintVerified: boolean;
    isCancelled: boolean;
    cancellationReason: string | null;
    cancelledBy: string | null;
    cancelledAt: string | null;
    transactionRef: string | null;
    createdAt: string;
}

// ── Receipt ───────────────────────────────────────────────────────────────────
// Matches backend Receipt.model.ts exactly
export interface Receipt {
    _id: string;
    receiptNumber: string;
    paymentId: string | Payment;
    enrollmentId: string | Enrollment;
    printedBy: string;
    printedAt: string;
    reprintCount: number;
    isCancelled: boolean;
    locked: boolean;
    createdAt: string;
}

// ── Ledger ────────────────────────────────────────────────────────────────────
export interface LedgerEntry {
    _id: string;
    enrollmentId: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    referenceType: 'PAYMENT' | 'CONCESSION' | 'CANCELLATION' | 'ADJUSTMENT';
    referenceId: string;
    description: string;
    createdAt: string;
}

// ── Audit Log ─────────────────────────────────────────────────────────────────
export interface AuditLog {
    _id: string;
    actorId: string | User;
    action: string;
    entityType: string;
    entityId: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
}

// ── Report ────────────────────────────────────────────────────────────────────
// Matches backend DailyReportSummary exactly
export interface DailyReport {
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

// ── API Response wrappers ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// ── Process Payment Result ────────────────────────────────────────────────────
export interface ProcessPaymentResult {
    payment: Payment;
    receipt: Receipt;
    receiptNumber: string;
    allocation: PaymentAllocation[];
}
