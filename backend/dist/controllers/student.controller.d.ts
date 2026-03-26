import { Request, Response } from 'express';
export declare class StudentController {
    createStudent(req: Request, res: Response): Promise<void>;
    getStudent(req: Request, res: Response): Promise<void>;
    generateAdmissionId(req: Request, res: Response): Promise<void>;
    getCount(req: Request, res: Response): Promise<void>;
    listStudents(req: Request, res: Response): Promise<void>;
    updateStatus(req: Request, res: Response): Promise<void>;
}
export declare const studentController: StudentController;
//# sourceMappingURL=student.controller.d.ts.map