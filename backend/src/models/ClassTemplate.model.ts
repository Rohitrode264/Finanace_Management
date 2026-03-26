import mongoose, { Document, Schema, Types } from 'mongoose';

export type Board = 'CBSE' | 'ICSE' | 'STATE' | 'IB' | 'OTHER';

export interface IClassTemplate extends Document {
    _id: Types.ObjectId;
    grade: string;
    stream: string | null;
    board: Board;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ClassTemplateSchema = new Schema<IClassTemplate>(
    {
        grade: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            // e.g. '11', '12', '10', '9'
        },
        stream: {
            type: String,
            trim: true,
            uppercase: true,
            default: null,
            // e.g. 'SCIENCE', 'COMMERCE', 'ARTS' — null for primary grades
        },
        board: {
            type: String,
            enum: ['CBSE', 'ICSE', 'STATE', 'IB', 'OTHER'] satisfies Board[],
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

// Unique combination: grade + stream + board defines a unique class type
ClassTemplateSchema.index({ grade: 1, stream: 1, board: 1 }, { unique: true });

export const ClassTemplate = mongoose.model<IClassTemplate>('ClassTemplate', ClassTemplateSchema);
