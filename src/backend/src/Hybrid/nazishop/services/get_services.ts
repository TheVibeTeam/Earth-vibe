import logger from '../../../Utils/logger';
import ServiceModel from '../models/Service';

export default {
    name: 'Get Services',
    type: 'query',
    description: 'Get all services with optional filters',
    file: __filename,
    category: 'services',
    query: `services(category: ServiceCategory, isActive: Boolean, limit: Int, skip: Int): ServicesResponse!`,
    resolver: async (_: any, args: any) => {
        try {
            const { category, isActive, limit = 20, skip = 0 } = args;
            logger.info({ category, isActive, limit, skip }, 'Fetching services');
            const filter: any = {};
            if (category) filter.category = category;
            if (isActive !== undefined) filter.isActive = isActive;
            const services = await ServiceModel.find(filter).limit(limit).skip(skip).sort({ isFeatured: -1, createdAt: -1 });
            const total = await ServiceModel.countDocuments(filter);
            return { services, total };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error fetching services');
            throw new Error(error.message || 'Error al obtener servicios');
        }
    }
};
