import { ClientSession, FilterQuery, Types } from 'mongoose';
import { IEnrollment } from '../models/Enrollment.model';
export declare class EnrollmentRepository {
    findById(id: string | Types.ObjectId, session?: ClientSession): Promise<IEnrollment | null>;
    findByStudentAndYear(studentId: string, academicYear: string): Promise<IEnrollment | null>;
    create(data: Partial<IEnrollment>, session?: ClientSession): Promise<IEnrollment>;
    updateStatus(enrollmentId: string | Types.ObjectId, status: IEnrollment['status'], session?: ClientSession): Promise<void>;
    updateNetFee(enrollmentId: string | Types.ObjectId, netFee: number, concessionType: IEnrollment['concessionType'], concessionValue: number, session?: ClientSession): Promise<void>;
    findMany(filter: FilterQuery<IEnrollment>, limit?: number, skip?: number): Promise<IEnrollment[]>;
}
//# sourceMappingURL=enrollment.repository.d.ts.map