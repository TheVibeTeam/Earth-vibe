import logger from '../../../Utils/logger';
import ServiceModel from '../models/Service';

export default {
    name: 'Get All Services (Admin)',
    type: 'query',
    description: 'Get all services with admin filters',
    file: __filename,
    category: 'admin',
    requireAuth: true,
    requireAdmin: true,
    query: `allServices(category: ServiceCategory, isActive: Boolean, isFeatured: Boolean, limit: Int, skip: Int): ServicesResponse!`,
    resolver: async (_: any, args: any, context: any) => {
        try {
            if (!context.user || context.user.role !== 'ADMIN') {
                throw new Error('Acceso denegado. Solo administradores.');
            }

            const { category, isActive, isFeatured, limit = 50, skip = 0 } = args;
            logger.info({ category, isActive, isFeatured, limit, skip }, 'Admin fetching all services');

            const filter: any = {};
            if (category) filter.category = category;
            if (isActive !== undefined) filter.isActive = isActive;
            if (isFeatured !== undefined) filter.isFeatured = isFeatured;

            const servicesFromDB = await ServiceModel.find(filter)
                .limit(limit)
                .skip(skip)
                .sort({ createdAt: -1 });

            const total = await ServiceModel.countDocuments(filter);

            const services = servicesFromDB.map(service => {
                const serviceObject = service.toObject();
                return {
                    ...serviceObject,
                    id: (serviceObject._id as any).toString(),
                    createdAt: serviceObject.createdAt?.toISOString(),
                    updatedAt: serviceObject.updatedAt?.toISOString(),
                };
            });

            return { services, total };
        } catch (error: any) {
            logger.error({ error: error.message }, 'Error fetching all services');
            throw new Error(error.message || 'Error al obtener servicios');
        }
    }
};
