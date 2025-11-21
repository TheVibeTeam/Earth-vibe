import logger from '../../../Utils/logger';
import NaziShopUserModel from '../models/NaziShopUser';

export default {
    name: 'Toggle Favorite Service',
    type: 'mutation',
    description: 'Add or remove service from favorites',
    file: __filename,
    category: 'users',
    requireAuth: true,
    mutation: `toggleFavorite(serviceId: String!): UserResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user) throw new Error('No autorizado');
            const { serviceId } = args;
            logger.info({ userId: context.user.id, serviceId }, 'Toggling favorite service');
            const user = await NaziShopUserModel.findOne({ email: context.user.email });
            if (!user) throw new Error('Usuario no encontrado');
            const isFavorite = user.favoriteServices.includes(serviceId);
            const updatedUser = await NaziShopUserModel.findOneAndUpdate(
                { email: context.user.email },
                isFavorite 
                    ? { $pull: { favoriteServices: serviceId } }
                    : { $addToSet: { favoriteServices: serviceId } },
                { new: true }
            );
            if (!updatedUser) throw new Error('Error al actualizar favoritos');
            return {
                success: true,
                message: isFavorite ? 'Servicio eliminado de favoritos' : 'Servicio agregado a favoritos',
                user: {
                    id: (updatedUser._id as any).toString(),
                    email: updatedUser.email,
                    displayName: updatedUser.displayName,
                    photoUrl: updatedUser.photoUrl,
                    phoneNumber: updatedUser.phoneNumber,
                    role: updatedUser.role,
                    isActive: updatedUser.isActive,
                    createdAt: updatedUser.createdAt.toISOString(),
                    totalPurchases: updatedUser.totalPurchases,
                    totalSpent: updatedUser.totalSpent,
                    favoriteServices: updatedUser.favoriteServices
                }
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error toggling favorite');
            throw new Error(error.message || 'Error al actualizar favoritos');
        }
    }
};
