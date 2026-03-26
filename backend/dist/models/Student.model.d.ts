import mongoose, { Document, Types } from 'mongoose';
export type StudentStatus = 'ACTIVE' | 'DROPPED' | 'PASSED_OUT';
export interface IStudent extends Document {
    _id: Types.ObjectId;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    fatherName: string;
    motherName: string;
    schoolName?: string;
    program?: string;
    bloodGroup?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    };
    status: StudentStatus;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Student: mongoose.Model<IStudent, {}, {}, {}, mongoose.Document<unknown, {}, IStudent, {}, {}> & IStudent & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Student.model.d.ts.map