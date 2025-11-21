import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../../Models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
    name: 'Verify Token',
    path: '/earthvibe/authentication/verify',
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

            // Buscar usuario en la base de datos para datos actualizados
            const currentUser = await UserModel.findById(user.userId).select('-password');

            if (!currentUser) {
                return res.status(404).json({
                    status: false,
                    msg: 'Usuario no encontrado'
                });
            }

            res.json({
                status: true,
                msg: 'Token válido',
                data: {
                    user: {
                        id: currentUser._id,
                        email: currentUser.email,
                        username: currentUser.username,
                        name: currentUser.name,
                        bio: currentUser.bio,
                        profilePicture: currentUser.profilePicture,
                        university: currentUser.university,
                        faculty: currentUser.faculty,
                        points: currentUser.points,
                        totalScans: currentUser.scannedProducts.length,
                        totalPosts: currentUser.posts.length,
                        createdAt: currentUser.createdAt
                    }
                }
            });
        } catch (error) {
            console.error('Error en verificación:', error);
            res.status(500).json({
                status: false,
                msg: 'Error en el servidor',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
