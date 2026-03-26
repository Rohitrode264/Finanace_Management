import { Request, Response } from 'express';
export declare class ClassController {
    listTemplates(_req: Request, res: Response): Promise<void>;
    createTemplate(req: Request, res: Response): Promise<void>;
    createClass(req: Request, res: Response): Promise<void>;
    getClassesByYear(req: Request, res: Response): Promise<void>;
    getClass(req: Request, res: Response): Promise<void>;
}
export declare const classController: ClassController;
//# sourceMappingURL=class.controller.d.ts.map