import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../../Models/User';
import Storage from '../../Utils/storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
    name: 'Create Post',
    path: '/earthvibe/post/create',
    method: 'post',
    category: 'earthvibe',
    example: { 
        content: 'Mi primera publicación ecológica!',
        imageUrl: 'https://example.com/image.jpg'
    },
    parameter: ['content'],
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
            const { content, imageUrl } = req.body;

            // Validar contenido
            if (!content || content.trim() === '') {
                return res.status(400).json({
                    status: false,
                    msg: 'El contenido es requerido'
                });
            }

            const currentUser = await UserModel.findById(user.userId);
            if (!currentUser) {
                return res.status(404).json({
                    status: false,
                    msg: 'Usuario no encontrado'
                });
            }

            // Procesar imagen si existe
            let imageUrlPath = undefined;
            if (imageUrl) {
                try {
                    const uploadResult = await Storage.uploadBase64(imageUrl, {
                        userId: user.userId,
                        category: 'images'
                    });
                    imageUrlPath = uploadResult.url;
                } catch (error) {
                    return res.status(400).json({
                        status: false,
                        msg: 'Error al procesar la imagen'
                    });
                }
            }

            // Crear nueva publicación
            const newPost = {
                content: content.trim(),
                imageUrl: imageUrlPath,
                likes: [],
                comments: [],
                favorites: [],
                createdAt: new Date()
            };

            currentUser.posts.push(newPost as any);
            await currentUser.save();

            res.status(201).json({
                status: true,
                msg: 'Publicación creada exitosamente',
                data: {
                    post: newPost,
                    totalPosts: currentUser.posts.length
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
