import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../../Models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
    name: 'Get Profile',
    path: '/earthvibe/user/profile',
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
            const currentUser = await UserModel.findById(user.userId).select('-password');

            if (!currentUser) {
                return res.status(404).json({
                    status: false,
                    msg: 'Usuario no encontrado'
                });
            }

            res.json({
                status: true,
                data: {
                    id: currentUser._id,
                    email: currentUser.email,
                    username: currentUser.username,
                    name: currentUser.name,
                    bio: currentUser.bio,
                    profilePicture: currentUser.profilePicture,
                    university: currentUser.university,
                    faculty: currentUser.faculty,
                    verified: currentUser.verified,
                    role: currentUser.role || 'user',
                    points: currentUser.points,
                    totalScans: currentUser.scannedProducts.length,
                    totalPosts: currentUser.posts.length,
                    scannedProducts: currentUser.scannedProducts.map(p => ({
                        barcode: p.barcode,
                        productName: p.productName,
                        brand: p.brand,
                        quantity: p.quantity,
                        points: p.points,
                        scannedAt: p.scannedAt
                    })),
                    posts: currentUser.posts,
                    createdAt: currentUser.createdAt
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
