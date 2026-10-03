import logger from '../../../Utils/logger';
import OrderModel from '../models/Order';

export default {
    name: 'Get All Orders',
    type: 'query',
    description: 'Get all orders (Admin only)',
    file: __filename,
    category: 'orders',
    requireAuth: true,
    query: `allOrders(status: OrderStatus, category: ServiceCategory, limit: Int, skip: Int): OrdersResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user) throw new Error('No autorizado');
            if (context.user.role !== 'ADMIN') throw new Error('Requiere permisos de administrador');
            const { status, category, limit = 50, skip = 0 } = args;
            logger.info({ status, category, limit, skip }, 'Fetching all orders');
            const filter: any = {};
            if (status) filter.status = status;
            if (category) filter.category = category;
            const ordersFromDB = await OrderModel.find(filter).limit(limit).skip(skip).sort({ createdAt: -1 });
            const total = await OrderModel.countDocuments(filter);

            const orders = ordersFromDB.map(order => {
                const orderObject = order.toObject();
                return {
                    ...orderObject,
                    id: (orderObject._id as any).toString(),
                    createdAt: orderObject.createdAt?.toISOString(),
                    updatedAt: orderObject.updatedAt?.toISOString(),
                };
            });

            return { orders, total };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error fetching all orders');
            throw new Error(error.message || 'Error al obtener órdenes');
        }
    }
};
