import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import NaziShopUserModel from './models/NaziShopUser';
import Storage from '../../Utils/storage';
import logger from '../../Utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
    name: 'NaziShop Upload Profile Picture',
    path: '/nazishop/upload-profile-picture',
    method: 'post',
    category: 'nazishop',
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

            // Buscar usuario en NaziShop
            const user = await NaziShopUserModel.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Eliminar foto anterior si existe
            if (user.photoUrl && user.photoUrl !== '') {
                try {
                    await Storage.deleteFile(user.photoUrl);
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
            user.photoUrl = uploadResult.url;
            await user.save();

            logger.info(`NaziShop profile picture updated for user: ${user.email}`);

            return res.status(200).json({
                success: true,
                message: 'Foto de perfil actualizada',
                profilePicture: uploadResult.url,
                user: {
                    id: user._id,
                    email: user.email,
                    displayName: user.displayName,
                    phoneNumber: user.phoneNumber,
                    photoUrl: user.photoUrl,
                    role: user.role,
                    totalPurchases: user.totalPurchases,
                    totalSpent: user.totalSpent,
                    favoriteServices: user.favoriteServices,
                    isActive: user.isActive,
                    createdAt: user.createdAt,
                }
            });
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error uploading NaziShop profile picture:');
            return res.status(500).json({
                success: false,
                message: 'Error al subir la imagen',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
};
