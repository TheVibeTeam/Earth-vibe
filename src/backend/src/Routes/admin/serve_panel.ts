import type { Request, Response } from 'express';
import path from 'path';

export default {
    name: 'Admin - Serve Panel',
    path: '/admin',
    method: 'get',
    category: 'admin',
    example: {},
    parameter: [],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        next();
    },
    execution: async (req: Request, res: Response) => {
        try {
            // Servir el login por defecto
            const filePath = path.join(__dirname, '../../../public/admin/login.html');
            res.sendFile(filePath);
        } catch (error: any) {
            res.status(500).json({
                status: false,
                msg: 'Error al cargar el panel de administración',
                error: error.message
            });
        }
    }
};
