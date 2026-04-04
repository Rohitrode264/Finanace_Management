import { Request, Response } from 'express';
import { studentService } from '../services/student.service';
import { auditService } from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { z } from 'zod';

const createStudentSchema = z.object({
    admissionNumber: z.string().optional().or(z.literal('')),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phone: z.string().min(10).max(15),
    alternatePhone: z.string().max(15).optional().or(z.literal('')),
    motherPhone: z.string().max(15).optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    fatherName: z.string().min(1).max(100),
    motherName: z.string().max(100).optional().or(z.literal('')),
    schoolName: z.string().max(200).optional().or(z.literal('')),
    program: z.string().max(100).optional().or(z.literal('')),
    bloodGroup: z.string().optional().or(z.literal('')),
    address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
    }).optional(),
    history: z.object({
        previousSchool: z.string().optional(),
        percentage: z.string().optional(),
        yearPassout: z.string().optional(),
        extraNote: z.string().optional(),
    }).optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(['ACTIVE', 'DROPPED', 'PASSED_OUT']),
});

export class StudentController {
    async createStudent(req: Request, res: Response): Promise<void> {
        const parsed = createStudentSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }

        try {
            const meta = auditService.extractRequestMeta(req);
            const student = await studentService.createStudent({
                ...parsed.data,
                createdBy: req.user!.userId,
                ...meta,
            });
            sendSuccess(res, student, 201, 'Student created successfully');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create student';
            sendError(res, message, 400);
        }
    }

    async getStudent(req: Request, res: Response): Promise<void> {
        try {
            const student = await studentService.findById(req.params['id']!);
            if (!student) { sendError(res, 'Student not found', 404); return; }
            sendSuccess(res, student);
        } catch { sendError(res, 'Failed to fetch student', 500); }
    }

    async generateAdmissionId(req: Request, res: Response): Promise<void> {
        try {
            const admissionId = await studentService.generateAdmissionNumber();
            sendSuccess(res, { admissionId }, 200, 'Generated successfully');
        } catch {
            sendError(res, 'Failed to generate admission ID', 500);
        }
    }

    async getCount(req: Request, res: Response): Promise<void> {
        try {
            const count = await studentService.countTotal();
            sendSuccess(res, { total: count });
        } catch {
            sendError(res, 'Failed to fetch total count', 500);
        }
    }

    async listStudents(req: Request, res: Response): Promise<void> {
        try {
            const { q, status, program, limit = '20', skip = '0' } = req.query as Record<string, string>;
            const l = parseInt(limit, 10);
            const s = parseInt(skip, 10);

            let result;
            if (q) {
                result = await studentService.search(q, l, s, program);
            } else {
                result = await studentService.listAll(
                    status as 'ACTIVE' | 'DROPPED' | 'PASSED_OUT' | undefined,
                    program,
                    l,
                    s
                );
            }
            sendSuccess(res, result);
        } catch (err) {
            sendError(res, 'Failed to list students', 500);
        }
    }

    async updateStatus(req: Request, res: Response): Promise<void> {
        const parsed = updateStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', parsed.error.format());
            return;
        }
        try {
            const meta = auditService.extractRequestMeta(req);
            const student = await studentService.updateStudentStatus({
                studentId: req.params['id']!,
                status: parsed.data.status,
                updatedBy: req.user!.userId,
                ...meta,
            });
            sendSuccess(res, student, 200, 'Status updated');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update status';
            sendError(res, message, 400);
        }
    }

    async getSchools(req: Request, res: Response): Promise<void> {
        try {
            const schools = await studentService.getUniqueSchools();
            sendSuccess(res, schools);
        } catch {
            sendError(res, 'Failed to fetch schools', 500);
        }
    }

    async getCities(req: Request, res: Response): Promise<void> {
        try {
            const cities = await studentService.getUniqueCities();
            sendSuccess(res, cities);
        } catch {
            sendError(res, 'Failed to fetch cities', 500);
        }
    }

    async getStates(req: Request, res: Response): Promise<void> {
        try {
            const states = await studentService.getUniqueStates();
            sendSuccess(res, states);
        } catch {
            sendError(res, 'Failed to fetch states', 500);
        }
    }
}

export const studentController = new StudentController();
