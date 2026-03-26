import { Request, Response } from 'express';
export declare class RBACController {
    listUsers(_req: Request, res: Response): Promise<void>;
    createUser(req: Request, res: Response): Promise<void>;
    updateUserStatus(req: Request, res: Response): Promise<void>;
    updateUserFingerprint(req: Request, res: Response): Promise<void>;
    listRoles(_req: Request, res: Response): Promise<void>;
    createRole(req: Request, res: Response): Promise<void>;
    listPermissions(_req: Request, res: Response): Promise<void>;
    grantPermission(req: Request, res: Response): Promise<void>;
    getRolePermissions(req: Request, res: Response): Promise<void>;
}
export declare const rbacController: RBACController;
//# sourceMappingURL=rbac.controller.d.ts.map