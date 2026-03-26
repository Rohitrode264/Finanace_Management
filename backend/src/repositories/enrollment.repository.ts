import { ClientSession, FilterQuery, Types } from 'mongoose';
import { Enrollment, IEnrollment } from '../models/Enrollment.model';



export class EnrollmentRepository {
    async findById(id: string | Types.ObjectId, session?: ClientSession): Promise<IEnrollment | null> {
        return Enrollment.findById(id)
            .populate({
                path: 'academicClassId',
                populate: { path: 'templateId' }
            })
            .session(session ?? null) as unknown as Promise<IEnrollment | null>;
    }

    async findByStudentAndYear(studentId: string, academicYear: string): Promise<IEnrollment | null> {
        return Enrollment.findOne({ studentId, academicYear }) as unknown as Promise<IEnrollment | null>;
    }

    async create(data: Partial<IEnrollment>, session?: ClientSession): Promise<IEnrollment> {
        const [enrollment] = await Enrollment.create([data], { session });
        if (!enrollment) throw new Error('Failed to create enrollment');
        return enrollment as IEnrollment;
    }

    async updateStatus(
        enrollmentId: string | Types.ObjectId,
        status: IEnrollment['status'],
        session?: ClientSession
    ): Promise<void> {
        await Enrollment.findByIdAndUpdate(enrollmentId, { $set: { status } }, { session });
    }

    async updateNetFee(
        enrollmentId: string | Types.ObjectId,
        netFee: number,
        concessionType: IEnrollment['concessionType'],
        concessionValue: number,
        session?: ClientSession
    ): Promise<void> {
        await Enrollment.findByIdAndUpdate(
            enrollmentId,
            { $set: { netFee, concessionType, concessionValue } },
            { session }
        );
    }

    async findMany(filter: FilterQuery<IEnrollment>, limit = 50, skip = 0): Promise<IEnrollment[]> {
        return Enrollment.find(filter)
            .populate({
                path: 'academicClassId',
                populate: { path: 'templateId' }
            })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }) as unknown as Promise<IEnrollment[]>;
    }
}
