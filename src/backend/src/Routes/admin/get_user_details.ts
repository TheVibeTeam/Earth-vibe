import type { Request, Response } from 'express';
import UserModel from '../../Models/User';
import { authenticate, requireAdmin, AuthRequest } from '../../Middleware/auth';

export default {
    name: 'Admin - Get User Details',
    path: '/admin/users/:userId',
    method: 'get',
    category: 'admin',
    example: {},
    parameter: ['userId'],
    premium: false,
    error: false,
    logger: true,
    requires: [authenticate, requireAdmin],
    execution: async (req: AuthRequest, res: Response) => {
        try {
            const { userId } = req.params;

            const user = await UserModel.findById(userId)
                .select('-password')
                .populate('redeems')
                .lean();

            if (!user) {
                return res.status(404).json({
                    status: false,
                    msg: 'Usuario no encontrado'
                });
            }

            // Calcular estadísticas detalladas
            const stats = {
                totalScans: user.scannedProducts?.length || 0,
                totalPosts: user.posts?.length || 0,
                totalLikes: user.posts?.reduce((sum, post) => sum + (post.likes?.length || 0), 0) || 0,
                totalComments: user.posts?.reduce((sum, post) => sum + (post.comments?.length || 0), 0) || 0,
                totalRedeems: user.redeems?.length || 0,
                lastScan: user.scannedProducts?.length > 0
                    ? user.scannedProducts[user.scannedProducts.length - 1].scannedAt
                    : null,
                lastPost: user.posts?.length > 0
                    ? user.posts[user.posts.length - 1].createdAt
                    : null
            };

            res.json({
                status: true,
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        username: user.username,
                        name: user.name,
                        bio: user.bio,
                        profilePicture: user.profilePicture,
                        university: user.university,
                        faculty: user.faculty,
                        verified: user.verified,
                        role: user.role,
                        points: user.points,
                        scannedProducts: user.scannedProducts,
                        posts: user.posts,
                        redeems: user.redeems,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt
                    },
                    stats
                }
            });
        } catch (error: any) {
            res.status(500).json({
                status: false,
                msg: 'Error al obtener detalles del usuario',
                error: error.message
            });
        }
    }
};
