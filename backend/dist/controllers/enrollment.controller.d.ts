import { Request, Response } from 'express';
export declare class EnrollmentController {
    createEnrollment(req: Request, res: Response): Promise<void>;
    getEnrollment(req: Request, res: Response): Promise<void>;
    getEnrollmentsByStudent(req: Request, res: Response): Promise<void>;
    getAllEnrollments(req: Request, res: Response): Promise<void>;
    applyConcession(req: Request, res: Response): Promise<void>;
    getEnrollmentLedger(req: Request, res: Response): Promise<void>;
    transferEnrollment(req: Request, res: Response): Promise<void>;
}
export declare const enrollmentController: EnrollmentController;
//# sourceMappingURL=enrollment.controller.d.ts.map