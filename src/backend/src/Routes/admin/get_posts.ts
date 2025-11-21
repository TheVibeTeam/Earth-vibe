import type { Request, Response } from 'express';
import User from '../../Models/User';
import { authenticate, requireSuperAdmin, AuthRequest } from '../../Middleware/auth';

export default {
    name: 'Admin - Get All Posts',
    path: '/admin/posts',
    method: 'get',
    category: 'admin',
    example: {},
    parameter: [],
    premium: false,
    error: false,
    logger: true,
    requires: [authenticate, requireSuperAdmin],
    execution: async (req: AuthRequest, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            // Obtener usuarios con posts
            const usersWithPosts = await User.find({ 'posts.0': { $exists: true } })
                .select('name username email profilePicture posts')
                .lean();

            // Aplanar posts y agregar información del usuario
            const allPosts = usersWithPosts.flatMap(user => 
                (user.posts || []).map(post => ({
                    ...(post as any),
                    user: {
                        _id: user._id,
                        name: user.name,
                        username: user.username,
                        email: user.email,
                        profilePicture: user.profilePicture
                    }
                }))
            );

            // Ordenar por fecha descendente
            allPosts.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            // Paginar
            const totalPosts = allPosts.length;
            const paginatedPosts = allPosts.slice(skip, skip + limit);

            res.json({
                status: true,
                data: {
                    posts: paginatedPosts,
                    currentPage: page,
                    totalPages: Math.ceil(totalPosts / limit),
                    totalPosts
                }
            });
        } catch (error: any) {
            console.error('Error obteniendo publicaciones:', error);
            res.status(500).json({
                status: false,
                msg: 'Error al obtener publicaciones',
                error: error.message
            });
        }
    }
};
