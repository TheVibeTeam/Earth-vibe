import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../Models/User';
import Storage from '../../Utils/storage';
import logger from '../../Utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
    name: 'Upload Profile Picture',
    path: '/earthvibe/upload-profile-picture',
    method: 'post',
    category: 'earthvibe',
    example: {
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
    },
    parameter: ['imageBase64'],
    premium: false,
    error: false,
    logger: true,
    requires: (req: Request, res: Response, next: Function) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token no proporcionado' 
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            (req as any).userId = decoded.userId;
            next();
        } catch (error) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token inválido o expirado' 
            });
        }

        if (!req.body.imageBase64) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó imagen'
            });
        }
    },
    execution: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).userId;
            const { imageBase64 } = req.body;

            // Buscar usuario
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Eliminar foto anterior si existe
            if (user.profilePicture && user.profilePicture !== '') {
                try {
                    await Storage.deleteFile(user.profilePicture);
                } catch (error) {
                    logger.warn({ error: error instanceof Error ? error.message : String(error) }, 'Could not delete old profile picture:');
                }
            }

            // Subir nueva imagen
            const uploadResult = await Storage.uploadBase64(imageBase64, {
                userId: userId,
                category: 'images'
            });

            // Actualizar usuario
            user.profilePicture = uploadResult.url;
            await user.save();

            logger.info(`Profile picture updated for user: ${user.email}`);

            return res.status(200).json({
                success: true,
                message: 'Foto de perfil actualizada',
                profilePicture: uploadResult.url,
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    name: user.name,
                    bio: user.bio,
                    profilePicture: user.profilePicture,
                    university: user.university,
                    faculty: user.faculty,
                    points: user.points,
                    verified: user.verified,
                    totalScans: user.scannedProducts.length,
                    totalPosts: user.posts.length,
                    createdAt: user.createdAt
                }
            });

        } catch (error: any) {
            logger.error({ error: error.message || String(error) }, 'Upload profile picture error:');
            return res.status(500).json({
                success: false,
                message: 'Error al subir la foto de perfil',
                error: error.message
            });
        }
    }
};
