import logger from '../../../Utils/logger';
import NaziShopUserModel from '../models/NaziShopUser';

export default {
    name: 'Add Balance to User (Admin)',
    type: 'mutation',
    description: 'Add balance to user account (Admin only)',
    file: __filename,
    category: 'admin',
    requireAuth: true,
    requireAdmin: true,
    mutation: `addBalance(userId: ID!, amount: Float!, note: String): UserResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user || context.user.role !== 'ADMIN') {
                throw new Error('Acceso denegado. Solo administradores.');
            }

            const { userId, amount, note } = args;
            logger.info({ userId, amount, note }, 'Admin adding balance to user');

            if (amount <= 0) throw new Error('El monto debe ser mayor a 0');

            const user = await NaziShopUserModel.findById(userId);
            if (!user) throw new Error('Usuario no encontrado');

            // Aquí podrías agregar un campo balance al modelo si lo necesitas
            // Por ahora lo agregamos a totalSpent negativamente como crédito
            const updatedUser = await NaziShopUserModel.findByIdAndUpdate(
                userId,
                { 
                    $inc: { totalSpent: -amount },
                    lastActiveTime: new Date()
                },
                { new: true, runValidators: true }
            ).select('-password');

            logger.info({ userId, amount }, 'Balance added successfully');

            return {
                success: true,
                message: `Saldo de $${amount} agregado exitosamente${note ? ': ' + note : ''}`,
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
            logger.error({ error: error.message }, 'Error adding balance');
            throw new Error(error.message || 'Error al agregar saldo');
        }
    }
};
