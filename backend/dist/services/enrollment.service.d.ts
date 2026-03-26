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
}
export declare const enrollmentService: EnrollmentService;
//# sourceMappingURL=enrollment.service.d.ts.map