import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../../Models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
    name: 'Update Profile',
    path: '/earthvibe/user/update',
    method: 'put',
    category: 'earthvibe',
    example: { 
        name: 'Juan Pérez',
        bio: 'Estudiante de ingeniería ambiental',
        university: 'Universidad Nacional',
        faculty: 'Ingeniería Ambiental'
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
            const { name, bio, university, faculty } = req.body;

            const currentUser = await UserModel.findById(user.userId);
            if (!currentUser) {
                return res.status(404).json({
                    status: false,
                    msg: 'Usuario no encontrado'
                });
            }

            // Actualizar solo los campos proporcionados
            if (name) currentUser.name = name.trim();
            if (bio !== undefined) currentUser.bio = bio.trim();
            if (university) currentUser.university = university.trim();
            if (faculty) currentUser.faculty = faculty.trim();

            await currentUser.save();

            res.json({
                status: true,
                msg: 'Perfil actualizado exitosamente',
                data: {
                    id: currentUser._id,
                    email: currentUser.email,
                    username: currentUser.username,
                    name: currentUser.name,
                    bio: currentUser.bio,
                    university: currentUser.university,
                    faculty: currentUser.faculty
                }
            });
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            res.status(500).json({
                status: false,
                msg: 'Error en el servidor',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
