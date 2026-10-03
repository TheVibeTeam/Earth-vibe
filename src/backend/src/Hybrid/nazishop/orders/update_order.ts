import logger from '../../../Utils/logger';
import OrderModel from '../models/Order';
import NaziShopUserModel from '../models/NaziShopUser';

export default {
    name: 'Update Order Status',
    type: 'mutation',
    description: 'Update order status (Admin only)',
    file: __filename,
    category: 'orders',
    requireAuth: true,
    mutation: `updateOrder(orderId: String!, input: UpdateOrderInput!): OrderResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user) throw new Error('No autorizado');
            if (context.user.role !== 'ADMIN') throw new Error('Requiere permisos de administrador');
            const { orderId, input } = args;
            logger.info({ orderId }, 'Updating order');
            const updateData: any = { ...input };
            if (input.status === 'COMPLETED' && !updateData.completedAt) {
                updateData.completedAt = new Date();
            }
            const updatedOrderFromDB = await OrderModel.findOneAndUpdate(
                { orderId },
                { $set: updateData },
                { new: true, runValidators: true }
            );
            if (!updatedOrderFromDB) throw new Error('Orden no encontrada');
            if (input.status === 'COMPLETED') {
                await NaziShopUserModel.findOneAndUpdate(
                    { email: updatedOrderFromDB.userEmail },
                    { $inc: { totalSpent: updatedOrderFromDB.amount } }
                );
            }

            const updatedOrderObject = updatedOrderFromDB.toObject();
            const order = {
                ...updatedOrderObject,
                id: (updatedOrderObject._id as any).toString(),
                createdAt: updatedOrderObject.createdAt?.toISOString(),
                updatedAt: updatedOrderObject.updatedAt?.toISOString(),
                completedAt: updatedOrderObject.completedAt?.toISOString(),
            };

            return {
                success: true,
                message: 'Orden actualizada exitosamente',
                order
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error updating order');
            throw new Error(error.message || 'Error al actualizar orden');
        }
    }
};
