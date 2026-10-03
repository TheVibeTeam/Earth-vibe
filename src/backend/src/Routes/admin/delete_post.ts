import type { Request, Response } from 'express';
import User from '../../Models/User';
import { authenticate, requireSuperAdmin, AuthRequest } from '../../Middleware/auth';

export default {
    name: 'Admin - Delete Post',
    path: '/admin/posts/:postId',
    method: 'delete',
    category: 'admin',
    example: {},
    parameter: ['postId'],
    premium: false,
    error: false,
    logger: true,
    requires: [authenticate, requireSuperAdmin],
    execution: async (req: AuthRequest, res: Response) => {
        try {
            const { postId } = req.params;

            // Buscar el usuario que tiene este post
            const user = await User.findOne({ 'posts._id': postId });

            if (!user) {
                return res.status(404).json({
                    status: false,
                    msg: 'Publicación no encontrada'
                });
            }

            // Eliminar el post del array
            user.posts.pull({ _id: postId });
            await user.save();

            res.json({
                status: true,
                msg: 'Publicación eliminada correctamente',
                data: { postId }
            });
        } catch (error: any) {
            console.error('Error eliminando publicación:', error);
            res.status(500).json({
                status: false,
                msg: 'Error al eliminar publicación',
                error: error.message
            });
        }
    }
};
