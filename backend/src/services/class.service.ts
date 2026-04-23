import { AcademicClass, IAcademicClass } from '../models/AcademicClass.model';
import { ClassTemplate, IClassTemplate } from '../models/ClassTemplate.model';
import { auditService } from './audit.service';
import { Types } from 'mongoose';

export class ClassService {
    async createTemplate(params: {
        grade: string;
        stream?: string | null;
        board: IClassTemplate['board'];
        createdBy: string;
    }): Promise<IClassTemplate> {
        const template = await ClassTemplate.create({
            grade: params.grade.toUpperCase().trim(),
            stream: params.stream?.toUpperCase().trim() ?? null,
            board: params.board,
            createdBy: new Types.ObjectId(params.createdBy),
        });
        return template as IClassTemplate;
    }

    async createAcademicClass(params: {
        templateId: string;
        academicYear: string;
        section: string;
        totalFee: number;
        installmentPlan: IAcademicClass['installmentPlan'];
        createdBy: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<IAcademicClass> {
        const template = await ClassTemplate.findById(params.templateId);
        if (!template) throw new Error('ClassTemplate not found');

        const academicClass = await AcademicClass.create({
            templateId: new Types.ObjectId(params.templateId),
            academicYear: params.academicYear.trim(),
            section: params.section.toUpperCase().trim(),
            totalFee: params.totalFee,
            installmentPlan: params.installmentPlan,
            isActive: true,
            createdBy: new Types.ObjectId(params.createdBy),
        });

        auditService.logAsync({
            actorId: params.createdBy,
            action: 'CLASS_CREATED',
            entityType: 'CLASS',
            entityId: academicClass._id.toString(),
            before: null,
            after: { academicYear: params.academicYear, section: params.section, totalFee: params.totalFee },
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });

        return academicClass as IAcademicClass;
    }

    async listTemplates(): Promise<IClassTemplate[]> {
        return ClassTemplate.find().sort({ grade: 1, stream: 1 }) as unknown as Promise<IClassTemplate[]>;
    }

    async findClassesByYear(academicYear: string): Promise<IAcademicClass[]> {
        return AcademicClass.find({ academicYear, isActive: true })
            .populate('templateId', 'grade stream board')
            .sort({ createdAt: -1 }) as unknown as Promise<IAcademicClass[]>;
    }

    async findById(id: string): Promise<IAcademicClass | null> {
        return AcademicClass.findById(id).populate('templateId') as unknown as Promise<IAcademicClass | null>;
    }

    async deactivateClass(params: {
        classId: string;
        updatedBy: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<void> {
        const cls = await AcademicClass.findById(params.classId);
        if (!cls) throw new Error('AcademicClass not found');

        await AcademicClass.findByIdAndUpdate(params.classId, { $set: { isActive: false } });

        auditService.logAsync({
            actorId: params.updatedBy,
            action: 'CLASS_UPDATED',
            entityType: 'CLASS',
            entityId: params.classId,
            before: { isActive: true },
            after: { isActive: false },
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });
    }

    async countTotal(): Promise<number> {
        return AcademicClass.countDocuments({ isActive: true });
    }

    async getUniqueSessions(): Promise<string[]> {
        const years = await AcademicClass.distinct('academicYear', { isActive: true });
        return years.sort().reverse(); // Show latest sessions first
    }
}

export const classService = new ClassService();
