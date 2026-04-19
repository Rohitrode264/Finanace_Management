import { IEnrollment } from '../models/Enrollment.model';
export declare class EnrollmentService {
    createEnrollment(params: {
        studentId: string;
        academicClassId: string;
        createdBy: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<IEnrollment>;
    findById(id: string): Promise<IEnrollment | null>;
    findByStudentAndYear(studentId: string, academicYear: string): Promise<IEnrollment | null>;
    findByStudentId(studentId: string): Promise<IEnrollment[]>;
    getAll(limit?: number, skip?: number, program?: string, classId?: string): Promise<IEnrollment[]>;
    completeEnrollment(enrollmentId: string, updatedBy: string, ipAddress: string): Promise<void>;
    countTotal(): Promise<number>;
    /**
     * ──────────────────────────────────────────────────────────────────────────
     * COURSE TRANSFER
     * ──────────────────────────────────────────────────────────────────────────
     * Transfers a student from one course (enrollment) to another.
     *
     * 1. Validates the source enrollment is ONGOING
     * 2. Validates the target class is active & student not already enrolled
     * 3. Inside a single transaction:
     *    a. Marks source enrollment CANCELLED
     *    b. Creates new enrollment in target class
     *    c. If student already paid anything, creates an ADJUSTMENT CREDIT
     *       on the new enrollment for the paid amount carried over
     * 4. Writes audit log
     */
    transferEnrollment(params: {
        sourceEnrollmentId: string;
        targetClassId: string;
        transferredBy: string;
        reason?: string;
        /** If omitted, source enrollment's concession is carried over automatically */
        concessionType?: 'NONE' | 'PERCENTAGE' | 'FLAT';
        concessionValue?: number;
        ipAddress: string;
        userAgent: string;
    }): Promise<{
        oldEnrollment: IEnrollment;
        newEnrollment: IEnrollment;
        amountCarriedOver: number;
        concessionAmount: number;
    }>;
}
export declare const enrollmentService: EnrollmentService;
//# sourceMappingURL=enrollment.service.d.ts.map