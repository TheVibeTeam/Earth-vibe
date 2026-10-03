import logger from '../../../Utils/logger';
import ServiceModel from '../models/Service';

export default {
    name: 'Get All Services',
    type: 'query',
    description: 'Get all services with optional filters (admin)',
    file: __filename,
    category: 'services',
    query: `allServices(category: ServiceCategory, isActive: Boolean, isFeatured: Boolean, limit: Int, skip: Int): ServicesResponse!`,
    resolver: async (_: any, args: any) => {
        try {
            const { category, isActive, isFeatured, limit = 20, skip = 0 } = args;
            logger.info({ category, isActive, isFeatured, limit, skip }, 'Fetching all services');
            const filter: any = {};
            if (category) filter.category = category;
            if (isActive !== undefined) filter.isActive = isActive;
            if (isFeatured !== undefined) filter.isFeatured = isFeatured;

            const servicesFromDB = await ServiceModel.find(filter).limit(limit).skip(skip).sort({ isFeatured: -1, createdAt: -1 });
            const total = await ServiceModel.countDocuments(filter);

            // Import InventoryModel dynamically to avoid circular dependencies if any
            const InventoryModel = require('../models/Inventory').default;

            const services = await Promise.all(servicesFromDB.map(async (service) => {
                const serviceObject = service.toObject();

                // Fetch inventory stats for this service
                // We use serviceId (custom ID) not _id because that's how inventory is linked
                const inventoryItems = await InventoryModel.find({
                    serviceId: serviceObject.serviceId,
                    isAvailable: true
                });

                let streamingPrices: number[] = serviceObject.streamingPrices || [];
                let streamingPlans: string[] = serviceObject.streamingPlans || [];

                if (inventoryItems.length > 0) {
                    // Extract prices from inventory
                    const inventoryPrices = inventoryItems
                        .map((item: any) => item.price)
                        .filter((p: any) => p != null) as number[];

                    if (inventoryPrices.length > 0) {
                        streamingPrices = [...new Set([...streamingPrices, ...inventoryPrices])];
                    }

                    // Extract plans/counts
                    const inventoryPlans = inventoryItems
                        .map((item: any) => item.plan)
                        .filter((p: any) => p != null) as string[];

                    if (inventoryPlans.length > 0) {
                        streamingPlans = [...new Set([...streamingPlans, ...inventoryPlans])];
                    } else if (streamingPlans.length === 0) {
                        // If no named plans but items exist, add a generic one so the UI shows "X Cuentas"
                        streamingPlans = Array(inventoryItems.length).fill('Cuenta');
                    }
                }

                return {
                    ...serviceObject,
                    id: (serviceObject._id as any).toString(),
                    createdAt: serviceObject.createdAt?.toISOString(),
                    updatedAt: serviceObject.updatedAt?.toISOString(),
                    streamingPrices,
                    streamingPlans
                };
            }));

            return { services, total };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error fetching all services');
            throw new Error(error.message || 'Error al obtener servicios');
        }
    }
};
