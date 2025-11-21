import logger from '../../../Utils/logger';
import NaziShopUserModel from '../models/NaziShopUser';

export default {
    name: 'Get My Profile',
    type: 'query',
    description: 'Get authenticated user profile',
    file: __filename,
    category: 'users',
    requireAuth: true,
    query: `me: User!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user) throw new Error('No autorizado');
            const user = context.user;
            logger.info({ userId: user.id }, 'Fetching user profile');
            let userData = await NaziShopUserModel.findOne({ email: user.email });
            if (!userData) {
                userData = await NaziShopUserModel.create({
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    role: 'USER',
                    isActive: true,
                    totalPurchases: 0,
                    totalSpent: 0,
                    favoriteServices: []
                });
            }
            await NaziShopUserModel.updateOne({ email: user.email }, { lastActiveTime: new Date() });
            return {
                id: (userData._id as any).toString(),
                email: userData.email,
                displayName: userData.displayName,
                photoUrl: userData.photoUrl,
                phoneNumber: userData.phoneNumber,
                role: userData.role,
                isActive: userData.isActive,
                createdAt: userData.createdAt.toISOString(),
                totalPurchases: userData.totalPurchases,
                totalSpent: userData.totalSpent,
                favoriteServices: userData.favoriteServices
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error fetching profile');
            throw new Error(error.message || 'Error al obtener perfil');
        }
    }
};
