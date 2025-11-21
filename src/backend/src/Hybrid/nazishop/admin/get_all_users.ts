import logger from '../../../Utils/logger';
import NaziShopUserModel from '../models/NaziShopUser';

export default {
    name: 'Get All Users (Admin)',
    type: 'query',
    description: 'Get all users with admin filters',
    file: __filename,
    category: 'admin',
    requireAuth: true,
    requireAdmin: true,
    query: `allUsers(role: UserRole, isActive: Boolean, limit: Int, skip: Int): UsersResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user || context.user.role !== 'ADMIN') {
                throw new Error('Acceso denegado. Solo administradores.');
            }

            const { role, isActive, limit = 50, skip = 0 } = args;
            logger.info({ role, isActive, limit, skip }, 'Admin fetching all users');

            const filter: any = {};
            if (role) filter.role = role;
            if (isActive !== undefined) filter.isActive = isActive;

            const users = await NaziShopUserModel.find(filter)
                .select('-password')
                .limit(limit)
                .skip(skip)
                .sort({ createdAt: -1 });

            const total = await NaziShopUserModel.countDocuments(filter);

            return { users, total };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error fetching all users');
            throw new Error(error.message || 'Error al obtener usuarios');
        }
    }
};
