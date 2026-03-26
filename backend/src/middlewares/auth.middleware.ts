import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
    userId: string;
    roleId: string;
    email: string;
}

// Extend Express Request to carry authenticated user info
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: 'Authentication required. Provide a Bearer token.',
        });
        return;
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        req.user = decoded;
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            res.status(401).json({ success: false, error: 'Token has expired. Please log in again.' });
        } else if (err instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ success: false, error: 'Invalid token signature.' });
        } else {
            res.status(401).json({ success: false, error: 'Token verification failed.' });
        }
    }
}
