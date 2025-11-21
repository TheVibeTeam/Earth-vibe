import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import NotificationModel from '../../Models/Notification';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
    name: 'Mark Notification as Read',
    path: '/earthvibe/notifications/:id/read',
    method: 'post',
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
            const notificationId = req.params.id;

            const notification = await NotificationModel.findById(notificationId);

            if (!notification) {
                return res.status(404).json({
                    status: false,
                    msg: 'Notificación no encontrada'
                });
            }

            // Agregar usuario a readBy si no está ya
            if (!notification.readBy.includes(user.userId)) {
                notification.readBy.push(user.userId);
                await notification.save();
            }

            res.json({
                status: true,
                msg: 'Notificación marcada como leída'
            });
        } catch (error) {
            console.error('Error marcando notificación como leída:', error);
            res.status(500).json({
                status: false,
                msg: 'Error en el servidor',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
