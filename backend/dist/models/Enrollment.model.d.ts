import mongoose, { Document, Types } from 'mongoose';
export type EnrollmentStatus = 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type ConcessionType = 'PERCENTAGE' | 'FLAT' | 'NONE';
export interface IEnrollment extends Document {
    _id: Types.ObjectId;
    studentId: Types.ObjectId;
    academicClassId: Types.ObjectId;
    academicYear: string;
    totalFee: number;
    concessionType: ConcessionType;
    concessionValue: number;
    netFee: number;
    status: EnrollmentStatus;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Enrollment: mongoose.Model<IEnrollment, {}, {}, {}, mongoose.Document<unknown, {}, IEnrollment, {}, {}> & IEnrollment & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Enrollment.model.d.ts.map