import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../../Models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
    name: 'Get Last Activity',
    path: '/earthvibe/user/last-activity',
    method: 'get',
    category: 'earthvibe',
    example: {},
    parameter: [],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                status: false, 
                msg: 'Token no proporcionado' 
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            (req as any).user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ 
                status: false, 
                msg: 'Token inválido o expirado' 
            });
        }
    },
    execution: async (req: Request, res: Response) => {
        try {
            const user = (req as any).user;
            const currentUser = await UserModel.findById(user.userId).select('scannedProducts');

            if (!currentUser) {
                return res.status(404).json({
                    status: false,
                    msg: 'Usuario no encontrado'
                });
            }

            // Obtener el último producto escaneado
            if (!currentUser.scannedProducts || currentUser.scannedProducts.length === 0) {
                return res.json({
                    status: true,
                    data: null,
                    msg: 'No hay actividad reciente'
                });
            }

            // Ordenar por fecha de escaneo (más reciente primero)
            const sortedProducts = currentUser.scannedProducts.sort((a, b) => 
                new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
            );

            const lastActivity = sortedProducts[0];

            res.json({
                status: true,
                data: {
                    type: 'scan',
                    location: 'Vibe Pod', // Puedes ajustar esto según tu lógica
                    points: lastActivity.points,
                    bottles: lastActivity.quantity ? parseInt(lastActivity.quantity) : 1,
                    timestamp: lastActivity.scannedAt,
                    productName: lastActivity.productName,
                    brand: lastActivity.brand
                }
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                msg: 'Error en el servidor',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
