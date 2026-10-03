import logger from '../../../Utils/logger';
import InventoryModel from '../models/Inventory';

export default {
    name: 'Add Inventory',
    type: 'mutation',
    description: 'Add new inventory item',
    file: __filename,
    category: 'admin',
    requireAuth: true,
    requireAdmin: true,
    mutation: `addInventory(serviceId: String!, email: String!, password: String!, pin: String, profileName: String, expiryDate: DateTime, plan: String, price: Float, duration: String): AddInventoryResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user || context.user.role !== 'ADMIN') {
                throw new Error('Acceso denegado. Solo administradores.');
            }

            const { serviceId, email, password, pin, profileName, expiryDate, plan, price, duration } = args;
            logger.info({ serviceId, email }, 'Admin adding inventory');

            const newItem = new InventoryModel({
                serviceId,
                email,
                password,
                pin,
                profileName,
                expiryDate,
                plan,
                price,
                duration,
                isAvailable: true
            });

            await newItem.save();

            const doc = newItem.toObject();
            const item = {
                ...doc,
                id: (doc._id as any).toString(),
                expiryDate: doc.expiryDate?.toISOString(),
                createdAt: doc.createdAt?.toISOString(),
                updatedAt: doc.updatedAt?.toISOString()
            };

            return {
                success: true,
                message: 'Inventario agregado correctamente',
                item
            };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error adding inventory');
            return {
                success: false,
                message: error.message || 'Error al agregar inventario',
                item: null
            };
        }
    }
};
