import logger from '../../../Utils/logger';
import NaziShopUserModel from '../models/NaziShopUser';

export default {
    name: 'Update User (Admin)',
    type: 'mutation',
    description: 'Update user details (Admin only)',
    file: __filename,
    category: 'admin',
    requireAuth: true,
    requireAdmin: true,
    mutation: `updateUser(userId: ID!, input: UpdateUserAdminInput!): UserResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user || context.user.role !== 'ADMIN') {
                throw new Error('Acceso denegado. Solo administradores.');
            }

            const { userId, input } = args;
            logger.info({ userId }, 'Admin updating user');

            const user = await NaziShopUserModel.findById(userId);
            if (!user) throw new Error('Usuario no encontrado');

            const updatedUser = await NaziShopUserModel.findByIdAndUpdate(
                userId,
                { $set: input },
                { new: true, runValidators: true }
            ).select('-password');

            return {
                success: true,
                message: 'Usuario actualizado exitosamente',
                user: {
                    id: (updatedUser!._id as any).toString(),
                    email: updatedUser!.email,
                    displayName: updatedUser!.displayName,
                    photoUrl: updatedUser!.photoUrl,
                    phoneNumber: updatedUser!.phoneNumber,
                    role: updatedUser!.role,
                    isActive: updatedUser!.isActive,
                    createdAt: updatedUser!.createdAt.toISOString(),
                    totalPurchases: updatedUser!.totalPurchases,
                    totalSpent: updatedUser!.totalSpent,
                    favoriteServices: updatedUser!.favoriteServices
                }
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error updating user');
            throw new Error(error.message || 'Error al actualizar usuario');
        }
    }
};
