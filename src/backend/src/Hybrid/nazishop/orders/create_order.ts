import logger from '../../../Utils/logger';
import OrderModel from '../models/Order';
import ServiceModel from '../models/Service';
import NaziShopUserModel from '../models/NaziShopUser';

export default {
    name: 'Create Order',
    type: 'mutation',
    description: 'Create a new order (purchase)',
    file: __filename,
    category: 'orders',
    requireAuth: true,
    mutation: `createOrder(input: CreateOrderInput!): OrderResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user) throw new Error('No autorizado');
            const { input } = args;
            const userId = context.user.id;
            logger.info({ userId, productId: input.productId }, 'Creating order');
            if (!input.productId || !input.amount || !input.paymentMethod) {
                throw new Error('Campos requeridos: productId, amount, paymentMethod');
            }
            const service = await ServiceModel.findOne({ serviceId: input.productId });
            if (!service) throw new Error('Servicio no encontrado');
            const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const newOrder = await OrderModel.create({
                orderId,
                userId,
                userEmail: context.user.email,
                userName: context.user.displayName || context.user.email,
                productId: input.productId,
                productName: service.name,
                category: input.category,
                amount: input.amount,
                status: 'PENDING',
                paymentMethod: input.paymentMethod,
                streamingPlan: input.streamingPlan,
                streamingDuration: input.streamingDuration,
                streamingEmail: input.streamingEmail,
                streamingPassword: input.streamingPassword,
                streamingPin: input.streamingPin,
                streamingProfileName: input.streamingProfileName,
                socialUsername: input.socialUsername,
                socialFollowersCount: input.socialFollowersCount,
                methodType: input.methodType,
                methodEmail: input.methodEmail,
                methodPassword: input.methodPassword,
                methodAdditionalData: input.methodAdditionalData
            });
            await NaziShopUserModel.findOneAndUpdate(
                { email: context.user.email },
                { $inc: { totalPurchases: 1 }, lastActiveTime: new Date() },
                { upsert: true }
            );
            return { success: true, message: 'Orden creada exitosamente', order: newOrder };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error creating order');
            throw new Error(error.message || 'Error al crear orden');
        }
    }
};
