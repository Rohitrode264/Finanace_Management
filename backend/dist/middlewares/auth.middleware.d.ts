import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: string;
    roleId: string;
    email: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.middleware.d.ts.map