import logger from '../../../Utils/logger';
import InventoryModel from '../models/Inventory';

export default {
    name: 'Get Inventory',
    type: 'query',
    description: 'Get inventory items with filters',
    file: __filename,
    category: 'admin',
    requireAuth: true,
    requireAdmin: false, // Permitir acceso a usuarios normales para ver disponibilidad
    query: `inventory(serviceId: String, isAvailable: Boolean, limit: Int, skip: Int): InventoryResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            // Si es usuario normal, solo puede ver items disponibles y no datos sensibles
            const isAdmin = context.user && context.user.role === 'ADMIN';

            const { serviceId, isAvailable, limit = 50, skip = 0 } = args;
            logger.info({ serviceId, isAvailable, limit, skip, isAdmin }, 'Fetching inventory');

            const filter: any = {};
            if (serviceId) filter.serviceId = serviceId;

            // Usuarios normales solo ven disponible
            if (!isAdmin) {
                filter.isAvailable = true;
            } else if (isAvailable !== undefined) {
                filter.isAvailable = isAvailable;
            }

            const inventory = await InventoryModel.find(filter)
                .limit(limit)
                .skip(skip)
                .sort({ createdAt: -1 });

            const total = await InventoryModel.countDocuments(filter);

            return {
                inventory: inventory.map(item => {
                    const doc = item.toObject();
                    // Ocultar datos sensibles para no admins
                    if (!isAdmin) {
                        return {
                            id: (doc._id as any).toString(),
                            serviceId: doc.serviceId,
                            isAvailable: doc.isAvailable,
                            // No devolver email, password, pin, etc.
                            email: '***',
                            password: '***',
                            pin: '***',
                            profileName: doc.profileName,
                            plan: doc.plan,
                            price: doc.price,
                            duration: doc.duration,
                            expiryDate: doc.expiryDate?.toISOString(),
                            createdAt: doc.createdAt?.toISOString(),
                            updatedAt: doc.updatedAt?.toISOString()
                        };
                    }
                    return {
                        ...doc,
                        id: (doc._id as any).toString(),
                        expiryDate: doc.expiryDate?.toISOString(),
                        createdAt: doc.createdAt?.toISOString(),
                        updatedAt: doc.updatedAt?.toISOString(),
                        profileName: doc.profileName || (doc as any).profiles
                    };
                }),
                total
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error fetching inventory');
            throw new Error(error.message || 'Error al obtener inventario');
        }
    }
};
