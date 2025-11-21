import logger from '../../../Utils/logger';
import OrderModel from '../models/Order';

export default {
    name: 'Get My Orders',
    type: 'query',
    description: 'Get orders for authenticated user',
    file: __filename,
    category: 'orders',
    requireAuth: true,
    query: `myOrders(status: OrderStatus, limit: Int, skip: Int): OrdersResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user) throw new Error('No autorizado');
            const { status, limit = 20, skip = 0 } = args;
            const userId = context.user.id;
            logger.info({ userId, status, limit, skip }, 'Fetching user orders');
            const filter: any = { userId };
            if (status) filter.status = status;
            const orders = await OrderModel.find(filter).limit(limit).skip(skip).sort({ createdAt: -1 });
            const total = await OrderModel.countDocuments(filter);
            return { orders, total };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error fetching orders');
            throw new Error(error.message || 'Error al obtener órdenes');
        }
    }
};
