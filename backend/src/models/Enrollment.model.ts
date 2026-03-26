import mongoose, { Document, Schema, Types } from 'mongoose';

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

const EnrollmentSchema = new Schema<IEnrollment>(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        academicClassId: {
            type: Schema.Types.ObjectId,
            ref: 'AcademicClass',
            required: true,
        },
        academicYear: {
            type: String,
            required: true,
            trim: true,
            // Denormalized from AcademicClass for fast queries without join
        },
        totalFee: {
            type: Number,
            required: true,
            min: 0,
            // Snapshot of class fee at time of enrollment — immutable
        },
        concessionType: {
            type: String,
            enum: ['PERCENTAGE', 'FLAT', 'NONE'] satisfies ConcessionType[],
            default: 'NONE',
        },
        concessionValue: {
            type: Number,
            default: 0,
            min: 0,
        },
        netFee: {
            type: Number,
            required: true,
            min: 0,
            // = totalFee minus concession amount
            // IMPORTANT: Balance is NOT stored here — always computed from LedgerEntries
        },
        status: {
            type: String,
            enum: ['ONGOING', 'COMPLETED', 'CANCELLED'] satisfies EnrollmentStatus[],
            default: 'ONGOING',
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

// Prevent a student from being enrolled twice in the same academic year/class
EnrollmentSchema.index({ studentId: 1, academicYear: 1, academicClassId: 1 }, { unique: true });
// Fast lookup of all enrollments for a student
EnrollmentSchema.index({ studentId: 1, academicYear: 1 });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
