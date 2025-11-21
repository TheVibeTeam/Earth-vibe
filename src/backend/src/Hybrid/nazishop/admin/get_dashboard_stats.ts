import logger from '../../../Utils/logger';
import NaziShopUserModel from '../models/NaziShopUser';
import OrderModel from '../models/Order';
import ServiceModel from '../models/Service';

export default {
    name: 'Get Dashboard Stats',
    type: 'query',
    description: 'Get admin dashboard statistics',
    file: __filename,
    category: 'admin',
    requireAuth: true,
    requireAdmin: true,
    query: `dashboardStats: DashboardStats!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user || context.user.role !== 'ADMIN') {
                throw new Error('Acceso denegado. Solo administradores.');
            }

            logger.info({ userId: context.user.id }, 'Fetching dashboard stats');

            // Contar usuarios totales y activos
            const totalUsers = await NaziShopUserModel.countDocuments();
            const activeUsers = await NaziShopUserModel.countDocuments({ isActive: true });

            // Contar servicios totales y activos
            const totalServices = await ServiceModel.countDocuments();
            const activeServices = await ServiceModel.countDocuments({ isActive: true });

            // Contar órdenes por estado
            const totalOrders = await OrderModel.countDocuments();
            const completedOrders = await OrderModel.countDocuments({ status: 'COMPLETED' });
            const pendingOrders = await OrderModel.countDocuments({ status: 'PENDING' });
            const canceledOrders = await OrderModel.countDocuments({ status: 'CANCELED' });

            // Calcular ingresos totales (suma de órdenes completadas)
            const revenueData = await OrderModel.aggregate([
                { $match: { status: 'COMPLETED' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

            // Calcular estadísticas de usuarios
            const userStatsData = await NaziShopUserModel.aggregate([
                {
                    $group: {
                        _id: null,
                        totalPurchases: { $sum: '$totalPurchases' },
                        totalSpent: { $sum: '$totalSpent' },
                        avgPurchases: { $avg: '$totalPurchases' },
                        avgSpent: { $avg: '$totalSpent' }
                    }
                }
            ]);
            const userStats = userStatsData.length > 0 ? userStatsData[0] : {
                totalPurchases: 0,
                totalSpent: 0,
                avgPurchases: 0,
                avgSpent: 0
            };

            // Top 5 servicios más comprados
            const topServices = await OrderModel.aggregate([
                { $match: { status: 'COMPLETED' } },
                { $group: { _id: '$productId', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);

            // Top 5 usuarios por compras
            const topUsers = await NaziShopUserModel.find()
                .sort({ totalPurchases: -1 })
                .limit(5)
                .select('displayName email totalPurchases totalSpent');

            // Ingresos de los últimos 7 días
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentRevenue = await OrderModel.aggregate([
                { 
                    $match: { 
                        status: 'COMPLETED',
                        createdAt: { $gte: sevenDaysAgo }
                    } 
                },
                { 
                    $group: { 
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        revenue: { $sum: '$amount' },
                        orders: { $sum: 1 }
                    } 
                },
                { $sort: { _id: 1 } }
            ]);

            return {
                totalUsers,
                activeUsers,
                totalServices,
                activeServices,
                totalOrders,
                completedOrders,
                pendingOrders,
                canceledOrders,
                totalRevenue,
                totalPurchases: userStats.totalPurchases,
                avgPurchasesPerUser: userStats.avgPurchases,
                avgSpentPerUser: userStats.avgSpent,
                topServices: topServices.map(s => ({
                    productId: s._id,
                    purchaseCount: s.count,
                    revenue: s.revenue
                })),
                topUsers: topUsers.map(u => ({
                    id: (u._id as any).toString(),
                    displayName: u.displayName,
                    email: u.email,
                    totalPurchases: u.totalPurchases,
                    totalSpent: u.totalSpent
                })),
                recentRevenue: recentRevenue.map(r => ({
                    date: r._id,
                    revenue: r.revenue,
                    orders: r.orders
                }))
            };

        } catch (error: any) {
            logger.error({ error: error.message }, 'Error fetching dashboard stats');
            throw new Error(error.message || 'Error al obtener estadísticas');
        }
    }
};
