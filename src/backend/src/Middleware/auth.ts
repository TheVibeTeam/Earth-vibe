import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../Models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

/**
 * Middleware para verificar que el usuario esté autenticado
 */
export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                status: false,
                msg: 'Token de autenticación no proporcionado'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role || 'user'
        };

        next();
    } catch (error) {
        return res.status(401).json({
            status: false,
            msg: 'Token inválido o expirado'
        });
    }
};

/**
 * Middleware para verificar que el usuario sea administrador
 */
export const requireAdmin = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: false,
                msg: 'Autenticación requerida'
            });
        }

        const user = await UserModel.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                status: false,
                msg: 'Usuario no encontrado'
            });
        }

        if (user.role !== 'admin' && user.role !== 'superadmin') {
            return res.status(403).json({
                status: false,
                msg: 'Acceso denegado. Requiere privilegios de administrador'
            });
        }

        req.user.role = user.role;
        next();
    } catch (error) {
        return res.status(500).json({
            status: false,
            msg: 'Error verificando permisos',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Middleware para verificar que el usuario sea super administrador
 */
export const requireSuperAdmin = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: false,
                msg: 'Autenticación requerida'
            });
        }

        const user = await UserModel.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                status: false,
                msg: 'Usuario no encontrado'
            });
        }

        if (user.role !== 'superadmin') {
            return res.status(403).json({
                status: false,
                msg: 'Acceso denegado. Requiere privilegios de super administrador'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            status: false,
            msg: 'Error verificando permisos',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
