import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../../Models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
    name: 'Get All Posts',
    path: '/earthvibe/post/all',
    method: 'get',
    category: 'earthvibe',
    example: { limit: '20', page: '1' },
    parameter: [],
    premium: false,
    error: false,
    logger: true,
    execution: async (req: Request, res: Response) => {
        try {
            const limit = parseInt(req.query.limit as string) || 20;
            const page = parseInt(req.query.page as string) || 1;
            const skip = (page - 1) * limit;

            // Obtener todos los usuarios con sus posts
            const users = await UserModel
                .find({ 'posts.0': { $exists: true } })
                .select('username name university profilePicture verified posts')
                .lean();

            // Aplanar todos los posts de todos los usuarios
            const allPosts: any[] = [];
            users.forEach(user => {
                user.posts.forEach((post: any) => {
                    allPosts.push({
                        _id: post._id.toString(),
                        content: post.content,
                        imageUrl: post.imageUrl,
                        likes: post.likes || [],
                        favorites: post.favorites || [],
                        comments: post.comments || [],
                        createdAt: post.createdAt,
                        author: {
                            id: user._id.toString(),
                            username: user.username,
                            name: user.name,
                            university: user.university,
                            profilePicture: user.profilePicture,
                            verified: user.verified
                        }
                    });
                });
            });

            // Ordenar por fecha más reciente
            allPosts.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            // Paginar
            const paginatedPosts = allPosts.slice(skip, skip + limit);

            res.json({
                status: true,
                data: paginatedPosts,
                pagination: {
                    page,
                    limit,
                    total: allPosts.length,
                    pages: Math.ceil(allPosts.length / limit)
                }
            });
        } catch (error) {
            console.error('Error obteniendo posts:', error);
            res.status(500).json({
                status: false,
                msg: 'Error en el servidor',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
