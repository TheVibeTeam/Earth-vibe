import logger from '../../../Utils/logger';
import OrderModel from '../models/Order';
import ServiceModel from '../models/Service';
import NaziShopUserModel from '../models/NaziShopUser';
import CurrencyRateModel from '../../../Models/CurrencyRate';

// Helper inline para conversión
async function convertToUSD(amount: number, currency: string): Promise<{ amountUSD: number; rate: number }> {
    if (currency === 'USD') return { amountUSD: amount, rate: 1 };

    const DEFAULT_RATES = { MXN: 17.5, COP: 4200 };
    const dbRate = await CurrencyRateModel.findOne({ currency });
    const rate = dbRate?.rate || DEFAULT_RATES[currency as keyof typeof DEFAULT_RATES] || 1;

    return {
        amountUSD: amount / rate,
        rate,
    };
}

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

            if (!input.productId || !input.amount || !input.paymentMethod) {
                throw new Error('Campos requeridos: productId, amount, paymentMethod');
            }

            const service = await ServiceModel.findOne({ serviceId: input.productId });
            if (!service) throw new Error('Servicio no encontrado');

            // Convertir a USD si es necesario
            const currency = input.currency || 'USD';
            const { amountUSD, rate } = await convertToUSD(input.amount, currency);

            const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            const newOrderFromDB = await OrderModel.create({
                orderId,
                userId,
                userEmail: context.user.email,
                userName: context.user.displayName || context.user.email,
                productId: input.productId,
                productName: service.name,
                category: input.category,
                amount: input.amount,
                currency,
                amountUSD,
                exchangeRate: rate,
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
                methodAdditionalData: input.methodAdditionalData,
            });

            await NaziShopUserModel.findOneAndUpdate(
                { email: context.user.email },
                { $inc: { totalPurchases: 1 }, lastActiveTime: new Date() },
                { upsert: true }
            );

            const newOrderObject = newOrderFromDB.toObject();
            const order = {
                ...newOrderObject,
                id: (newOrderObject._id as any).toString(),
                createdAt: newOrderObject.createdAt?.toISOString(),
                updatedAt: newOrderObject.updatedAt?.toISOString(),
            };

            return { success: true, message: 'Orden creada exitosamente', order };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error creating order');
            throw new Error(error.message || 'Error al crear orden');
        }
    },
};
