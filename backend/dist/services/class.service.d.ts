import { IAcademicClass } from '../models/AcademicClass.model';
import { IClassTemplate } from '../models/ClassTemplate.model';
export declare class ClassService {
    createTemplate(params: {
        grade: string;
        stream?: string | null;
        board: IClassTemplate['board'];
        createdBy: string;
    }): Promise<IClassTemplate>;
    createAcademicClass(params: {
        templateId: string;
        academicYear: string;
        section: string;
        totalFee: number;
        installmentPlan: IAcademicClass['installmentPlan'];
        createdBy: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<IAcademicClass>;
    listTemplates(): Promise<IClassTemplate[]>;
    findClassesByYear(academicYear: string): Promise<IAcademicClass[]>;
    findById(id: string): Promise<IAcademicClass | null>;
    deactivateClass(params: {
        classId: string;
        updatedBy: string;
        ipAddress: string;
        userAgent: string;
    }): Promise<void>;
    countTotal(): Promise<number>;
}
export declare const classService: ClassService;
//# sourceMappingURL=class.service.d.ts.map