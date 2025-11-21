import type { Request, Response } from 'express';
import User from '../../Models/User';
import { authenticate, requireAdmin, AuthRequest } from '../../Middleware/auth';

export default {
    name: 'Admin - Delete Comment',
    path: '/admin/posts/:postId/comments/:commentId',
    method: 'delete',
    category: 'admin',
    example: {},
    parameter: [],
    premium: false,
    error: false,
    logger: true,
    requires: [authenticate, requireAdmin],
    execution: async (req: AuthRequest, res: Response) => {
        try {
            const { postId, commentId } = req.params;
            const { userId } = req.body; // We need the user ID to find the post efficiently

            if (!userId) {
                // If userId is not provided, we might have to search all users (expensive)
                // For now, let's require userId.
                return res.status(400).json({ status: false, msg: 'UserId is required to locate the post' });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ status: false, msg: 'Usuario no encontrado' });
            }

            const post = user.posts.id(postId);
            if (!post) {
                return res.status(404).json({ status: false, msg: 'Publicación no encontrada' });
            }

            // Remove comment
            post.comments.pull({ _id: commentId });
            
            await user.save();

            res.json({
                status: true,
                msg: 'Comentario eliminado correctamente'
            });
        } catch (error: any) {
            console.error('Error eliminando comentario:', error);
            res.status(500).json({
                status: false,
                msg: 'Error al eliminar comentario',
                error: error.message
            });
        }
    }
};
