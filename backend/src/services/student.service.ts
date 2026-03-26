import { Student, IStudent } from '../models/Student.model';
import { auditService } from './audit.service';
import { Types } from 'mongoose';

export class StudentService {
    async createStudent(params: {
        admissionNumber: string;
        firstName: string;
        lastName: string;
        phone: string;
        alternatePhone?: string;
        motherPhone?: string;
        fatherName: string;
        motherName: string;
        schoolName?: string;
        program?: string;
        email?: string;
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
        createdBy: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<IStudent> {
        const existing = await Student.findOne({ admissionNumber: params.admissionNumber.toUpperCase() });
        if (existing) throw new Error(`Admission number ${params.admissionNumber} already exists`);

        const student = await Student.create({
            admissionNumber: params.admissionNumber.toUpperCase().trim(),
            firstName: params.firstName.trim(),
            lastName: params.lastName.trim(),
            phone: params.phone.trim(),
            alternatePhone: params.alternatePhone?.trim(),
            motherPhone: params.motherPhone?.trim(),
            fatherName: params.fatherName.trim(),
            motherName: params.motherName.trim(),
            schoolName: params.schoolName?.trim(),
            program: params.program?.trim(),
            email: params.email?.trim(),
            bloodGroup: params.bloodGroup?.trim(),
            address: params.address,
            history: params.history,
            status: 'ACTIVE',
            createdBy: new Types.ObjectId(params.createdBy),
        });

        auditService.logAsync({
            actorId: params.createdBy,
            action: 'STUDENT_CREATED',
            entityType: 'STUDENT',
            entityId: student._id.toString(),
            before: null,
            after: { admissionNumber: student.admissionNumber, name: `${student.firstName} ${student.lastName}` },
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });

        return student as IStudent;
    }

    async countTotal(): Promise<number> {
        return Student.countDocuments();
    }

    async generateAdmissionNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `ADM-${year}-`;
        const lastStudent = await Student.findOne({ admissionNumber: new RegExp(`^${prefix}`) })
            .sort({ admissionNumber: -1 });

        if (!lastStudent || !lastStudent.admissionNumber) {
            return `${prefix}0001`;
        }

        const lastSequence = parseInt(lastStudent.admissionNumber.replace(prefix, ''), 10);
        const nextSequence = isNaN(lastSequence) ? 1 : lastSequence + 1;
        return `${prefix}${nextSequence.toString().padStart(4, '0')}`;
    }

    async updateStudentStatus(params: {
        studentId: string;
        status: IStudent['status'];
        updatedBy: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<IStudent> {
        const student = await Student.findById(params.studentId);
        if (!student) throw new Error('Student not found');

        const before = { status: student.status };
        student.status = params.status;
        await student.save();

        auditService.logAsync({
            actorId: params.updatedBy,
            action: 'STUDENT_UPDATED',
            entityType: 'STUDENT',
            entityId: params.studentId,
            before,
            after: { status: params.status },
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
        });

        return student as IStudent;
    }

    async findById(id: string): Promise<IStudent | null> {
        return Student.findById(id).populate('createdBy', 'name') as any;
    }

    async search(query: string, limit = 20, skip = 0, program?: string): Promise<{ students: IStudent[]; total: number }> {
        if (!query || query.trim().length === 0) return { students: [], total: 0 };

        const searchRegex = new RegExp(query.trim(), 'i');
        const searchFilter: any = {
            $or: [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { admissionNumber: searchRegex }
            ]
        };

        const filter: any = { ...searchFilter };
        if (program) filter.program = program;

        const [students, total] = await Promise.all([
            Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec() as unknown as IStudent[],
            Student.countDocuments(filter).exec()
        ]);

        return { students, total };
    }

    async listAll(status?: IStudent['status'], program?: string, limit = 50, skip = 0): Promise<{ students: IStudent[]; total: number }> {
        const filter: any = {};
        if (status) filter.status = status;
        if (program) filter.program = program;

        const [students, total] = await Promise.all([
            Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec() as unknown as IStudent[],
            Student.countDocuments(filter).exec()
        ]);

        return { students, total };
    }
}

export const studentService = new StudentService();
