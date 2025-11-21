import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import NotificationModel from '../../Models/Notification';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
    name: 'Get User Notifications',
    path: '/earthvibe/notifications',
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
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            // Buscar notificaciones para este usuario
            const query: any = {
                $and: [
                    {
                        $or: [
                            { recipients: 'all' },
                            { recipients: 'specific', specificUsers: user.userId }
                        ]
                    },
                    {
                        $or: [
                            { expiresAt: { $exists: false } },
                            { expiresAt: null },
                            { expiresAt: { $gt: new Date() } }
                        ]
                    }
                ]
            };

            const notifications = await NotificationModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await NotificationModel.countDocuments(query);

            // Marcar cuáles han sido leídas
            const notificationsWithReadStatus = notifications.map(notif => ({
                id: notif._id,
                title: notif.title,
                message: notif.message,
                type: notif.type,
                priority: notif.priority,
                sentBy: notif.sentByName,
                isRead: notif.readBy.includes(user.userId),
                createdAt: notif.createdAt,
                expiresAt: notif.expiresAt
            }));

            // Contar no leídas
            const unreadCount = notificationsWithReadStatus.filter(n => !n.isRead).length;

            res.json({
                status: true,
                data: {
                    notifications: notificationsWithReadStatus,
                    unreadCount,
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    total
                }
            });
        } catch (error) {
            console.error('Error obteniendo notificaciones:', error);
            res.status(500).json({
                status: false,
                msg: 'Error en el servidor',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
