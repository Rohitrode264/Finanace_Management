import mongoose, { Document, Schema, Types } from 'mongoose';

export type StudentStatus = 'ACTIVE' | 'DROPPED' | 'PASSED_OUT';

export interface IStudent extends Document {
    _id: Types.ObjectId;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    phone: string;
    alternatePhone?: string;
    motherPhone?: string;
    email?: string;
    fatherName: string;
    motherName?: string;
    schoolName?: string;
    program?: string;
    bloodGroup?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    };
    history?: {
        previousSchool?: string;
        percentage?: string;
        yearPassout?: string;
        extraNote?: string;
    };
    status: StudentStatus;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
    {
        admissionNumber: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            // Format: e.g. ADM-2024-0001
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        alternatePhone: {
            type: String,
            trim: true,
        },
        motherPhone: {
            type: String,
            trim: true,
        },
        fatherName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        motherName: {
            type: String,
            required: false,
            trim: true,
            maxlength: 100,
        },
        schoolName: {
            type: String,
            trim: true,
            maxlength: 200,
            default: '',
        },
        program: {
            type: String,
            trim: true,
            default: '',
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        bloodGroup: {
            type: String,
            trim: true,
        },
        address: {
            street: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            zipCode: { type: String, trim: true },
        },
        history: {
            previousSchool: { type: String, trim: true },
            percentage: { type: String, trim: true },
            yearPassout: { type: String, trim: true },
            extraNote: { type: String, trim: true },
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'DROPPED', 'PASSED_OUT'] satisfies StudentStatus[],
            default: 'ACTIVE',
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

// Full-text search on student names and program
StudentSchema.index({ firstName: 'text', lastName: 'text', admissionNumber: 'text', program: 'text' });

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
