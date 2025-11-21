import type { Request, Response } from 'express';
import UserModel from '../../Models/User';
import { authenticate, requireAdmin, AuthRequest } from '../../Middleware/auth';

export default {
    name: 'Admin - Get All Users',
    path: '/admin/users',
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
            const {
                page = 1,
                limit = 20,
                search = '',
                role = '',
                university = '',
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const skip = (pageNum - 1) * limitNum;

            // Construir filtros
            const filter: any = {};

            if (search) {
                filter.$or = [
                    { email: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } }
                ];
            }

            if (role) {
                filter.role = role;
            }

            if (university) {
                filter.university = { $regex: university, $options: 'i' };
            }

            // Ordenamiento
            const sort: any = {};
            sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

            // Obtener usuarios
            const users = await UserModel.find(filter)
                .select('-password')
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean();

            const total = await UserModel.countDocuments(filter);

            // Calcular estadísticas para cada usuario
            const usersWithStats = users.map(user => ({
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
                totalScans: user.scannedProducts?.length || 0,
                totalPosts: user.posts?.length || 0,
                totalRedeems: user.redeems?.length || 0,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }));

            res.json({
                status: true,
                data: {
                    users: usersWithStats,
                    pagination: {
                        total,
                        page: pageNum,
                        limit: limitNum,
                        pages: Math.ceil(total / limitNum)
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({
                status: false,
                msg: 'Error al obtener usuarios',
                error: error.message
            });
        }
    }
};
