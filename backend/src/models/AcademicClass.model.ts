import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInstallmentPlan {
    installmentNo: number;
    dueDate: Date;
    amount: number;
}

export interface IAcademicClass extends Document {
    _id: Types.ObjectId;
    templateId: Types.ObjectId;
    academicYear: string;    // IMMUTABLE after creation e.g. "2024-25"
    section: string;
    totalFee: number;
    installmentPlan: IInstallmentPlan[];
    isActive: boolean;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const InstallmentPlanSchema = new Schema<IInstallmentPlan>(
    {
        installmentNo: { type: Number, required: true, min: 1 },
        dueDate: { type: Date, required: true },
        amount: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const AcademicClassSchema = new Schema<IAcademicClass>(
    {
        templateId: {
            type: Schema.Types.ObjectId,
            ref: 'ClassTemplate',
            required: true,
        },
        academicYear: {
            type: String,
            required: true,
            trim: true,
            match: [/^\d{4}-\d{2,4}$/, 'academicYear must be in format YYYY-YY or YYYY-YYYY'],
            // FINANCIAL RULE: Once set, this MUST NOT be changed.
            // Enforced in service layer — no update path for academicYear.
        },
        section: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            // e.g. 'A', 'B', 'C'
        },
        totalFee: {
            type: Number,
            required: true,
            min: 0,
        },
        installmentPlan: {
            type: [InstallmentPlanSchema],
            required: true,
            validate: {
                validator: function (plan: IInstallmentPlan[]) {
                    if (plan.length === 0) return false;
                    // Validate installment amounts sum equals totalFee
                    const total = plan.reduce((sum, i) => sum + i.amount, 0);
                    return Math.abs(total - (this as IAcademicClass).totalFee) < 0.01;
                },
                message: 'Sum of installment amounts must equal totalFee',
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

// Find all classes for a specific academic year (very common query)
AcademicClassSchema.index({ academicYear: 1 });
// Prevent duplicate section in same year for same template
AcademicClassSchema.index({ templateId: 1, academicYear: 1, section: 1 }, { unique: true });

export const AcademicClass = mongoose.model<IAcademicClass>('AcademicClass', AcademicClassSchema);
