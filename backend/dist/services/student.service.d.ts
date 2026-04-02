import { IStudent } from '../models/Student.model';
export declare class StudentService {
    createStudent(params: {
        admissionNumber: string;
        firstName: string;
        lastName: string;
        phone: string;
        alternatePhone?: string;
        motherPhone?: string;
        fatherName: string;
        motherName?: string;
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
    }): Promise<IStudent>;
    countTotal(): Promise<number>;
    generateAdmissionNumber(): Promise<string>;
    updateStudentStatus(params: {
        studentId: string;
        status: IStudent['status'];
        updatedBy: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<IStudent>;
    findById(id: string): Promise<IStudent | null>;
    search(query: string, limit?: number, skip?: number, program?: string): Promise<{
        students: IStudent[];
        total: number;
    }>;
    listAll(status?: IStudent['status'], program?: string, limit?: number, skip?: number): Promise<{
        students: IStudent[];
        total: number;
    }>;
    getUniqueSchools(): Promise<string[]>;
}
export declare const studentService: StudentService;
//# sourceMappingURL=student.service.d.ts.map