import type { Request, Response } from 'express';
import UserModel from '../../Models/User';
import Challenge from '../../Models/Challenge';
import Product from '../../Models/Product';
import Reward from '../../Models/Reward';
import { authenticate, requireAdmin, AuthRequest } from '../../Middleware/auth';

export default {
    name: 'Admin - Get Dashboard Stats',
    path: '/admin/dashboard/stats',
    method: 'get',
    category: 'admin',
    example: {},
    parameter: [],
    premium: false,
    error: false,
    logger: true,
    requires: [authenticate, requireAdmin],
    execution: async (req: AuthRequest, res: Response) => {
        try {
            // Obtener estadísticas generales
            const totalUsers = await UserModel.countDocuments();
            const totalAdmins = await UserModel.countDocuments({ role: { $in: ['admin', 'superadmin'] } });
            const totalChallenges = await Challenge.countDocuments();
            const activeChallenges = await Challenge.countDocuments({ isActive: true });
            const totalProducts = await Product.countDocuments();
            const activeProducts = await Product.countDocuments({ isActive: true });
            const totalRewards = await Reward.countDocuments();
            const activeRewards = await Reward.countDocuments({ isActive: true });

            // Usuarios recientes (últimos 7 días)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentUsers = await UserModel.countDocuments({
                createdAt: { $gte: sevenDaysAgo }
            });

            // Calcular total de puntos en el sistema
            const pointsAggregation = await UserModel.aggregate([
                {
                    $group: {
                        _id: null,
                        totalPoints: { $sum: '$points' }
                    }
                }
            ]);
            const totalPoints = pointsAggregation.length > 0 ? pointsAggregation[0].totalPoints : 0;

            // Calcular total de botellas escaneadas
            const bottlesAggregation = await UserModel.aggregate([
                {
                    $project: {
                        bottlesCount: { $size: { $ifNull: ['$scannedProducts', []] } }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalBottles: { $sum: '$bottlesCount' }
                    }
                }
            ]);
            const totalBottles = bottlesAggregation.length > 0 ? bottlesAggregation[0].totalBottles : 0;

            // Calcular total de posts
            const postsAggregation = await UserModel.aggregate([
                {
                    $project: {
                        postsCount: { $size: { $ifNull: ['$posts', []] } }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalPosts: { $sum: '$postsCount' }
                    }
                }
            ]);
            const totalPosts = postsAggregation.length > 0 ? postsAggregation[0].totalPosts : 0;

            // Top 10 usuarios por puntos
            const topUsers = await UserModel.find()
                .select('username name points university profilePicture')
                .sort({ points: -1 })
                .limit(10)
                .lean();

            // Usuarios por universidad
            const usersByUniversity = await UserModel.aggregate([
                {
                    $group: {
                        _id: '$university',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 10
                }
            ]);

            // Usuarios registrados por día (últimos 30 días)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const usersByDay = await UserModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);

            res.json({
                status: true,
                data: {
                    overview: {
                        totalUsers,
                        totalAdmins,
                        recentUsers,
                        totalChallenges,
                        activeChallenges,
                        totalProducts,
                        activeProducts,
                        totalRewards,
                        activeRewards,
                        totalPoints,
                        totalBottles,
                        totalPosts
                    },
                    topUsers: topUsers.map(user => ({
                        id: user._id,
                        username: user.username,
                        name: user.name,
                        points: user.points,
                        university: user.university,
                        profilePicture: user.profilePicture
                    })),
                    usersByUniversity,
                    usersByDay
                }
            });
        } catch (error: any) {
            res.status(500).json({
                status: false,
                msg: 'Error al obtener estadísticas',
                error: error.message
            });
        }
    }
};
