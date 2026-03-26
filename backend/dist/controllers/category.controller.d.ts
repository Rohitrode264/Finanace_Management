import { Request, Response } from 'express';
export declare class CategoryController {
    listCategories(req: Request, res: Response): Promise<void>;
    createCategory(req: Request, res: Response): Promise<void>;
    toggleCategoryStatus(req: Request, res: Response): Promise<void>;
}
export declare const categoryController: CategoryController;
//# sourceMappingURL=category.controller.d.ts.map