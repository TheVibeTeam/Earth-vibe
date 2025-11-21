import logger from '../../../Utils/logger';
import NaziShopUserModel from '../models/NaziShopUser';

export default {
    name: 'Update User Profile',
    type: 'mutation',
    description: 'Update authenticated user profile',
    file: __filename,
    category: 'users',
    requireAuth: true,
    mutation: `updateProfile(input: UpdateUserInput!): UserResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user) throw new Error('No autorizado');
            const { input } = args;
            logger.info({ userId: context.user.id }, 'Updating user profile');
            const updatedUser = await NaziShopUserModel.findOneAndUpdate(
                { email: context.user.email },
                { 
                    $set: {
                        displayName: input.displayName,
                        phoneNumber: input.phoneNumber,
                        photoUrl: input.photoUrl,
                        lastActiveTime: new Date()
                    }
                },
                { new: true, runValidators: true }
            );
            if (!updatedUser) throw new Error('Usuario no encontrado');
            return {
                success: true,
                message: 'Perfil actualizado exitosamente',
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
            logger.error({ error: error.message }, 'Error updating profile');
            throw new Error(error.message || 'Error al actualizar perfil');
        }
    }
};
