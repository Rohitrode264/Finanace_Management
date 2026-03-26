import mongoose, { Document, Types } from 'mongoose';
export interface IInstallmentPlan {
    installmentNo: number;
    dueDate: Date;
    amount: number;
}
export interface IAcademicClass extends Document {
    _id: Types.ObjectId;
    templateId: Types.ObjectId;
    academicYear: string;
    section: string;
    totalFee: number;
    installmentPlan: IInstallmentPlan[];
    isActive: boolean;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const AcademicClass: mongoose.Model<IAcademicClass, {}, {}, {}, mongoose.Document<unknown, {}, IAcademicClass, {}, {}> & IAcademicClass & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=AcademicClass.model.d.ts.map