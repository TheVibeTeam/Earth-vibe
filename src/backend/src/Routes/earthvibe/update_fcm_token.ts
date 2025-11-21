import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../../Models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
    name: 'Update FCM Token',
    path: '/earthvibe/user/update-fcm-token',
    method: 'put',
    category: 'earthvibe',
    example: { 
        fcmToken: 'fcm_token_here'
    },
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
            const { fcmToken } = req.body;

            if (!fcmToken) {
                return res.status(400).json({
                    status: false,
                    msg: 'Token FCM es requerido'
                });
            }

            // Actualizar el token FCM del usuario
            await UserModel.findByIdAndUpdate(user.userId, {
                fcmToken: fcmToken
            });

            return res.json({
                status: true,
                msg: 'Token FCM actualizado exitosamente'
            });
        } catch (error) {
            console.error('Error updating FCM token:', error);
            return res.status(500).json({
                status: false,
                msg: 'Error al actualizar el token FCM'
            });
        }
    }
};
